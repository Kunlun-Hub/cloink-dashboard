import { NetworkTrafficGroup } from "@/cloud/traffic-events/interfaces/NetworkTrafficGroup";
import { parseAddressPort } from "@/cloud/traffic-events/utils/parseAddress";

// Mirrors management/internals/shared/netiputil.IsSystemLocalAddress: addresses
// that only exist on the local host or link (unspecified, loopback, multicast,
// link-local and the limited broadcast address).
export function isSystemLocalAddress(address?: string): boolean {
  const { ip } = parseAddressPort(address);
  const value = ip
    .replace(/^\[|\]$/g, "")
    .trim()
    .toLowerCase();
  if (!value) return true;

  if (value.includes(":")) {
    if (value === "::" || value === "::1") return true;
    if (value.startsWith("ff")) return true; // multicast ff00::/8
    const firstGroup = parseInt(value.split(":")[0] || "0", 16);
    if (Number.isNaN(firstGroup)) return false;
    return (firstGroup & 0xffc0) === 0xfe80; // link-local unicast fe80::/10
  }

  const octets = value.split(".");
  if (octets.length !== 4) return false;
  const [a, b] = octets.map((part) => Number(part));
  if (octets.some((part) => part === "" || Number.isNaN(Number(part)))) {
    return false;
  }
  if (a === 0 || a === 127) return true; // unspecified / loopback
  if (a === 255 && b === 255) return true; // limited broadcast
  if (a === 169 && b === 254) return true; // link-local
  return (a & 0xf0) === 0xe0; // multicast 224.0.0.0/4
}

// Reports flows that carry no routing information: discovery chatter
// (mDNS/LLMNR/NetBIOS) and a peer talking to its own address. The collector
// already drops these, so filtering here only hides rows stored before that fix.
export function isNoisyTrafficGroup(group: NetworkTrafficGroup): boolean {
  if (
    isSystemLocalAddress(group.source?.address) ||
    isSystemLocalAddress(group.destination?.address)
  ) {
    return true;
  }
  const source = parseAddressPort(group.source?.address).ip;
  const destination = parseAddressPort(group.destination?.address).ip;
  return Boolean(source) && source === destination;
}
