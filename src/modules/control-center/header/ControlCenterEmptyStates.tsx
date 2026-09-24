import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import { NoPeersGettingStarted } from "@components/NoPeersGettingStarted";
import SquareIcon from "@components/SquareIcon";
import GetStartedTest from "@components/ui/GetStartedTest";
import NetworkRoutesIcon from "@/assets/icons/NetworkRoutesIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { FlowView } from "@/modules/control-center/header/FlowSelector";
import { ExternalLinkIcon, PlusCircle } from "lucide-react";
import { useCanvasState } from "@/modules/control-center/contexts/ControlCenterContext";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { useControlCenterData } from "@/modules/control-center/hooks/useControlCenterData";
import { useNetworksContext } from "@/modules/networks/NetworkProvider";
import { useCanvasTransitionActive } from "@/modules/control-center/utils/canvas-transition";

// Must stay a literal: Tailwind only emits classes it finds as static text.
const EMPTY_STATE_REVEAL_IN =
  "animate-in fade-in zoom-in-[.97] duration-[700ms] ease-out fill-mode-both";

export function ControlCenterEmptyStates() {
  const { t } = useI18n();
  const { currentView, selectedNetwork, layoutInitialized, instantDrill } =
    useCanvasState();
  const { isDraft } = useDraftMode();
  const { isPeersLoading, isNetworksLoading, peers, networks } =
    useControlCenterData();
  const { openCreateNetworkModal, openResourceModal } = useNetworksContext();
  const { permission } = usePermissions();
  const isTransitioning = useCanvasTransitionActive();

  if (isDraft) return null;

  const drilledNetwork =
    selectedNetwork !== ""
      ? networks?.find((n) => n.id === selectedNetwork)
      : undefined;
  // The overlay lives outside the canvas pane, so the drill transition's fade
  // doesn't cover it and it would otherwise flash in mid-dive.
  const drilledNetworkEmpty =
    layoutInitialized &&
    !isTransitioning &&
    !!drilledNetwork &&
    (drilledNetwork.resources?.length ?? 0) === 0;

  return (
    <>
      {currentView === FlowView.PEERS &&
        !isPeersLoading &&
        peers?.length === 0 && (
          <div className={"absolute left-0 top-0 z-10 w-full mt-28"}>
            <NoPeersGettingStarted showBackground={false} />
          </div>
        )}

      {currentView === FlowView.NETWORKS &&
        !isNetworksLoading &&
        drilledNetworkEmpty && (
          <div
            className={`absolute left-0 top-0 z-10 w-full mt-28 ${
              instantDrill ? "" : EMPTY_STATE_REVEAL_IN
            }`}
          >
            <GetStartedTest
              showBackground={false}
              icon={
                <SquareIcon
                  icon={
                    <NetworkRoutesIcon
                      className={"fill-nb-gray-200"}
                      size={20}
                    />
                  }
                  color={"gray"}
                  size={"large"}
                />
              }
              title={t("controlCenter.emptyResourceTitle")}
              description={t("controlCenter.emptyResourceDescription")}
              button={
                <div
                  className={"gap-x-4 flex items-center justify-center"}
                >
                  <Button
                    variant={"primary"}
                    onClick={() =>
                      drilledNetwork && openResourceModal(drilledNetwork)
                    }
                    disabled={!permission.networks.update}
                  >
                    <PlusCircle size={16} />
                    {t("controlCenter.addResource")}
                  </Button>
                </div>
              }
              learnMore={
                <>
                  {t("common.learnMoreAbout")}
                  <InlineLink
                    href={"https://docs.netbird.io/how-to/networks#resources"}
                    target={"_blank"}
                  >
                    {t("controlCenter.resourcesLabel")}
                    <ExternalLinkIcon size={12} />
                  </InlineLink>
                </>
              }
            />
          </div>
        )}

      {currentView === FlowView.NETWORKS &&
        !isNetworksLoading &&
        selectedNetwork === "" &&
        networks?.length === 0 && (
          <div className={"absolute left-0 top-0 z-10 w-full mt-28"}>
            <GetStartedTest
              showBackground={false}
              icon={
                <SquareIcon
                  icon={
                    <NetworkRoutesIcon
                      className={"fill-nb-gray-200"}
                      size={20}
                    />
                  }
                  color={"gray"}
                  size={"large"}
                />
              }
              title={t("controlCenter.emptyNetworkTitle")}
              description={t("controlCenter.emptyNetworkDescription")}
              button={
                <div
                  className={"gap-x-4 flex items-center justify-center"}
                >
                  <Button
                    variant={"primary"}
                    onClick={openCreateNetworkModal}
                    disabled={!permission.networks.create}
                  >
                    <PlusCircle size={16} />
                    {t("controlCenter.addNetwork")}
                  </Button>
                </div>
              }
              learnMore={
                <>
                  {t("common.learnMoreAbout")}
                  <InlineLink
                    href={"https://docs.netbird.io/how-to/networks"}
                    target={"_blank"}
                  >
                    {t("controlCenter.networksLabel")}
                    <ExternalLinkIcon size={12} />
                  </InlineLink>
                </>
              }
            />
          </div>
        )}
    </>
  );
}
