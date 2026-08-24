import Button from "@components/Button";
import { DatePickerWithRange } from "@components/DatePickerWithRange";
import InlineLink from "@components/InlineLink";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import {
  formatPeerResourceChip,
  PeerResourceOption,
  PeerResourcePicker,
} from "@components/table/filters/PeerResourcePicker";
import {
  TableFilterChips,
  TableFilterDef,
  TableFiltersButton,
} from "@components/table/TableFilters";
import GetStartedTest from "@components/ui/GetStartedTest";
import useFetchApi from "@utils/api";
import { cn, formatBytes } from "@utils/helpers";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { ArrowDownIcon, ArrowLeftRightIcon, ArrowUpIcon, ChevronRightIcon, ExternalLinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { DateRange } from "react-day-picker";
import {
  TrafficEvent,
  TrafficEventDirection,
  TrafficEventType,
} from "@/cloud/traffic-events/interfaces/TrafficEvent";
import {
  NetworkTrafficGroup,
  NetworkTrafficGroupRow,
} from "@/cloud/traffic-events/interfaces/NetworkTrafficGroup";
import { TrafficEventsBytesCell } from "@/cloud/traffic-events/table/TrafficEventsBytesCell";
import NetworkTrafficGroupDetails from "@/cloud/traffic-events/table/NetworkTrafficGroupDetails";
import { TrafficEventsMachineCell } from "@/cloud/traffic-events/table/TrafficEventsMachineCell";
import { TrafficEventsPortCell } from "@/cloud/traffic-events/table/TrafficEventsPortCell";
import { TrafficEventsReporterCell } from "@/cloud/traffic-events/table/TrafficEventsReporterCell";
import { TrafficEventsTextCell } from "@/cloud/traffic-events/table/TrafficEventsTextCell";
import { TrafficEventsTimeCell } from "@/cloud/traffic-events/table/TrafficEventsTimeCell";
import { TRAFFIC_EVENTS_DOC_LINK } from "@/cloud/traffic-events/TrafficEventSetting";
import { parseAddressPort } from "@/cloud/traffic-events/utils/parseAddress";
import { usePeers } from "@/contexts/PeersProvider";
import { useServerPagination } from "@/contexts/ServerPaginationProvider";
import { useUsers } from "@/contexts/UsersProvider";
import { NetworkResource } from "@/interfaces/Network";

export const getTrafficEventTypeText = (
  t: (key: string, values?: Record<string, unknown>) => string,
  type: TrafficEventType,
  isP2P: boolean,
  direction: TrafficEventDirection,
) => {
  const name = isP2P ? t("trafficEvents.p2p") : t("trafficEvents.routed");
  const isInbound = direction === TrafficEventDirection.INGRESS;
  const directionText = isInbound
    ? t("trafficEvents.inbound")
    : t("trafficEvents.outbound");

  switch (type) {
    case TrafficEventType.CONNECTED:
      return t("trafficEvents.typeText", {
        name,
        verb: t("trafficEvents.connectionStarted"),
        direction: directionText,
      });
    case TrafficEventType.BLOCKED:
      return t("trafficEvents.typeText", {
        name,
        verb: t("trafficEvents.connectionBlocked"),
        direction: directionText,
      });
    case TrafficEventType.STOPPED:
      return t("trafficEvents.typeText", {
        name,
        verb: t("trafficEvents.connectionStopped"),
        direction: directionText,
      });
    default:
      return t("common.unknown");
  }
};

export const TrafficEventsTableColumns = (t: (...args: any[]) => string): ColumnDef<TrafficEvent>[] => [
  {
    id: "timestamp",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("trafficEvents.time")}</DataTableHeader>
    ),
    cell: ({ row }) => (
      <TrafficEventsTimeCell timestamp={row.original.events[0].timestamp} />
    ),
    accessorFn: (row) => row.events?.[0]?.timestamp ?? null,
    filterFn: "dateRange",
    enableGlobalFilter: false,
  },
  {
    id: "type",
    accessorKey: "type",
    accessorFn: (row) => {
      const isP2P =
        row.source.id === row.reporter_id ||
        row.destination.id === row.reporter_id;
      return getTrafficEventTypeText(
        t,
        row.events[0].type,
        isP2P,
        row.direction,
      );
    },
    filterFn: "arrIncludesSomeExact",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("trafficEvents.event")}</DataTableHeader>
    ),
    cell: ({ row }) => row.getValue("type"),
  },
  {
    id: "text",
    accessorKey: "type",
    accessorFn: (row) => {
      const isP2P =
        row.source.id === row.reporter_id ||
        row.destination.id === row.reporter_id;
      return getTrafficEventTypeText(
        t,
        row.events[0].type,
        isP2P,
        row.direction,
      );
    },
    filterFn: "arrIncludesSomeExact",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("trafficEvents.event")}</DataTableHeader>
    ),
    cell: ({ row }) => <TrafficEventsTextCell event={row.original} />,
    enableGlobalFilter: false,
  },
  {
    id: "source",
    accessorFn: (row) => row.source.address,
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("trafficEvents.source")}</DataTableHeader>
    ),
    cell: ({ row }) => (
      <TrafficEventsMachineCell event={row.original} isSource={true} />
    ),
  },
  {
    id: "protocol",
    accessorFn: (row) => row.protocol,
    filterFn: "arrIncludesSomeExact",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("trafficEvents.protocolPort")}</DataTableHeader>
    ),
    cell: ({ row }) => <TrafficEventsPortCell event={row.original} />,
  },
  {
    id: "source_port",
    accessorFn: (row) => {
      return parseAddressPort(row?.source.address).port;
    },
    filterFn: "arrIncludesSomeExact",
  },
  {
    id: "destination_port",
    accessorFn: (row) => {
      return parseAddressPort(row?.destination.address).port;
    },
    filterFn: "arrIncludesSomeExact",
  },
  {
    id: "destination",
    accessorFn: (row) => row.destination.address,
    filterFn: "arrIncludesSomeExact",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("trafficEvents.destination")}</DataTableHeader>
    ),
    cell: ({ row }) => {
      return <TrafficEventsMachineCell event={row.original} isSource={false} />;
    },
  },

  {
    id: "bytes_all",
    accessorKey: "tx_bytes",
    filterFn: "arrIncludesSomeExact",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("trafficEvents.traffic")}</DataTableHeader>
    ),
    cell: ({ row }) => {
      return <TrafficEventsBytesCell event={row.original} />;
    },
    enableGlobalFilter: false,
  },
  {
    id: "bytes_inbound",
    accessorKey: "tx_bytes",
    filterFn: "arrIncludesSomeExact",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("trafficEvents.traffic")}</DataTableHeader>
    ),
    cell: ({ row }) => {
      return (
        <div className={"2xl:min-w-[200px] ml-auto"}>
          <TrafficEventsBytesCell event={row.original} showOutbound={false} />
        </div>
      );
    },
    enableGlobalFilter: false,
  },
  {
    id: "bytes_outbound",
    accessorKey: "tx_bytes",
    filterFn: "arrIncludesSomeExact",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("trafficEvents.traffic")}</DataTableHeader>
    ),
    cell: ({ row }) => {
      return (
        <div className={"2xl:min-w-[200px] ml-auto"}>
          <TrafficEventsBytesCell event={row.original} showInbound={false} />
        </div>
      );
    },
    enableGlobalFilter: false,
  },
  {
    id: "reporter",
    accessorKey: "reporter_id",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("trafficEvents.router")}</DataTableHeader>
    ),
    cell: ({ row }) => <TrafficEventsReporterCell event={row.original} />,
  },
  {
    id: "policy",
    accessorFn: (row) => row.policy?.name,
  },
  {
    id: "user",
    accessorKey: "user_email",
  },
];

