import Card from "@components/Card";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import * as React from "react";
import { useMemo, useState } from "react";
import { EnterpriseConnectionDomain } from "@/interfaces/IdentityProvider";
import { useI18n } from "@/i18n/I18nProvider";
import LastTimeRow from "@/modules/common-table-rows/LastTimeRow";

const createDomainTableColumns = (
  t: (key: any, ...args: any[]) => string,
): ColumnDef<EnterpriseConnectionDomain>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableHeader column={column}>{t("domainVerification.domain")}</DataTableHeader>;
    },
    sortingFn: "text",
  },
  {
    accessorKey: "validation_status",
    header: ({ column }) => {
      return <DataTableHeader column={column}>{t("common.status")}</DataTableHeader>;
    },
    sortingFn: "text",
  },
  {
    accessorKey: "validation_last_updated",
    header: ({ column }) => {
      return <DataTableHeader column={column}>{t("domainVerification.lastCheck")}</DataTableHeader>;
    },
    sortingFn: "text",
    cell: ({ row }) => (
      <LastTimeRow
        date={dayjs(row.original.validation_last_updated).toDate()}
        text={t("domainVerification.lastCheckedOn")}
      />
    ),
  },
];

type Props = {
  domains: EnterpriseConnectionDomain[];
};
export const DomainVerificationTable = ({ domains }: Props) => {
  const { t } = useI18n();
  const columns = useMemo(() => createDomainTableColumns(t), [t]);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "is_current",
      desc: true,
    },
    {
      id: "name",
      desc: true,
    },
  ]);

  return (
    <Card className={"w-full"}>
      <DataTable
        showHeader={false}
        tableClassName={"w-full mt-0"}
        minimal={true}
        showSearchAndFilters={false}
        text={t("domainVerification.domains")}
        sorting={sorting}
        setSorting={setSorting}
        columns={columns}
        data={domains}
      />
    </Card>
  );
};
