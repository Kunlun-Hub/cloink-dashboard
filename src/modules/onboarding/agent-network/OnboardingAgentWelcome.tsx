import Button from "@components/Button";
import SquareIcon from "@components/SquareIcon";
import {
  ArrowRightIcon,
  BotIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
} from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  onNext: () => void;
};

// OnboardingAgentWelcome is the first step of the Agent Network onboarding.
// It frames what Agent Network does before the operator starts wiring up a
// device, provider, and policy. Mirrors the intro of the quickstart guide.
export const OnboardingAgentWelcome = ({ onNext }: Props) => {
  const { t } = useI18n();

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center"}>{t("onboarding.agent.welcome.title")}</h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t("onboarding.agent.welcome.description")}
        </div>
      </div>

      <div className={"mt-4 flex flex-col gap-4"}>
        <Highlight
          icon={<KeyRoundIcon size={16} />}
          title={t("onboarding.agent.welcome.keylessTitle")}
          description={t("onboarding.agent.welcome.keylessDescription")}
        />
        <Highlight
          icon={<ShieldCheckIcon size={16} />}
          title={t("onboarding.agent.welcome.policyTitle")}
          description={t("onboarding.agent.welcome.policyDescription")}
        />
        <Highlight
          icon={<BotIcon size={16} />}
          title={t("onboarding.agent.welcome.usageTitle")}
          description={t("onboarding.agent.welcome.usageDescription")}
        />
      </div>

      <div className={"flex items-center justify-center mt-6"}>
        <Button variant={"primary"} onClick={onNext}>
          {t("onboarding.agent.welcome.getStarted")}
          <ArrowRightIcon size={16} />
        </Button>
      </div>
    </div>
  );
};

const Highlight = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className={"flex gap-3 items-start"}>
      <SquareIcon color={"netbird"} margin={""} icon={icon} />
      <div>
        <div className={"text-sm"}>{title}</div>
        <div className={"text-[0.8rem] text-nb-gray-300 font-light mt-1 block"}>
          {description}
        </div>
      </div>
    </div>
  );
};