type Props = {
  headingTarget?: HTMLHeadingElement | null;
  isSettingEnabled: boolean;
};

export default function TrafficEventsTable({
  headingTarget,
  isSettingEnabled,
}: Readonly<Props>) {
  const router = useRouter();
  const { t } = useI18n();
  const { users } = useUsers();
  const { peers } = usePeers();
  // Resources back the Resources tab of the source/destination picker. Errors
  // are ignored so a missing networks permission just yields an empty tab.
  const { data: resources } = useFetchApi<NetworkResource[]>(
    "/networks/resources",
    true,
  );
  const {
    data,
    isLoading,
    mutate,
    setFilter,
    getFilter,
    queryParams,
    ...paginationProps
  } = useServerPagination<NetworkTrafficGroup[]>();

  const groups = useMemo<NetworkTrafficGroupRow[] | undefined>(() => {
    if (!Array.isArray(data)) return undefined;
    return data.map((group) => ({ ...group, id: group.key }));
  }, [data]);

  const userOptions = useMemo<PeerResourceOption[]>(() => {
    const map = new Map<string, PeerResourceOption>();
    for (const user of users ?? []) {
      if (!user.id || !user.email || user.is_service_user) continue;
      map.set(user.id, {
        id: user.id,
        name: user.name || user.email,
        sublabel: user.email,
        kind: "user" as const,
      });
    }
    return Array.from(map.values());
  }, [users]);

  const dateRange = useMemo<DateRange | undefined>(() => {
    const start = getFilter("start_date");
    const end = getFilter("end_date");
    if (!start && !end) return undefined;
    return {
      from: start ? dayjs(start).toDate() : undefined,
      to: end ? dayjs(end).toDate() : undefined,
    };
  }, [getFilter]);

  const handleDateFilterChange = useCallback(
    (range?: DateRange) => {
      setFilter(
        "start_date",
        range?.from ? dayjs(range.from).toISOString() : undefined,
      );
      setFilter(
        "end_date",
        range?.to ? dayjs(range.to).toISOString() : undefined,
      );
    },
    [setFilter],
  );

  const peerOptions = useMemo<PeerResourceOption[]>(() => {
    return (peers ?? [])
      .filter((p) => p.id)
      .map((p) => ({
        id: p.id as string,
        name: p.name,
        sublabel: p.ip,
        kind: "peer" as const,
        connected: p.connected,
      }));
  }, [peers]);

  const resourceOptions = useMemo<PeerResourceOption[]>(() => {
    return (resources ?? [])
      .filter((r) => r.id)
      .map((r) => ({
        id: r.id,
        name: r.name,
        sublabel: r.address,
        kind: "resource" as const,
        resourceType: r.type,
      }));
  }, [resources]);

  // Combined lookups so a chip can resolve a selected id to a name. The Source
  // filter also resolves users (its third tab); Destination is peers/resources.
  const destinationChipOptions = useMemo<PeerResourceOption[]>(
    () => [...peerOptions, ...resourceOptions],
    [peerOptions, resourceOptions],
  );
  const sourceChipOptions = useMemo<PeerResourceOption[]>(
    () => [...destinationChipOptions, ...userOptions],
    [destinationChipOptions, userOptions],
  );

  const filterDefs = useMemo<TableFilterDef[]>(
    () => [
      {
        id: "source_id",
        label: t("trafficEvents.source"),
        renderPicker: (p) => (
          <PeerResourcePicker
            value={p.value as string | undefined}
            onChange={(next) => {
              p.onChange(next?.id);
              // Peers/resources filter by source_id; users by user_id. The two
              // API params are mutually exclusive within this merged control.
              if (!next) {
                setFilter("source_id", undefined);
                setFilter("user_id", undefined);
              } else if (next.kind === "user") {
                setFilter("user_id", next.id);
                setFilter("source_id", undefined);
              } else {
                setFilter("source_id", next.id);
                setFilter("user_id", undefined);
              }
            }}
            close={p.close}
            peers={peerOptions}
            resources={resourceOptions}
            users={userOptions}
          />
        ),
        formatChip: (v) =>
          formatPeerResourceChip(v as string | undefined, sourceChipOptions),
      },
      {
        id: "destination_id",
        label: t("trafficEvents.destination"),
        renderPicker: (p) => (
          <PeerResourcePicker
            value={p.value as string | undefined}
            onChange={(next) => {
              p.onChange(next?.id);
              setFilter("destination_id", next?.id ?? undefined);
            }}
            close={p.close}
            peers={peerOptions}
            resources={resourceOptions}
          />
        ),
        formatChip: (v) =>
          formatPeerResourceChip(
            v as string | undefined,
            destinationChipOptions,
          ),
      },
    ],
    [
      peerOptions,
      resourceOptions,
      userOptions,
      sourceChipOptions,
      destinationChipOptions,
      setFilter,
      t,
    ],
  );

  // Seed the column-filter chips from the active server query so the chips
  // match what is fetched. The date lives in its own picker, not a chip.
  const initialColumnFilters = useMemo<{ id: string; value: unknown }[]>(() => {
    const filters: { id: string; value: unknown }[] = [];
    // Source holds either a source_id (peer/resource) or a user_id (Users tab).
    const sourceId = getFilter("source_id");
    const userId = getFilter("user_id");
    if (sourceId) filters.push({ id: "source_id", value: sourceId });
    else if (userId) filters.push({ id: "source_id", value: userId });
    const destinationId = getFilter("destination_id");
    if (destinationId)
      filters.push({ id: "destination_id", value: destinationId });
    return filters;
  }, [getFilter]);

  const columns = useMemo<ColumnDef<NetworkTrafficGroupRow>[]>(
    () => [
      {
        id: "expand",
        header: "",
        cell: () => null,
        enableGlobalFilter: false,
      },
      {
        id: "window_start",
        header: t("trafficEvents.windowStart"),
        cell: ({ row }) => (
          <TrafficEventsTimeCell timestamp={row.original.window_start} />
        ),
      },
      {
        id: "user",
        header: t("trafficEvents.user"),
        cell: ({ row }) => (
          <div className="min-w-[160px]">
            <div className="text-sm text-nb-gray-200">
              {row.original.user.name ||
                row.original.user.email ||
                t("trafficEvents.unknownUser")}
            </div>
            {row.original.user.email && (
              <div className="text-xs text-nb-gray-400">
                {row.original.user.email}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "reporter",
        header: t("trafficEvents.reporter"),
        cell: ({ row }) => (
          <span
            className="block max-w-[180px] truncate text-sm text-nb-gray-300"
            title={row.original.reporter_id}
          >
            {peers?.find((peer) => peer.id === row.original.reporter_id)?.name ??
              row.original.reporter_id}
          </span>
        ),
      },
      {
        id: "details",
        header: t("trafficEvents.details"),
        cell: ({ row }) => (
          <span className="text-sm text-nb-gray-300">
            {row.original.detail_count}
          </span>
        ),
      },
      {
        id: "events",
        header: t("trafficEvents.eventCounts"),
        cell: ({ row }) => (
          <div className="whitespace-nowrap text-xs text-nb-gray-400">
            {t("trafficEvents.eventCountsValue", {
              starts: row.original.num_of_starts,
              ends: row.original.num_of_ends,
              drops: row.original.num_of_drops,
            })}
          </div>
        ),
      },
      {
        id: "traffic",
        header: t("trafficEvents.traffic"),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 whitespace-nowrap text-xs font-medium text-nb-gray-300">
            <span className="flex items-center gap-2">
              <ArrowDownIcon size={15} className="text-sky-400" />
              {formatBytes(row.original.rx_bytes)}
            </span>
            <span className="flex items-center gap-2">
              <ArrowUpIcon size={15} className="text-netbird" />
              {formatBytes(row.original.tx_bytes)}
            </span>
          </div>
        ),
      },
      {
        id: "integrity",
        header: t("trafficEvents.integrity"),
        cell: () => (
          <span
            className="inline-flex rounded-full border border-nb-gray-700 px-2 py-1 text-xs text-nb-gray-400"
            title={t("trafficEvents.integrityUnknownDescription")}
          >
            {t("trafficEvents.integrityUnknown")}
          </span>
        ),
      },
      {
        id: "source_id",
        accessorFn: (row) => row.key,
        enableGlobalFilter: false,
      },
      {
        id: "destination_id",
        accessorFn: (row) => row.key,
        enableGlobalFilter: false,
      },
    ],
    [peers, t],
  );

  const getStartedCard = !isSettingEnabled ? (
    <GetStartedTest
      icon={
        <SquareIcon
          icon={<ArrowLeftRightIcon className={"text-nb-gray-200"} size={20} />}
          color={"gray"}
          size={"large"}
        />
      }
      title={t("trafficEvents.getStartedTitle")}
      description={t("trafficEvents.getStartedDescription")}
      button={
        <Button
          variant={"primary"}
          onClick={() => router.push("/settings?tab=networks")}
        >
          Enable Traffic Events
        </Button>
      }
      learnMore={
        <>
          {t("common.learnMoreAbout")}{" "}
          <InlineLink href={TRAFFIC_EVENTS_DOC_LINK} target={"_blank"}>
            {t("trafficEvents.title")}
            <ExternalLinkIcon size={12} />
          </InlineLink>
        </>
      }
    />
  ) : (
    <GetStartedTest
      icon={
        <SquareIcon
          icon={<ArrowLeftRightIcon className={"text-nb-gray-200"} size={20} />}
          color={"gray"}
          size={"large"}
        />
      }
      title={t("trafficEvents.emptyTitle")}
      description={t("trafficEvents.emptyDescription")}
      learnMore={
        <>
          {t("common.learnMoreAbout")}{" "}
          <InlineLink href={TRAFFIC_EVENTS_DOC_LINK} target={"_blank"}>
            {t("trafficEvents.title")}
            <ExternalLinkIcon size={12} />
          </InlineLink>
        </>
      }
    />
  );

  // Keep the filter controls interactive whenever the feature is enabled, even
  // before any events exist, so filters can be configured and exercised on an
  // empty table.
  const filtersDisabled = !isSettingEnabled;

  return (
    <DataTable
      {...paginationProps}
      serverSidePagination={false}
      useRowId={true}
      headingTarget={headingTarget}
      text={t("trafficEvents.title")}
      isLoading={isLoading}
      tableCellClassName={"py-2"}
      rowClassName={"data-[accordion=opened]:!border-b-transparent"}
      renderExpandedRow={(group) => (
        <NetworkTrafficGroupDetails
          group={group}
          filters={queryParams}
          columns={TrafficEventsTableColumns(t)}
        />
      )}
      renderExpandButton={(expanded, controls, toggle) => (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={controls}
          aria-label={
            expanded
              ? t("trafficEvents.collapseDetails")
              : t("trafficEvents.expandDetails")
          }
          className="rounded p-2 text-nb-gray-400 outline-none hover:bg-nb-gray-900 hover:text-white focus-visible:ring-2 focus-visible:ring-netbird"
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
        >
          <ChevronRightIcon
            size={16}
            aria-hidden="true"
            className={cn("transition-transform", expanded && "rotate-90")}
          />
        </button>
      )}
      columns={columns}
      columnVisibility={{ source_id: false, destination_id: false }}
      initialFilters={initialColumnFilters}
      data={groups}
      searchPlaceholder={t("trafficEvents.searchPlaceholder")}
      aboveTable={(table) => (
        <TableFilterChips table={table} filters={filterDefs} />
      )}
      getStartedCard={getStartedCard}
    >
      {(table) => (
        <>
          <DatePickerWithRange
            value={dateRange}
            onChange={handleDateFilterChange}
            disabled={filtersDisabled}
          />

          <TableFiltersButton
            table={table}
            filters={filterDefs}
            disabled={filtersDisabled}
          />

          <DataTableRefreshButton
            isDisabled={filtersDisabled}
            onClick={() => mutate()}
          />
        </>
      )}
    </DataTable>
  );
}
