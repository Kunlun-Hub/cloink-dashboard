import Badge from "@components/Badge";
import { NetworkIcon, WorkflowIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  single: boolean;
};
export default function ResourceTypeCell({ single }: Props) {
  const { t } = useI18n();

  return (
    <div className={"inline-flex"}>
      {single ? (
        <Badge variant={"gray"} className={"min-w-[130px]"}>
          <WorkflowIcon size={14} /> {t("networkResources.singleIp")}
        </Badge>
      ) : (
        <Badge variant={"gray"} className={"min-w-[130px]"}>
          <NetworkIcon size={14} /> {t("networkResources.ipRange")}
        </Badge>
      )}
    </div>
  );
}
