import Button from "@components/Button";
import { Callout } from "@components/Callout";
import { Input } from "@components/Input";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { isValidIP } from "@utils/ip";
import { trim } from "lodash";
import React, { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

type IPVersion = "v4" | "v6";

interface PeerEditIPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ip: string) => void;
  currentIP: string;
  version: IPVersion;
}

const config: Record<
  IPVersion,
  {
    titleKey: string;
    descriptionKey: string;
    placeholderKey: string;
    errorMessageKey: string;
    validate: (ip: string) => boolean;
  }
> = {
  v4: {
    titleKey: "peer.editIpTitle",
    descriptionKey: "peer.editIpDescription",
    placeholderKey: "peer.editIpPlaceholder",
    errorMessageKey: "peer.editIpError",
    validate: (ip: string) =>
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        ip,
      ),
  },
  v6: {
    titleKey: "peer.editIpv6Title",
    descriptionKey: "peer.editIpv6Description",
    placeholderKey: "peer.editIpv6Placeholder",
    errorMessageKey: "peer.editIpv6Error",
    validate: (ip: string) => isValidIP(ip) && ip.includes(":"),
  },
};

export function PeerEditIPModal({
  open,
  onOpenChange,
  onSave,
  currentIP,
  version,
}: Readonly<PeerEditIPModalProps>) {
  const { t } = useI18n();
  const { titleKey, descriptionKey, placeholderKey, errorMessageKey, validate } =
    config[version];
  const title = t(titleKey);
  const description = t(descriptionKey);
  const placeholder = t(placeholderKey);
  const errorMessage = t(errorMessageKey);
  const [ip, setIP] = useState(currentIP);

  const isDisabled = useMemo(() => {
    if (ip === currentIP) return true;
    const trimmed = trim(ip);
    return trimmed.length === 0 || !validate(trimmed);
  }, [ip, currentIP, validate]);

  const error = useMemo(() => {
    if (ip === currentIP) return "";
    if (!validate(trim(ip))) return errorMessage;
    return "";
  }, [ip, currentIP, validate, errorMessage]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"max-w-md"}>
        <form>
          <ModalHeader title={title} description={description} color={"blue"} />

          <div className={"p-default flex flex-col gap-4"}>
            <div>
              <Input
                placeholder={placeholder}
                value={ip}
                onChange={(e) => setIP(e.target.value)}
                error={error}
              />
            </div>

            <Callout>{t("peer.editIpReconnectInfo")}</Callout>
          </div>

          <ModalFooter className={"items-center"} separator={false}>
            <div className={"flex gap-3 w-full justify-end"}>
              <ModalClose asChild={true}>
                <Button variant={"secondary"} className={"w-full"}>
                  {t("common.cancel")}
                </Button>
              </ModalClose>

              <Button
                variant={"primary"}
                className={"w-full"}
                onClick={() => onSave(trim(ip))}
                disabled={isDisabled}
              >
                {t("common.save")}
              </Button>
            </div>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
