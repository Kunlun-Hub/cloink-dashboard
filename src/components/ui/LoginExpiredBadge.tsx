import Badge from "@components/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/Tooltip";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  loginExpired: boolean;
};
export default function LoginExpiredBadge({ loginExpired }: Props) {
  const { t } = useI18n();

  return loginExpired ? (
    <Tooltip delayDuration={1}>
      <TooltipTrigger>
        <Badge variant={"red"} className={"px-2"}>
          <AlertTriangle size={12} />
          {t("loginExpiredBadge.title")}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className={"text-nb-gray-300 text-xs leading-1.5"}>
          {t("peer.loginExpiredTooltipLine1")} <br />
          {t("peer.loginExpiredTooltipLine2")}
        </div>
      </TooltipContent>
    </Tooltip>
  ) : null;
}
