import Button from "@components/Button";
import { Modal, ModalContent } from "@components/modal/Modal";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Check, CircleCheckBig } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const TrialSuccessModal = ({ open, setOpen }: Props) => {
  const { t } = useI18n();
  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent showClose={false} maxWidthClass={"max-w-md"}>
        <GradientFadedBackground />
        <div className={"flex items-center justify-center flex-col gap-3 px-6"}>
          <CircleCheckBig size={28} className={"text-green-500"} />
          <div className={"text-xl font-medium"}>
            {t("billing.trialStartedTitle")}
          </div>
          <div className={"text-sm text-nb-gray-300 text-center"}>
            {t("billing.trialStartedWelcome")}
            <b className={"text-nb-gray-200 font-medium"}>
              {t("billing.trialStartedNextTwoWeeks")}
            </b>
            .
          </div>
          <div className={"bg-nb-gray-920 px-5 py-4 rounded-lg mt-4"}>
            <div className={"text-base font-medium mb-1"}>
              {t("billing.whatsNext")}
            </div>
            <div className={"text-sm text-nb-gray-200 mb-2"}>
              {t("billing.trialExploreDescription")}
            </div>
            <ul className="flex flex-col gap-1.5 mt-4 mb-6">
              <li className="flex items-center gap-2 text-sm text-nb-gray-200">
                <Check size={16} className={"text-netbird"} />
                {t("billing.trialFeatureIdpSync")}
              </li>
              <li className="flex items-center gap-2 text-sm text-nb-gray-200">
                <Check size={16} className={"text-netbird"} />
                {t("billing.trialFeaturePostureChecks")}
              </li>
              <li className="flex items-center gap-2 text-sm text-nb-gray-200">
                <Check size={16} className={"text-netbird"} />
                {t("billing.trialFeatureDeviceApprovals")}
              </li>
            </ul>
            <Button
              className={"w-full"}
              variant={"primary"}
              onClick={() => setOpen(false)}
            >
              {t("billing.exploreNetBird")}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
