import Badge from "@components/Badge";
import Button from "@components/Button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@components/HoverCard";
import { ListItem } from "@components/ListItem";
import GroupBadge from "@components/ui/GroupBadge";
import { UserCountStack } from "@components/ui/MultipleGroups";
import {
  ArrowRightIcon,
  Binary,
  CircleUser,
  FileCode2Icon,
  HelpCircle,
  LockKeyhole,
  LockOpenIcon,
  LucideIcon,
  RectangleEllipsis,
  Settings,
  Users,
} from "lucide-react";
import * as React from "react";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useReverseProxies } from "@/contexts/ReverseProxiesProvider";
import { Group } from "@/interfaces/Group";
import { isL4Mode, ReverseProxy } from "@/interfaces/ReverseProxy";
import FullTooltip from "@components/FullTooltip";
import { useI18n } from "@/i18n/I18nProvider";

type AuthMethodDef = {
  key: "password_auth" | "pin_auth" | "bearer_auth";
  labelKey: "reverseProxy.authPassword" | "reverseProxy.authPin" | "reverseProxy.authMethodSso";
  hoverLabelKey: "reverseProxy.authHoverPassword" | "reverseProxy.authHoverPinCode" | "reverseProxy.authHoverSso";
  Icon: LucideIcon;
};

const AUTH_METHODS: AuthMethodDef[] = [
  {
    key: "password_auth",
    labelKey: "reverseProxy.authPassword",
    hoverLabelKey: "reverseProxy.authHoverPassword",
    Icon: RectangleEllipsis,
  },
  { key: "pin_auth", labelKey: "reverseProxy.authPin", hoverLabelKey: "reverseProxy.authHoverPinCode", Icon: Binary },
  {
    key: "bearer_auth",
    labelKey: "reverseProxy.authMethodSso",
    hoverLabelKey: "reverseProxy.authHoverSso",
    Icon: Users,
  },
];

const HEADER_AUTH_METHOD = {
  labelKey: "reverseProxy.authHeaders" as const,
  hoverLabelKey: "reverseProxy.authHoverHttpHeaders" as const,
  Icon: FileCode2Icon,
};

const NETBIRD_ONLY_METHOD = {
  labelKey: "reverseProxy.netBirdOnlyAccess" as const,
  hoverLabelKey: "reverseProxy.authHoverNetBirdOnly" as const,
  Icon: CircleUser,
};

type Props = {
  reverseProxy: ReverseProxy;
};

