import { useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import useFetchApi, { useApiCall } from "@utils/api";
import { Group } from "@/interfaces/Group";
import { Network, NetworkResource, NetworkRouter } from "@/interfaces/Network";
import { Peer } from "@/interfaces/Peer";
import {
  buildConnectors,
  Connector,
  ConnectorApi,
  createConnector as svcCreateConnector,
  CreateConnectorInput,
  deleteConnector as svcDeleteConnector,
  isConnectorNetwork,
  syncConnectorRoutes as svcSyncRoutes,
} from "./connectorService";
import { RouteEntry } from "./cidr";

export function useConnectors() {
  const { data: networks } = useFetchApi<Network[]>("/networks");
  const { data: groups } = useFetchApi<Group[]>("/groups");
  const { data: peers } = useFetchApi<Peer[]>("/peers");
  const { mutate } = useSWRConfig();

  const peerNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of peers || []) {
      if (p.id) m[p.id] = p.name || p.hostname || p.id;
    }
    return m;
  }, [peers]);

  const connectorNetworks = useMemo(
    () => (networks || []).filter((n: Network) => isConnectorNetwork(n)),
    [networks],
  );

  const resourcesKey =
    connectorNetworks.length > 0
      ? ["connector-resources", connectorNetworks.map((n) => n.id).join(",")]
      : null;

  const { data: resourcesMap } = useSWR(
    resourcesKey,
    async ([, ids]: [string, string]) => {
      const out: Record<string, NetworkResource[]> = {};
      // Use the same OIDC fetch the app uses via a hidden hook-free path:
      // we rely on useApiCall instances created below in useConnectorActions.
      // Here we fetch through the global fetch with credentials; the
      // management API in this deployment accepts the session cookie.
      await Promise.all(
        ids.split(",").map(async (id) => {
          try {
            const res = await fetch(`/api/networks/${id}/resources`, {
              credentials: "include",
            });
            out[id] = res.ok ? await res.json() : [];
          } catch {
            out[id] = [];
          }
        }),
      );
      return out;
    },
  );

  const connectors: Connector[] = useMemo(
    () => buildConnectors(networks || [], resourcesMap || {}, peerNames),
    [networks, resourcesMap, peerNames],
  );

  const refresh = () => {
    mutate("/networks");
    mutate(resourcesKey);
  };

  return {
    connectors,
    networks: (networks || []).filter((n: Network) => !isConnectorNetwork(n)),
    groups: groups || [],
    peers: peers || [],
    isLoading: !networks,
    refresh,
  };
}

export function useConnectorActions() {
  const { mutate } = useSWRConfig();
  const networksCall = useApiCall<Network>("/networks");

  const api: ConnectorApi = useMemo(
    () => ({
      post: <T,>(url: string, data: unknown): Promise<T> =>
        networksCall.post(data, url.replace(/^\/networks/, "")) as Promise<T>,
      put: <T,>(url: string, data: unknown): Promise<T> =>
        networksCall.put(data, url.replace(/^\/networks/, "")) as Promise<T>,
      del: <T,>(url: string): Promise<T> =>
        networksCall.del("", url.replace(/^\/networks/, "")) as Promise<T>,
      get: <T,>(url: string): Promise<T> =>
        networksCall.get(url.replace(/^\/networks/, "")) as Promise<T>,
    }),
    [networksCall],
  );

  const refreshAll = () => {
    mutate("/networks");
    mutate((key) => Array.isArray(key) && key[0] === "connector-resources");
    mutate("/groups");
  };

  return {
    createConnector: async (input: CreateConnectorInput) => {
      const c = await svcCreateConnector(api, input);
      refreshAll();
      return c;
    },
    deleteConnector: async (connector: Connector) => {
      await svcDeleteConnector(api, connector);
      refreshAll();
    },
    syncRoutes: async (
      connector: Connector,
      announced: RouteEntry[],
      excluded: RouteEntry[],
    ) => {
      const c = await svcSyncRoutes(api, connector, announced, excluded);
      refreshAll();
      return c;
    },
  };
}

export type { Connector };
export { isConnectorNetwork };
