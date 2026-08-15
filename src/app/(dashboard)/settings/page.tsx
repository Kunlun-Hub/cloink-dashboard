"use client";

import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { VerticalTabs } from "@components/VerticalTabs";
import {
  AlertOctagonIcon,
  ChartNoAxesCombined,
  FingerprintIcon,
  FolderGit2Icon,
  KeyRound,
  LockIcon,
  MonitorSmartphoneIcon,
  NetworkIcon,
  ShieldIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { useMSP } from "@/cloud/msp/contexts/MSPProvider";
import {
  CloudSettingsTabContent,
  CloudSettingsTabTrigger,
} from "@/cloud/settings/CloudSettings";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSelector } from "@/i18n/LanguageSelector";
import PageContainer from "@/layouts/PageContainer";
import { useAccount } from "@/modules/account/useAccount";
import AuthenticationTab from "@/modules/settings/AuthenticationTab";
import ClientSettingsTab from "@/modules/settings/ClientSettingsTab";
import DangerZoneTab from "@/modules/settings/DangerZoneTab";
import GroupsSettings from "@/modules/settings/GroupsSettings";
import IdentityProvidersTab from "@/modules/settings/IdentityProvidersTab";
import MetricsTab from "@/modules/settings/MetricsTab";
import NetworkSettingsTab from "@/modules/settings/NetworkSettingsTab";
import PermissionsTab from "@/modules/settings/PermissionsTab";
import SetupKeysTab from "@/modules/settings/SetupKeysTab";

export default function NetBirdSettings() {
  const queryParams = useSearchParams();
  const queryTab = queryParams.get("tab");
  const { permission } = usePermissions();
  const { t } = useI18n();

  const initialTab = useMemo(() => {
    if (permission?.settings?.read) return "authentication";
    if (permission?.billing?.update) return "plans-and-billing";
    return "authentication";
  }, [permission]);

  const [tab, setTab] = useState(queryTab ?? initialTab);

  const account = useAccount();

  useEffect(() => {
    if (queryTab) {
      setTab(queryTab);
    }
  }, [queryTab]);

  return (
    <PageContainer>
      <div className="mb-4 flex justify-end">
        <LanguageSelector />
      </div>
      <VerticalTabs value={tab} onChange={setTab}>
        <VerticalTabs.List>
          {permission.settings.read && (
            <>
              <VerticalTabs.Trigger
                value="authentication"
                data-testid="settings-tab-authentication"
              >
                <ShieldIcon size={14} />
                {t("settings.authentication")}
              </VerticalTabs.Trigger>
              {permission.setup_keys.read && (
                <VerticalTabs.Trigger value="setup-keys">
                  <KeyRound size={14} />
                  {t("settings.setupKeys")}
                </VerticalTabs.Trigger>
              )}
              {account?.settings?.embedded_idp_enabled &&
                permission?.identity_providers?.read && (
                  <VerticalTabs.Trigger value="identity-providers">
                    <FingerprintIcon size={14} />
                    {t("settings.identityProviders")}
                  </VerticalTabs.Trigger>
                )}
              <VerticalTabs.Trigger
                value="groups"
                data-testid="settings-tab-groups"
              >
                <FolderGit2Icon size={14} />
                {t("settings.groups")}
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger
                value="permissions"
                data-testid="settings-tab-permissions"
              >
                <LockIcon size={14} />
                {t("settings.permissions")}
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger
                value="networks"
                data-testid="settings-tab-networks"
              >
                <NetworkIcon size={14} />
                {t("settings.networks")}
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger
                value="clients"
                data-testid="settings-tab-clients"
              >
                <MonitorSmartphoneIcon size={14} />
                {t("settings.clients")}
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger value="metrics">
                <ChartNoAxesCombined size={14} />
                {t("settings.metrics")}
              </VerticalTabs.Trigger>
            </>
          )}
          <CloudSettingsTabTrigger />
          <DangerZoneTabTrigger />
        </VerticalTabs.List>
        <RestrictedAccess
          page={"Settings"}
          hasAccess={permission?.billing?.read || permission?.settings?.read}
        >
          <div className={"border-l border-nb-gray-930 w-full"}>
            {account && <AuthenticationTab account={account} />}
            {permission.setup_keys.read && <SetupKeysTab />}
            {account?.settings?.embedded_idp_enabled &&
              permission?.identity_providers?.read && <IdentityProvidersTab />}
            {account && <PermissionsTab account={account} />}
            {account && <GroupsSettings account={account} />}
            {account && <NetworkSettingsTab account={account} />}
            {account && <ClientSettingsTab account={account} />}
            {account && <MetricsTab account={account} />}
            {account && <DangerZoneTab account={account} />}
            <CloudSettingsTabContent />
          </div>
        </RestrictedAccess>
      </VerticalTabs>
    </PageContainer>
  );
}

const DangerZoneTabTrigger = () => {
  const { isOwner } = useLoggedInUser();
  const { t } = useI18n();

  const { isAccountWithMSPParent } = useMSP();
  if (isAccountWithMSPParent) return;

  return (
    isOwner && (
      <VerticalTabs.Trigger value="danger-zone" disabled={!isOwner}>
        <AlertOctagonIcon size={14} />
        {t("settings.dangerZone")}
      </VerticalTabs.Trigger>
    )
  );
};
