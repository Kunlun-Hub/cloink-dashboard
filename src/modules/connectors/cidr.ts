/**
 * CIDR utilities for the connector (飞越云-style route announcement) feature.
 *
 * Supports the same input formats as 飞越云:
 * - CIDR: 172.16.0.0/24
 * - IP range: 172.16.0.0-172.16.0.255
 * - Short range: 172.16.0.0-255
 * - Single IP: 172.16.0.8
 */

export interface ParsedCIDR {
  /** Network address as 32-bit int */
  network: number;
  /** Prefix length 0-32 */
  prefix: number;
  /** Normalized "a.b.c.d/p" string */
  cidr: string;
}

export interface RouteEntry {
  cidr: string;
  description?: string;
  enabled: boolean;
}

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = parseInt(p, 10);
    if (isNaN(v) || v < 0 || v > 255 || !/^\d+$/.test(p)) return null;
    n = (n << 8) + v;
  }
  return n >>> 0;
}

function intToIp(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join(".");
}

/**
 * Parse a CIDR string like "10.0.0.0/8" into network int + prefix.
 * Returns null if invalid.
 */
export function parseCIDR(cidr: string): ParsedCIDR | null {
  const m = cidr.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if (!m) return null;
  const ip = ipToInt(m[1]);
  const prefix = parseInt(m[2], 10);
  if (ip === null || prefix < 0 || prefix > 32) return null;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  return { network, prefix, cidr: `${intToIp(network)}/${prefix}` };
}

/**
 * Normalize user input into a canonical CIDR string.
 * Accepts: "172.16.0.0/24", "172.16.0.8" (→ /32), "172.16.0.0-172.16.0.255",
 * "172.16.0.0-255". Ranges are converted to the minimal covering CIDR list
 * joined by comma; callers that need a single CIDR should use normalizeToCIDRs.
 */
export function normalizeToCIDRs(input: string): string[] {
  const s = input.trim();
  // Single CIDR
  const parsed = parseCIDR(s);
  if (parsed) return [parsed.cidr];
  // Single IP → /32
  const ip = ipToInt(s);
  if (ip !== null) return [`${intToIp(ip)}/32`];
  // Range formats
  const range = s.match(/^(\d{1,3}(?:\.\d{1,3}){3})-(\d{1,3}(?:\.\d{1,3}){0,3})$/);
  if (range) {
    const start = ipToInt(range[1]);
    let end: number | null = null;
    if (range[2].includes(".")) {
      end = ipToInt(range[2]);
    } else {
      // Short form: 172.16.0.0-255 → last octet range
      const last = parseInt(range[2], 10);
      const startParts = range[1].split(".");
      if (!isNaN(last) && last >= 0 && last <= 255) {
        end = ipToInt(
          `${startParts[0]}.${startParts[1]}.${startParts[2]}.${last}`,
        );
      }
    }
    if (start !== null && end !== null && end >= start) {
      return rangeToCIDRs(start, end);
    }
  }
  return [];
}

/** Convert an inclusive IP range to the minimal list of CIDRs. */
export function rangeToCIDRs(start: number, end: number): string[] {
  const result: string[] = [];
  let s = start >>> 0;
  const e = end >>> 0;
  while (s <= e) {
    // Largest power-of-two block aligned at s
    let maxSize = s === 0 ? 32 : 32 - Math.floor(Math.log2(s & -s));
    // Don't exceed remaining range
    while (s + Math.pow(2, 32 - maxSize) - 1 > e) maxSize++;
    result.push(`${intToIp(s)}/${maxSize}`);
    s += Math.pow(2, 32 - maxSize);
    if (s === 0) break; // overflow guard (wrapped past 2^32)
  }
  return result;
}

/** Does `cidr` contain the given IP address? */
export function cidrContainsIp(cidr: string, ip: string): boolean {
  const c = parseCIDR(cidr);
  const n = ipToInt(ip);
  if (!c || n === null) return false;
  const mask = c.prefix === 0 ? 0 : (0xffffffff << (32 - c.prefix)) >>> 0;
  return ((n & mask) >>> 0) === c.network;
}

