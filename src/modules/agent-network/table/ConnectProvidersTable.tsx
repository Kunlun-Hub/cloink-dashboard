"use client";

import Badge from "@components/Badge";
import Button from "@components/Button";
import Card from "@components/Card";
import FullTooltip from "@components/FullTooltip";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import NoResults from "@components/ui/NoResults";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { Boxes } from "lucide-react";
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
    <div className={"flex items-center gap-3 py-2"}>
      {/* catalog_id comes off the wire as a plain string; an id the catalog
          doesn't know renders the neutral badge. */}
      <AIProviderLogo
        providerId={provider.catalog_id as AIProviderId}
        size={36}
        tile
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
        <span className={"text-xs text-nb-gray-400 whitespace-nowrap"}>
          {provider.catalog_id}
        </span>
      </div>
    </div>
  );
}

function ModelList({ models }: { models: string[] }) {
  return (
    <div className={"flex flex-col gap-1 text-xs"}>
      {models.map((model) => (
        <div key={model}>{model}</div>
      ))}
    </div>
  );
}

// An unrestricted policy still comes back with the provider's declared (or
// catalog) models, so "All Models" can say what it covers instead of leaving
// the caller to guess which model ids to configure.
function AllModelsTooltip({ models }: { models: string[] }) {
  const { t } = useI18n();
  if (models.length === 0) {
    return (
      <span className={"text-xs"}>
        {t("agentNetwork.allModelsNoList")}
      </span>
    );
  }
  return (
    <div className={"flex flex-col gap-2 text-xs"}>
      <span className={"text-nb-gray-300"}>
        {t("agentNetwork.allModelsKnownModels")}
      </span>
      <ModelList models={models} />
    </div>
  );
}

// Same badge the admin providers table uses for its allow-list, with the
// model names on hover — the caller has no other page to look them up on.
function ModelsCell({ provider }: { provider: APIMeProvider }) {
  const { t } = useI18n();
  const allModels = provider.all_models_allowed;
  return (
    <div className={"flex"}>
      <FullTooltip
        content={
          allModels ? (
            <AllModelsTooltip models={provider.models} />
          ) : (
            <ModelList models={provider.models} />
          )
        }
      >
        <Badge variant={"gray"} className={"h-[34px]"} useHover={true}>
          <Boxes size={11} />
          <span className={"font-medium text-xs"}>
            {allModels ? t("agentProviders.allModels") : provider.models.length}
          </span>
          {allModels && provider.models.length > 0 && (
            <span className={"text-xs text-nb-gray-400"}>
              ({provider.models.length})
            </span>
          )}
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
      // Minimal-in-a-card, the shape the group detail page gives its
      // secondary tables: this one sits under a heading on a page that
      // already has its own, rather than being the page.
      wrapperComponent={Card}
      wrapperProps={{ className: "mt-3 w-full" }}
      minimal={true}
      inset={false}
      tableClassName={"mt-0"}
      paginationPaddingClassName={"px-0 pt-8"}
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
        <NoResults
          className={"py-4"}
          icon={<AgentNetworkIcon className={"text-nb-gray-300"} size={20} />}
          title={t("connectProviders.emptyTitle")}
          description={
            canManagePolicies
              ? t("connectProviders.emptyManageableDescription")
              : t("connectProviders.emptyReadonlyDescription")
          }
        >
          {canManagePolicies && (
            <Button
              variant={"primary"}
              size={"sm"}
              className={"mt-4"}
              onClick={() => router.push("/agent-network/policies")}
            >
              {t("connectProviders.goToPolicies")}
            </Button>
          )}
        </NoResults>
      }
    />
  );
}
