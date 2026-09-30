/**
 * Connector orchestration service.
 *
 * A 飞越云-style "connector" is a device (peer) that announces subnet routes.
 * We implement it on NetBird's model without backend changes:
 *
 * - One hidden Network per connector: name `[connector] {peerName}`,
 *   description `cloink-connector:{peerId}` (marker for identification/filtering)
 * - One NetworkRouter linking the peer to that network
 * - One NetworkResource per announced CIDR (type subnet) — these are the
 *   REAL routes distributed to clients, not description text
 * - Excluded routes are applied via CIDR splitting at sync time, mirroring
 *   飞越云's preview calculation
 *
 * Resource groups (NetBird Groups) are standalone. When a user adds an IP to
 * a resource group, we find the connector whose announced CIDR covers the IP
 * (most specific match) and create the NetworkResource in that connector's
 * network, then add it to the group. The same resource can join many groups.
 */

import { Group } from "@/interfaces/Group";
import { Network, NetworkResource, NetworkRouter } from "@/interfaces/Network";
import {
  computeEffectiveRoutes,
  EffectiveRoute,
  findBestMatch,
  normalizeToCIDRs,
  parseCIDR,
  RouteEntry,
} from "./cidr";

/** Marker prefix in Network.description identifying connector-managed networks */
export const CONNECTOR_MARKER = "cloink-connector:";

/** Marker prefix in NetworkResource.description for announced-route resources */
export const ROUTE_RESOURCE_MARKER = "cloink-route:";

export interface ConnectorRoute extends RouteEntry {
  /** Database id of the underlying NetworkResource, if synced */
  resourceId?: string;
}

export interface Connector {
  /** The hidden network id */
  networkId: string;
  network: Network;
  peerId: string;
  peerName: string;
  router?: NetworkRouter;
  announced: ConnectorRoute[];
  excluded: ConnectorRoute[];
  /** Effective routes (preview calculation) */
  effective: EffectiveRoute[];
}

export function isConnectorNetwork(n: Network): boolean {
  return !!n.description?.startsWith(CONNECTOR_MARKER);
}

export function connectorPeerId(n: Network): string | null {
  if (!isConnectorNetwork(n)) return null;
  return n.description!.slice(CONNECTOR_MARKER.length).split("|")[0] || null;
}

export function isRouteResource(r: NetworkResource): boolean {
  return !!r.description?.startsWith(ROUTE_RESOURCE_MARKER);
}

/**
 * Build Connector objects from raw networks + their resources/routers.
 * `resourcesByNetwork` maps networkId → NetworkResource[].
 */
export function buildConnectors(
  networks: Network[],
  resourcesByNetwork: Record<string, NetworkResource[]>,
  peerNames: Record<string, string>,
): Connector[] {
  return networks.filter(isConnectorNetwork).map((network) => {
    const peerId = connectorPeerId(network) || "";
    const resources = resourcesByNetwork[network.id] || [];
    const announced: ConnectorRoute[] = [];
    const excluded: ConnectorRoute[] = [];
    for (const r of resources) {
      if (!isRouteResource(r)) continue;
      // description format: cloink-route:{kind}:{originalCidr}:{note}
      // kind = "announce" | "exclude"
      const rest = r.description!.slice(ROUTE_RESOURCE_MARKER.length);
      const kind = rest.startsWith("announce:") ? "announce" : "exclude";
      const entry: ConnectorRoute = {
        cidr: r.address,
        description: r.name?.replace(/^route-/, "") || undefined,
        enabled: r.enabled,
        resourceId: r.id,
      };
      // Recover the user-facing note from resource name if present
      if (kind === "announce") announced.push(entry);
      else excluded.push(entry);
    }
    const effective = computeEffectiveRoutes(announced, excluded);
    return {
      networkId: network.id,
      network,
      peerId,
      peerName: peerNames[peerId] || network.name.replace(/^\[connector\] /, ""),
      router: undefined, // filled by caller from network.routers if loaded
      announced,
      excluded,
      effective,
    };
  });
}

export interface CreateConnectorInput {
  peerId: string;
  peerName: string;
  announced: RouteEntry[];
  excluded: RouteEntry[];
  masquerade?: boolean;
  metric?: number;
}

export interface ConnectorApi {
  post<T>(url: string, data: unknown): Promise<T>;
  put<T>(url: string, data: unknown): Promise<T>;
  del<T>(url: string): Promise<T>;
  get<T>(url: string): Promise<T>;
}