export default function ReverseProxyAuthCell({
  reverseProxy,
}: Readonly<Props>) {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { openModal } = useReverseProxies();
  const { groups } = useGroups();

  if (isL4Mode(reverseProxy.mode)) {
    return (
      <div className={"flex"}>
        <FullTooltip
          content={
            <div className={"flex text-xs max-w-[340px]"}>
              {t("reverseProxy.authNotSupportedL4")}
            </div>
          }
        >
          <Badge variant={"gray"}>
            N/A
            <HelpCircle size={12} />
          </Badge>
        </FullTooltip>
      </div>
    );
  }

  const auth = reverseProxy.auth;
  const isPrivate = !!reverseProxy.private;

  const enabled = AUTH_METHODS.filter((m) => auth?.[m.key]?.enabled);
  const hasHeaderAuths = (auth?.header_auths ?? []).some((h) => h.enabled);
  const authCount =
    enabled.length + (hasHeaderAuths ? 1 : 0) + (isPrivate ? 1 : 0);

  const ssoGroups = auth?.bearer_auth?.enabled
    ? (auth.bearer_auth.distribution_groups ?? [])
        .map((groupId) => groups?.find((g) => g.id === groupId))
        .filter((g): g is Group => g != undefined)
    : [];

  const accessGroups = isPrivate
    ? (reverseProxy.access_groups ?? [])
        .map((groupId) => groups?.find((g) => g.id === groupId))
        .filter((g): g is Group => g != undefined)
    : [];

  const canConfigure = !!permission?.services?.update;

  const authBadge = (
    <Badge
      variant={"gray"}
      useHover={false}
      disabled={!canConfigure}
      className={
        "cursor-pointer !rounded-r-none !border-r-0 !h-[34px] !px-2 min-w-[50px] hover:bg-nb-gray-930 transition-all"
      }
    >
      {authCount > 0 ? (
        <LockKeyhole size={12} className="text-green-500" />
      ) : (
        <LockOpenIcon size={12} className="text-red-500" />
      )}
      <span className={"font-medium text-xs"}>{authCount}</span>
    </Badge>
  );

  const showAuthHover = authCount > 0;

  return (
    <div className={"flex"} data-auth-cell onClick={(e) => {
      e.stopPropagation();
      if (permission?.services?.update) {
        openModal({ proxy: reverseProxy, initialTab: "auth" });
      }
    }}>
      <div className={"flex items-center"}>
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild={true}>{authBadge}</HoverCardTrigger>
          {showAuthHover && (
            <HoverCardContent
              className={"p-0"}
              sideOffset={14}
              onClick={(e) => e.stopPropagation()}
            >
                <div className={"text-xs"}>
                  {enabled.map(({ key, hoverLabelKey, Icon }) => (
                    <ListItem
                      key={key}
                      className={"py-0.5"}
                      icon={<Icon size={14} />}
                      label={t(hoverLabelKey)}
                      value={
                        <div className={"text-green-500"}>
                          {key === "bearer_auth" && ssoGroups.length === 0
                            ? t("reverseProxy.allUsers")
                            : t("common.enable")}
                        </div>
                      }
                    >
                      {key === "bearer_auth" && ssoGroups.length > 0 && (
                        <div className={"flex flex-col gap-2 px-4 pt-2 pb-3"}>
                          {ssoGroups.map((group) => (
                            <div
                              key={group.id}
                              className={
                                "flex gap-2 items-center justify-between"
                              }
                            >
                              <GroupBadge group={group} />
                              <ArrowRightIcon size={14} />
                              <UserCountStack group={group} />
                            </div>
                          ))}
                        </div>
                      )}
                    </ListItem>
                  ))}
                  {hasHeaderAuths && (
                    <ListItem
                      className={"py-0.5"}
                      icon={<FileCode2Icon size={14} />}
                      label={t(HEADER_AUTH_METHOD.hoverLabelKey)}
                      value={
                        <div className={"text-green-500"}>
                          {(auth?.header_auths ?? []).filter((h) => h.enabled).length === 1
                            ? t("reverseProxy.oneHeader")
                            : t("reverseProxy.headerCount", { count: (auth?.header_auths ?? []).filter((h) => h.enabled).length })}
                        </div>
                      }
                    />
                  )}
                  {isPrivate && (
                    <ListItem
                      className={"py-0.5"}
                      icon={<CircleUser size={14} />}
                      label={t(NETBIRD_ONLY_METHOD.hoverLabelKey)}
                      value={
                        <div className={"text-green-500"}>
                          {accessGroups.length === 0
                            ? t("reverseProxy.noGroups")
                            : accessGroups.length === 1
                              ? t("reverseProxy.oneGroup")
                              : t("reverseProxy.groupCount", { count: accessGroups.length })}
                        </div>
                      }
                    >
                      {accessGroups.length > 0 && (
                        <div className={"flex flex-col gap-2 px-4 pt-2 pb-3"}>
                          {accessGroups.map((group) => (
                            <div
                              key={group.id}
                              className={
                                "flex gap-2 items-center justify-between"
                              }
                            >
                              <GroupBadge group={group} />
                              <ArrowRightIcon size={14} />
                              <UserCountStack group={group} />
                            </div>
                          ))}
                        </div>
                      )}
                    </ListItem>
                  )}
                </div>
            </HoverCardContent>
          )}
        </HoverCard>
        <Button
          size={"xs"}
          variant={"secondary"}
          className={"!rounded-l-none !px-2 !h-[34px]"}
          onClick={(e) => {
            e.stopPropagation();
            openModal({ proxy: reverseProxy, initialTab: "auth" });
          }}
          disabled={!permission?.services?.update}
          aria-label={t("reverseProxy.configureAuth")}
        >
          <Settings size={12} />
        </Button>
      </div>
    </div>
  );
}
