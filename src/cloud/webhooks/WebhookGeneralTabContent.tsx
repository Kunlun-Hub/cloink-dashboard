import React from "react";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { TabsContent } from "@components/Tabs";
import { GlobeIcon } from "lucide-react";
import { AuthenticationSettings } from "@/cloud/webhooks/WebhookAuthenticationSettings";
import { WebhookConfig } from "@/cloud/webhooks/useWebhookConfig";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  value: WebhookConfig;
  urlHelpText?: string;
  mask?: boolean;
};

export function WebhookGeneralTabContent({
  value,
  urlHelpText,
  mask,
}: Readonly<Props>) {
  const { t } = useI18n();
  const resolvedUrlHelpText = urlHelpText ?? t("webhook.urlHelpText");
  return (
    <TabsContent value={"general"} className={"px-8 text-sm"}>
      <div className={"mb-6"}>
        <Label>
          {value.isEditing ? t("webhook.endpointUrl") : t("webhook.enterEndpointUrl")}
        </Label>
        <HelpText>{resolvedUrlHelpText}</HelpText>
        <Input
          customPrefix={<GlobeIcon size={16} />}
          placeholder="https://api.example.com/webhook"
          maxWidthClass="w-full"
          value={value.url}
          error={value.urlError}
          onChange={(e) => value.setUrl(e.target.value)}
          data-testid="webhook-url-input"
        />
      </div>

      <Label>{t("webhook.authentication")}</Label>
      <HelpText>
        {t("webhook.authenticationHelp")}
      </HelpText>
      <AuthenticationSettings value={value} mask={mask} />
    </TabsContent>
  );
}