/** Does `outer` fully contain `inner` (both CIDR strings)? */
export function cidrContainsCidr(outer: string, inner: string): boolean {
  const o = parseCIDR(outer);
  const i = parseCIDR(inner);
  if (!o || !i || o.prefix > i.prefix) return false;
  const mask = o.prefix === 0 ? 0 : (0xffffffff << (32 - o.prefix)) >>> 0;
  return ((i.network & mask) >>> 0) === o.network;
}

/**
 * Subtract `exclude` from `cidr`, returning the list of CIDRs that remain.
 * This mirrors 飞越云's preview behavior: excluding 10.202.10.65/32 from
 * 10.202.10.0/24 yields 8 CIDRs covering everything except .65.
 */
export function subtractCIDR(cidr: string, exclude: string): string[] {
  const c = parseCIDR(cidr);
  const x = parseCIDR(exclude);
  if (!c || !x) return [cidr];
  if (!cidrContainsCidr(c.cidr, x.cidr)) return [c.cidr]; // no overlap
  if (c.prefix === x.prefix) return []; // fully excluded

  // Split c into two halves recursively, keeping the half that doesn't
  // contain x, recursing into the half that does.
  const result: string[] = [];
  const stack: ParsedCIDR[] = [c];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (cur.prefix === x.prefix) {
      if (cur.network !== x.network) result.push(cur.cidr);
      continue;
    }
    if (!cidrContainsCidr(cur.cidr, x.cidr)) {
      result.push(cur.cidr);
      continue;
    }
    // Split into halves at prefix+1
    const half = cur.prefix + 1;
    const bit = 1 << (32 - half);
    const left = cur.network >>> 0;
    const right = (cur.network | bit) >>> 0;
    stack.push(
      { network: left, prefix: half, cidr: `${intToIp(left)}/${half}` },
      { network: right, prefix: half, cidr: `${intToIp(right)}/${half}` },
    );
  }
  return result.sort((a, b) => {
    const pa = parseCIDR(a)!;
    const pb = parseCIDR(b)!;
    return pa.network - pb.network || pa.prefix - pb.prefix;
  });
}

export interface EffectiveRoute {
  cidr: string;
  /** Which announced route this came from */
  sourceCidr: string;
  sourceDescription?: string;
}

/**
 * Compute effective routes like 飞越云's preview tab:
 * 1. Only enabled announced routes count
 * 2. Subtract enabled excluded routes (CIDR split)
 * 3. Disabled exclusions are ignored
 * 4. Routes fully covered by a larger route are absorbed (omitted)
 */
export function computeEffectiveRoutes(
  announced: RouteEntry[],
  excluded: RouteEntry[],
): EffectiveRoute[] {
  const enabledExcludes = excluded
    .filter((e) => e.enabled)
    .map((e) => e.cidr)
    .filter((c) => parseCIDR(c));

  let routes: EffectiveRoute[] = [];
  for (const a of announced) {
    if (!a.enabled || !parseCIDR(a.cidr)) continue;
    let parts = [a.cidr];
    for (const x of enabledExcludes) {
      parts = parts.flatMap((p) => subtractCIDR(p, x));
    }
    for (const p of parts) {
      routes.push({ cidr: p, sourceCidr: a.cidr, sourceDescription: a.description });
    }
  }

  // Absorb routes fully covered by a larger route
  routes = routes.filter(
    (r, idx) =>
      !routes.some(
        (other, oidx) =>
          oidx !== idx &&
          parseCIDR(other.cidr)!.prefix < parseCIDR(r.cidr)!.prefix &&
          cidrContainsCidr(other.cidr, r.cidr),
      ),
  );

  return routes.sort((a, b) => {
    const pa = parseCIDR(a.cidr)!;
    const pb = parseCIDR(b.cidr)!;
    return pa.network - pb.network || pa.prefix - pb.prefix;
  });
}

/** Find the most specific (longest prefix) CIDR in `cidrs` containing `ip`. */
export function findBestMatch(ip: string, cidrs: string[]): string | null {
  let best: string | null = null;
  let bestPrefix = -1;
  for (const c of cidrs) {
    const p = parseCIDR(c);
    if (p && p.prefix > bestPrefix && cidrContainsIp(c, ip)) {
      best = p.cidr;
      bestPrefix = p.prefix;
    }
  }
  return best;
}

/** Quick validity check for user input in any supported format. */
export function isValidRouteInput(input: string): boolean {
  return normalizeToCIDRs(input).length > 0;
}
