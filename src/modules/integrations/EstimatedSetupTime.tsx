import { Clock4 } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  minutes?: number;
};
export const EstimatedSetupTime = ({ minutes = 5 }: Props) => {
  const { t } = useI18n();
  return (
    <div
      className={
        "text-center z-0 mt-2.5 text-xs text-nb-gray-300 flex items-center justify-center gap-2 font-normal"
      }
    >
      <Clock4 size={12} />
      <div>
        {t("idpSync.estimatedSetupTime")}
        <span className={"font-medium"}> {minutes} {t("common.minutes")}</span>
      </div>
    </div>
  );
};
