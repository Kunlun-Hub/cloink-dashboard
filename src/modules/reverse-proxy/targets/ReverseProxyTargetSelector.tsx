"use client";

import HelpText from "@components/HelpText";
import { Label } from "@components/Label";
import { Modal } from "@components/modal/Modal";
import { ClusterOption, PeerGroupSelector } from "@components/PeerGroupSelector";
import React, { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Network } from "@/interfaces/Network";
import {
  ReverseProxyDomainType,
  ReverseProxyTargetType,
} from "@/interfaces/ReverseProxy";
import {
  isResourceTargetType,
  useReverseProxies,
} from "@/contexts/ReverseProxiesProvider";
import { HelpTooltip } from "@components/HelpTooltip";
import InlineLink, { InlineButtonLink } from "@components/InlineLink";
import SetupModal from "@/modules/setup-netbird-modal/SetupModal";

export type Target = {
  type: ReverseProxyTargetType;
  peerId?: string;
  resourceId?: string;
  host: string;
};

type Props = {
  value?: Target;
  initialNetwork?: Network;
  onChange: (value: Target | undefined) => void;
  /** The service's currently-selected proxy cluster (apex domain).
   *  When set, the Proxy Clusters tab is restricted to that one cluster.
   *  When unset, all clusters that support private services are offered;
   *  picking one in this tab is the operator's commit to that cluster. */
  serviceCluster?: string;
  /** Called when the user picks a cluster in the Proxy Clusters tab so
   *  the parent service modal can mirror the choice into its domain
   *  state (no-op when serviceCluster is already that value). */
  onClusterPick?: (cluster: string) => void;
};

