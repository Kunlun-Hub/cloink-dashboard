"use client";

import { ScrollArea } from "@components/ScrollArea";
import { SmallBadge } from "@components/ui/SmallBadge";
import { cn } from "@utils/helpers";
import { isNetBirdCloud } from "@utils/netbird";
import { RadioTowerIcon } from "lucide-react";
import * as React from "react";
import AccessControlIcon from "@/assets/icons/AccessControlIcon";
import ActivityIcon from "@/assets/icons/ActivityIcon";
import AgentNetworkIcon from "@/assets/icons/AgentNetworkIcon";
import ControlCenterIcon from "@/assets/icons/ControlCenterIcon";
import DNSIcon from "@/assets/icons/DNSIcon";
import GroupsIcon from "@/assets/icons/GroupsIcon";
import IntegrationIcon from "@/assets/icons/IntegrationIcon";
import PeerIcon from "@/assets/icons/PeerIcon";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import SlidersIcon from "@/assets/icons/SlidersIcon";
import TeamIcon from "@/assets/icons/TeamIcon";
import TrafficEventsIcon from "@/assets/icons/TrafficEventsIcon";
import UsageLogsIcon from "@/assets/icons/UsageLogsIcon";
import { DistributorNavigation } from "@/cloud/distributor/DistributorNavigation";
import { MSPNavigationItem } from "@/cloud/msp/MSPNavigationItem";
import SidebarItem from "@/components/SidebarItem";
import SidebarItemGroup from "@/components/SidebarItemGroup";
import { NavigationVersionInfo } from "@/components/VersionInfo";
import { useApplicationContext } from "@/contexts/ApplicationProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { headerHeight } from "@/layouts/Header";
import { useAgentNetworkMode } from "@/modules/agent-network/useAgentNetworkMode";
import { useMyAgentNetworkSetup } from "@/modules/agent-network/useMyAgentNetworkSetup";
import { NavigationUsageInfo } from "@/modules/billing/NavigationUsageInfo";
import {
  accountPageAccess,
  agentNetworkPageAccess,
  GROUPS_ACTIVE_ROUTES,
  hasNetworkingAccess,
  type NavSectionId,
  PEERS_ACTIVE_ROUTES,
  visibleSections,
} from "@/modules/navigation/sections";
import { useNavSections } from "@/modules/navigation/useNavSections";
import { NetworkNavigation } from "@/modules/networks/misc/NetworkNavigation";

type Props = {
  fullWidth?: boolean;
  hideOnMobile?: boolean;
};

/**
 * One sidebar for both products: what both work with (Control Center,
 * Peers, Users, Groups) at the top, a collapsible section per product
 * (Networking, Agent Network), and the account area at the bottom. The
 * section rules live in modules/navigation/sections.ts.
 */