/**
 * Create a full connector: hidden network + router + route resources.
 * Announced CIDRs become real NetworkResources (the actual routes).
 * Excluded routes are stored as disabled-by-convention resources so the
 * preview math can run; effective routes are computed client-side.
 */
export async function createConnector(
  api: ConnectorApi,
  input: CreateConnectorInput,
): Promise<Connector> {
  // 1. Hidden network
  const network = await api.post<Network>("/networks", {
    name: `[connector] ${input.peerName}`,
    description: `${CONNECTOR_MARKER}${input.peerId}`,
  });

  // 2. Router: this peer routes for the network
  const router = await api.post<NetworkRouter>(
    `/networks/${network.id}/routers`,
    {
      peer: input.peerId,
      metric: input.metric ?? 9999,
      masquerade: input.masquerade ?? true,
      enabled: true,
    },
  );

  // 3. Route resources (real routes)
  const announced: ConnectorRoute[] = [];
  for (const r of input.announced) {
    for (const cidr of normalizeToCIDRs(r.cidr)) {
      const res = await api.post<NetworkResource>(
        `/networks/${network.id}/resources`,
        {
          name: `route-${cidr}${r.description ? ` (${r.description})` : ""}`,
          description: `${ROUTE_RESOURCE_MARKER}announce:${cidr}`,
          address: cidr,
          enabled: r.enabled,
        },
      );
      announced.push({ cidr, description: r.description, enabled: r.enabled, resourceId: res.id });
    }
  }
  const excluded: ConnectorRoute[] = [];
  for (const r of input.excluded) {
    for (const cidr of normalizeToCIDRs(r.cidr)) {
      const res = await api.post<NetworkResource>(
        `/networks/${network.id}/resources`,
        {
          name: `exclude-${cidr}${r.description ? ` (${r.description})` : ""}`,
          description: `${ROUTE_RESOURCE_MARKER}exclude:${cidr}`,
          address: cidr,
          enabled: r.enabled,
        },
      );
      excluded.push({ cidr, description: r.description, enabled: r.enabled, resourceId: res.id });
    }
  }

  return {
    networkId: network.id,
    network,
    peerId: input.peerId,
    peerName: input.peerName,
    router,
    announced,
    excluded,
    effective: computeEffectiveRoutes(announced, excluded),
  };
}

/** Delete a connector: router + network (resources cascade). */
export async function deleteConnector(
  api: ConnectorApi,
  connector: Connector,
): Promise<void> {
  if (connector.router?.id) {
    await api.del(`/networks/${connector.networkId}/routers/${connector.router.id}`);
  }
  await api.del(`/networks/${connector.networkId}`);
}

/**
 * Sync a connector's announced/excluded routes to match the desired lists.
 * Creates/updates/deletes underlying NetworkResources as needed.
 */
export async function syncConnectorRoutes(
  api: ConnectorApi,
  connector: Connector,
  announced: RouteEntry[],
  excluded: RouteEntry[],
): Promise<Connector> {
  const desired = new Map<string, RouteEntry & { kind: string }>();
  for (const r of announced)
    for (const cidr of normalizeToCIDRs(r.cidr))
      desired.set(`announce:${cidr}`, { ...r, cidr, kind: "announce" });
  for (const r of excluded)
    for (const cidr of normalizeToCIDRs(r.cidr))
      desired.set(`exclude:${cidr}`, { ...r, cidr, kind: "exclude" });

  const existing = new Map<string, ConnectorRoute & { kind: string }>();
  for (const r of connector.announced)
    if (r.resourceId) existing.set(`announce:${r.cidr}`, { ...r, kind: "announce" });
  for (const r of connector.excluded)
    if (r.resourceId) existing.set(`exclude:${r.cidr}`, { ...r, kind: "exclude" });

  // Delete removed
  for (const [key, r] of existing) {
    if (!desired.has(key) && r.resourceId) {
      await api.del(`/networks/${connector.networkId}/resources/${r.resourceId}`);
    }
  }
  // Create new / update changed
  const newAnnounced: ConnectorRoute[] = [];
  const newExcluded: ConnectorRoute[] = [];
  for (const [key, d] of desired) {
    const e = existing.get(key);
    const payload = {
      name:
        d.kind === "announce"
          ? `route-${d.cidr}${d.description ? ` (${d.description})` : ""}`
          : `exclude-${d.cidr}${d.description ? ` (${d.description})` : ""}`,
      description: `${ROUTE_RESOURCE_MARKER}${d.kind}:${d.cidr}`,
      address: d.cidr,
      enabled: d.enabled,
    };
    let resourceId = e?.resourceId;
    if (e?.resourceId) {
      if (e.enabled !== d.enabled || e.description !== d.description) {
        await api.put(
          `/networks/${connector.networkId}/resources/${e.resourceId}`,
          payload,
        );
      }
    } else {
      const res = await api.post<NetworkResource>(
        `/networks/${connector.networkId}/resources`,
        payload,
      );
      resourceId = res.id;
    }
    const entry = { cidr: d.cidr, description: d.description, enabled: d.enabled, resourceId };
    if (d.kind === "announce") newAnnounced.push(entry);
    else newExcluded.push(entry);
  }

  return {
    ...connector,
    announced: newAnnounced,
    excluded: newExcluded,
    effective: computeEffectiveRoutes(newAnnounced, newExcluded),
  };
}

