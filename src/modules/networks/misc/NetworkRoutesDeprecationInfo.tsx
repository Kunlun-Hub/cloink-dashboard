import FullTooltip from "@components/FullTooltip";
import { TriangleAlertIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  size?: number;
};
export const NetworkRoutesDeprecationInfo = ({ size = 14 }: Props) => {
  const { t } = useI18n();

  return (
    <FullTooltip
      content={
        <div className={"text-xs max-w-[230px]"}>
          {t("networkResources.deprecationTooltip")}
        </div>
      }
    >
      <TriangleAlertIcon
        size={size}
        className={"text-amber-500 ml-2.5 hover:text-amber-400 cursor-help"}
      />
    </FullTooltip>
  );
};
