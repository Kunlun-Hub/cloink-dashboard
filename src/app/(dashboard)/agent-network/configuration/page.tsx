"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { VerticalTabs } from "@components/VerticalTabs";
import * as Tabs from "@radix-ui/react-tabs";
import { Gauge, ScrollText, ServerIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { lazy, Suspense, useEffect, useState } from "react";
import AgentNetworkIcon from "@/assets/icons/AgentNetworkIcon";
import GroupsProvider from "@/contexts/GroupsProvider";
import PeersProvider from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import AgentAccountControlsCard from "@/modules/agent-network/AgentAccountControlsCard";
import AgentBudgetRulesTable from "@/modules/agent-network/AgentBudgetRulesTable";
import AIProvidersProvider from "@/modules/agent-network/AIProvidersProvider";

const ClustersTable = lazy(
  () => import("@/modules/reverse-proxy/clusters/ClustersTable"),
);

const TAB_BUDGET_SETTINGS = "budget-settings";
const TAB_LOG_SETTINGS = "log-settings";
const TAB_CLUSTERS = "clusters";

// AgentNetworkConfigurationPage holds the configuration surfaces extracted from
// Usage & Logs — global limits and log-collection controls — using the same
// vertical-tab layout (and per-tab breadcrumb/heading/description) as the main
// Settings page so it reads as "settings for the Agent Network".
export default function AgentNetworkConfigurationPage() {
  const { permission } = usePermissions();
  const { t } = useI18n();
  const queryParams = useSearchParams();
  const queryTab = queryParams.get("tab");
  const [tab, setTab] = useState(queryTab ?? TAB_BUDGET_SETTINGS);

  useEffect(() => {
    if (queryTab) setTab(queryTab);
  }, [queryTab]);

  return (
    <PageContainer>
      <VerticalTabs value={tab} onChange={setTab}>
        <VerticalTabs.List>
          <VerticalTabs.Trigger value={TAB_BUDGET_SETTINGS}>
            <Gauge size={14} />
            {t("agentNetwork.globalLimits")}
          </VerticalTabs.Trigger>
          <VerticalTabs.Trigger value={TAB_LOG_SETTINGS}>
            <ScrollText size={14} />
            {t("agentNetwork.logCollection")}
          </VerticalTabs.Trigger>
          <VerticalTabs.Trigger value={TAB_CLUSTERS}>
            <ServerIcon size={14} />
            {t("nav.clusters")}
          </VerticalTabs.Trigger>
        </VerticalTabs.List>
        <RestrictedAccess
          page={t("nav.configuration")}
          hasAccess={permission?.services?.read}
        >
          <GroupsProvider>
            <PeersProvider>
              <AIProvidersProvider>
                <div className={"border-l border-nb-gray-930 w-full"}>
                  <Tabs.Content
                    value={TAB_BUDGET_SETTINGS}
                    className={"w-full"}
                  >
                    <ConfigTabHeader
                      label={t("agentNetwork.globalLimits")}
                      href={"/agent-network/configuration?tab=budget-settings"}
                    />
                    {/* DataTable applies its own p-default, so it is rendered
                        directly (no extra wrapper) to align with the header. */}
                    <Suspense fallback={<SkeletonTable />}>
                      <AgentBudgetRulesTable />
                    </Suspense>
                  </Tabs.Content>

                  <Tabs.Content value={TAB_LOG_SETTINGS} className={"w-full"}>
                    {/* Self-contained tab (own breadcrumb + heading + save),
                        mirroring the Settings > Authentication layout. */}
                    <Suspense fallback={<SkeletonTable />}>
                      <AgentAccountControlsCard />
                    </Suspense>
                  </Tabs.Content>

                  <Tabs.Content value={TAB_CLUSTERS} className={"w-full"}>
                    <ConfigTabHeader
                      label={t("nav.clusters")}
                      href={"/agent-network/configuration?tab=clusters"}
                    />
                    <Suspense fallback={<SkeletonTable />}>
                      <ClustersTable />
                    </Suspense>
                  </Tabs.Content>
                </div>
              </AIProvidersProvider>
            </PeersProvider>
          </GroupsProvider>
        </RestrictedAccess>
      </VerticalTabs>
    </PageContainer>
  );
}

function ConfigTabHeader({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  const { t } = useI18n();

  return (
    <div className={"p-default py-6"}>
      <Breadcrumbs>
        <Breadcrumbs.Item
          href={"/agent-network/providers"}
          label={t("nav.agentNetwork")}
          icon={<AgentNetworkIcon size={16} />}
        />
        <Breadcrumbs.Item href={href} label={label} active />
      </Breadcrumbs>
      <h1>{label}</h1>
    </div>
  );
}
