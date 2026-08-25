"use client";

import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DescriptionWithTooltip from "@components/ui/DescriptionWithTooltip";
import GetStartedTest from "@components/ui/GetStartedTest";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { cn } from "@utils/helpers";
import { ExternalLinkIcon, PlusCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import AIAccessIcon from "@/assets/icons/AgentNetworkIcon";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n/I18nProvider";
import { AIProvider } from "@/modules/agent-network/data/mockData";
import { useAIProviders } from "@/modules/agent-network/AIProvidersProvider";
import AIProviderLogo from "@/modules/agent-network/AIProviderLogo";
import AIProviderModal from "@/modules/agent-network/AIProviderModal";
import { useProviderCatalog } from "@/modules/agent-network/useProviderCatalog";
import AgentProviderActionCell from "@/modules/agent-network/table/AgentProviderActionCell";

function NameCell({ provider }: { provider: AIProvider }) {
  const { getById } = useProviderCatalog();
  const catalog = getById(provider.providerId);
  return (
    <div
      className={
        "flex w-full items-center gap-4 dark:text-neutral-300 text-neutral-500 transition-all group/provider rounded-md py-2 pl-3 pr-4 max-w-[450px]"
      }
    >
      <div className={"relative shrink-0"}>
        <AIProviderLogo providerId={provider.providerId} size={40} />
        <div
          className={cn(
            "h-2 w-2 rounded-full absolute bottom-0 right-0 z-10",
            provider.enabled ? "bg-green-500" : "bg-nb-gray-700",
          )}
        ></div>
        <div
          className={cn(
            "h-3 w-3 bg-nb-gray-950 rounded-tl-[8px] rounded-br absolute bottom-0 right-0 transition-all",
            "group-hover/table-row:bg-nb-gray-940",
            "group-hover/provider:!bg-nb-gray-910",
          )}
        ></div>
      </div>
      <div className={"flex items-start flex-col min-w-0"}>
        <p
          className={
            "font-medium text-left whitespace-nowrap text-sm dark:text-nb-gray-100"
          }
          data-testid={provider.name}
        >
          {provider.name}
        </p>
        <DescriptionWithTooltip
          className={"text-left mt-0.5"}
          text={`${catalog?.name ?? provider.providerId} · ${provider.upstreamUrl}`}
          maxChars={40}
        />
      </div>
    </div>
  );
}

function ModelsCell({ provider }: { provider: AIProvider }) {
  const { t } = useI18n();
  if (provider.models.length === 0) {
    return <span className={"text-xs text-nb-gray-400"}>{t("agentProviders.allModels")}</span>;
  }
  return (
    <span className={"text-xs text-nb-gray-300"}>
      {t("agentProviders.modelsConfigured", { count: provider.models.length })}
    </span>
  );
}

const getColumns = (t: (...args: any[]) => string): ColumnDef<AIProvider>[] => [
  {
    id: "name",
    accessorKey: "name",
    sortingFn: "text",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("table.name")}</DataTableHeader>
    ),
    cell: ({ row }) => <NameCell provider={row.original} />,
  },
  {
    id: "models",
    accessorFn: (p) => p.models.length,
    sortingFn: "basic",
    header: ({ column }) => (
      <DataTableHeader column={column}>{t("table.models")}</DataTableHeader>
    ),
    cell: ({ row }) => <ModelsCell provider={row.original} />,
  },
  {
    id: "actions",
    accessorKey: "id",
    header: "",
    cell: ({ row }) => <AgentProviderActionCell provider={row.original} />,
  },
];

type Props = {
  headingTarget?: HTMLHeadingElement | null;
};

export default function AgentProvidersTable({
  headingTarget,
}: Readonly<Props>) {
  const path = usePathname();
  const { t } = useI18n();
  const { providers, isLoading } = useAIProviders();

  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [{ id: "name", desc: false }],
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<
    AIProvider | undefined
  >(undefined);

  return (
    <>
      {editOpen && editingProvider && (
        <AIProviderModal
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o) setEditingProvider(undefined);
          }}
          provider={editingProvider}
        />
      )}
      <DataTable
      headingTarget={headingTarget}
      isLoading={isLoading}
      text={t("nav.providers")}
      sorting={sorting}
      setSorting={setSorting}
      columns={getColumns(t)}
      data={providers}
      searchPlaceholder={t("agentProviders.searchPlaceholder")}
      onRowClick={(row) => {
        setEditingProvider(row.original);
        setEditOpen(true);
      }}
      getStartedCard={
        <GetStartedTest
          icon={
            <SquareIcon
              icon={<AIAccessIcon className={"fill-nb-gray-200"} size={20} />}
              color={"gray"}
              size={"large"}
            />
          }
          title={t("onboarding.agent.provider.title")}
          description={t("agentProviders.emptyDescription")}
          button={
            <div className={"gap-x-4 flex items-center justify-center"}>
              <AddProviderButton />
            </div>
          }
          learnMore={
            <>
              {t("common.learnMoreAbout")}
              <InlineLink
                href={"https://docs.netbird.io/agent-network/providers"}
                target={"_blank"}
              >
                {t("aiProvider.modal.agentNetworkProviders")}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </>
          }
        />
      }
      rightSide={() =>
        providers.length > 0 && (
          <div className={cn("gap-x-4 ml-auto flex")}>
            <AddProviderButton />
          </div>
        )
      }
      initialPageSize={25}
    />
    </>
  );
}

const AddProviderButton = () => {
  const { t } = useI18n();
  const { openWizard } = useAIProviders();
  return (
    <Button variant={"primary"} onClick={openWizard}>
      <PlusCircle size={16} />
      {t("aiProvider.modal.connectProvider")}
    </Button>
  );
};
