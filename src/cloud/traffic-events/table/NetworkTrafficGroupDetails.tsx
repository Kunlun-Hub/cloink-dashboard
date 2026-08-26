import Button from "@components/Button";
import { DataTable } from "@components/table/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import React from "react";
import { NetworkTrafficGroup } from "@/cloud/traffic-events/interfaces/NetworkTrafficGroup";
import { TrafficEvent } from "@/cloud/traffic-events/interfaces/TrafficEvent";
import ServerPaginationProvider, {
  useServerPagination,
} from "@/contexts/ServerPaginationProvider";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  group: NetworkTrafficGroup;
  filters: URLSearchParams;
  columns: ColumnDef<TrafficEvent>[];
};

export default function NetworkTrafficGroupDetails({
  group,
  filters,
  columns,
}: Readonly<Props>) {
  const defaultFilters = Object.fromEntries(filters);
  delete defaultFilters.grouped;
  defaultFilters.window_start = group.window_start;
  // An existing empty value selects the persisted unknown-user group.
  defaultFilters.group_user_id = group.user.id;
  defaultFilters.reporter_id = group.reporter_id;
  defaultFilters.source_key = group.source_key;
  defaultFilters.destination_address = group.destination.address;
  defaultFilters.protocol = String(group.protocol);
  defaultFilters.direction = group.direction;
  defaultFilters.connection_type = group.connection_type;

  return (
    <ServerPaginationProvider
      url="/events/network-traffic"
      defaultPageSize={10}
      defaultFilters={defaultFilters}
      ignoreError
    >
      <NetworkTrafficGroupDetailTable columns={columns} />
    </ServerPaginationProvider>
  );
}

function NetworkTrafficGroupDetailTable({
  columns,
}: Readonly<{ columns: ColumnDef<TrafficEvent>[] }>) {
  const { t } = useI18n();
  const { data, error, isLoading, mutate, ...pagination } =
    useServerPagination<TrafficEvent[]>();
  const events = Array.isArray(data) ? data : [];

  if (error) {
    return (
      <div
        className="flex items-center gap-4 px-6 py-5 text-sm text-red-400"
        role="alert"
      >
        <span>{t("trafficEvents.detailsError")}</span>
        <Button variant="secondary" size="xs" onClick={() => mutate()}>
          {t("trafficEvents.retry")}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center gap-2 px-6 py-5 text-sm text-nb-gray-300"
        role="status"
        aria-live="polite"
      >
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        {t("trafficEvents.detailsLoading")}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="px-6 py-5 text-sm text-nb-gray-400" role="status">
        {t("trafficEvents.detailsEmpty")}
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-700/40 bg-nb-gray-950/30 px-4 pb-4">
      <DataTable
        {...pagination}
        columns={columns}
        data={events}
        useRowId
        minimal
        serverSidePagination
        showSearchAndFilters={false}
        columnVisibility={{
          user: false,
          source_port: false,
          destination_port: false,
          bytes_inbound: false,
          bytes_outbound: false,
          type: false,
          timestamp: false,
          policy: false,
        }}
      />
    </div>
  );
}
