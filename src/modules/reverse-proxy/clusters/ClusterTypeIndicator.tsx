import FullTooltip from "@components/FullTooltip";
import { ServerIcon, UserCog } from "lucide-react";
import * as React from "react";
import {
  ReverseProxyCluster,
  ReverseProxyClusterType,
} from "@/interfaces/ReverseProxy";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  cluster: ReverseProxyCluster;
};

// ClusterTypeIndicator renders a small icon next to the cluster name —
// same pattern as EphemeralPeerIndicator — so the source of the
// cluster is visible at a glance without a dedicated column.
export const ClusterTypeIndicator = ({ cluster }: Props) => {
  const { t } = useI18n();
  if (cluster.type === ReverseProxyClusterType.ACCOUNT) {
    return (
      <FullTooltip
        content={
          <div className={"text-xs max-w-xs"}>
            <span className={"font-medium text-nb-gray-100"}>
              {t("reverseProxy.accountClusterTitle")}
            </span>{" "}
            {t("reverseProxy.accountClusterDescription")}
          </div>
        }
      >
        <UserCog size={12} className={"shrink-0 text-netbird"} />
      </FullTooltip>
    );
  }
  return (
    <FullTooltip
      content={
        <div className={"text-xs max-w-xs"}>
          <span className={"font-medium text-nb-gray-100"}>
            {t("reverseProxy.sharedClusterTitle")}
          </span>{" "}
          {t("reverseProxy.sharedClusterDescription")}
        </div>
      }
    >
      <ServerIcon size={12} className={"shrink-0 text-nb-gray-300"} />
    </FullTooltip>
  );
};
