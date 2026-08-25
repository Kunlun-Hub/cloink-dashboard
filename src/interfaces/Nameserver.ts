export interface NameserverGroup {
  id?: string;
  name: string;
  description: string;
  descriptionKey?: string;
  primary: boolean;
  domains: string[];
  nameservers: Nameserver[];
  groups: string[];
  enabled: boolean;
  search_domains_enabled: boolean;
}

export interface Nameserver {
  ip: string;
  ns_type: "udp";
  port: number;
  id?: string;
}

// i18n keys for preset descriptions (used by consuming components for display):
//   Google: "nameservers.template.googleDescription"
//   Cloudflare: "nameservers.template.cloudflareDescription"
export const NameserverPresets: Record<string, NameserverGroup> = {
  Default: {
    name: "",
    description: "",
    primary: true,
    domains: [],
    nameservers: [
      {
        ip: "",
        ns_type: "udp",
        port: 53,
        id: "1",
      },
    ],
    groups: [],
    enabled: true,
    search_domains_enabled: false,
  },
  Google: {
    name: "Google DNS",
    description: "Google DNS Servers",
    descriptionKey: "nameserver.googleDnsServers",
    primary: true,
    domains: [],
    nameservers: [
      {
        ip: "8.8.8.8",
        ns_type: "udp",
        port: 53,
        id: "1",
      },
      {
        ip: "8.8.4.4",
        ns_type: "udp",
        port: 53,
        id: "2",
      },
    ],
    groups: [],
    enabled: true,
    search_domains_enabled: false,
  },
  Cloudflare: {
    name: "Cloudflare DNS",
    description: "Cloudflare DNS Servers",
    descriptionKey: "nameserver.cloudflareDnsServers",
    primary: true,
    domains: [],
    nameservers: [
      {
        ip: "1.1.1.1",
        ns_type: "udp",
        port: 53,
        id: "1",
      },
      {
        ip: "1.0.0.1",
        ns_type: "udp",
        port: 53,
        id: "2",
      },
    ],
    groups: [],
    enabled: true,
    search_domains_enabled: false,
  },
  Quad9: {
    name: "Quad9 DNS",
    description: "Quad9 DNS Servers",
    descriptionKey: "nameserver.quad9DnsServers",
    primary: true,
    domains: [],
    nameservers: [
      {
        ip: "9.9.9.9",
        ns_type: "udp",
        port: 53,
        id: "1",
      },
      {
        ip: "149.112.112.112",
        ns_type: "udp",
        port: 53,
        id: "2",
      },
    ],
    groups: [],
    enabled: true,
    search_domains_enabled: false,
  },
};
