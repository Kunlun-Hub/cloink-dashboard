import Button from "@components/Button";
import { ArrowRightIcon, CheckCircle2Icon, PlusIcon } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import AgentPolicyModal from "@/modules/agent-network/AgentPolicyModal";
import { useAIProviders } from "@/modules/agent-network/AIProvidersProvider";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  onBack: () => void;
  onNext: () => void;
};

// OnboardingAgentPolicy covers the quickstart's "Create a Policy" step. By
// default Agent Network denies every request; nothing reaches a provider
// until a policy connects a source group to one or more providers.
export const OnboardingAgentPolicy = ({ onBack, onNext }: Props) => {
  const { t } = useI18n();
  const { policies } = useAIProviders();
  const [open, setOpen] = useState(false);
  const hasPolicy = policies.length > 0;

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center"}>{t("onboarding.agent.policy.title")}</h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t("onboarding.agent.policy.description")}
        </div>
      </div>

      {hasPolicy ? (
        <div className={"mt-4 flex items-center justify-center gap-2 text-sm"}>
          <CheckCircle2Icon size={16} className={"text-green-500"} />
          <span>
            {policies.length > 1
              ? t("onboarding.agent.policy.createdPlural", { count: policies.length })
              : t("onboarding.agent.policy.createdSingular")}{" "}
            {t("onboarding.agent.policy.authorized")}
          </span>
        </div>
      ) : (
        <div className={"mt-4 flex items-center justify-center"}>
          <Button variant={"primary"} onClick={() => setOpen(true)}>
            <PlusIcon size={16} />
            {t("onboarding.agent.policy.addButton")}
          </Button>
        </div>
      )}

      <div className={"flex items-center justify-center mt-4 gap-3"}>
        <Button variant={"secondary"} onClick={onBack}>
          {t("actions.goBack")}
        </Button>
        <Button variant={"primary"} disabled={!hasPolicy} onClick={onNext}>
          {t("common.continue")}
          <ArrowRightIcon size={16} />
        </Button>
      </div>

      <AgentPolicyModal open={open} onOpenChange={setOpen} />
    </div>
  );
};
