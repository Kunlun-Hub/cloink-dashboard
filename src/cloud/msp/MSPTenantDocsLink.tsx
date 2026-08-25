import InlineLink from "@components/InlineLink";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

export const MSPTenantDocsLink = () => {
  const { t } = useI18n();
  return (
    <>
      {t("common.learnMoreAbout")}
      <InlineLink
        href={"https://docs.netbird.io/how-to/msp-portal"}
        target={"_blank"}
      >
        {t("msp.mspPortal")}
        <ExternalLinkIcon size={12} />
      </InlineLink>
    </>
  );
};