export default function ReverseProxyTargetSelector({
  value,
  initialNetwork,
  onChange,
  serviceCluster,
  onClusterPick,
}: Readonly<Props>) {
  const { t } = useI18n();
  const { resources, peers, domains } = useReverseProxies();
  const [installModal, setInstallModal] = useState(false);

  // Clusters tab is only available when at least one domain advertises
  // supports_private. Inside a network-resource flow there is no cluster
  // concept, so the tab is hidden there too.
  const clusters: ClusterOption[] = useMemo(() => {
    if (initialNetwork) return [];
    const privateCapable = (domains ?? []).filter(
      (d) =>
        d.supports_private === true &&
        d.type === ReverseProxyDomainType.FREE,
    );
    if (privateCapable.length === 0) return [];
    if (serviceCluster) {
      const match = privateCapable.find((d) => d.domain === serviceCluster);
      return match
        ? [{ domain: match.domain }]
        : [{ domain: serviceCluster }];
    }
    return privateCapable.map((d) => ({ domain: d.domain }));
  }, [domains, initialNetwork, serviceCluster]);

  const showClusters = clusters.length > 0;

  const tabOrder = useMemo(() => {
    if (initialNetwork) return ["resources"] as const;
    return showClusters
      ? (["peers", "resources", "clusters"] as const)
      : (["peers", "resources"] as const);
  }, [initialNetwork, showClusters]);

  return (
    <div>
      <Label className={"gap-0 inline"}>
        {initialNetwork ? (
          t("reverseProxy.targetSelectResource")
        ) : (
          <>
            {t("reverseProxy.targetSelectPeerOrResource")}{" "}
            <HelpTooltip
              className={"max-w-sm"}
              content={
                <>
                  {t("reverseProxy.targetHelpArticle")}{" "}
                  <span className={"text-white font-medium"}>
                    {t("reverseProxy.targetPeerLabel")}
                  </span>{" "}
                  {t("reverseProxy.targetPeerHelpSuffix")}
                  <span className={"mt-1 block"}>
                    {t("reverseProxy.targetPeerInstall")}{" "}
                    <InlineButtonLink onClick={() => setInstallModal(true)}>
                      {t("reverseProxy.installNetBird")}
                    </InlineButtonLink>
                    .
                  </span>
                </>
              }
              interactive={true}
            >
              {t("reverseProxy.targetPeerLabel")}
            </HelpTooltip>
            ,{" "}
            <HelpTooltip
              className={"max-w-sm"}
              content={
                <>
                  {t("reverseProxy.targetHelpArticle")}{" "}
                  <span className={"text-white font-medium"}>
                    {t("reverseProxy.targetResourceLabel")}
                  </span>{" "}
                  {t("reverseProxy.targetResourceHelpSuffix")}
                  <span className={"mt-1 block"}>
                    {t("reverseProxy.targetResourceCreate")}{" "}
                    <InlineLink href={"/networks"}>{t("reverseProxy.networks")}</InlineLink>{" "}
                    {t("reverseProxy.targetCreateSome")}
                  </span>
                </>
              }
              interactive={true}
            >
              {t("reverseProxy.targetResourceLabel")}
            </HelpTooltip>
            {showClusters && (
              <>
                {" "}
                {t("reverseProxy.targetPeerOrResourceConnector")}{" "}
                <HelpTooltip
                  className={"max-w-sm"}
                  content={
                    <>
                      {t("reverseProxy.targetHelpArticle")}{" "}
                      <span className={"text-white font-medium"}>
                        {t("reverseProxy.proxyCluster")}
                      </span>{" "}
                      {t("reverseProxy.proxyClusterHelpSuffix")}
                    </>
                  }
                  interactive={true}
                >
                  {t("reverseProxy.proxyCluster")}
                </HelpTooltip>
              </>
            )}
          </>
        )}
      </Label>
      <HelpText>
        {initialNetwork
          ? t("reverseProxy.targetSelectResourceHelp")
          : t("reverseProxy.targetSelectGeneralHelp")}
      </HelpText>
      <PeerGroupSelector
        values={[]}
        onChange={() => {}}
        placeholder={
          initialNetwork
            ? t("reverseProxy.targetSelectResourcePlaceholder")
            : showClusters
            ? t("reverseProxy.targetSelectPeerResourceOrClusterPlaceholder")
            : t("reverseProxy.targetSelectPeerOrResourcePlaceholder")
        }
        showPeers={!initialNetwork}
        showResources={true}
        showClusters={showClusters}
        clusters={clusters}
        selectedCluster={
          value?.type === ReverseProxyTargetType.CLUSTER
            ? value.resourceId
            : undefined
        }
        onClusterChange={(cluster) => {
          if (!cluster) {
            onChange(undefined);
            return;
          }
          onChange({
            type: ReverseProxyTargetType.CLUSTER,
            resourceId: cluster,
            host: value?.host ?? "",
          });
          onClusterPick?.(cluster);
        }}
        showRoutes={false}
        hideAllGroup={true}
        hideGroupsTab={true}
        resourceIds={
          initialNetwork ? initialNetwork.resources ?? [] : undefined
        }
        tabOrder={[...tabOrder]}
        closeOnSelect={true}
        max={1}
        resource={
          value?.type && isResourceTargetType(value.type) && value.resourceId
            ? {
                id: value.resourceId,
                type: value.type as "host" | "domain" | "subnet",
              }
            : value?.type === ReverseProxyTargetType.PEER && value.peerId
            ? { id: value.peerId, type: "peer" }
            : undefined
        }
        onResourceChange={(res) => {
          if (res) {
            if (res.type === "peer") {
              const peer = peers?.find((p) => p.id === res.id);
              onChange({
                type: ReverseProxyTargetType.PEER,
                peerId: res.id,
                host: peer?.ip || "localhost",
              });
            } else {
              const selectedResource = resources?.find((r) => r.id === res.id);
              const address = selectedResource?.address || "";
              onChange({
                type:
                  (selectedResource?.type as ReverseProxyTargetType) ??
                  ReverseProxyTargetType.HOST,
                resourceId: res.id,
                host: address.includes("/") ? address.split("/")[0] : address,
              });
            }
          } else {
            onChange(undefined);
          }
        }}
      />
      <Modal open={installModal} onOpenChange={setInstallModal}>
        <SetupModal />
      </Modal>
    </div>
  );
}
