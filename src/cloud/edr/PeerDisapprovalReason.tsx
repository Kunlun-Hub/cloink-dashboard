import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Peer } from "@/interfaces/Peer";

export const PeerDisapprovalReason = ({ peer }: { peer: Peer }) => {
  const { t } = useI18n();
  if (!peer?.disapproval_reason) return null;

  return (
    <div
      className={
        "text-[0.7rem] bg-nb-gray-910 py-2 px-4 font-mono border border-nb-gray-900 rounded-b-md"
      }
    >
      {t("peer.disapprovalReason", { reason: peer?.disapproval_reason })}
    </div>
  );
};
