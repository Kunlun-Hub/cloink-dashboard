import FullTooltip from "@components/FullTooltip";
import { Label } from "@components/Label";
import { IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@utils/helpers";
import { isLocalDev, isProduction } from "@utils/netbird";
import { isEmpty } from "lodash";
import { GlobeIcon } from "lucide-react";
import React, { useMemo } from "react";
import RoundedFlag from "@/assets/countries/RoundedFlag";
import { useCountries } from "@/contexts/CountryProvider";
import { ActivityEvent } from "@/interfaces/ActivityEvent";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  event: ActivityEvent;
};

export default function ActivityDescription({ event }: Props) {
  const { t } = useI18n();
  const m = event.meta;
  const meta = useMemo(() => {
    if (event.meta) {
      return Object.keys(event.meta)
        .map((key) => {
          if (!event.meta[key]) return;
          if (key == "peer_groups") return;
          if (key.includes("id")) return;
          if (key.includes("time")) return;
          return {
            key,
            value: event.meta[key],
          };
        })
        .filter((item) => item !== undefined);
    }
  }, [event.meta]);

  if (!m) return null;

  /**
   * Setup Key
   */

  if (event.activity_code == "setupkey.revoke")
    return (
      <div className={"inline"}>{t("activity.setupkey")}<Value> {m.name}</Value>{t("activity.withKey")}<Value>{m.key}</Value> was
        revoked
      </div>
    );

  if (event.activity_code == "setupkey.delete")
    return (
      <div className={"inline"}>{t("activity.setupkey")}<Value> {m.name}</Value>{t("activity.withKey")}<Value>{m.key}</Value> was
        deleted
      </div>
    );

  if (event.activity_code == "setupkey.add")
    return (
      <div className={"inline"}>{t("activity.setupkey")}<Value>{m.name}</Value>{t("activity.withKey")}<Value>{m.key}</Value> was
        created
      </div>
    );

  if (event.activity_code == "peer.setupkey.add")
    return (
      <div className={"inline"}>{t("reverseProxy.targetPeerLabel")}<Value>{m.name}</Value> <PeerConnectionInfo meta={m} /> was added
        with the NetBird IP <Value>{m.ip}</Value> using the setup key{" "}
        <Value>{m.setup_key_name}</Value>
      </div>
    );

  if (event.activity_code == "setupkey.group.delete")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{m.group}</Value> was removed from the{" "}
        <Value>{m.setupkey}</Value>{t("activity.setupKeySuffix")}</div>
    );

  if (event.activity_code == "setupkey.group.add")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{m.group}</Value> was added to the{" "}
        <Value>{m.setupkey}</Value>{t("activity.setupKeySuffix")}</div>
    );

  /**
   * Dashboard
   */
  if (event.activity_code == "dashboard.login")
    return (
      <div className={"inline"}>
        <Value>{m.username}</Value>{t("activity.dashboardLogin")}</div>
    );

  /**
   * Policy
   */

  if (event.activity_code == "policy.update")
    return (
      <div className={"inline"}>{t("activity.policy")}<Value>{m.name}</Value>{t("activity.policyUpdate")}</div>
    );

  if (event.activity_code == "policy.delete")
    return (
      <div className={"inline"}>{t("activity.policy")}<Value>{m.name}</Value>{t("activity.setupkeyDelete")}</div>
    );

  if (event.activity_code == "policy.add")
    return (
      <div className={"inline"}>{t("activity.policy")}<Value>{m.name}</Value>{t("activity.setupkeyAdd")}</div>
    );

  /**
   * Route
   */

  if (event.activity_code == "route.delete") {
    let hasDomains = m?.domains && m?.domains.length > 0;
    return (
      <div className={"inline"}>{t("activity.route")}<Value>{m.name}</Value> with the {hasDomains ? "domain(s)" : ""}{" "}
        <Value>{hasDomains ? m?.domains : m.network_range}</Value>{" "}
        {hasDomains ? "" : "range"} was deleted
      </div>
    );
  }

  if (event.activity_code == "route.update") {
    let hasDomains = m?.domains && m?.domains.length > 0;
    return (
      <div className={"inline"}>{t("activity.route")}<Value>{m.name}</Value> with the {hasDomains ? "domain(s)" : ""}{" "}
        <Value>{hasDomains ? m?.domains : m.network_range}</Value>{" "}
        {hasDomains ? "" : "range"} was updated
      </div>
    );
  }

  if (event.activity_code == "route.add") {
    let hasDomains = m?.domains && m?.domains.length > 0;
    return (
      <div className={"inline"}>{t("activity.route")}<Value>{m.name}</Value> with the {hasDomains ? "domain(s)" : ""}{" "}
        <Value>{hasDomains ? m?.domains : m.network_range}</Value>{" "}
        {hasDomains ? "" : "range"} was created
      </div>
    );
  }

  /**
   * User
   */

  if (event.activity_code == "user.peer.delete")
    return (
      <div className={"inline"}>{t("reverseProxy.targetPeerLabel")}<Value>{m.name}</Value> <PeerConnectionInfo meta={m} /> with
        NetBird IP <Value>{m.ip}</Value>{t("activity.setupkeyDelete")}</div>
    );

  if (event.activity_code == "user.peer.add")
    return (
      <div className={"inline"}>{t("reverseProxy.targetPeerLabel")}<Value>{m.name}</Value> <PeerConnectionInfo meta={m} /> was added
        with the NetBird IP <Value>{m.ip}</Value>
      </div>
    );

  if (event.activity_code == "user.peer.update")
    return (
      <div className={"inline"}>{t("reverseProxy.targetPeerLabel")}<Value>{m.name}</Value> <PeerConnectionInfo meta={m} /> with
        NetBird IP <Value>{m.ip}</Value>{t("activity.routeUpdate")}</div>
    );

  if (event.activity_code == "user.join")
    return (
      <div className={"inline"}>{t("reverseProxy.eventsUser")}<Value>{m.username}</Value> joined NetBird
      </div>
    );

  if (event.activity_code == "user.invite")
    return (
      <div className={"inline"}>
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>{" "}
        was invited.
      </div>
    );

  if (event.activity_code == "user.create")
    return (
      <div className={"inline"}>
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>{" "}
        was created by <Value>{event?.initiator_name || "NetBird"}</Value>
      </div>
    );

  if (event.activity_code == "user.group.add")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{event.meta.group}</Value> was added to user{" "}
        <Value>{event.meta.username}</Value>
      </div>
    );

  if (event.activity_code == "user.block")
    return (
      <div className={"inline"}>{t("reverseProxy.eventsUser")}<Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>{t("activity.userBlock")}</div>
    );

  if (event.activity_code == "user.unblock")
    return (
      <div className={"inline"}>{t("reverseProxy.eventsUser")}<Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>{t("activity.userUnblock")}</div>
    );

  if (event.activity_code == "user.delete")
    return (
      <div className={"inline"}>{t("reverseProxy.eventsUser")}<Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>{t("activity.setupkeyDelete")}</div>
    );

  if (event.activity_code == "user.group.delete")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{event.meta.group}</Value> was removed from user{" "}
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.role.update")
    return (
      <div className={"inline"}>{t("user.account.role")}<Value>{event.meta.role}</Value> was updated of user{" "}
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.approve")
    return (
      <div className={"inline"}>{t("reverseProxy.eventsUser")}<Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>{t("activity.userApprove")}</div>
    );

  if (event.activity_code == "user.reject")
    return (
      <div className={"inline"}>{t("reverseProxy.eventsUser")}<Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>{t("activity.userReject")}</div>
    );

  if (event.activity_code == "user.password.change")
    return (
      <div className={"inline"}>{t("activity.userPasswordChange")}<Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.password.reset")
    return (
      <div className={"inline"}>{t("activity.userPasswordReset")}{" "}
        <Value>{event.meta.email}</Value>
      </div>
    );

  /**
   * User Invite Link
   */

  if (event.activity_code == "user.invite.link.create")
    return (
      <div className={"inline"}>{t("activity.userInviteLinkCreate")}<Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.invite.link.accept")
    return (
      <div className={"inline"}>{t("activity.userInviteLinkAccept")}<Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.invite.link.regenerate")
    return (
      <div className={"inline"}>{t("activity.userInviteLinkRegenerate")}<Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.invite.link.delete")
    return (
      <div className={"inline"}>{t("activity.userInviteLinkDelete")}<Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>
      </div>
    );

  /**
   * Service User
   */

  if (event.activity_code == "service.user.create")
    return (
      <div className={"inline"}>{t("activity.serviceUser")}<Value>{event.meta.name}</Value>{t("activity.setupkeyAdd")}</div>
    );

  if (event.activity_code == "service.user.delete")
    return (
      <div className={"inline"}>{t("activity.serviceUser")}<Value>{event.meta.name}</Value>{t("activity.setupkeyDelete")}</div>
    );

  /**
   * Peer
   */

  if (event.activity_code == "peer.group.delete")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{m.group}</Value> was removed from the peer with the
        NetBird IP <Value>{m.peer_ip}</Value>
      </div>
    );

  if (event.activity_code == "peer.group.add")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{m.group}</Value> was added to the peer with the NetBird IP{" "}
        <Value>{m.peer_ip}</Value>
      </div>
    );

  if (event.activity_code == "peer.login.expire") {
    return (
      <div className={"inline"}>{t("activity.loginOfPeer")}<Value>{m.name}</Value> expired
        {m.reason && (
          <>
            {" "}
            due to <Value>{m.reason}</Value>
          </>
        )}
      </div>
    );
  }

  if (event.activity_code == "peer.ssh.disable")
    return (
      <div className={"inline"}>
        SSH Server of peer <Value>{m.name}</Value>{t("activity.peerSshDisable")}</div>
    );

  if (event.activity_code == "peer.ssh.enable")
    return (
      <div className={"inline"}>
        SSH Server of peer <Value>{m.name}</Value>{t("activity.peerSshEnable")}</div>
    );

  if (event.activity_code == "peer.login.expiration.disable")
    return (
      <div className={"inline"}>{t("activity.loginExpirationOfPeer")}<Value>{m.name}</Value>{t("activity.peerSshDisable")}</div>
    );

  if (event.activity_code == "peer.login.expiration.enable")
    return (
      <div className={"inline"}>{t("activity.loginExpirationOfPeer")}<Value>{m.name}</Value>{t("activity.peerSshEnable")}</div>
    );

  if (event.activity_code == "peer.rename")
    return (
      <div className={"inline"}>
        Peer with the NetBird IP <Value>{m.ip}</Value> was renamed to{" "}
        <Value>{m.name}</Value>
      </div>
    );

  if (event.activity_code == "peer.approve")
    return (
      <div className={"inline"}>
        Peer with the NetBird IP <Value>{m.ip}</Value>{t("activity.userApprove")}</div>
    );

  if (event.activity_code == "peer.ip.update")
    return (
      <div className={"inline"}>{t("reverseProxy.targetPeerLabel")}<Value>{m.name}</Value> IP address was updated from{" "}
        <Value>{m.old_ip}</Value> to <Value>{m.ip}</Value>
      </div>
    );

  if (event.activity_code == "peer.user.add")
    return (
      <div className={"inline"}>{t("reverseProxy.targetPeerLabel")}<Value>{m.name}</Value> <PeerConnectionInfo meta={m} /> was added
        with the NetBird IP <Value>{m.ip}</Value>
      </div>
    );

  /**
   * Group
   */

  if (event.activity_code == "group.add")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{m.name}</Value>{t("activity.setupkeyAdd")}</div>
    );

  if (event.activity_code == "group.delete")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{event.meta.name}</Value>{t("activity.setupkeyDelete")}</div>
    );

  if (event.activity_code == "group.update")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{event.meta.old_name}</Value> was renamed to{" "}
        <Value>{event.meta.new_name}</Value>
      </div>
    );

  /**
   * Account
   */

  if (event.activity_code == "account.create")
    return (
      <div className={"inline"}>
        <Value>{event.initiator_name}</Value>{t("activity.accountCreate")}</div>
    );

  if (event.activity_code == "account.setting.peer.login.expiration.update")
    return <div className={"inline"}>{t("activity.globalLoginExpirationUpdated")}</div>;

  if (event.activity_code == "account.setting.peer.login.expiration.enable")
    return <div className={"inline"}>{t("activity.globalLoginExpirationEnabled")}</div>;

  if (event.activity_code == "account.setting.peer.login.expiration.disable")
    return <div className={"inline"}>{t("activity.globalLoginExpirationDisabled")}</div>;

  if (event.activity_code == "account.network.range.update")
    return (
      <div className={"inline"}>
        Account network range was updated from{" "}
        <Value>{m.old_network_range}</Value> to{" "}
        <Value>{m.new_network_range}</Value>
      </div>
    );

  /**
   * Nameserver
   */

  if (event.activity_code == "nameserver.group.add")
    return (
      <div className={"inline"}>{t("activity.nameserver")}<Value>{event.meta.name}</Value>{t("activity.nameserverGroupAdd")}</div>
    );

  if (event.activity_code == "nameserver.group.delete")
    return (
      <div className={"inline"}>{t("activity.nameserver")}<Value>{event.meta.name}</Value>{t("activity.setupkeyDelete")}</div>
    );

  if (event.activity_code == "nameserver.group.update")
    return (
      <div className={"inline"}>{t("activity.nameserver")}<Value>{event.meta.name}</Value>{t("activity.routeUpdate")}</div>
    );

  /**
   * Personal Access Token
   */

  if (event.activity_code == "personal.access.token.create")
    return (
      <div className={"inline"}>{t("activity.accessToken")}<Value>{event.meta.name}</Value> for user{" "}
        <Value>{event.meta.username}</Value>{t("activity.setupkeyAdd")}</div>
    );

  if (event.activity_code == "personal.access.token.delete")
    return (
      <div className={"inline"}>{t("activity.accessToken")}<Value>{event.meta.name}</Value> for user{" "}
        <Value>{event.meta.username}</Value>{t("activity.setupkeyDelete")}</div>
    );

  /**
   * Integration
   */

  if (event.activity_code == "integration.create") {
    if (!event.meta.platform) return "Integration created";
    return (
      <div className={"inline"}>
        <Value className={"capitalize"}>{event.meta.platform}</Value>{" "}
        integration created
      </div>
    );
  }

  if (event.activity_code == "integration.delete") {
    if (!event.meta.platform) return "Integration deleted";
    return (
      <div className={"inline"}>
        <Value className={"capitalize"}>{event.meta.platform}</Value>{" "}
        integration deleted
      </div>
    );
  }

  if (event.activity_code == "integration.update") {
    if (!event.meta.platform) return "Integration updated";
    return (
      <div className={"inline"}>
        <Value className={"capitalize"}>{event.meta.platform}</Value>{" "}
        integration updated
      </div>
    );
  }

  /**
   * DNS
   */

  if (event.activity_code == "dns.setting.disabled.management.group.add")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{event.meta.group}</Value> was added to disabled DNS group
        setting
      </div>
    );

  if (event.activity_code == "dns.setting.disabled.management.group.delete")
    return (
      <div className={"inline"}>{t("common.group")}<Value>{event.meta.group}</Value> was removed from disabled DNS
        group setting
      </div>
    );

  /**
   * Posture Checks
   */

  if (event.activity_code == "posture.check.updated")
    return (
      <div className={"inline"}>{t("activity.postureCheck")}<Value> {m.name}</Value>{t("activity.routeUpdate")}</div>
    );

  if (event.activity_code == "posture.check.created")
    return (
      <div className={"inline"}>{t("activity.postureCheck")}<Value> {m.name}</Value>{t("activity.setupkeyAdd")}</div>
    );

  if (event.activity_code == "posture.check.deleted")
    return (
      <div className={"inline"}>{t("activity.postureCheck")}<Value> {m.name}</Value>{t("activity.setupkeyDelete")}</div>
    );

  if (event.activity_code == "transferred.owner.role")
    return <div className={"inline"}>{t("activity.ownerRoleTransferred")}</div>;

  /**
   * EDR
   */
  if (event.activity_code == "integrated-validator.api.created")
    return (
      <div className={"inline"}>
        <Value>{m?.platform}</Value>{t("activity.integrationCreate")}</div>
    );

  if (event.activity_code == "integrated-validator.api.updated")
    return (
      <div className={"inline"}>
        <Value>{m?.platform}</Value>{t("activity.integrationUpdate")}</div>
    );

  if (event.activity_code == "integrated-validator.api.deleted")
    return (
      <div className={"inline"}>
        <Value>{m?.platform}</Value>{t("activity.integrationDelete")}</div>
    );

  if (event.activity_code == "integrated-validator.host-check.approved")
    return (
      <div className={"inline"}>{t("activity.integratedValidatorHostCheckApproved")}<Value>{m?.platform}</Value>{t("activity.integration")}</div>
    );

  if (event.activity_code == "integrated-validator.host-check.denied")
    return (
      <div className={"inline"}>{t("activity.integratedValidatorHostCheckDenied")}<Value>{m?.platform}</Value>{t("activity.integration")}</div>
    );

  if (event.activity_code == "integrated-validator.peer.compliance-bypassed")
    return (
      <div className={"inline"}>{t("reverseProxy.targetPeerLabel")}<Value>{m?.name}</Value> with the NetBird IP <Value>{m?.ip}</Value>{" "}
        compliance bypassed for <Value>{m?.platform}</Value> integration
        {m?.original_reason && (
          <>
            {" "}
            (original non-compliant reason: <Value>{m?.original_reason}</Value>)
          </>
        )}
      </div>
    );

  if (
    event.activity_code == "integrated-validator.peer.compliance-bypass-revoked"
  )
    return (
      <div className={"inline"}>{t("reverseProxy.targetPeerLabel")}<Value>{m?.name}</Value> with the NetBird IP <Value>{m?.ip}</Value>{" "}
        compliance bypass revoked for <Value>{m?.platform}</Value>{t("activity.integration")}</div>
    );

  /**
   * Resource
   */
  if (event.activity_code == "resource.group.add")
    return (
      <div className={"inline"}>
        {t("activity.group")} <Value>{m.name}</Value>{" "}
        {t("activity.resourceGroupAdd")}{"  "}
        <Value>{m.resource_name}</Value>
      </div>
    );

  if (event.activity_code == "resource.group.delete")
    return (
      <div className={"inline"}>
        {t("activity.group")} <Value>{m.name}</Value>{" "}
        {t("activity.resourceGroupDelete")}{"  "}
        <Value>{m.resource_name}</Value>
      </div>
    );

  /**
   * Reverse Proxy
   */

  if (event.activity_code == "service.peer.expose")
    return (
      <div className={"inline"}>{t("reverseProxy.targetPeerLabel")}<Value>{m.peer_name}</Value> exposed service{" "}
        <Value>{m.domain}</Value> with auth{" "}
        <Value>{m.auth ? "Enabled" : "Disabled"}</Value>
      </div>
    );

  if (event.activity_code == "service.peer.unexpose")
    return (
      <div className={"inline"}>{t("reverseProxy.targetPeerLabel")}<Value>{m.peer_name}</Value> unexposed service{" "}
        <Value>{m.domain}</Value>
      </div>
    );

  if (event.activity_code == "service.peer.expose.expire")
    return (
      <div className={"inline"}>{t("reverseProxy.modalDefaultLabel")}<Value>{m.domain}</Value> exposed by peer{" "}
        <Value>{m.peer_name}</Value>{t("activity.servicePeerExposeExpire")}</div>
    );

  /**
   * Networks
   */

  if (event.activity_code == "network.resource.create")
    return (
      <div className={"inline"}>{t("reverseProxy.targetResourceLabel")}<Value>{m.name}</Value> created for network{"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.resource.update")
    return (
      <div className={"inline"}>{t("reverseProxy.targetResourceLabel")}<Value>{m.name}</Value> updated for network{"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.resource.delete")
    return (
      <div className={"inline"}>{t("reverseProxy.targetResourceLabel")}<Value>{m.name}</Value> deleted from network{"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.router.create")
    return (
      <div className={"inline"}>
        Routing peer created for network{"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.router.delete")
    return (
      <div className={"inline"}>
        Routing peer deleted from network{"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.router.update")
    return (
      <div className={"inline"}>
        Routing peer updated from network{"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.create")
    return (
      <div className={"inline"}>
        Network with name <Value>{m.name}</Value>{t("activity.networkCreate")}</div>
    );

  if (event.activity_code == "network.delete")
    return (
      <div className={"inline"}>
        Network with name <Value>{m.name}</Value>{t("activity.networkDelete")}</div>
    );

  if (event.activity_code == "network.update")
    return (
      <div className={"inline"}>
        Network with name <Value>{m.name}</Value>{t("activity.networkUpdate")}</div>
    );

  /**
   * Jobs
   */

  if (event.activity_code == "peer.job.create")
    return (
      <div className={"inline"}>{t("activity.remoteJob")}<Value>{m.job_type}</Value> created for peer{" "}
        <Value>{m.for_peer_name}</Value>
      </div>
    );

  /**
   * Flow Settings
   */

  if (event.activity_code == "account.settings.extra.flow.group.remove")
    return (
      <div className={"inline"}>{t("activity.limitTrafficEventGroup")}<Value>{m.group_name}</Value>{t("activity.accountSettingsFlowGroupRemove")}</div>
    );

  if (event.activity_code == "account.settings.extra.flow.group.add")
    return (
      <div className={"inline"}>{t("activity.limitTrafficEventGroup")}<Value>{m.group_name}</Value>{t("activity.accountSettingsFlowGroupAdd")}</div>
    );

  /**
   * Identity Provider
   */

  if (event.activity_code == "identityprovider.create")
    return (
      <div className={"inline"}>{t("activity.identityProvider")}<Value>{m.name}</Value>{t("activity.setupkeyAdd")}</div>
    );

  if (event.activity_code == "identityprovider.update")
    return (
      <div className={"inline"}>{t("activity.identityProvider")}<Value>{m.name}</Value>{t("activity.routeUpdate")}</div>
    );

  if (event.activity_code == "identityprovider.delete")
    return (
      <div className={"inline"}>{t("activity.identityProvider")}<Value>{m.name}</Value>{t("activity.setupkeyDelete")}</div>
    );

  /**
   * Reverse Proxy
   */

  if (event.activity_code == "service.create")
    return (
      <div className={"inline"}>{t("reverseProxy.modalDefaultLabel")}<Value>{m.domain}</Value> in cluster{" "}
        <Value>{m.proxy_cluster}</Value> was created with authentication{" "}
        <Value>{m.auth ? "Enabled" : "Disabled"}</Value>
      </div>
    );

  if (event.activity_code == "service.update")
    return (
      <div className={"inline"}>{t("reverseProxy.modalDefaultLabel")}<Value>{m.domain}</Value> in cluster{" "}
        <Value>{m.proxy_cluster}</Value> was updated with authentication{" "}
        <Value>{m.auth ? "Enabled" : "Disabled"}</Value>
      </div>
    );

  if (event.activity_code == "service.delete")
    return (
      <div className={"inline"}>{t("reverseProxy.modalDefaultLabel")}<Value>{m.domain}</Value> in cluster{" "}
        <Value>{m.proxy_cluster}</Value>{t("activity.setupkeyDelete")}</div>
    );

  /**
   * Distributor
   */

  if (event.activity_code == "reseller.msp.created")
    return (
      <div className={"inline"}>{t("activity.customer")}<Value>{m.msp_name}</Value> with domain{" "}
        <Value>{m.msp_domain}</Value>{t("activity.setupkeyAdd")}</div>
    );

  if (event.activity_code == "reseller.activated")
    return <div className={"inline"}>{t("activity.distributorActivated")}</div>;

  if (event.activity_code == "reseller.msp.deleted")
    return (
      <div className={"inline"}>{t("activity.customer")}<Value>{m.msp_name}</Value> with domain{" "}
        <Value>{m.msp_domain}</Value>{t("activity.setupkeyDelete")}</div>
    );

  if (event.activity_code == "reseller.msp.unlinked")
    return (
      <div className={"inline"}>{t("activity.customer")}<Value>{m.msp_name}</Value> with domain{" "}
        <Value>{m.msp_domain}</Value>{t("activity.customerWasUnlinked")}</div>
    );

  if (event.activity_code == "reseller.msp.invite.requested")
    return (
      <div className={"inline"}>{t("activity.inviteRequestedForCustomer")}<Value>{m.msp_name}</Value> with domain{" "}
        <Value>{m.msp_domain}</Value>
      </div>
    );

  if (event.activity_code == "reseller.msp.invite.accepted")
    return (
      <div className={"inline"}>{t("activity.inviteAcceptedByCustomer")}<Value>{m.msp_name}</Value> with domain{" "}
        <Value>{m.msp_domain}</Value>
      </div>
    );

  if (event.activity_code == "reseller.msp.invite.declined")
    return (
      <div className={"inline"}>{t("activity.inviteDeclinedByCustomer")}<Value>{m.msp_name}</Value> with domain{" "}
        <Value>{m.msp_domain}</Value>
      </div>
    );

  if (event.activity_code == "reseller.msp.updated")
    return (
      <div className={"inline"}>{t("activity.customer")}<Value>{m.msp_name}</Value> with domain{" "}
        <Value>{m.msp_domain}</Value>{t("activity.routeUpdate")}</div>
    );

  return (
    <div className={"flex gap-2.5 items-center"}>
      <span className={"mb-[1px]"}>{event.activity}</span>

      {isLocalDev() && !isProduction() && (
        <FullTooltip
          content={
            <div className={"pb-1"}>
              <Label className={"mb-3"}>{t("activity.activityCode")}</Label>
              <Value>{event.activity_code}</Value>
              <Label className={"my-3"}>{t("activity.meta")}</Label>
              {meta &&
                meta.map((item) => (
                  <React.Fragment key={item?.key}>
                    <div className={"inline"}>
                      <Value>
                        {item?.key} = {item?.value}
                      </Value>
                    </div>
                  </React.Fragment>
                ))}
            </div>
          }
        >
          <IconInfoCircle className={"text-nb-gray-500"} size={16} />
        </FullTooltip>
      )}
    </div>
  );
}

function Value({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return children ? (
    <span
      className={cn(
        "text-nb-gray-200 inline-flex gap-1 items-center max-h-[22px] font-medium bg-nb-gray-900 py-[3px] text-[11px] px-[5px] border border-nb-gray-800 rounded-[4px]",
        className,
      )}
    >
      {children}
    </span>
  ) : null;
}

function PeerConnectionInfo({ meta }: { meta: any }) {
  const hasMeta =
    !isEmpty(meta?.location_country_code) ||
    !isEmpty(meta?.location_connection_ip);
  const { countries } = useCountries();

  const countryText = useMemo(() => {
    if (!countries) return "Unknown";
    const country = countries.find(
      (c) => c.country_code === meta?.location_country_code,
    );
    if (!country) return "Unknown";
    if (!meta?.location_city_name) return country.country_name;
    return `${country.country_name}, ${meta?.location_city_name}`;
  }, [countries, meta]);

  return hasMeta ? (
    <>
      {" "}
      from{" "}
      {meta?.location_connection_ip && (
        <Value>{meta?.location_connection_ip}</Value>
      )}{" "}
      {meta?.location_country_code && (
        <Value>
          {isEmpty(meta?.location_country_code) ? (
            <GlobeIcon size={9} className={"text-nb-gray-300"} />
          ) : (
            <RoundedFlag country={meta?.location_country_code} size={9} />
          )}
          {countryText}
        </Value>
      )}
    </>
  ) : null;
}
