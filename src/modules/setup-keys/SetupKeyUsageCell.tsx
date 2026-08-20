import { IconRepeat } from "@tabler/icons-react";
import { Repeat1 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  current: number;
  limit: number;
  reusable: boolean;
};
export default function SetupKeyUsageCell({ current, limit, reusable }: Props) {
  const { t } = useI18n();
  return reusable ? (
    <div className={"flex items-center text-[13px] text-nb-gray-300 gap-2"}>
      <IconRepeat size={14} className={"text-green-400"} />
      <span>
        <span className={"font-medium text-nb-gray-200"}> {current} </span> of{" "}
        {limit == 0 ? <>{t("setupKey.unlimited")}</> : limit} {t("setupKey.peerCount")}
      </span>
    </div>
  ) : (
    <div className={"flex items-center text-[13px] text-nb-gray-300 gap-2"}>
      <Repeat1 size={14} /> One-off
    </div>
  );
}
