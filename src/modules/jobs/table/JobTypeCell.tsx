import { BugIcon } from "lucide-react";
import * as React from "react";
import { Job } from "@/interfaces/Job";
import EmptyRow from "@/modules/common-table-rows/EmptyRow";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  job: Job;
};
export const JobTypeCell = ({ job }: Props) => {
  const { t } = useI18n();
  if (job.workload.type === "bundle") {
    return (
      <div
        className={"flex items-center gap-2 whitespace-nowrap text-nb-gray-200"}
      >
        <BugIcon size={14} />
        <span>{t("jobs.debugBundle")}</span>
      </div>
    );
  }

  return <EmptyRow />;
};
