import { IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@utils/helpers";
import { Sparkles } from "lucide-react";
import * as React from "react";
import { useBilling } from "@/contexts/BillingProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { PlanTier } from "@/interfaces/Subscription";
import { TrialOrUpgradeButton } from "@/modules/billing/trial/TrialOrUpgradeButton";

export const TrialGradientCard = () => {
  const { currentPlan, canUpgrade, isTrialAvailable } = useBilling();
  const { t } = useI18n();
  let planName = currentPlan?.name || t("billing.freePlan");
  if (!isTrialAvailable) return null;

  return (
    <div
      className={
        "flex flex-col bg-gradient-to-r from-[#6697FF]/60 to-[#CE8EE3]/70 backdrop-blur rounded-md overflow-hidden"
      }
    >
      <div className={cn("text-sm", "w-full px-6 py-4")}>
        <div
          className={
            "items-start md:items-center justify-between flex flex-col md:flex-row gap-5"
          }
        >
          <div className={"z-10 relative"}>
            <div
              className={cn(
                "flex items-center font-normal mb-1",
                "text-base gap-2 ",
              )}
            >
              <Sparkles size={16} className={cn("relative", "-top-[0px]")} />
              {t("billing.tryAllFeatures")}
            </div>
            <div className={cn("font-light")}>
              {t("billing.activateTrialDescription", { plan: planName })}
            </div>
          </div>
          <TrialOrUpgradeButton plan={PlanTier.BUSINESS} variant={"white"} />
        </div>
      </div>
      {!canUpgrade && (
        <div
          className={"inline gap-1 font-light bg-black/50 px-5 text-xs py-3"}
        >
          <IconInfoCircle
            size={13}
            className={cn("relative -top-[1px] mr-1 inline")}
          />
          {t("billing.planRecentlyUpdated")}
        </div>
      )}
    </div>
  );
};
