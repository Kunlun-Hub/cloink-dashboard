import Button from "@components/Button";
import Card from "@components/Card";
import InlineLink from "@components/InlineLink";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import DataTableResetFilterButton from "@components/table/DataTableResetFilterButton";
import {
  formatGroupsChip,
  GroupsPicker,
} from "@components/table/filters/GroupsPicker";
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
import GetStartedTest from "@components/ui/GetStartedTest";
import NoResults from "@components/ui/NoResults";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { ExternalLinkIcon, PlusCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
import { uniqBy } from "lodash";
import { useSWRConfig } from "swr";
import SetupKeysIcon from "@/assets/icons/SetupKeysIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Group } from "@/interfaces/Group";
import { SetupKey } from "@/interfaces/SetupKey";
import EmptyRow from "@/modules/common-table-rows/EmptyRow";
import ExpirationDateRow from "@/modules/common-table-rows/ExpirationDateRow";
import LastTimeRow from "@/modules/common-table-rows/LastTimeRow";
import SetupKeyActionCell from "@/modules/setup-keys/SetupKeyActionCell";
import SetupKeyGroupsCell from "@/modules/setup-keys/SetupKeyGroupsCell";
import SetupKeyModal from "@/modules/setup-keys/SetupKeyModal";
import SetupKeyNameCell from "@/modules/setup-keys/SetupKeyNameCell";
import SetupKeyUsageCell from "@/modules/setup-keys/SetupKeyUsageCell";

export const getSetupKeysTableColumns = (
  t: (key: string, params?: Record<string, unknown>) => string,
): ColumnDef<SetupKey>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("table.nameAndKey")}
        </DataTableHeader>
      );
    },
    sortingFn: "text",
    cell: ({ row }) => (
      <SetupKeyNameCell
        name={row.original.name}
        valid={row.original.valid}
        secret={row.original.key}
        ephemeral={row.original.ephemeral}
        allowExtraDnsLabels={row.original.allow_extra_dns_labels}
      />
    ),
  },
  {
    id: "valid",
    accessorKey: "valid",
    sortingFn: "basic",
  },
  {
    accessorKey: "usage_limit",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("table.usage")}</DataTableHeader>
      );
    },
    cell: ({ row }) => (
      <SetupKeyUsageCell
        current={row.original.used_times}
        limit={row.original.usage_limit || 0}
        reusable={row.original.type == "reusable"}
      />
    ),
  },
  {
    id: "type",
    accessorKey: "type",
    filterFn: "equalsString",
  },
  {
    accessorKey: "last_used",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("table.lastUsed")}
        </DataTableHeader>
      );
    },
    sortingFn: "datetime",
    cell: ({ row }) => (
      <LastTimeRow
        date={row.original.last_used}
        text={t("setupKeys.lastUsedOn")}
      />
    ),
  },
  {
    id: "group_strings",
    accessorKey: "group_strings",
    accessorFn: (s) => s.groups?.map((g) => g?.name || "").join(", "),
  },
  {
    id: "group_names",
    accessorFn: (s) => s.groups?.map((g) => g?.name || ""),
    filterFn: "arrIncludesSome",
  },
  {
    accessorFn: (item) => item.auto_groups?.length,
    id: "groups",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("table.groups")}</DataTableHeader>
      );
    },
    cell: ({ row }) => <SetupKeyGroupsCell setupKey={row.original} />,
  },

  {
    accessorKey: "expires",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("table.expires")}
        </DataTableHeader>
      );
    },
    cell: ({ row }) => {
      let expires = dayjs(row.original.expires);
      let isNeverExpiring = expires?.year() == 1 || false;
      return !isNeverExpiring ? (
        <ExpirationDateRow date={row.original.expires} />
      ) : (
        <EmptyRow className={"px-3"} />
      );
    },
  },
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) => {
      return <SetupKeyActionCell setupKey={row.original} />;
    },
  },
];

type Props = {
  setupKeys?: SetupKey[];
  isLoading: boolean;
  headingTarget?: HTMLHeadingElement | null;
  isGroupPage?: boolean;
  groups?: Group[];
};

