import Button from "@components/Button";
import { notify } from "@components/Notification";
import { SkeletonIntegration } from "@components/skeletons/SkeletonIntegration";
import { useApiCall } from "@utils/api";
import { Settings } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/intune.png";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { Account } from "@/interfaces/Account";
import { IntuneIntegration } from "@/interfaces/EDR";
import IntuneConfiguration from "@/modules/integrations/edr/intune/IntuneConfiguration";
import IntuneSetup from "@/modules/integrations/edr/intune/IntuneSetup";
import { useIntegrations } from "@/modules/integrations/edr/useIntegrations";
import { IntegrationCard } from "@/modules/integrations/IntegrationCard";
import { Group } from "@/interfaces/Group";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  account: Account;
};

export const Intune = ({ account }: Props) => {
  const { mutate } = useSWRConfig();
  const [setupModal, setSetupModal] = useState(false);
  const { permission } = usePermissions();
  const { confirm } = useDialog();
  const { t } = useI18n();

  const {
    intune: integration,
    isAnyIntegrationEnabled,
    isIntuneLoading,
  } = useIntegrations();
  const intuneRequest = useApiCall<IntuneIntegration>(
    "/integrations/edr/intune",
  );

  const [enabled, setEnabled] = useState(!!integration?.enabled);

  useEffect(() => {
    setEnabled(!!integration?.enabled);
  }, [integration]);

  const toggleSwitch = async () => {
    if (!integration?.tenant_id) return setSetupModal(true);
    const isCurrentlyEnabled = integration.enabled;

    const choice = isCurrentlyEnabled
      ? await confirm({
          title: t("intune.disableTitle"),
          description: t("intune.disableDescription"),
          confirmText: "Disable",
          cancelText: t("common.cancel"),
          type: "warning",
        })
      : true;
    if (!choice) return;

    const groups =
      integration.groups?.map((group) => (group as Group).id) || [];

    notify({
      title: t("edr.intune.notifyTitle"),
      description: isCurrentlyEnabled
        ? t("intune.disabledDescription")
        : t("intune.enabledDescription"),
      promise: intuneRequest
        .put({
          ...integration,
          groups,
          secret: undefined,
          enabled: !isCurrentlyEnabled,
        })
        .then(() => {
          mutate("/integrations/edr/intune");
        }),
      loadingMessage: t("intune.updating"),
    });
  };

  return isIntuneLoading ? (
    <SkeletonIntegration loadingHeight={196} />
  ) : (
    <>
      <IntegrationCard
        name="Intune"
        description={t("intune.cardDescription")}
        url={{
          title: "microsoft.com",
          href: "https://www.microsoft.com/en-us/security/business/endpoint-management/microsoft-intune",
        }}
        image={integrationImage}
        data={integration?.tenant_id ? integration : undefined}
        disabled={
          enabled
            ? !permission.edr.update
            : isAnyIntegrationEnabled || !permission.edr.create
        }
        switchState={enabled}
        onEnabledChange={toggleSwitch}
        onSetup={() => setSetupModal(true)}
      >
        {integration && <ConfigurationButton config={integration} />}
      </IntegrationCard>
      <IntuneSetup
        account={account}
        open={setupModal}
        onOpenChange={setSetupModal}
        onSuccess={() => setEnabled(true)}
      />
    </>
  );
};

type ConfigurationProps = {
  config: IntuneIntegration;
};
const ConfigurationButton = ({ config }: ConfigurationProps) => {
  const [configModal, setConfigModal] = useState(false);

  return (
    <>
      <div className={"flex gap-2"}>
        <Button
          variant={"secondary"}
          size={"xs"}
          className={"w-full items-center"}
          onClick={() => {
            setConfigModal(true);
          }}
        >
          <Settings size={14} />
          Settings
        </Button>
      </div>
      <IntuneConfiguration
        open={configModal}
        onOpenChange={setConfigModal}
        config={config}
      />
    </>
  );
};
