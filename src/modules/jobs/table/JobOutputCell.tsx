import Badge from "@components/Badge";
import CopyToClipboardText from "@components/CopyToClipboardText";
import FullTooltip from "@components/FullTooltip";
import { Input } from "@components/Input";
import { useApiCall } from "@utils/api";
import { Download } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Job } from "@/interfaces/Job";
import EmptyRow from "@/modules/common-table-rows/EmptyRow";

type Props = {
  job: Job;
};

export const JobOutputCell = ({ job }: Props) => {
  const { t } = useI18n();
  const downloadRequest = useApiCall<Blob>("/debug-bundles", true, {
    blob: true,
  });

  const downloadBundle = async (key: string) => {
    const blob = await downloadRequest.get(
      `/download?key=${encodeURIComponent(key)}`,
    );
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cloink-debug-bundle.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (job.status === "succeeded" && job.workload.result) {
    return (
      <div className="flex flex-col gap-1 items-start justify-center pb-1">
        {Object.entries(job.workload.result).map(([key, value]) => (
          <div key={key} className="text-sm w-[200px] max-w-full min-w-0">
            <span className="font-normal capitalize text-nb-gray-300 text-xs">
              {key.replaceAll("_", " ")}
            </span>
            <br />
            <span className="text-nb-gray-200 flex w-full min-w-0 items-center gap-1 overflow-hidden">
              <span className="min-w-0 flex-1 overflow-hidden">
                <CopyToClipboardText
                  message={t("jobs.outputCopied")}
                  alwaysShowIcon={true}
                >
                  <span className="block w-full truncate font-mono whitespace-nowrap">
                    {typeof value === "boolean"
                      ? value
                        ? t("common.yes")
                        : t("common.no")
                      : String(value)}
                  </span>
                </CopyToClipboardText>
              </span>
              {key === "upload_key" && typeof value === "string" && (
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-netbird hover:bg-nb-gray-900/60 hover:text-white"
                  title={t("jobs.downloadBundle")}
                  aria-label={t("jobs.downloadBundle")}
                  onClick={() => downloadBundle(value)}
                >
                  <Download size={14} />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (job.status === "failed" && job.failed_reason) {
    return (
      <div className={"flex"}>
        <FullTooltip
          content={
            <div className={"max-w-xs text-xs"}>{job.failed_reason}</div>
          }
        >
          <Badge variant={"red"} className={"px-3 max-w-[200px]"}>
            <div className={"truncate"}>{job.failed_reason}</div>
          </Badge>
        </FullTooltip>
      </div>
    );
  }

  return <EmptyRow />;
};
