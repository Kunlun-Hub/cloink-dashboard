import Button from "@components/Button";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Label } from "@components/Label";
import { notify } from "@components/Notification";
import { PeerGroupSelector } from "@components/PeerGroupSelector";
import { useHasChanges } from "@hooks/useHasChanges";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import {
  ArrowLeftRightIcon,
  ExternalLinkIcon,
  FlaskConicalIcon,
} from "lucide-react";
import * as React from "react";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { useGroups } from "@/contexts/GroupsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { Account } from "@/interfaces/Account";
import useGroupHelper from "@/modules/groups/useGroupHelper";

type Props = {
  account: Account;
};

export const TRAFFIC_EVENTS_DOC_LINK =
  "https://docs.netbird.io/how-to/traffic-events-logging";

export const TrafficEventSetting = ({ account }: Props) => {
  const { permission } = usePermissions();
  const { groups } = useGroups();
  const { mutate } = useSWRConfig();
  const { confirm } = useDialog();
  const { t } = useI18n();
  const saveRequest = useApiCall<Account>("/accounts/" + account.id);

  const [trafficEventsEnabled, setTrafficEventsEnabled] = useState(
    account.settings?.extra?.network_traffic_logs_enabled ?? false,
  );

  const [trafficPacketCounterEnabled, setTrafficPacketCounterEnabled] =
    useState(
      account.settings?.extra?.network_traffic_packet_counter_enabled ?? false,
    );

  const toggleTrafficEvents = async (toggle: boolean) => {
    if (!toggle) {
      setTrafficPacketCounterEnabled(false);
    }
    notify({
      title: t("trafficEventSetting.notifyTitle"),
      description: toggle
        ? t("trafficEventSetting.enabledSuccess")
        : t("trafficEventSetting.disabledSuccess"),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            extra: {
              ...account.settings?.extra,
              network_traffic_logs_enabled: toggle,
              network_traffic_packet_counter_enabled: !toggle
                ? false
                : trafficPacketCounterEnabled,
            },
          },
        })
        .then(() => {
          setTrafficEventsEnabled(toggle);
          mutate("/accounts");
        }),
      loadingMessage: t("trafficEventSetting.updating"),
    });
  };

  const toggleTrafficPacketCounter = async (toggle: boolean) => {
    let choice = false;
    if (toggle) {
      choice = await confirm({
        title: t("trafficEventSetting.confirmTitle"),
        description: t("trafficEventSetting.confirmDescription"),
        confirmText: t("common.enable"),
        cancelText: t("common.cancel"),
        type: "default",
      });
      if (!choice) return;
    }

    notify({
      title: t("trafficEventSetting.reportingNotifyTitle"),
      description: toggle
        ? t("trafficEventSetting.reportingEnabledSuccess")
        : t("trafficEventSetting.reportingDisabledSuccess"),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            extra: {
              ...account.settings?.extra,
              network_traffic_packet_counter_enabled: toggle,
            },
          },
        })
        .then(() => {
          setTrafficPacketCounterEnabled(toggle);
          mutate("/accounts");
        }),
      loadingMessage: t("trafficEventSetting.updatingReporting"),
    });
  };

  return (
    <>
      <div className={"mt-4"}>
        <h2 className={"text-lg font-medium"}>
          {t("trafficEventSetting.experimental")}
          <FlaskConicalIcon
            size={16}
            className={"inline ml-1.5 relative -top-[2px]"}
          />
        </h2>
        <div className={"text-sm text-gray-400"}>
          {t("trafficEventSetting.experimentalDescription")}{" "}
          <InlineLink href={TRAFFIC_EVENTS_DOC_LINK} target={"_blank"}>
            {t("common.learnMore")}
            <ExternalLinkIcon size={12} />
          </InlineLink>
        </div>
      </div>
      <div className={"relative"}>
        <div className={"flex flex-col relative mb-4"}>
          <FancyToggleSwitch
            value={trafficEventsEnabled}
            onChange={toggleTrafficEvents}
            data-testid="traffic-events"
            label={
              <>
                <ArrowLeftRightIcon size={15} />
                {t("trafficEventSetting.enableTrafficEvents")}
              </>
            }
            helpText={
              <>
                {t("trafficEventSetting.enableTrafficEventsHelp")}
              </>
            }
            disabled={!permission.settings.update}
          />

          <div
            className={cn(
              "border border-nb-gray-900 border-t-0 rounded-b-md bg-nb-gray-940 px-[1.28rem] pt-3 pb-5 flex flex-col gap-4 mx-[0.25rem]",
              !trafficEventsEnabled
                ? "opacity-50 pointer-events-none"
                : "bg-nb-gray-930/80",
            )}
          >
            <FancyToggleSwitch
              variant={"blank"}
              className={"mt-2"}
              value={trafficPacketCounterEnabled}
              onChange={toggleTrafficPacketCounter}
              data-testid="traffic-reporting-kernel"
              label={<>{t("trafficEventSetting.enableTrafficReporting")}</>}
              helpText={
                <>
                  {t("trafficEventSetting.enableTrafficReportingHelp")}
                </>
              }
              disabled={!permission.settings.update}
            />
            <div className={"mt-2"}>
              <Label>{t("trafficEventSetting.limitToGroups")}</Label>
              <HelpText className={"mb-3"}>
                {t("trafficEventSetting.limitToGroupsHelp")}
              </HelpText>
              {!groups ? (
                <Skeleton height={46} />
              ) : (
                <TrafficEventGroupsSetting account={account} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

type TrafficEventGroupsSettingProps = {
  account: Account;
};

export const TrafficEventGroupsSetting = ({
  account,
}: TrafficEventGroupsSettingProps) => {
  const saveRequest = useApiCall<Account>("/accounts/" + account.id);
  const { mutate } = useSWRConfig();
  const { t } = useI18n();

  const [trafficGroups, setTrafficGroups, { save: saveGroups }] =
    useGroupHelper({
      initial: account.settings?.extra?.network_traffic_logs_groups,
    });

  const { hasChanges, updateRef } = useHasChanges([trafficGroups]);

  const saveTrafficGroups = async () => {
    const groups = await saveGroups();
    const groupIds = groups.map((group) => group.id) as string[];

    notify({
      title: t("trafficEventSetting.groupsNotifyTitle"),
      description: t("trafficEventSetting.groupsUpdatedSuccess"),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            extra: {
              ...account.settings?.extra,
              network_traffic_logs_groups: groupIds || [],
            },
          },
        })
        .then(() => {
          setTrafficGroups(groups);
          updateRef([groups]);
          mutate("/accounts");
        }),
      loadingMessage: t("trafficEventSetting.updatingGroups"),
    });
  };

  return (
    <div className={"flex gap-4 items-end justify-end"}>
      <PeerGroupSelector
        onChange={setTrafficGroups}
        values={trafficGroups}
        hideAllGroup={true}
        showResources={false}
        showResourceCounter={false}
        placeholderForSearch={t("trafficEventSetting.searchPlaceholder")}
        data-testid="traffic-events-groups-selector"
      />
      <Button
        variant={"input"}
        className={"h-[45px]"}
        disabled={!hasChanges}
        onClick={saveTrafficGroups}
        data-testid="save-traffic-groups"
      >
        {t("trafficEventSetting.saveGroups")}
      </Button>
    </div>
  );
};
