import Button from "@components/Button";
import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import {
  ReverseProxyCluster,
  ReverseProxyClusterType,
} from "@/interfaces/ReverseProxy";

type Props = {
  cluster: ReverseProxyCluster;
};

export default function ClustersActionCell({ cluster }: Readonly<Props>) {
  const { confirm } = useDialog();
  const request = useApiCall<ReverseProxyCluster>("/reverse-proxies/clusters");
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();
  const { t } = useI18n();

  // Shared clusters are operated by NetBird; only account-owned (BYOP)
  // clusters can be deleted from this page. Rendering nothing for
  // shared rows keeps the cell column-aligned without an inert button.
  if (cluster.type !== ReverseProxyClusterType.ACCOUNT) {
    return <div className={"pr-4"} />;
  }

  const handleDelete = async () => {
    const choice = await confirm({
      title: t("reverseProxy.deleteClusterTitle", { name: cluster.address }),
      description: t("reverseProxy.deleteClusterDescription"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      type: "danger",
      maxWidthClass: "max-w-md",
    });
    if (!choice) return;

    notify({
      title: cluster.address,
      description: t("reverseProxy.clusterDeleted"),
      promise: request
        .del({}, `/${encodeURIComponent(cluster.address)}`)
        .then(() => {
          mutate("/reverse-proxies/clusters");
        }),
      loadingMessage: t("reverseProxy.clusterDeleting"),
    });
  };

  return (
    <div className={"flex justify-end pr-4"}>
      <Button
        variant={"danger-outline"}
        size={"sm"}
        onClick={handleDelete}
        disabled={!permission?.services?.delete}
      >
        <Trash2 size={16} />
        {t("common.delete")}
      </Button>
    </div>
  );
}