export default function SetupKeysTable({
  setupKeys,
  isLoading,
  headingTarget,
  isGroupPage,
  groups,
}: Readonly<Props>) {
  const { mutate } = useSWRConfig();
  const path = usePathname();
  const { permission } = usePermissions();
  const { t } = useI18n();

  const columns = useMemo(() => getSetupKeysTableColumns(t), [t]);

  // Default sorting state of the table
  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [
      {
        id: "valid",
        desc: true,
      },
      {
        id: "last_used",
        desc: true,
      },
      {
        id: "name",
        desc: true,
      },
    ],
    !isGroupPage,
  );

  const [open, setOpen] = useState(false);

  // Groups derived from the current setup keys, so the Groups filter
  // only offers groups that actually appear in the table.
  const tableGroups = useMemo<Group[]>(
    () =>
      (uniqBy(
        setupKeys?.flatMap((k) => k.groups || []),
        "name",
      ) as Group[]) || [],
    [setupKeys],
  );

  // Single-radio status filter mirroring the previous All / Valid /
  // Expired ButtonGroup. The `valid` column already exists; we just
  // re-route it through the consolidated filter UI.
  const statusOptions = useMemo<RadioOption<boolean | undefined>[]>(
    () => [
      { value: undefined, label: t("filters.all"), dotClass: "bg-nb-gray-500" },
      { value: true, label: t("filters.valid"), dotClass: "bg-green-500" },
      {
        value: false,
        label: t("filters.expired"),
        dotClass: "bg-nb-gray-700",
      },
    ],
    [t],
  );

  const usageOptions = useMemo<RadioOption<string | undefined>[]>(
    () => [
      { value: undefined, label: t("filters.all") },
      { value: "one-off", label: t("setupKeys.oneOff") },
      { value: "reusable", label: t("setupKeys.reusable") },
    ],
    [t],
  );

  const filterDefs = useMemo<TableFilterDef[]>(
    () => [
      {
        id: "valid",
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
      {
        id: "type",
        label: t("table.usage"),
        renderPicker: (p) => (
          <RadioPicker
            value={p.value as string | undefined}
            onChange={p.onChange}
            close={p.close}
            options={usageOptions}
          />
        ),
        formatChip: (v) =>
          formatRadioChip(v as string | undefined, usageOptions),
      },
      {
        id: "group_names",
        label: t("table.groups"),
        renderPicker: (p) => (
          <GroupsPicker
            value={p.value as string[] | undefined}
            onChange={p.onChange}
            close={p.close}
            groups={tableGroups}
          />
        ),
        formatChip: (v) => formatGroupsChip(v as string[] | undefined),
      },
    ],
    [t, statusOptions, usageOptions, tableGroups],
  );

  return (
    <>
      {open && <SetupKeyModal open={open} setOpen={setOpen} groups={groups} />}
      <DataTable
        headingTarget={headingTarget}
        isLoading={isLoading}
        wrapperComponent={isGroupPage ? Card : undefined}
        wrapperProps={isGroupPage ? { className: "mt-6 w-full" } : undefined}
        paginationPaddingClassName={isGroupPage ? "px-0 pt-8" : undefined}
        tableClassName={isGroupPage ? "mt-0 mb-2" : undefined}
        inset={false}
        minimal={isGroupPage}
        keepStateInLocalStorage={!isGroupPage}
        text={t("setupKeys.title")}
        sorting={sorting}
        setSorting={setSorting}
        initialPageSize={25}
        showResetFilterButton={false}
        columns={columns}
        data={setupKeys}
        searchPlaceholder={t("setupKeys.searchPlaceholder")}
        columnVisibility={{
          valid: false,
          group_strings: false,
          group_names: false,
          type: false,
        }}
        aboveTable={(table) => (
          <TableFilterChips table={table} filters={filterDefs} />
        )}
        getStartedCard={
          isGroupPage ? (
            <NoResults
              icon={<SetupKeysIcon className={"fill-nb-gray-200"} size={20} />}
              className={"py-4"}
              title={t("setupKeys.groupEmptyTitle")}
              description={t("setupKeys.groupEmptyDescription")}
            >
              <Button
                variant={"primary"}
                className={"mt-4"}
                onClick={() => setOpen(true)}
                disabled={!permission.setup_keys.create}
              >
                <PlusCircle size={16} />
                {t("setupKeys.createKey")}
              </Button>
            </NoResults>
          ) : (
            <GetStartedTest
              icon={
                <SquareIcon
                  icon={
                    <SetupKeysIcon className={"fill-nb-gray-200"} size={20} />
                  }
                  color={"gray"}
                  size={"large"}
                />
              }
              title={t("setupKeys.createTitle")}
              description={t("setupKeys.emptyDescription")}
              button={
                <Button
                  variant={"primary"}
                  className={""}
                  onClick={() => setOpen(true)}
                  disabled={!permission.setup_keys.create}
                  data-testid="open-create-setup-key"
                >
                  <PlusCircle size={16} />
                  {t("setupKeys.createKey")}
                </Button>
              }
              learnMore={
                <>
                  {t("setupKeys.learnMorePrefix")}
                  <InlineLink
                    href={
                      "https://docs.netbird.io/how-to/register-machines-using-setup-keys"
                    }
                    target={"_blank"}
                  >
                    {t("setupKeys.learnMoreLink")}
                    <ExternalLinkIcon size={12} />
                  </InlineLink>
                </>
              }
            />
          )
        }
        rightSide={() => (
          <>
            {setupKeys && setupKeys?.length > 0 && (
              <Button
                variant={"primary"}
                className={"ml-auto"}
                onClick={() => setOpen(true)}
                disabled={!permission.setup_keys.create}
                data-testid="open-create-setup-key"
              >
                <PlusCircle size={16} />
                {t("setupKeys.createKey")}
              </Button>
            )}
          </>
        )}
      >
        {(table) => (
          <>
            <TableFiltersButton
              table={table}
              filters={filterDefs}
              disabled={setupKeys?.length == 0}
            />

            <DataTableResetFilterButton
              table={table}
              onClick={() => {
                table.setPageIndex(0);
                table.resetColumnFilters();
                table.resetGlobalFilter();
              }}
            />

            <DataTableRefreshButton
              isDisabled={setupKeys?.length == 0}
              onClick={() => {
                mutate("/setup-keys").then();
                mutate("/groups").then();
              }}
            />
          </>
        )}
      </DataTable>
    </>
  );
}
