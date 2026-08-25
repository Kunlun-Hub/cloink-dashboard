import * as React from "react";
import { Label } from "@components/Label";
import PeerIcon from "@/assets/icons/PeerIcon";
import Card from "@components/Card";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import TeamIcon from "@/assets/icons/TeamIcon";
import IntegrationIcon from "@/assets/icons/IntegrationIcon";
import { NotificationEventType } from "@/interfaces/NotificationChannel";
import { useI18n } from "@/i18n/I18nProvider";

type EventTypeMeta = {
  key: NotificationEventType;
  label: string;
  helpText: string;
  group: "peer" | "user" | "integration";
};

const getEventTypeMetadata = (t: (key: string) => string): EventTypeMeta[] => [
  {
    key: NotificationEventType.PeerPendingApproval,
    label: t("notifications.pendingApproval"),
    helpText: t("notifications.peerPendingApprovalHelp"),
    group: "peer",
  },
  {
    key: NotificationEventType.PeerAdd,
    label: t("notifications.peerAdded"),
    helpText: t("notifications.peerAddedHelp"),
    group: "peer",
  },
  {
    key: NotificationEventType.RoutingPeerDisconnect,
    label: t("notifications.routingPeerDisconnected"),
    helpText: t("notifications.routingPeerDisconnectedHelp"),
    group: "peer",
  },
  {
    key: NotificationEventType.RoutingPeerDelete,
    label: t("notifications.routingPeerDeleted"),
    helpText: t("notifications.routingPeerDeletedHelp"),
    group: "peer",
  },
  {
    key: NotificationEventType.UserPendingApproval,
    label: t("notifications.userPendingApproval"),
    helpText: t("notifications.userPendingApprovalHelp"),
    group: "user",
  },
  {
    key: NotificationEventType.UserJoin,
    label: t("notifications.userJoined"),
    helpText: t("notifications.userJoinedHelp"),
    group: "user",
  },
  {
    key: NotificationEventType.ServiceUserCreate,
    label: t("notifications.serviceUserCreated"),
    helpText: t("notifications.serviceUserCreatedHelp"),
    group: "user",
  },
  {
    key: NotificationEventType.IdpSyncTokenExpire,
    label: t("notifications.idpSyncTokenExpired"),
    helpText: t("notifications.idpSyncTokenExpiredHelp"),
    group: "integration",
  },
  {
    key: NotificationEventType.EdrSyncTokenExpire,
    label: t("notifications.edrSyncTokenExpired"),
    helpText: t("notifications.edrSyncTokenExpiredHelp"),
    group: "integration",
  },
];

const getGroupConfig = (t: (key: string) => string) => ({
  peer: {
    label: t("notifications.peerNotifications"),
    icon: <PeerIcon size={12} />,
  },
  user: {
    label: t("notifications.userNotifications"),
    icon: <TeamIcon size={12} />,
  },
  integration: {
    label: t("notifications.integrationNotifications"),
    icon: <IntegrationIcon size={12} />,
  },
} as const);

const GROUPS: Array<"peer" | "user" | "integration"> = [
  "peer",
  "user",
  "integration",
];

type Props = {
  event_types: NotificationEventType[];
  onToggle: (type: NotificationEventType) => void;
  disabled?: boolean;
};

export const NotificationEventTypes = ({ event_types, onToggle, disabled }: Props) => {
  const { t } = useI18n();
  const eventTypeMetadata = getEventTypeMetadata(t);
  const groupConfig = getGroupConfig(t);
  return (
    <>
      {GROUPS.map((group) => {
        const config = groupConfig[group];
        const types = eventTypeMetadata.filter((t) => t.group === group);
        return (
          <div key={group} className={"flex flex-col gap-2 relative w-full"}>
            <Label>
              {config.icon}
              {config.label}
            </Label>
            <Card
              className={
                "w-full flex flex-col border-nb-gray-910 bg-nb-gray-935"
              }
            >
              {types.map((type, index) => (
                <React.Fragment key={type.key}>
                  {index > 0 && <Separator />}
                  <FancyToggleSwitch
                    value={event_types.includes(type.key)}
                    onChange={() => onToggle(type.key)}
                    disabled={disabled}
                    data-testid={`notification-event-${type.key}`}
                    label={type.label}
                    helpText={type.helpText}
                    variant={"blank"}
                    className={
                      "px-5 py-4 hover:bg-nb-gray-930 transition-colors duration-150"
                    }
                    textWrapperClassName={""}
                  />
                </React.Fragment>
              ))}
            </Card>
          </div>
        );
      })}
    </>
  );
};

const Separator = () => (
  <span className={"h-px w-full block bg-nb-gray-920"}></span>
);
