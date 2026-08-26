import Button from "@components/Button";
import useCopyToClipboard from "@hooks/useCopyToClipboard";
import { ArrowRightIcon, CheckCircle2Icon, Copy, PlusIcon } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import AIProviderModal from "@/modules/agent-network/AIProviderModal";
import { useAIProviders } from "@/modules/agent-network/AIProvidersProvider";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  onBack: () => void;
  onNext: () => void;
};

// OnboardingAgentProvider covers the quickstart's "Connect a Provider" step.
// Connecting the first provider is what seeds the account-level agent network
// settings and generates the tunnel-only endpoint, so we key "done" off
// settings being present rather than counting providers.
export const OnboardingAgentProvider = ({ onBack, onNext }: Props) => {
  const { t } = useI18n();
  const { settings, providers, openWizard, closeWizard, isWizardOpen } =
    useAIProviders();
  const connected = !!settings;

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center"}>{t("onboarding.agent.provider.title")}</h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t("onboarding.agent.provider.description")}
        </div>
      </div>

      {connected ? (
        <EndpointPanel endpoint={settings.endpoint} count={providers.length} />
      ) : (
        <div className={"mt-4 flex items-center justify-center"}>
          <Button variant={"primary"} onClick={openWizard}>
            <PlusIcon size={16} />
            {t("onboarding.agent.provider.connectButton")}
          </Button>
        </div>
      )}

      <div className={"flex items-center justify-center mt-4 gap-3"}>
        <Button variant={"secondary"} onClick={onBack}>
          {t("actions.goBack")}
        </Button>
        <Button variant={"primary"} disabled={!connected} onClick={onNext}>
          {t("common.continue")}
          <ArrowRightIcon size={16} />
        </Button>
      </div>

      <AIProviderModal open={isWizardOpen} onOpenChange={closeWizard} />
    </div>
  );
};

const EndpointPanel = ({
  endpoint,
  count,
}: {
  endpoint: string;
  count: number;
}) => {
  const { t } = useI18n();
  const [, copy] = useCopyToClipboard(`https://${endpoint}`);
  return (
    <div className={"mt-4 flex flex-col gap-3"}>
      <div className={"flex items-center justify-center gap-2 text-sm"}>
        <CheckCircle2Icon size={16} className={"text-green-500"} />
        <span>
          {count > 1
            ? t("onboarding.agent.provider.connectedPlural", { count })
            : t("onboarding.agent.provider.connectedSingular")}{" "}
          {t("onboarding.agent.provider.endpointReady")}
        </span>
      </div>
      <div
        className={
          "inline-flex items-center gap-3 rounded-lg border border-nb-gray-800 bg-nb-gray-900/40 p-3 mx-auto"
        }
      >
        <div className={"flex flex-col"}>
          <div
            className={
              "text-[10px] text-nb-gray-400 uppercase tracking-wider font-medium"
            }
          >
            {t("onboarding.agent.provider.apiBaseUrl")}
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
            "inline-flex items-center gap-1.5 rounded-md border border-nb-gray-700 bg-nb-gray-800/60 px-2.5 py-1.5 text-[11px] font-medium text-nb-gray-200 hover:bg-nb-gray-800 hover:text-nb-gray-100 transition-colors shrink-0"
          }
          onClick={() => copy(t("onboarding.agent.provider.endpointCopied"))}
          aria-label={t("onboarding.agent.provider.copyEndpoint")}
        >
          <Copy size={12} />
          {t("onboarding.agent.provider.copy")}
        </button>
      </div>
    </div>
  );
};
