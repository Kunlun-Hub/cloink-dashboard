import Button from "@components/Button";
import { Modal, ModalContent } from "@components/modal/Modal";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Sparkles } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const FirewallGPTAccessFormSuccessModal = ({ open, setOpen }: Props) => {
  const { t } = useI18n();
  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent showClose={true} maxWidthClass={"max-w-sm"}>
        <GradientFadedBackground />
        <div
          className={
            "flex items-center justify-center flex-col gap-3 px-6 relative z-[1]"
          }
        >
          <Sparkles size={26} className={"text-netbird-500"} />
          <div className={"text-xl font-medium"}>
            {t("firewallGpt.accessFormSuccess.title")}
          </div>
          <div className={"text-sm text-center mb-2"}>
            <p className={"!text-nb-gray-300"}>
              {t("firewallGpt.accessFormSuccess.description")}
            </p>
          </div>
          <Button
            variant={"secondary"}
            size={"xs"}
            className={"w-full"}
            onClick={() => setOpen(false)}
          >
            {t("firewallGpt.accessFormSuccess.close")}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
};
