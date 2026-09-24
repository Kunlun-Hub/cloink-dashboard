import React, { useEffect, useMemo, useState } from "react";
import Button from "@components/Button";
import { Input } from "@components/Input";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { useI18n } from "@/i18n/I18nProvider";
import { trim } from "lodash";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (name: string) => void;
  currentName: string;
  // Group names, placeholder peer names on the canvas, …
  takenNames: string[];
  duplicateError?: string;
  title?: string;
  description?: string;
  inputPlaceholder?: string;
};

export const GroupRenameModal = ({
  open,
  onOpenChange,
  onRename,
  currentName,
  takenNames,
  duplicateError,
  title,
  description,
  inputPlaceholder,
}: Props) => {
  const { t } = useI18n();
  const duplicateErrorText =
    duplicateError ?? t("controlCenter.draft.groupExists");
  const titleText = title ?? t("controlCenter.draft.renameGroup");
  const descriptionText =
    description ?? t("controlCenter.draft.groupNameDescription");
  const placeholderText =
    inputPlaceholder ?? t("controlCenter.draft.groupNamePlaceholder");
  const [name, setName] = useState(currentName);
  const [error, setError] = useState("");

  const isDisabled = useMemo(() => {
    if (error !== "") return true;
    const trimmed = trim(name);
    return trimmed.length === 0 || trimmed === currentName;
  }, [name, error, currentName]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const exists =
      newName !== currentName && takenNames.includes(trim(newName));
    setError(exists ? duplicateErrorText : "");
    setName(newName);
  };

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError("");
    }
  }, [open, currentName]);

  const submit = () => {
    if (isDisabled) return;
    onOpenChange(false);
    onRename(trim(name));
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"max-w-md"}>
        <ModalHeader
          title={titleText}
          description={descriptionText}
          color={"blue"}
        />
        <div className={"p-default flex flex-col"}>
          <Input
            placeholder={placeholderText}
            value={name}
            onChange={handleNameChange}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            error={error}
            autoFocus
            data-testid="cc-rename-input"
          />
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
              disabled={isDisabled}
              onClick={submit}
              data-testid="cc-rename-submit"
            >
              {t("controlCenter.draft.rename")}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
