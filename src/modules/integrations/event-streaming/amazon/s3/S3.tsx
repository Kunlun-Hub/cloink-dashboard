import { notify } from "@components/Notification";
import { SkeletonIntegration } from "@components/skeletons/SkeletonIntegration";
import useFetchApi, { useApiCall } from "@utils/api";
import * as React from "react";
import { useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/s3.svg";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useIsLicensed } from "@/hooks/useIsLicensed";
import { EventStream } from "@/interfaces/EventStream";
import S3Setup from "@/modules/integrations/event-streaming/amazon/s3/S3Setup";
import { IntegrationCard } from "@/modules/integrations/IntegrationCard";
import { useI18n } from "@/i18n/I18nProvider";

export default function S3() {
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

  const s3Settings = eventStreamIntegrations?.find(
    (integration) => integration.platform === "s3",
  );

  const isOtherIntegrationEnabled = eventStreamIntegrations?.some(
    (integration) => integration.enabled && integration.platform !== "s3",
  );

  const integrationRequest = useApiCall<EventStream>(
    "/integrations/event-streaming",
  );

  const [setupModal, setSetupModal] = useState(false);
  const { confirm } = useDialog();

  const toggleSwitch = async () => {
    if (!s3Settings) return setSetupModal(true);

    const choice = await confirm({
      title: t("s3.disconnectTitle"),
      description: t("s3.disconnectDescription"),
      confirmText: t("common.disconnect"),
      cancelText: t("common.cancel"),
      type: "warning",
    });
    if (!choice) return;

    notify({
      title: t("s3.notifyTitle"),
      description: t("s3.disconnectedDescription"),
      promise: integrationRequest.del({}, "/" + s3Settings.id).then(() => {
        mutate("/integrations/event-streaming");
      }),
      loadingMessage: t("s3.disconnecting"),
    });
  };

  return isLoading ? (
    <SkeletonIntegration />
  ) : (
    <>
      <IntegrationCard
        name="Amazon S3"
        description={t("s3.cardDescription")}
        url={{
          title: "aws.amazon.com/s3",
          href: "https://aws.amazon.com/s3",
        }}
        image={integrationImage}
        data={s3Settings}
        switchState={!s3Settings ? false : s3Settings.enabled}
        disabled={
          s3Settings?.enabled
            ? !permission.event_streaming.update
            : isOtherIntegrationEnabled || !permission.event_streaming.create
        }
        onEnabledChange={toggleSwitch}
        onSetup={() => setSetupModal(true)}
      ></IntegrationCard>
      <S3Setup open={setupModal} onOpenChange={setSetupModal} />
    </>
  );
}