export interface ResolvedTarget {
  connector: Connector;
  /** The announced CIDR covering the IP (most specific) */
  matchedCidr: string;
}

/**
 * Find which connector can route a given IP: the connector whose enabled
 * announced routes (minus exclusions) cover it, most specific match wins.
 */
export function resolveConnectorForIp(
  ip: string,
  connectors: Connector[],
): ResolvedTarget | null {
  // Normalize single IP to /32 for matching
  const ipCidrs = normalizeToCIDRs(ip);
  if (ipCidrs.length === 0) return null;
  const normalized = ipCidrs[0];

  let best: ResolvedTarget | null = null;
  let bestPrefix = -1;
  for (const c of connectors) {
    for (const e of c.effective) {
      // effective routes are already announce-minus-exclude
      if (
        parseCIDR(e.cidr) &&
        (e.cidr === normalized ||
          (parseCIDR(normalized)?.prefix === 32 &&
            cidrContains(e.cidr, normalized)))
      ) {
        const prefix = parseCIDR(e.cidr)!.prefix;
        if (prefix > bestPrefix) {
          bestPrefix = prefix;
          best = { connector: c, matchedCidr: e.sourceCidr };
        }
      }
    }
  }
  return best;
}

function cidrContains(cidr: string, ipCidr: string): boolean {
  const c = parseCIDR(cidr);
  const ip = parseCIDR(ipCidr);
  if (!c || !ip || ip.prefix !== 32) return false;
  const mask = c.prefix === 0 ? 0 : (0xffffffff << (32 - c.prefix)) >>> 0;
  return ((ip.network & mask) >>> 0) === c.network;
}

/**
 * Create a user resource (IP) inside the right connector network and
 * attach it to the given groups. Returns the created resource.
 * Throws if no connector covers the IP.
 */
export async function createResourceInConnector(
  api: ConnectorApi,
  connectors: Connector[],
  ip: string,
  name: string,
  note: string | undefined,
  groupIds: string[],
): Promise<{ resource: NetworkResource; connector: Connector }> {
  const resolved = resolveConnectorForIp(ip, connectors);
  if (!resolved) {
    throw new Error(`no-connector:${ip}`);
  }
  const cidrs = normalizeToCIDRs(ip);
  const address = cidrs[0] || ip;
  const resource = await api.post<NetworkResource>(
    `/networks/${resolved.connector.networkId}/resources`,
    {
      name: name || address,
      description: note || "",
      address,
      groups: groupIds.length > 0 ? groupIds : undefined,
      enabled: true,
    },
  );
  return { resource, connector: resolved.connector };
}

/** Add an existing resource to more groups (same IP in multiple groups). */
export async function addResourceToGroups(
  api: ConnectorApi,
  networkId: string,
  resource: NetworkResource,
  groupIds: string[],
): Promise<NetworkResource> {
  const existing = new Set(
    ((resource.groups || []) as (Group | string)[]).map((g) =>
      typeof g === "string" ? g : g.id || "",
    ),
  );
  for (const id of groupIds) existing.add(id);
  return api.put<NetworkResource>(`/networks/${networkId}/resources/${resource.id}`, {
    name: resource.name,
    description: resource.description || "",
    address: resource.address,
    groups: Array.from(existing),
    enabled: resource.enabled,
  });
}

/** Batch-create resources from 飞越云-style batch text: "IP,备注" per line. */
export function parseBatchResources(
  text: string,
): { ip: string; note: string; error?: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(",");
      const ip = (idx >= 0 ? line.slice(0, idx) : line).trim();
      const note = idx >= 0 ? line.slice(idx + 1).trim() : "";
      const cidrs = normalizeToCIDRs(ip);
      if (cidrs.length === 0) return { ip, note, error: "invalid" };
      return { ip: cidrs[0], note };
    });
}

export { findBestMatch };
