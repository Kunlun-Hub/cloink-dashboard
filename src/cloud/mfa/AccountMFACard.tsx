import FeatureCard, { FeatureCardStatus } from "@components/FeatureCard";
import useFetchApi from "@utils/api";
import loadConfig from "@utils/config";
import { isNetBirdCloud } from "@utils/netbird";
import { ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo } from "react";
import { AccountMFA } from "@/cloud/mfa/AccountMFASettings";
import { useI18n } from "@/i18n/I18nProvider";

const config = loadConfig();

export const AccountMfaCard = () => {
  const { t } = useI18n();
  const { data: accountMfa } = useFetchApi<AccountMFA>(
    "/service/mfa",
    true,
    true,
    !!config.authServiceUrl,
    {
      origin: config.authServiceUrl,
    },
  );

  const enabled = useMemo(() => {
    return accountMfa?.mfa || false;
  }, [accountMfa]);

  const router = useRouter();

  return (
    isNetBirdCloud() && (
      <FeatureCard
        onClick={() => router.push("/settings?tab=authentication")}
        aria-label={t("mfa.title")}
        className={"min-w-[432px]"}
        icon={<ShieldCheckIcon size={16} />}
        title={t("mfa.title")}
        action={<FeatureCardStatus enabled={enabled} />}
        description={t("mfa.enableIfNotInIdp")}
      />
    )
  );
};
