import Button from "@components/Button";
import { ArrowRightIcon } from "lucide-react";
import * as React from "react";
import { AgentConnectTabs } from "@/modules/agent-network/AgentConnectModal";
import { useAIProviders } from "@/modules/agent-network/AIProvidersProvider";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  onBack: () => void;
  onNext: () => void;
};

// OnboardingAgentConfigure covers the quickstart's "Configure Your Agent"
// step. The per-tool snippets (Claude Code, Codex, OpenAI SDK, cURL) are shown
// inline via AgentConnectTabs, with the endpoint pre-filled.
export const OnboardingAgentConfigure = ({ onBack, onNext }: Props) => {
  const { t } = useI18n();
  const { settings, providers } = useAIProviders();

  // Open the tab that matches the connected provider: Anthropic and Kimi
  // (whose upstream also speaks the Anthropic Messages API) get the Claude
  // Code config, everything else is OpenAI-shaped so default to cURL.
  const defaultTab = providers.some(
    (p) => p.providerId === "anthropic_api" || p.providerId === "kimi_api",
  )
    ? "claude-code"
    : "curl";

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center"}>{t("onboarding.agent.configure.title")}</h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t("onboarding.agent.configure.description")}
        </div>
      </div>

      {settings ? (
        <AgentConnectTabs
          endpoint={settings.endpoint}
          listClassName={"px-0"}
          contentClassName={"px-0 py-2"}
          defaultTab={defaultTab}
          providerIds={providers.map((p) => p.providerId)}
        />
      ) : (
        <div
          className={
            "mt-2 text-center text-sm text-nb-gray-400 font-light sm:px-4"
          }
        >
          {t("onboarding.agent.configure.noProvider")}
        </div>
      )}

      <div className={"flex items-center justify-center mt-4 gap-3"}>
        <Button variant={"secondary"} onClick={onBack}>
          {t("actions.goBack")}
        </Button>
        <Button variant={"primary"} onClick={onNext}>
          {t("common.continue")}
          <ArrowRightIcon size={16} />
        </Button>
      </div>
    </div>
  );
};