export default function Navigation({
  fullWidth = false,
  hideOnMobile = false,
}: Readonly<Props>) {
  const { isNavigationCollapsed } = useApplicationContext();
  const { permission, isRestricted } = usePermissions();
  const { loggedInUser } = useLoggedInUser();
  const { t } = useI18n();
  // "enabled" already falls back to the caller's agent_network grants when
  // the feature flag can't be resolved (no accounts read — usage_viewer and
  // custom delegated roles), so it is the one surface switch here.
  const { only: agentNetworkOnly, enabled: agentNetworkEnabled } =
    useAgentNetworkMode();
  // Caller-scoped: true whenever the caller's own policies grant access to
  // at least one provider, independent of any agent_network permission —
  // this is what lets plain users (limited view included) reach Connect Agent
  // and the self-scoped Usage & Logs view.
  const { configured: mySetupConfigured } = useMyAgentNetworkSetup();
  const agentNetworkPages = agentNetworkPageAccess({
    permission,
    configured: mySetupConfigured,
  });
  const accountPages = accountPageAccess({
    permission,
    cloud: isNetBirdCloud(),
  });
  const shown = visibleSections({
    agentNetworkOnly,
    agentNetworkEnabled,
    agentNetworkAccess: Object.values(agentNetworkPages).some(Boolean),
    networkingAccess: hasNetworkingAccess(permission),
    accountAccess: Object.values(accountPages).some(Boolean),
  });
  const sections = useNavSections(loggedInUser?.id);
  const section = (id: NavSectionId) => ({
    id,
    open: sections.isOpen(id),
    onOpenChange: (open: boolean) => sections.setOpen(id, open),
    active: sections.isActive(id),
  });

  return (
    <div
      data-navigation
      className={cn(
        "whitespace-nowrap md:border-r dark:border-zinc-700/40 bg-gray-50 dark:bg-nb-gray relative group/navigation transition-all",
        hideOnMobile ? "hidden md:block" : "",
        fullWidth
          ? "w-auto max-w-[22rem]"
          : "w-[15rem] max-w-[15rem] min-w-[15rem] overflow-y-auto",
        isNavigationCollapsed &&
          "md:w-[64px] md:min-w-[64px] md:fixed md:overflow-hidden md:hover:w-[15rem] md:hover:max-w-[15rem] md:hover:min-w-[15rem] md:z-50",
      )}
      style={{
        height: `calc(100vh - ${headerHeight}px)`,
      }}
    >
      <div className={cn(fullWidth ? "w-10/12" : "fixed z-0")}>
        <ScrollArea
          style={{
            height: !fullWidth
              ? `calc(100vh - ${headerHeight}px)`
              : "100%",
          }}
        >
          <div
            className={cn(
              "flex flex-col pt-3 w-[15rem] max-w-[15rem] min-w-[15rem] transition-all",
              isNavigationCollapsed &&
                "md:w-[64px] md:min-w-[64px] md:group-hover/navigation:w-[15rem] md:group-hover/navigation:max-w-[15rem] md:group-hover/navigation:min-w-[15rem] md:overflow-x-clip",
            )}
            style={{
              minHeight: !fullWidth
                ? `calc(100vh - ${headerHeight}px)`
                : "100%",
            }}
          >
            {/* What both products work with: Control Center maps the
                connections between devices, networks and AI providers;
                Peers are the machines, devices and agents; Users and Groups
                are who and what every policy, network or agent, is written
                for. */}
            <SidebarItemGroup>
              <SidebarItem
                icon={<ControlCenterIcon size={16} />}
                label={t("nav.controlCenter")}
                href={"/control-center"}
                visible={permission.policies.read}
              />
              <SidebarItem
                icon={<PeerIcon />}
                label={t("nav.peers")}
                href={"/peers"}
                activeRoutes={PEERS_ACTIVE_ROUTES}
                // Restricted users get the add-your-device view there, so
                // the link stays even in the limited (user role) sidebar.
                visible={true}
              />
              <SidebarItem
                icon={<TeamIcon />}
                label={t("nav.team")}
                href={"/team"}
                collapsible
                visible={permission.users.read}
              >
                <SidebarItem
                  label={t("nav.users")}
                  isChild
                  href={"/team/users"}
                  visible={permission.users.read}
                />
                <SidebarItem
                  label={t("nav.serviceUsers")}
                  isChild
                  href={"/team/service-users"}
                  visible={permission.users.read}
                />
              </SidebarItem>
              <SidebarItem
                icon={<GroupsIcon />}
                label={t("nav.groups")}
                href={"/groups"}
                activeRoutes={GROUPS_ACTIVE_ROUTES}
                // The Groups page's own check. Both products' policies are
                // written against groups, so Agent Network admins need it as
                // much as network admins; the limited (user role) view keeps
                // to its own pages.
                visible={permission.groups.read && !isRestricted}
              />
              <DistributorNavigation />
              <SidebarItem
                icon={<RadioTowerIcon size={16} />}
                label={t("nav.relays")}
                href={"/relays"}
                visible={permission.settings.read}
              />
            </SidebarItemGroup>

            {shown.includes("networking") && (
              <SidebarItemGroup
                label={t("nav.networking")}
                collapsible
                {...section("networking")}
              >
                <NetworkingItems />
              </SidebarItemGroup>
            )}

            {shown.includes("agent-network") && (
              <SidebarItemGroup
                label={t("nav.agentNetwork")}
                badge={
                  !agentNetworkOnly && (
                    <SmallBadge
                      text={t("common.beta")}
                      variant={"sky"}
                      className={"text-[8px] leading-none py-[3px] px-[5px]"}
                      textClassName={"top-0"}
                    />
                  )
                }
                collapsible
                {...section("agent-network")}
              >
                <SidebarItem
                  icon={<AgentNetworkIcon size={16} />}
                  label={t("nav.agents")}
                  collapsible
                  visible={
                    agentNetworkPages.connect ||
                    agentNetworkPages.providers ||
                    agentNetworkPages.policies
                  }
                >
                  <SidebarItem
                    label={t("nav.connectAgent")}
                    isChild
                    href={"/agent-network/connect"}
                    exactPathMatch={true}
                    visible={agentNetworkPages.connect}
                  />
                  <SidebarItem
                    label={t("nav.providers")}
                    isChild
                    href={"/agent-network/providers"}
                    exactPathMatch={true}
                    visible={agentNetworkPages.providers}
                  />
                  <SidebarItem
                    label={t("nav.agentPolicies")}
                    isChild
                    href={"/agent-network/policies"}
                    exactPathMatch={true}
                    visible={agentNetworkPages.policies}
                  />
                </SidebarItem>
                <SidebarItem
                  icon={<UsageLogsIcon />}
                  label={t("nav.usageLogs")}
                  href={"/agent-network/usage"}
                  exactPathMatch={true}
                  visible={agentNetworkPages.usage}
                />
                <SidebarItem
                  icon={<SlidersIcon />}
                  label={t("nav.configuration")}
                  href={"/agent-network/configuration"}
                  exactPathMatch={true}
                  visible={agentNetworkPages.configuration}
                />
              </SidebarItemGroup>
            )}

            {/* Pushes the account area to the bottom while there is room. */}
            <div className={"flex-1"} />

            {/* The account area: how the account is set up and what changed
                in it. Both products share it. Documentation lives in the
                header's help menu. */}
            {shown.includes("account") && (
              <SidebarItemGroup label={t("nav.account")} {...section("account")}>
                <SidebarItem
                  icon={<SettingsIcon />}
                  label={t("nav.settings")}
                  href={"/settings"}
                  exactPathMatch={true}
                  visible={accountPages.settings}
                />
                <MSPNavigationItem />
                <SidebarItem
                  icon={<IntegrationIcon />}
                  label={t("nav.integrations")}
                  href={"/integrations"}
                  exactPathMatch={true}
                  visible={accountPages.integrations}
                />
                <SidebarItem
                  icon={<ActivityIcon />}
                  label={t("nav.auditEvents")}
                  href={"/events/audit"}
                  exactPathMatch={true}
                  visible={accountPages.auditEvents}
                />
              </SidebarItemGroup>
            )}
            <NavigationUsageInfo />
            <NavigationVersionInfo />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

const NetworkingItems = () => {
  const { permission } = usePermissions();
  const { t } = useI18n();
  return (
    <>
      <SidebarItem
        icon={<AccessControlIcon />}
        label={t("nav.accessControl")}
        href={"/access-control"}
        collapsible
        visible={permission.policies.read}
      >
        <SidebarItem
          label={t("nav.policies")}
          href={"/access-control"}
          isChild
          exactPathMatch={true}
          visible={permission.policies.read}
        />
        <SidebarItem
          label={t("nav.postureChecks")}
          isChild
          href={"/posture-checks"}
          exactPathMatch={true}
          visible={permission.policies.read}
        />
      </SidebarItem>

      <NetworkNavigation />

      <SidebarItem
        icon={<ReverseProxyIcon size={16} />}
        labelClassName={"pr-0"}
        label={
          <div className={"flex items-center gap-2"}>
            {t("nav.reverseProxy")}
            <SmallBadge
              text={t("common.beta")}
              variant={"sky"}
              className={"text-[8px] leading-none py-[3px] px-[5px]"}
              textClassName={"top-0"}
            />
          </div>
        }
        href={"/reverse-proxy"}
        collapsible
        exactPathMatch={false}
        visible={permission?.services?.read}
      >
        <SidebarItem
          label={t("nav.services")}
          isChild
          href={"/reverse-proxy/services"}
          exactPathMatch={true}
          visible={permission?.services?.read}
        />
        <SidebarItem
          label={t("nav.customDomains")}
          isChild
          href={"/reverse-proxy/custom-domains"}
          exactPathMatch={true}
          visible={permission?.services?.read}
        />
        <SidebarItem
          label={t("nav.clusters")}
          isChild
          href={"/reverse-proxy/clusters"}
          exactPathMatch={true}
          visible={permission?.services?.read}
        />
        <SidebarItem
          label={t("nav.accessLogs")}
          isChild
          href={"/reverse-proxy/logs"}
          exactPathMatch={true}
          visible={permission?.services?.read}
        />
      </SidebarItem>

      <SidebarItem
        icon={<DNSIcon />}
        label={t("nav.dns")}
        href={"/dns"}
        collapsible
        exactPathMatch={true}
        visible={permission.dns.read || permission.nameservers.read}
      >
        <SidebarItem
          label={t("nav.nameservers")}
          isChild
          href={"/dns/nameservers"}
          visible={permission.nameservers.read}
        />
        <SidebarItem
          label={t("nav.zones")}
          isChild
          href={"/dns/zones"}
          visible={permission?.dns?.read}
        />
        <SidebarItem
          label={t("nav.dnsSettings")}
          isChild
          href={"/dns/settings"}
          visible={permission.dns.read}
        />
      </SidebarItem>

      <SidebarItem
        icon={<TrafficEventsIcon />}
        label={t("nav.trafficEvents")}
        href={"/events/traffic"}
        exactPathMatch={true}
        visible={permission.events.read}
      />
    </>
  );
};
