import Button from "@components/Button";
import { Modal, ModalContent } from "@components/modal/Modal";
import { ArrowRightIcon, CheckCircle2Icon, DownloadIcon, Loader2Icon } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { SetupModalContent } from "@/modules/setup-netbird-modal/SetupModal";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  onBack: () => void;
  onNext: () => void;
  // device_connected is true once at least one peer has joined the network.
  // The parent polls /peers and flips this; we use it to surface the
  // connected state and let the operator continue.
  deviceConnected: boolean;
};

// OnboardingAgentDevice covers the quickstart's "Add Your Device to the
// Network" step: agent-network endpoints are reachable only over the
// NetBird overlay, so the operator's device must run the client and be
// authenticated before anything else works.
export const OnboardingAgentDevice = ({
  onBack,
  onNext,
  deviceConnected,
}: Props) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // Close the install modal automatically once the device shows up so the
  // operator lands back on the connected state without an extra click.
  useEffect(() => {
    if (deviceConnected) setOpen(false);
  }, [deviceConnected]);

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center"}>{t("onboarding.agent.device.title")}</h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t("onboarding.agent.device.description")}
        </div>
      </div>

      <div
        className={
          "mt-4 flex items-center justify-center gap-2 rounded-md border border-nb-gray-900 bg-nb-gray-920 py-3 px-4 text-sm"
        }
      >
        {deviceConnected ? (
          <>
            <CheckCircle2Icon size={16} className={"text-green-500"} />
            <span>{t("onboarding.agent.device.connected")}</span>
          </>
        ) : (
          <>
            <Loader2Icon size={16} className={"animate-spin text-nb-gray-300"} />
            <span className={"text-nb-gray-300"}>
              {t("onboarding.agent.device.waiting")}
            </span>
          </>
        )}
      </div>

      <div className={"flex items-center justify-center mt-4 gap-3"}>
        <Button variant={"secondary"} onClick={onBack}>
          {t("actions.goBack")}
        </Button>
        {deviceConnected ? (
          <Button variant={"primary"} onClick={onNext}>
            {t("common.continue")}
            <ArrowRightIcon size={16} />
          </Button>
        ) : (
          <Button variant={"primary"} onClick={() => setOpen(true)}>
            <DownloadIcon size={16} />
            {t("common.installNetBird")}
          </Button>
        )}
      </div>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent className={"!z-[70]"}>
          <SetupModalContent title={t("common.installNetBird")} isUserDevice={true} />
        </ModalContent>
      </Modal>
    </div>
  );
};
