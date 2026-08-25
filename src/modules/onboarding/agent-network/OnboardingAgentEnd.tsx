import Button from "@components/Button";
import { ArrowRightIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  onFinish: () => void;
};

// OnboardingAgentEnd wraps up the flow and points at Usage & Logs to confirm
// requests are being recorded, matching the quickstart's "Verify" step.
export const OnboardingAgentEnd = ({ onFinish }: Props) => {
  const { t } = useI18n();

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center max-w-sm mx-auto"}>
          {t("onboarding.agentEndTitle")} <br />
          {t("onboarding.agentEndSubtitle")}
        </h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t("onboarding.agentEndDescription")}
        </div>
      </div>

      <div className={"mt-4 flex items-center justify-center"}>
        <Button variant={"secondaryLighter"} onClick={onFinish}>
          {t("onboarding.goToAccessLogs")}
          <ArrowRightIcon size={16} />
        </Button>
      </div>
    </div>
  );
};
