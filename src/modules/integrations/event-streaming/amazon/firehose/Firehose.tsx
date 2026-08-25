import { notify } from "@components/Notification";
import { SkeletonIntegration } from "@components/skeletons/SkeletonIntegration";
import useFetchApi, { useApiCall } from "@utils/api";
import * as React from "react";
import { useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/firehose.png";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useIsLicensed } from "@/hooks/useIsLicensed";
import { EventStream } from "@/interfaces/EventStream";
import FirehoseSetup from "@/modules/integrations/event-streaming/amazon/firehose/FirehoseSetup";
import { IntegrationCard } from "@/modules/integrations/IntegrationCard";
import { useI18n } from "@/i18n/I18nProvider";

export default function Firehose() {
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

  const firehoseSettings = eventStreamIntegrations?.find(
    (integration) => integration.platform === "firehose",
  );

  const isOtherIntegrationEnabled = eventStreamIntegrations?.some(
    (integration) => integration.enabled && integration.platform !== "firehose",
  );

  const integrationRequest = useApiCall<EventStream>(
    "/integrations/event-streaming",
  );

  const [setupModal, setSetupModal] = useState(false);
  const { confirm } = useDialog();

  const toggleSwitch = async () => {
    if (!firehoseSettings) return setSetupModal(true);

    const choice = await confirm({
      title: t("firehose.disconnectTitle"),
      description: t("firehose.disconnectDescription"),
      confirmText: t("common.disconnect"),
      cancelText: t("common.cancel"),
      type: "warning",
    });
    if (!choice) return;

    notify({
      title: t("firehose.notifyTitle"),
      description: t("firehose.disconnectedDescription"),
      promise: integrationRequest
        .del({}, "/" + firehoseSettings.id)
        .then(() => {
          mutate("/integrations/event-streaming");
        }),
      loadingMessage: t("firehose.disconnecting"),
    });
  };

  return isLoading ? (
    <SkeletonIntegration />
  ) : (
    <>
      <IntegrationCard
        name="Amazon Data Firehose"
        description={t("firehose.cardDescription")}
        url={{
          title: "aws.amazon.com/firehose",
          href: "https://aws.amazon.com/firehose",
        }}
        image={integrationImage}
        data={firehoseSettings}
        switchState={!firehoseSettings ? false : firehoseSettings.enabled}
        disabled={
          firehoseSettings?.enabled
            ? !permission.event_streaming.update
            : isOtherIntegrationEnabled || !permission.event_streaming.create
        }
        onEnabledChange={toggleSwitch}
        onSetup={() => setSetupModal(true)}
      ></IntegrationCard>
      <FirehoseSetup open={setupModal} onOpenChange={setSetupModal} />
    </>
  );
}
