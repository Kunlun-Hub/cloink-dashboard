"use client";

import Badge from "@components/Badge";
import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import GetStartedTest from "@components/ui/GetStartedTest";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import AgentNetworkIcon from "@/assets/icons/AgentNetworkIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import AIProviderLogo from "@/modules/agent-network/AIProviderLogo";
import { AIProviderId } from "@/modules/agent-network/data/mockData";
import { APIMeProvider } from "@/modules/agent-network/useMyAgentNetworkSetup";
import { useI18n } from "@/i18n/I18nProvider";

function NameCell({ provider }: { provider: APIMeProvider }) {
  return (
    <div className={"flex items-center gap-3 py-2 pl-3"}>
      {/* catalog_id comes off the wire as a plain string; an id the catalog
          doesn't know renders the neutral badge. */}
      <AIProviderLogo
        providerId={provider.catalog_id as AIProviderId}
        size={28}
      />
      <div className={"flex flex-col items-start min-w-0"}>
        <span
          className={
            "font-medium text-sm dark:text-nb-gray-100 whitespace-nowrap"
          }
        >
          {provider.name}
        </span>
        {/* The name is operator-chosen and often just the vendor, so the
            catalog id is what actually says which provider is behind it. */}
        <span className={"text-xs text-nb-gray-400 whitespace-nowrap mt-0.5"}>
          {provider.catalog_id}
        </span>
      </div>
    </div>
  );
}

// Up to this many models are spelled out; beyond it the cell just counts them,
// the way the admin providers table reports its allow-list.
const NAMED_MODELS = 2;

function ModelsCell({ provider }: { provider: APIMeProvider }) {
  const { t } = useI18n();
  if (provider.all_models_allowed) {
    return <span className={"text-xs text-nb-gray-400"}>{t("agentProviders.allModels")}</span>;
  }
  // A short allow-list is spelled out as one chip per model, the way groups
  // and providers are chipped elsewhere; a long one collapses to a count.
  if (provider.models.length <= NAMED_MODELS) {
    return (
      <div className={"flex items-center gap-2"}>
        {provider.models.map((model) => (
          <Badge
            key={model}
            variant={"gray-ghost"}
            className={"whitespace-nowrap"}
          >
            {model}
          </Badge>
        ))}
      </div>
    );
  }
  return (
    <div className={"flex"}>
      <FullTooltip
        content={
          <div className={"flex flex-col gap-1 text-xs"}>
            {provider.models.map((model) => (
              <div key={model}>{model}</div>
            ))}
          </div>
        }
      >
        <Badge
          variant={"gray-ghost"}
          useHover={true}
          className={"whitespace-nowrap"}
        >
          {t("agentAccessLog.modelsCount", { count: provider.models.length })}
        </Badge>
      </FullTooltip>
    </div>
  );
}

const getColumns = (t: (...args: any[]) => string): ColumnDef<APIMeProvider>[] => [
  {
    id: "name",
    accessorKey: "name",
    sortingFn: "text",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("agentNetwork.provider")}</DataTableHeader>
    ),
    cell: ({ row }) => <NameCell provider={row.original} />,
  },
  {
    id: "models",
    // All-models rows sort above allow-listed ones, then by list length.
    accessorFn: (p) => (p.all_models_allowed ? Infinity : p.models.length),
    sortingFn: "basic",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("table.models")}</DataTableHeader>
    ),
    cell: ({ row }) => <ModelsCell provider={row.original} />,
  },
];

type Props = {
  providers: APIMeProvider[];
};

// ConnectProvidersTable lists what the caller's own policies let them reach.
// Same DataTable the admin providers table uses, minus the write flows: the
// rows come from the caller-scoped agent-config answer, so there is nothing
// here to connect, edit, or delete.
export default function ConnectProvidersTable({ providers }: Readonly<Props>) {
  const { t } = useI18n();
  const path = usePathname();
  const router = useRouter();
  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [{ id: "name", desc: false }],
  );

  // Whoever can edit policies can fix this themselves, so they get the action
  // instead of being told to ask someone else.
  const { permission } = usePermissions();
  const canManagePolicies = !!permission?.["agent_network.policies"]?.update;

  return (
    <DataTable
      text={t("nav.providers")}
      sorting={sorting}
      setSorting={setSorting}
      columns={getColumns(t)}
      data={providers}
      showSearchAndFilters={false}
      initialPageSize={25}
      // Nothing to list means no policy covers this caller yet, so the card
      // says so rather than leaving an empty table behind.
      getStartedCard={
        <GetStartedTest
          icon={
            <SquareIcon
              icon={
                <AgentNetworkIcon className={"fill-nb-gray-200"} size={20} />
              }
              color={"gray"}
              size={"large"}
            />
          }
          title={t("connectProviders.emptyTitle")}
          description={
            canManagePolicies
              ? t("connectProviders.emptyManageableDescription")
              : t("connectProviders.emptyReadonlyDescription")
          }
          button={
            canManagePolicies ? (
              <Button
                variant={"primary"}
                onClick={() => router.push("/agent-network/policies")}
              >
                {t("connectProviders.goToPolicies")}
              </Button>
            ) : undefined
          }
        />
      }
    />
  );
}
