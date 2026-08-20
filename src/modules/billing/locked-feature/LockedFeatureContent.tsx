import Button from "@components/Button";
import { cn } from "@utils/helpers";
import { isNetBirdCloud } from "@utils/netbird";
import { LockIcon, MailIcon } from "lucide-react";
import * as React from "react";
import { PlanFeatureAvailability } from "@/cloud/cloud-hooks/useIsFeatureLocked";
import { useTrial } from "@/cloud/cloud-hooks/useTrial";
import { useMSP } from "@/cloud/msp/contexts/MSPProvider";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { PlanTier } from "@/interfaces/Subscription";
import { LockedFeatureInfoCardProps } from "@/modules/billing/locked-feature/LockedFeatureInfoCard";
import { TrialOrUpgradeButton } from "@/modules/billing/trial/TrialOrUpgradeButton";

export enum PLAN_TEXT {
  TEAM = "Available on Team",
  BUSINESS = "Available on Business",
  ENTERPRISE = "Available with an Enterprise license",
}

export const LockedFeatureContent = ({
  feature,
  isTooltip = false,
  featureText,
  isCard = false,
  offerTrial = true,
}: LockedFeatureInfoCardProps) => {
  const { isMSPInTenantContext, isAccountWithMSPParent } = useMSP();
  const { isOwnerOrAdmin } = useLoggedInUser();
  const { t } = useI18n();
  const plan = PlanFeatureAvailability[feature];
  const featureSubject = featureText ?? t("billing.lockedFeature.thisFeature");

  return (
    <>
      <div className={"z-10 relative"}>
        <div
          className={cn(
            "flex items-center font-normal mb-1",
            isTooltip ? "text-sm gap-1.5" : "text-base gap-2",
          )}
        >
          <LockIcon
            size={isTooltip ? 12 : 14}
            className={cn("relative", isTooltip && "-top-[1px]")}
          />
            { isNetBirdCloud()? (plan == "team" ? t("billing.lockedFeature.availableOnTeam") : t("billing.lockedFeature.availableOnBusiness")) : t("billing.lockedFeature.availableWithEnterprise") }
        </div>
        <div
          className={cn(
            "text-nb-gray-300 font-light",
            isTooltip ? "text-xs" : "",
          )}
        >
          <AvailableOnPlanText featureText={featureSubject} plan={plan} />
          {isCard && <br />}
          <UpgradeOrTrialText offerTrial={offerTrial} />
        </div>
      </div>
      {(isOwnerOrAdmin || !isNetBirdCloud()) && (
        <TrialOrUpgradeButton
          plan={plan}
          feature={feature}
          variant={"primary"}
          isCard={isCard}
          isTooltip={isTooltip}
          offerTrial={offerTrial}
          hidden={isAccountWithMSPParent}
        />
      )}
      {isAccountWithMSPParent && !isMSPInTenantContext && (
        <GetMSPSupportButton />
      )}
    </>
  );
};

const AvailableOnPlanText = ({
  featureText,
  plan,
}: {
  featureText: string;
  plan: PlanTier;
}) => {
  const { t } = useI18n();
  const isOrAre = featureText.includes("Posture Checks") ? "are" : "is";
  const values = { feature: featureText, verb: isOrAre };
  if (!isNetBirdCloud()) {
    return (
      <>
        {plan == "team"
          ? t("billing.lockedFeature.availableSelfHostedTeam", values)
          : t("billing.lockedFeature.availableSelfHostedBusiness", values)}
      </>
    );
  }

  return (
    <>
      {plan == "team"
        ? t("billing.lockedFeature.availableOnTeamOrHigher", values)
        : t("billing.lockedFeature.availableOnBusinessPlan", values)}
    </>
  );
};

const UpgradeOrTrialText = ({
  offerTrial = true,
}: {
  offerTrial?: boolean;
}) => {
  const {
    isMSPInTenantContext,
    isAccountWithMSPParent,
    mspContact,
    hasReseller,
  } = useMSP();
  const { isTrialAvailable } = useTrial();
  const { isOwnerOrAdmin } = useLoggedInUser();
  const { t } = useI18n();

  if (!isNetBirdCloud()) {
    return (
      <>
      </>
    );
  }

  if (hasReseller) {
    return <>{t("billing.lockedFeature.contactAdminUpgrade")}</>;
  }

  if (isAccountWithMSPParent && !isMSPInTenantContext) {
    return (
      <>
        {t("billing.lockedFeature.contactAdminPrefix")}{" "}
        <span className={"text-nb-gray-200 font-medium"}>{mspContact}</span>{" "}
        {t("billing.lockedFeature.contactAdminSuffix")}
      </>
    );
  }

  if (!isOwnerOrAdmin)
    return <>{t("billing.lockedFeature.onlyOwnerOrAdmin")}</>;

  if (isTrialAvailable && offerTrial)
    return <>{t("billing.lockedFeature.upgradeOrStartTrial")}</>;

  return (
    <>
      {isMSPInTenantContext
        ? t("billing.lockedFeature.upgradeYourTenantsPlan")
        : t("billing.lockedFeature.upgradeYourCurrentPlan")}
    </>
  );
};

const GetMSPSupportButton = () => {
  const { mspInfo, hasReseller } = useMSP();
  const { t } = useI18n();
  const mailToEmail = mspInfo?.parent_owner_email || "support@netbird.io";
  if (hasReseller) return;

  return (
    <div className={"relative top-1 min-w-[160px]"}>
      <a
        href={`mailto:${mailToEmail}?subject=Request%20for%20Assistance%3A%20Upgrade%20Plan`}
        className={"w-full"}
      >
        <Button
          size={"xs"}
          variant={"primary"}
          className={cn("w-full h-[34px]")}
        >
          <MailIcon size={15} className={"shrink-0"} />
          {t("billing.getSupport")}
        </Button>
      </a>
    </div>
  );
};
