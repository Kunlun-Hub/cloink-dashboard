"use client";

import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { VerticalTabs } from "@components/VerticalTabs";
import {
  FileText,
  FingerprintIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import { useAccount } from "@/modules/account/useAccount";
import EDRTab from "@/modules/integrations/edr/EDRTab";
import EventStreamingTab from "@/modules/integrations/event-streaming/EventStreamingTab";
import IdentityProviderTab from "@/modules/integrations/idp-sync/IdentityProviderTab";
import SSOTab from "@/modules/integrations/sso/SSOTab";
import { isNetBirdCloud } from "@utils/netbird";

export default function Integrations() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const [tab, setTab] = useState(currentTab || "identity-provider");
  const account = useAccount();
  const { permission } = usePermissions();
  const { t } = useI18n();

  return (
    <PageContainer>
      <VerticalTabs value={tab} onChange={setTab}>
        <VerticalTabs.List>
          <VerticalTabs.Trigger value="identity-provider">
            <FingerprintIcon size={14} />
            {t("idpSync.title")}
          </VerticalTabs.Trigger>

          {isNetBirdCloud() && (
            <VerticalTabs.Trigger value="sso">
              <KeyRoundIcon size={14} />
              {t("sso.title")}
            </VerticalTabs.Trigger>
          )}

          <VerticalTabs.Trigger value="event-streaming">
            <FileText size={14} />
            {t("eventStreaming.title")}
          </VerticalTabs.Trigger>
          <VerticalTabs.Trigger value="edr">
            <ShieldCheckIcon size={15} />
            {t("edr.title")}
          </VerticalTabs.Trigger>
        </VerticalTabs.List>
        <RestrictedAccess
          page={t("nav.integrations")}
          hasAccess={
            permission?.edr?.read ||
            permission?.idp?.read ||
            permission?.event_streaming?.read ||
            (!isNetBirdCloud() && (permission?.settings?.read ?? false))
          }
        >
          <div className={"border-l border-nb-gray-930 w-full"}>
            <IdentityProviderTab />
            <SSOTab />
            <EventStreamingTab />
            {account && <EDRTab account={account} />}
          </div>
        </RestrictedAccess>
      </VerticalTabs>
    </PageContainer>
  );
}
