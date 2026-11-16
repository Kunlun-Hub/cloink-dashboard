import SidebarItem from "@components/SidebarItem";
import * as React from "react";
import NetworkRoutesIcon from "@/assets/icons/NetworkRoutesIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { NETWORKS_ACTIVE_ROUTES } from "@/modules/navigation/sections";

export const NetworkNavigation = () => {
  const { permission } = usePermissions();
  const { t } = useI18n();
  return (
    <SidebarItem
      icon={<NetworkRoutesIcon />}
      label={t("nav.networkRouting")}
      collapsible
      visible={permission.networks.read || permission.routes.read}
    >
      <SidebarItem
        label={t("nav.networks")}
        isChild
        href={"/networks"}
        exactPathMatch={true}
        activeRoutes={NETWORKS_ACTIVE_ROUTES}
        visible={permission.networks.read}
      />
      <SidebarItem
        label={t("nav.routes")}
        isChild
        href={"/network-routes"}
        exactPathMatch={true}
        visible={permission.routes.read}
      />
    </SidebarItem>
  );
};
