"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import { HelpTooltip } from "@components/HelpTooltip";
import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import useCopyToClipboard from "@hooks/useCopyToClipboard";
import { Copy, ExternalLinkIcon, Globe, Plug } from "lucide-react";
import React, { Suspense, useState } from "react";
import AgentNetworkIcon from "@/assets/icons/AgentNetworkIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import PageContainer from "@/layouts/PageContainer";
import AgentConnectModal from "@/modules/agent-network/AgentConnectModal";
import AIProviderModal from "@/modules/agent-network/AIProviderModal";
import AIProvidersProvider, {
  useAIProviders,
} from "@/modules/agent-network/AIProvidersProvider";
import AgentProvidersTable from "@/modules/agent-network/table/AgentProvidersTable";
import InlineLink from "@components/InlineLink";
import { useI18n } from "@/i18n/I18nProvider";

function EndpointBadge({ endpoint }: { endpoint: string }) {
  const { t } = useI18n();
  const [, copy] = useCopyToClipboard(`https://${endpoint}`);
  const [connectOpen, setConnectOpen] = useState(false);
  return (
    <div
      className={
        "inline-flex items-center gap-3 rounded-lg border border-nb-gray-800 bg-nb-gray-900/40 p-3 min-w-[300px]"
      }
    >
      <div className={"flex flex-col"}>
        <div
          className={
            "text-[10px] text-nb-gray-400 uppercase tracking-wider font-medium inline-flex items-center gap-1.5"
          }
        >
          {t("agentNetwork.apiBaseUrl")}
          <HelpTooltip
            iconSize={11}
            content={
              <>
                {t("agentNetwork.apiBaseUrlTooltip1")}
                <code className={"font-mono"}> base_url</code>
                {t("agentNetwork.apiBaseUrlTooltip2")}{" "}
                <code className={"font-mono"}>baseURL</code>
                {t("agentNetwork.apiBaseUrlTooltip3")}
              </>
            }
          />
        </div>
        <code
          className={
            "font-mono text-xs text-nb-gray-100 leading-tight mt-0.5 whitespace-nowrap"
          }
        >
          https://{endpoint}
        </code>
      </div>
      <button
        type={"button"}
        className={
          "inline-flex items-center gap-1.5 rounded-md border border-nb-gray-700 bg-nb-gray-800/60 px-2.5 py-1.5 text-[11px] font-medium text-nb-gray-200 hover:bg-nb-gray-800 hover:text-white transition-colors shrink-0"
        }
        onClick={() => copy(t("agentNetwork.endpointCopied"))}
        aria-label={t("agentNetwork.copyEndpoint")}
      >
        <Copy size={12} />
        {t("agentNetwork.copy")}
      </button>
      <button
        type={"button"}
        className={
          "inline-flex items-center gap-1.5 rounded-md border border-nb-gray-700 bg-nb-gray-800/60 px-2.5 py-1.5 text-[11px] font-medium text-nb-gray-200 hover:bg-nb-gray-800 hover:text-white transition-colors shrink-0"
        }
        onClick={() => setConnectOpen(true)}
        aria-label={t("agentNetwork.agentConfig")}
      >
        <Plug size={12} />
        {t("agentNetwork.agentConfig")}
      </button>
      <AgentConnectModal
        open={connectOpen}
        onOpenChange={setConnectOpen}
        endpoint={endpoint}
      />
    </div>
  );
}

function EndpointHeader() {
  const { t } = useI18n();
  const { settings, settingsLoading, openWizard } = useAIProviders();
  if (settingsLoading) return null;
  if (!settings) {
    return (
      <button
        type={"button"}
        onClick={openWizard}
        className={
          "inline-flex items-center gap-3 rounded-lg border border-dashed border-nb-gray-800 bg-nb-gray-900/20 p-3 text-left hover:border-nb-gray-700 hover:bg-nb-gray-900/40 transition-colors cursor-pointer min-w-[300px]"
        }
      >
        <div
          className={
            "h-8 w-8 rounded-md bg-nb-gray-900 flex items-center justify-center shrink-0"
          }
        >
          <Globe size={14} className={"text-nb-gray-500"} />
        </div>
        <div className={"flex flex-col min-w-0"}>
          <div
            className={
              "text-[10px] text-nb-gray-500 uppercase tracking-wider font-medium inline-flex items-center gap-1.5"
            }
          >
            {t("agentNetwork.apiBaseUrl")}
            <span onClick={(e) => e.stopPropagation()}>
              <HelpTooltip
                iconSize={11}
                content={
                  <>
                    {t("agentNetwork.apiBaseUrlTooltip1")}
                    <code className={"font-mono"}> base_url</code>
                    {t("agentNetwork.apiBaseUrlTooltip2")}{" "}
                    <code className={"font-mono"}>baseURL</code>
                    {t("agentNetwork.apiBaseUrlTooltip3")}
                  </>
                }
              />
            </span>
          </div>
          <span className={"text-xs text-nb-gray-400 leading-tight mt-0.5"}>
            {t("agentNetwork.connectFirstProvider")}
          </span>
        </div>
      </button>
    );
  }
  return <EndpointBadge endpoint={settings.endpoint} />;
}

function PageBody({
  headingTarget,
}: {
  headingTarget: HTMLHeadingElement | null;
}) {
  const { isWizardOpen, closeWizard } = useAIProviders();

  return (
    <>
      <Suspense fallback={<SkeletonTable />}>
        <AgentProvidersTable headingTarget={headingTarget} />
      </Suspense>
      <AIProviderModal open={isWizardOpen} onOpenChange={closeWizard} />
    </>
  );
}

export default function AgentNetworkProvidersPage() {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      {/* Gate the whole surface: AIProvidersProvider and EndpointHeader fetch
          agent-network state, so they must not mount for users without
          services.read. */}
      <RestrictedAccess
        page={t("nav.providers")}
        hasAccess={permission?.services?.read}
      >
        <AIProvidersProvider>
          <div className={"p-default py-6"}>
            <Breadcrumbs>
              <Breadcrumbs.Item
                href={"/agent-network/providers"}
                label={t("agentNetwork.agentNetwork")}
                icon={<AgentNetworkIcon size={16} />}
              />
              <Breadcrumbs.Item
                href={"/agent-network/providers"}
                label={t("nav.providers")}
                active={true}
              />
            </Breadcrumbs>
            <h1 ref={headingRef}>{t("nav.providers")}</h1>
            <Paragraph>
              {t("agentNetwork.providersDescription1")}
              <InlineLink
                href={"https://docs.netbird.io/agent-network/providers"}
                target={"_blank"}
              >
                {t("common.learnMore")}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </Paragraph>
            <div className={"mt-4"}>
              <EndpointHeader />
            </div>
          </div>

          <PageBody headingTarget={portalTarget} />
        </AIProvidersProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
