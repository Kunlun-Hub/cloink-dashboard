import Button from "@components/Button";
import { notify } from "@components/Notification";
import { SkeletonIntegration } from "@components/skeletons/SkeletonIntegration";
import { cn } from "@utils/helpers";
import { Settings } from "lucide-react";
import * as React from "react";
import { useMemo, useState } from "react";
import integrationImage from "@/assets/integrations/okta.png";
import { usePermissions } from "@/contexts/PermissionsProvider";
import {
  DomainValidationStatus,
  EnterpriseConnection,
} from "@/interfaces/IdentityProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { IntegrationCard } from "@/modules/integrations/IntegrationCard";
import { OktaSsoSettings } from "@/modules/integrations/sso/okta/OktaSSOSettings";
import OktaSSOSetup from "@/modules/integrations/sso/okta/OktaSSOSetup";
import { useEnterpriseConnections } from "@/modules/integrations/sso/useEnterpriseConnections";

export const OktaSSOIntegrationCard = () => {
  const [setupModal, setSetupModal] = useState(false);
  const { oktaConnection, isDataLoading, toggleConnection, mutate, error } =
    useEnterpriseConnections();
  const { permission } = usePermissions();
  const { t } = useI18n();

  const handleToggleConnection = () => {
    if (!oktaConnection) return;
    notify({
      title: t("okta.notifyTitle"),
      description: oktaConnection?.enabled
        ? t("okta.disabledDescription")
        : t("okta.enabledDescription"),
      promise: toggleConnection(oktaConnection.id).then(() => {
        mutate();
      }),
      loadingMessage: t("idpSync.updatingIntegration"),
    });
  };

  return isDataLoading ? (
    <SkeletonIntegration loadingHeight={197} />
  ) : (
    <>
      <IntegrationCard
        name="Okta"
        description={t("okta.description")}
        data={oktaConnection}
        url={{
          title: "okta.com",
          href: "https://www.okta.com/",
        }}
        disabled={error || (oktaConnection?.enabled ? !permission.idp.update : !permission.idp.create)}
        switchState={oktaConnection?.enabled || false}
        onEnabledChange={() => {
          if (!oktaConnection) setSetupModal(true);
          else handleToggleConnection();
        }}
        image={integrationImage}
        onSetup={() => setSetupModal(true)}
      >
        {oktaConnection && <ConfigurationContent connection={oktaConnection} />}
      </IntegrationCard>

      <OktaSSOSetup open={setupModal} onOpenChange={setSetupModal} />
    </>
  );
};

type ConfigurationProps = {
  connection: EnterpriseConnection;
};
const ConfigurationContent = ({ connection }: ConfigurationProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const hasSomePendingDomains = useMemo(() => {
    return connection?.domains?.some(
      (domain) => domain.validation_status === DomainValidationStatus.PENDING,
    );
  }, [connection]);

  const hasSomeFailedDomains = useMemo(() => {
    return connection?.domains?.some(
      (domain) => domain.validation_status === DomainValidationStatus.FAILED,
    );
  }, [connection]);

  const hasSomeVerifiedDomains = useMemo(() => {
    return connection?.domains?.some(
      (domain) => domain.validation_status === DomainValidationStatus.VERIFIED,
    );
  }, [connection]);

  return (
    <div className={"flex gap-2 justify-between"}>
      {connection.enabled ? (
        <div
          className={
            "text-sm flex gap-2 items-center text-nb-gray-300 font-medium"
          }
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",

              hasSomeVerifiedDomains
                ? "bg-green-400"
                : hasSomePendingDomains
                ? "bg-yellow-400"
                : hasSomeFailedDomains
                ? "bg-red-500"
                : "bg-nb-gray-300",
            )}
          ></span>
          {hasSomeVerifiedDomains
            ? t("common.active")
            : hasSomePendingDomains
              ? t("reverseProxy.pendingVerification")
              : hasSomeFailedDomains
                ? t("sso.failedVerification")
                : t("common.inactive")}
        </div>
      ) : (
        <div
          className={
            "text-sm flex gap-2 items-center text-nb-gray-400 font-medium"
          }
        >
          <span className={cn("h-2 w-2 rounded-full bg-nb-gray-600")}></span>
          {t("common.inactive")}
        </div>
      )}
      <Button
        variant={"secondary"}
        size={"xs"}
        className={"items-center"}
        onClick={() => setOpen(true)}
      >
        <Settings size={14} />
        {t("common.settings")}
      </Button>
      {open && (
        <OktaSsoSettings
          config={connection}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </div>
  );
};
