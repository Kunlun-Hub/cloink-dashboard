import InlineLink from "@components/InlineLink";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

export const DistributorDocsLink = () => {
  const { t } = useI18n();
  return (
    <>
      {t("common.learnMoreAbout")}
      <InlineLink
        href={"https://docs.netbird.io/manage/for-partners/distributor-portal"}
        target={"_blank"}
      >
        {t("customers.title")}
        <ExternalLinkIcon size={12} />
      </InlineLink>
    </>
  );
};
