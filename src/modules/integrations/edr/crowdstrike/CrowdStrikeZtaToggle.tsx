import FancyToggleSwitch from "@components/FancyToggleSwitch";
import InlineLink from "@components/InlineLink";
import { ExternalLinkIcon, GaugeIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
};
export const CrowdStrikeZtaToggle = ({ value, onChange }: Props) => {
  const { t } = useI18n();
  return (
    <FancyToggleSwitch
      value={value}
      onChange={onChange}
      label={
        <>
          <GaugeIcon size={15} />
          {t("crowdStrike.ztaToggleLabel")}
        </>
      }
      helpText={
        <div>
          {t("crowdStrike.ztaToggleHelpPrefix")}{" "}
          <InlineLink
            href={
              "https://www.crowdstrike.com/resources/white-papers/falcon-zero-trust-risk-score/"
            }
            target={"_blank"}
          >
            {t("crowdStrike.ztaScoreLink")}
            <ExternalLinkIcon
              size={12}
              className={"shrink-0 relative -top-[1px] mr-[1px]"}
            />
          </InlineLink>{" "}
          {t("crowdStrike.ztaToggleHelpSuffix")}
        </div>
      }
    />
  );
};
