import { ClockIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { DNSRecord } from "@/interfaces/DNS";
import { getTTLLabel } from "@/modules/dns/zones/DNSRecordModal";

type Props = {
  record: DNSRecord;
};

export const DNSRecordTimeToLiveCell = ({ record }: Props) => {
  const { t } = useI18n();
  return (
    <div
      className={
        "flex items-center whitespace-nowrap gap-2 dark:text-neutral-300 text-neutral-500 hover:text-neutral-100 transition-all py-2 px-3 rounded-md"
      }
    >
      <ClockIcon size={14} />
      {getTTLLabel(record.ttl, t)}
    </div>
  );
};
