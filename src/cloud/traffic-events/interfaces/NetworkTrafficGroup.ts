export interface NetworkTrafficGroup {
  key: string;
  scope: "OVERLAY_DATA_PLANE";
  window_start: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  reporter_id: string;
  detail_count: number;
  rx_bytes: number;
  rx_packets: number;
  tx_bytes: number;
  tx_packets: number;
  num_of_starts: number;
  num_of_ends: number;
  num_of_drops: number;
}

export type NetworkTrafficGroupRow = NetworkTrafficGroup & { id: string };
