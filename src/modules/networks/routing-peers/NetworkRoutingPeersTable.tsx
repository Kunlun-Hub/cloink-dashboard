import Button from "@components/Button";
import Card from "@components/Card";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableResetFilterButton from "@components/table/DataTableResetFilterButton";
import {
  formatRadioChip,
  RadioOption,
  RadioPicker,
} from "@components/table/filters/RadioPicker";
import {
  TableFilterChips,
  TableFilterDef,
  TableFiltersButton,
} from "@components/table/TableFilters";
import NoResults from "@components/ui/NoResults";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";
import * as React from "react";
import { useMemo, useState } from "react";
import PeerIcon from "@/assets/icons/PeerIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { NetworkRouter } from "@/interfaces/Network";
import { useNetworksContext } from "@/modules/networks/NetworkProvider";
import { NetworkRoutingPeerName } from "@/modules/networks/routing-peers/NetworkRoutingPeerName";
import { RoutingPeersActionCell } from "@/modules/networks/routing-peers/RoutingPeersActionCell";
import { RoutingPeersMasqueradeCell } from "@/modules/networks/routing-peers/RoutingPeersMasqueradeCell";
import RouteMetricCell from "@/modules/routes/RouteMetricCell";

type Props = {
  routers?: NetworkRouter[];
  isLoading: boolean;
  headingTarget?: HTMLHeadingElement | null;
};

export default function NetworkRoutingPeersTable({
  routers,
  isLoading,
  headingTarget,
}: Readonly<Props>) {
  const { permission } = usePermissions();
  const { openAddRoutingPeerModal, network } = useNetworksContext();
  const { t } = useI18n();

  const NetworkRouterColumns: ColumnDef<NetworkRouter>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "id",
        header: ({ column }) => {
          return (
            <DataTableHeader column={column}>
              {t("networkRoutingPeers.peer")}
            </DataTableHeader>
          );
        },
        sortingFn: "text",
        cell: ({ row }) => <NetworkRoutingPeerName router={row.original} />,
      },
      {
        id: "enabled",
        accessorKey: "enabled",
      },
      {
        id: "metric",
        accessorKey: "metric",
        header: ({ column }) => {
          return (
            <DataTableHeader column={column}>
              {t("networkRoutingPeers.metric")}
            </DataTableHeader>
          );
        },
        cell: ({ row }) => (
          <RouteMetricCell
            metric={row.original.metric}
            useHoverStyle={false}
          />
        ),
      },
      {
        id: "masquerade",
        accessorKey: "masquerade",
        header: ({ column }) => {
          return (
            <DataTableHeader column={column}>
              {t("networkRoutingPeers.masquerade")}
            </DataTableHeader>
          );
        },
        cell: ({ row }) => (
          <RoutingPeersMasqueradeCell router={row.original} />
        ),
      },
      {
        id: "actions",
        accessorKey: "id",
        header: "",
        cell: ({ row }) => {
          return <RoutingPeersActionCell router={row.original} />;
        },
      },
      {
        id: "search",
        accessorKey: "search",
        header: "",
        filterFn: "fuzzy",
      },
    ],
    [t],
  );

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "metric",
      desc: false,
    },
  ]);

  const statusOptions = useMemo<RadioOption<boolean | undefined>[]>(
    () => [
      {
        value: undefined,
        label: t("common.all"),
        dotClass: "bg-nb-gray-500",
      },
      {
        value: true,
        label: t("common.active"),
        dotClass: "bg-green-500",
      },
      {
        value: false,
        label: t("common.inactive"),
        dotClass: "bg-nb-gray-700",
      },
    ],
    [t],
  );

  const filterDefs = useMemo<TableFilterDef[]>(
    () => [
      {
        id: "enabled",
        label: t("common.status"),
        renderPicker: (p) => (
          <RadioPicker
            value={p.value as boolean | undefined}
            onChange={p.onChange}
            close={p.close}
            options={statusOptions}
          />
        ),
        formatChip: (v) =>
          formatRadioChip(v as boolean | undefined, statusOptions),
      },
    ],
    [statusOptions, t],
  );

  return (
    <DataTable
      wrapperComponent={Card}
      wrapperProps={{ className: "mt-6 pb-2 w-full" }}
      headingTarget={headingTarget}
      sorting={sorting}
      setSorting={setSorting}
      minimal={true}
      showSearchAndFilters={true}
      inset={false}
      tableClassName={"mt-0"}
      text={t("common.routingPeers")}
      columns={NetworkRouterColumns}
      keepStateInLocalStorage={false}
      initialPageSize={25}
      showResetFilterButton={false}
      aboveTable={(table) => (
        <TableFilterChips table={table} filters={filterDefs} />
      )}
      data={routers}
      searchPlaceholder={t("networkRoutingPeers.searchPlaceholder")}
      isLoading={isLoading}
      getStartedCard={
        <NoResults
          className={"py-4"}
          title={t("networkRoutingPeers.emptyTitle")}
          description={t("networkRoutingPeers.emptyDescription")}
          icon={<PeerIcon size={18} className={"fill-nb-gray-400"} />}
        />
      }
      columnVisibility={{ search: false, enabled: false }}
      rowClassName={(row) => (row.original.enabled ? "" : "opacity-50")}
      paginationPaddingClassName={"px-0 pt-8"}
      rightSide={() => (
        <Button
          variant={"primary"}
          className={"ml-auto mr-4"}
          onClick={() => network && openAddRoutingPeerModal(network)}
          disabled={!permission.networks.update}
        >
          <PlusCircle size={16} />
          {t("common.add")}
        </Button>
      )}
    >
      {(table) => (
        <>
          <TableFiltersButton
            table={table}
            filters={filterDefs}
            disabled={!routers || routers?.length == 0}
          />
          <DataTableResetFilterButton
            table={table}
            onClick={() => {
              table.setPageIndex(0);
              table.resetColumnFilters();
              table.resetGlobalFilter();
            }}
          />
        </>
      )}
    </DataTable>
  );
}
