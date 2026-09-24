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
import { trim } from "lodash";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (name: string) => void;
  groups: Group[] | undefined;
};

export const CreateGroupNameModal = ({
  open,
  onOpenChange,
  onSuccess,
  groups,
}: Props) => {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const isDisabled = useMemo(() => {
    if (error !== "") return true;
    return trim(name).length === 0;
  }, [name, error]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const trimmed = trim(newName);
    // "All" is the system group; name-based checks would misidentify a copy.
    if (trimmed === "All") {
      setError(t("controlCenter.draft.reservedGroupName"));
    } else {
      const exists = groups?.some((g) => g.name === trimmed);
      setError(
        exists ? t("controlCenter.draft.groupExists") : "",
      );
    }
    setName(newName);
  };

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"max-w-md"}>
        <ModalHeader
          title={t("controlCenter.draft.createGroup")}
          description={t("controlCenter.draft.groupNameDescription")}
          color={"blue"}
        />
        <div className={"p-default flex flex-col gap-4"}>
          <Input
            placeholder={t("controlCenter.draft.groupNamePlaceholder")}
            value={name}
            onChange={handleNameChange}
            error={error}
            autoFocus
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
              onClick={() => onSuccess(trim(name))}
              disabled={isDisabled}
              type={"submit"}
            >
              {t("common.save")}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
