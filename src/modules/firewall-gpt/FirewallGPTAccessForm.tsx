import Button from "@components/Button";
import ButtonGroup from "@components/ButtonGroup";
import { Label } from "@components/Label";
import { ModalContent } from "@components/modal/Modal";
import Paragraph from "@components/Paragraph";
import { Textarea } from "@components/Textarea";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import useFetchApi from "@utils/api";
import { cn } from "@utils/helpers";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { useDomainCategory } from "@/cloud/cloud-hooks/useDomainCategory";
import { useAnalytics } from "@/contexts/AnalyticsProvider";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { Peer } from "@/interfaces/Peer";
import { companySizes } from "@/modules/onboarding/OnboardingSurvey";

const brevoFormUrl =
  "https://ee8d1e90.sibforms.com/serve/MUIFADhAlqzGzwhzxXojyqtHhVQkXyORiLc20F22--S_-NWZe5jr_3C6KO4KK3175j3tQjpxoClLoLq25_OpJjlATwEYcpyqD60HkJIUh3r3zErtUjF0L7ihIJqNcatEXZI7O3bPjp8gTL5GwfVnKeKyPFlBc-xrV2y_Mok5hwpKg5Hd-IfsFjCc9nIUeEQTZf3Hv2bYROOTbAdr";

type Props = {
  account_id: string;
  onSubmit: () => void;
};

export const FirewallGptAccessForm = ({ account_id, onSubmit }: Props) => {
  const { t } = useI18n();
  const { loggedInUser } = useLoggedInUser();
  const { domainCategory, isPrivate } = useDomainCategory();
  const { trackEvent } = useAnalytics();
  const { mutate } = useSWRConfig();

  const [companySize, setCompanySize] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompanySizeSelected = (size: string) => companySize === size;
  const { data: peers, isLoading: isLoadingPeers } =
    useFetchApi<Peer[]>("/peers");

  useEffect(() => {
    if (peers) {
      if (peers.length > 1000) setCompanySize("1000");
      else if (peers.length > 300) setCompanySize("300");
      else if (peers.length > 50) setCompanySize("50");
      else if (peers.length > 5) setCompanySize("5");
      else setCompanySize("5");
    }
  }, [peers]);

  const canSubmit =
    companySize != "" && message != "" && !isSubmitting && !isLoadingPeers;

  const submit = async () => {
    try {
      if (loggedInUser) {
        if (!loggedInUser.email) return;
        setIsSubmitting(true);

        // Create FormData
        const formData = new FormData();
        formData.append("EMAIL", loggedInUser.email || "");
        formData.append("ACCOUNT_ID", account_id);
        domainCategory && formData.append("DOMAIN_CATEGORY", domainCategory);
        formData.append("PLANNED_USER_AMOUNT", companySize);
        formData.append("MESSAGE", message);
        formData.append("email_address_check", "");
        formData.append("locale", "en");

        await fetch(brevoFormUrl, {
          method: "POST",
          body: formData,
          mode: "no-cors",
        })
          .then(() => {
            trackEvent(
              "Smart Firewall",
              "smart_firewall_access_form",
              "Form Submit",
            );
            mutate("/integrations/assistant/registration");
          })
          .finally(() => {
            setIsSubmitting(false);
            onSubmit();
          });
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <ModalContent
      maxWidthClass={cn("relative max-w-lg")}
      className={"z-[9999]"}
    >
      <GradientFadedBackground />
      <div className={"flex flex-col gap-6 relative z-10 px-8 z-10"}>
        <div className={"text-center"}>
          <h2 className={"text-xl my-0 leading-[1.5] text-center"}>
            {t("firewallGpt.accessForm.title")}
          </h2>
          <Paragraph className={cn("text-sm text-center mt-2")}>
            {t("firewallGpt.accessForm.description")}
          </Paragraph>
        </div>
        <div className={"flex flex-col gap-6"}>
          {!isPrivate && (
            <div className={"flex w-full flex-col gap-2"}>
              <div>
                <Label>
                  {t("firewallGpt.accessForm.companySizeLabel")}
                  <span className={"text-red-500 relative -top-[2.5px] "}>
                    *
                  </span>
                </Label>
              </div>
              <ButtonGroup>
                {companySizes.map((size) => (
                  <ButtonGroup.Button
                    key={size.value}
                    className={"w-full"}
                    onClick={() => setCompanySize(size.value)}
                    variant={
                      isCompanySizeSelected(size.value)
                        ? "tertiary"
                        : "secondary"
                    }
                  >
                    {size.label}
                  </ButtonGroup.Button>
                ))}
              </ButtonGroup>
            </div>
          )}

          <div className={"flex w-full flex-col gap-2"}>
            <div>
              <Label>
                {t("firewallGpt.accessForm.messageLabel")}
                <span className={"text-red-500 relative -top-[2.5px] "}>*</span>
              </Label>
            </div>
            <Textarea
              variant={"darker"}
              tabIndex={0}
              autoFocus={true}
              placeholder={t("firewallGpt.accessForm.messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              cols={5}
              className={"min-h-[100px]"}
            />
          </div>
        </div>
        <Button
          variant={"primary"}
          className={"w-full"}
          onClick={submit}
          disabled={!canSubmit}
        >
          {isSubmitting && (
            <Loader2 size={16} className={cn("animate-spin", "block")} />
          )}
          {t("firewallGpt.accessForm.submit")}
        </Button>
      </div>
    </ModalContent>
  );
};
