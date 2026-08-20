import { notify } from "@components/Notification";
import { SkeletonIntegration } from "@components/skeletons/SkeletonIntegration";
import useFetchApi, { useApiCall } from "@utils/api";
import * as React from "react";
import { useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/datadog.png";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useIsLicensed } from "@/hooks/useIsLicensed";
import { EventStream } from "@/interfaces/EventStream";
import DatadogSetup from "@/modules/integrations/event-streaming/datadog/DatadogSetup";
import { IntegrationCard } from "@/modules/integrations/IntegrationCard";
import { useI18n } from "@/i18n/I18nProvider";

export default function Datadog() {
  const { permission } = usePermissions();
  const { t } = useI18n();
  // Event Streaming is a licensed feature; skip the call on open-source.
  const { isLicensed } = useIsLicensed();

  const { mutate } = useSWRConfig();
  const { data: eventStreamIntegrations, isLoading } = useFetchApi<
    EventStream[]
  >(
    "/integrations/event-streaming",
    false,
    false,
    permission.event_streaming.read && isLicensed,
  );

  const dataDogSettings = eventStreamIntegrations?.find(
    (integration) => integration.platform === "datadog",
  );

  const isOtherIntegrationEnabled = eventStreamIntegrations?.some(
    (integration) => integration.enabled && integration.platform !== "datadog",
  );

  const integrationRequest = useApiCall<EventStream>(
    "/integrations/event-streaming",
  );

  const [setupModal, setSetupModal] = useState(false);
  const { confirm } = useDialog();

  const toggleSwitch = async () => {
    if (!dataDogSettings) return setSetupModal(true);

    const choice = await confirm({
      title: t("datadog.disconnectTitle"),
      description: t("datadog.disconnectDescription"),
      confirmText: "Disconnect",
      cancelText: t("common.cancel"),
      type: "warning",
    });
    if (!choice) return;

    notify({
      title: t("datadog.notifyTitle"),
      description: t("datadog.disconnectedDescription"),
      promise: integrationRequest.del({}, "/" + dataDogSettings.id).then(() => {
        mutate("/integrations/event-streaming");
      }),
      loadingMessage: t("datadog.disconnecting"),
    });
  };

  return isLoading ? (
    <SkeletonIntegration />
  ) : (
    <>
      <IntegrationCard
        name="Datadog"
        description={t("datadog.cardDescription")}
        url={{
          title: "datadoghq.com",
          href: "https://www.datadoghq.com/",
        }}
        image={integrationImage}
        data={dataDogSettings}
        switchState={!dataDogSettings ? false : dataDogSettings.enabled}
        disabled={
          dataDogSettings?.enabled
            ? !permission.event_streaming.update
            : isOtherIntegrationEnabled || !permission.event_streaming.create
        }
        onEnabledChange={toggleSwitch}
        onSetup={() => setSetupModal(true)}
      ></IntegrationCard>
      <DatadogSetup open={setupModal} onOpenChange={setSetupModal} />
    </>
  );
}
