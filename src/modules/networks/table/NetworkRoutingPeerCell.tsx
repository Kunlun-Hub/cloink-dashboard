import Badge from "@components/Badge";
import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import { cn } from "@utils/helpers";
import { HelpCircle, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Network } from "@/interfaces/Network";
import { useNetworksContext } from "@/modules/networks/NetworkProvider";

type Props = {
  network: Network;
};
export default function NetworkRoutingPeerCell({ network }: Props) {
  const { permission } = usePermissions();
  const router = useRouter();
  const { t } = useI18n();
  const disabledText = useMemo(
    () => (
      <>
        {t("networkRoutingPeers.cell.haInactivePrefix")}{" "}
        <span className={"text-yellow-400 font-medium"}>
          {t("networkRoutingPeers.cell.inactive")}
        </span>{" "}
        {t("networkRoutingPeers.cell.haForNetwork")}
      </>
    ),
    [t],
  );

  const enabledText = useMemo(
    () => (
      <>
        {t("networkRoutingPeers.cell.haActivePrefix")}{" "}
        <span className={"text-green-500 font-medium"}>
          {t("networkRoutingPeers.cell.active")}
        </span>{" "}
        {t("networkRoutingPeers.cell.haForNetwork")}
      </>
    ),
    [t],
  );

  const { openAddRoutingPeerModal } = useNetworksContext();

  const isHighlyAvailable = !!(
    network?.routing_peers_count && network.routing_peers_count >= 2
  );
  const isActive = !!(
    network?.routing_peers_count && network.routing_peers_count > 0
  );

  return (
    <div className={"flex gap-3 items-center"}>
      <FullTooltip
        interactive={false}
        content={
          <div className={"max-w-xs text-xs"}>
            <>
              {isHighlyAvailable ? enabledText : disabledText}
              {isHighlyAvailable ? (
                <div className={"inline-flex mt-2"}>
                  {t("networkRoutingPeers.cell.addMorePeers")}
                </div>
              ) : (
                <div className={"inline-flex mt-2"}>
                  {t("networkRoutingPeers.cell.addPeersHint")}
                </div>
              )}
            </>
          </div>
        }
      >
        {isActive && (
          <Badge
            variant={isHighlyAvailable ? "green" : "gray"}
            className={cn(
              "inline-flex gap-2  min-w-[110px] font-medium items-center justify-center min-h-[34px] cursor-pointer",
            )}
            onClick={() =>
              router.push(`/network?id=${network.id}&tab=routing-peers`)
            }
            useHover={true}
          >
            <>
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isHighlyAvailable ? "bg-green-500" : "bg-yellow-400",
                )}
              ></div>
              {network?.routing_peers_count && network.routing_peers_count}{" "}
              {t("networkRoutingPeers.cell.peerLabel")}
            </>

            <HelpCircle size={12} />
          </Badge>
        )}
      </FullTooltip>
      <Button
        size={"xs"}
        variant={"secondary"}
        className={"!px-3"}
        onClick={() => openAddRoutingPeerModal(network)}
        disabled={!permission.networks.update}
        aria-label={t("networkRoutingPeers.cell.addAriaLabel")}
      >
        <PlusCircle size={12} />
        {t("common.add")}
      </Button>
    </div>
  );
}
