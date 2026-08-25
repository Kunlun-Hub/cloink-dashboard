import Button from "@components/Button";
import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { GroupedRoute, Route } from "@/interfaces/Route";

type Props = {
  groupedRoute: GroupedRoute;
};
export default function GroupedRouteActionCell({ groupedRoute }: Props) {
  const { permission } = usePermissions();
  const { t } = useI18n();

  const { confirm } = useDialog();
  const routeRequest = useApiCall<Route>("/routes");
  const { mutate } = useSWRConfig();

  const handleRevoke = async () => {
    if (!groupedRoute.routes) return Promise.resolve();
    const batch = groupedRoute.routes.map((route) => {
      if (route.id) return routeRequest.del("", `/${route.id}`);
      return Promise.resolve(route);
    });

    notify({
      title: t("routeGroups.deleteNetworkTitle", { name: groupedRoute.network_id }),
      description: t("routeGroups.deletedDescription"),
      promise: Promise.all(batch).then(() => {
        mutate("/routes");
      }),
      loadingMessage: t("routeGroups.deleting"),
    });
  };

  const handleConfirm = async () => {
    const choice = await confirm({
      title: t("routeGroups.deleteNetworkConfirmTitle", { name: groupedRoute.network_id }),
      description: t("routeGroups.deleteConfirmDescription"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      type: "danger",
    });
    if (!choice) return;
    handleRevoke().then();
  };

  return (
    <div className={"flex justify-end pr-4"}>
      <Button
        variant={"danger-outline"}
        size={"sm"}
        onClick={handleConfirm}
        disabled={!permission.routes.delete}
      >
        <Trash2 size={16} />
        {t("common.delete")}
      </Button>
    </div>
  );
}
