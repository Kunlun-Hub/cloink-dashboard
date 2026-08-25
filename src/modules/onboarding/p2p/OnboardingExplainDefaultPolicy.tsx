import Button from "@components/Button";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Policy } from "@/interfaces/Policy";
import { OnboardingPolicy } from "@/modules/onboarding/OnboardingPolicy";

type Props = {
  policy?: Policy;
  onNext?: () => void;
  onToggle?: (policy: Policy) => void;
};

export const OnboardingExplainDefaultPolicy = ({
  policy,
  onNext,
  onToggle,
}: Props) => {
  const { t } = useI18n();

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center max-w-sm mx-auto"}>
          {t("onboarding.explainPolicyTitle")}
        </h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t("onboarding.explainDefaultPolicyDescription")}
        </div>

        {policy && (
          <div
            className={
              "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
            }
          >
            {t("onboarding.explainDefaultPolicyFlip")}
          </div>
        )}
      </div>

      <div>
        <OnboardingPolicy policy={policy} onToggle={onToggle} />
      </div>

      <Button variant={"primary"} onClick={onNext}>
        {t("common.continue")}
      </Button>
    </div>
  );
};
