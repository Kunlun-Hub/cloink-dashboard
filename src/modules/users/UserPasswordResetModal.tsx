import Button from "@components/Button";
import Code from "@components/Code";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import Paragraph from "@components/Paragraph";
import { useApiCall } from "@utils/api";
import { MailIcon } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { PasswordResetLink } from "@/interfaces/PasswordReset";
import { User } from "@/interfaces/User";

type Props = {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UserPasswordResetModal = ({ user, open, onOpenChange }: Props) => {
  const request = useApiCall<PasswordResetLink>("/users", true);
  const [isLoading, setIsLoading] = useState(false);
  const [link, setLink] = useState<PasswordResetLink | null>(null);
  const { t } = useI18n();

  const close = (next: boolean) => {
    if (!next) setLink(null);
    onOpenChange(next);
  };

  const sendResetLink = async () => {
    setIsLoading(true);
    notify({
      title: t("passwordReset.sendingTitle"),
      description: t("passwordReset.sendingDescription", {
        email: user.email ?? "",
      }),
      promise: request
        .post({}, `/${user.id}/password-reset`)
        .then((response) => setLink(response))
        .finally(() => setIsLoading(false)),
      loadingMessage: t("passwordReset.sending"),
    });
  };

  return (
    <Modal open={open} onOpenChange={close}>
      <ModalContent
        maxWidthClass={"max-w-xl"}
        className={"mt-20"}
        showClose={true}
      >
        <div className={"pb-6 px-8"}>
          <div className={"flex flex-col items-center justify-center gap-3"}>
            <div>
              <h2 className={"text-2xl text-center mb-2"}>
                {link
                  ? t("passwordReset.createdTitle")
                  : t("passwordReset.title")}
              </h2>
              <Paragraph className={"mt-0 text-sm text-center"}>
                {link
                  ? t("passwordReset.createdDescription", {
                      email: link.email,
                    })
                  : t("passwordReset.description", {
                      email: user.email ?? "",
                    })}
              </Paragraph>
            </div>
          </div>
        </div>

        {link ? (
          <>
            <div className={"px-8 pb-6"}>
              {link.email_sent ? (
                <Paragraph
                  className={"!mt-0 mb-3 text-xs text-nb-gray-400 text-center"}
                >
                  {t("passwordReset.emailSent")}
                </Paragraph>
              ) : (
                <Paragraph
                  className={"!mt-0 mb-3 text-xs text-amber-700 dark:text-amber-500 text-center"}
                >
                  {t("passwordReset.emailFailed")}
                  {link.email_error ? ` (${link.email_error})` : ""}
                </Paragraph>
              )}
              <Code message={t("passwordReset.linkCopied")} codeToCopy={link.url}>
                <span className="break-all whitespace-normal block">
                  {link.url}
                </span>
              </Code>
              <Paragraph
                className={"mt-3 text-xs text-nb-gray-400 text-center"}
              >
                {t("passwordReset.expiresOn")}{" "}
                {new Date(link.expires_at).toLocaleString()}
              </Paragraph>
            </div>
            <ModalFooter className={"items-center"}>
              <Button
                variant={"secondary"}
                className={"w-full"}
                onClick={() => close(false)}
              >
                {t("passwordReset.close")}
              </Button>
            </ModalFooter>
          </>
        ) : (
          <ModalFooter className={"items-center"}>
            <Button
              variant={"primary"}
              className={"w-full"}
              disabled={isLoading}
              onClick={sendResetLink}
            >
              <MailIcon size={14} />
              {t("passwordReset.send")}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};
