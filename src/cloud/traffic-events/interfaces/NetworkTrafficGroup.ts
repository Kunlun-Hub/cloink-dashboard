import { TrafficEventMachine } from "@/cloud/traffic-events/interfaces/TrafficEvent";

export interface NetworkTrafficGroup {
  key: string;
  scope: "OVERLAY_DATA_PLANE";
  window_start: string;
  latest_timestamp: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  reporter_id: string;
  source_key: string;
  source: TrafficEventMachine;
  destination: TrafficEventMachine;
  protocol: number;
  direction: string;
  connection_type: string;
  detail_count: number;
  flow_count: number;
  rx_bytes: number;
  rx_packets: number;
  tx_bytes: number;
  tx_packets: number;
  num_of_starts: number;
  num_of_ends: number;
  num_of_drops: number;
}

export type NetworkTrafficGroupRow = NetworkTrafficGroup & { id: string };
