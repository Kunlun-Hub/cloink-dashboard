import Button from "@components/Button";
import { Modal, ModalContent } from "@components/modal/Modal";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: () => void;
  onCancel: () => void;
};

export const AccountMFAInfoModal = ({
  open,
  setOpen,
  onCancel,
  onConfirm,
}: Props) => {
  const { t } = useI18n();
  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent showClose={false} maxWidthClass={"max-w-[380px]"}>
        <GradientFadedBackground />
        <div className={"flex items-center justify-center flex-col gap-3 px-6"}>
          <div className={"text-xl font-medium text-center"}>
            {t("mfa.mayNotNeedTitle")}
          </div>
          <div className={"text-sm text-nb-gray-300 text-center mb-2"}>
            {t("mfa.mayNotNeedPrefix")}
            <strong className={"text-nb-gray-200 font-medium"}>
              {t("mfa.ssoProvider")}
            </strong>
            {t("mfa.mayNotNeedSuffix")}
          </div>
          <div className={"flex gap-4 w-full"}>
            <Button
              className={"w-full"}
              variant={"secondary"}
              onClick={onCancel}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className={"w-full"}
              variant={"primary"}
              onClick={onConfirm}
            >
              {t("mfa.enableMfa")}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
