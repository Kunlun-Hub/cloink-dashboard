import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import { IconHelpCircle } from "@tabler/icons-react";
import { cn } from "@utils/helpers";
import { isNetBirdCloud } from "@utils/netbird";
import { ExternalLinkIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useState } from "react";
import { PlanFeatures } from "@/cloud/cloud-hooks/useIsFeatureLocked";
import { useTrial } from "@/cloud/cloud-hooks/useTrial";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { PlanTier } from "@/interfaces/Subscription";
import { useAgentNetworkMode } from "@/modules/agent-network/useAgentNetworkMode";

type Props = {
  plan?: PlanTier;
  variant?: "primary" | "white";
  feature?: keyof typeof PlanFeatures;
  isCard?: boolean;
  isTooltip?: boolean;
  offerTrial?: boolean;
  hidden?: boolean;
};

export const TrialOrUpgradeButton = ({
  plan,
  variant = "primary",
  feature,
  isCard = false,
  isTooltip = false,
  offerTrial = true,
  hidden = false,
}: Props) => {
  const { isTrialAvailable, startTrial, plans, canUpgrade } = useTrial();
  const [isLoading, setIsLoading] = useState(false);
  const { isOwnerOrAdmin } = useLoggedInUser();
  const { t } = useI18n();
  const router = useRouter();
  if (hidden) return;

  const activateTrial = async () => {
    if (!isOwnerOrAdmin) return;
    if (!canUpgrade) return;
    if (!plans) return;
    const foundPlan = plans.find((p) => p.name.toLowerCase() == plan);
    if (!foundPlan) return;
    setIsLoading(true);
    startTrial(foundPlan, feature).finally(() => setIsLoading(false));
  };

  const RegularUserContent = () => {
    return (
      <div>
        <div>
          {isTrialAvailable && offerTrial
            ? t("billing.onlyOwnerOrAdminStartTrial")
            : t("billing.onlyOwnerOrAdminUpgrade")}
        </div>
      </div>
    );
  };

  const PlansAndBillingButton = () => {
    return (
      <div className={"relative top-1 min-w-[160px]"}>
        <Button
          size={"xs"}
          variant={variant}
          onClick={() => router.push("/settings?tab=plans-and-billing")}
          className={cn("w-full h-[34px]")}
          disabled={!isOwnerOrAdmin}
        >
          {t("billing.goToPlansAndBilling")}
        </Button>
      </div>
    );
  };

  const TrialButton = () => {
    return (
      <div
        className={cn(
          "relative top-1",
          isCard ? "min-w-[190px]" : "min-w-[160px]",
        )}
      >
        <FullTooltip
          className={"w-full"}
          disabled={canUpgrade}
          content={
            <div className={"text-xs max-w-sm"}>
              {t("billing.planRecentlyUpdated")}
            </div>
          }
        >
          <Button
            size={"xs"}
            variant={variant}
            onClick={activateTrial}
            disabled={!canUpgrade}
            className={cn(
              "w-full h-[34px]",
              variant === "white" && !canUpgrade && "disabled:!opacity-30",
              variant === "primary" &&
                !canUpgrade &&
                "disabled:!opacity-40 disabled:!bg-nb-gray-700",
            )}
          >
            {isLoading ? (
              <Loader2 size={15} className={"animate-spin"} />
            ) : (
              t("billing.startFreeTrial")
            )}
            {!canUpgrade && (
              <IconHelpCircle size={13} className={"relative -top-[1px]"} />
            )}
          </Button>
        </FullTooltip>
        <div
          className={cn(
            "text-[0.7rem] mt-2 text-center leading-none",
            variant === "white" ? "text-white" : "text-nb-gray-300",
            !canUpgrade && "opacity-40",
            !isOwnerOrAdmin && "opacity-50",
          )}
        >
          {t("billing.noCreditCardRequired")}
        </div>
      </div>
    );
  };

  if (!isNetBirdCloud()) return <SelfHostedUpgradeButton variant={variant} />;
  if (!isOwnerOrAdmin) return <RegularUserContent />;
  if (!isTrialAvailable) return <PlansAndBillingButton />;
  if (!offerTrial) return <PlansAndBillingButton />;
  if (!canUpgrade && isTooltip) return <PlansAndBillingButton />;
  return <TrialButton />;
};

export const SelfHostedUpgradeButton = ({
  variant = "primary",
}: {
  variant?: "primary" | "white";
}) => {
  const { only: agentNetworkOnly } = useAgentNetworkMode();
  const { t } = useI18n();
  // Agent Network-only deployments point at the Agent Network pricing page
  // (tagged so the visit is attributable); the regular self-hosted product
  // keeps the on-prem pricing anchor.
  const href = agentNetworkOnly
    ? "https://netbird.ai/pricing?utm_source=dashboard_oss"
    : "https://netbird.io/pricing#on-prem";
  return (
    <div className={"relative top-1 min-w-[160px]"}>
      <a
        href={href}
        target={"_blank"}
        rel={"noopener noreferrer"}
        className={"w-full"}
      >
        <Button
          size={"xs"}
          variant={variant}
          className={cn("w-full h-[34px]")}
          data-testid={"self-hosted-upgrade-cta"}
        >
          {t("billing.getLicense")}
          <ExternalLinkIcon size={13} className={"shrink-0"} />
        </Button>
      </a>
    </div>
  );
};
