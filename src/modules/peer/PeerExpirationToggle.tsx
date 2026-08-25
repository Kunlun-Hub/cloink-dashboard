import FancyToggleSwitch, {
  FancyToggleSwitchVariants,
} from "@components/FancyToggleSwitch";
import FullTooltip from "@components/FullTooltip";
import { IconInfoCircle } from "@tabler/icons-react";
import { ArrowUpRightIcon, LockIcon } from "lucide-react";
import * as React from "react";
import { useMemo } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Peer } from "@/interfaces/Peer";
import InlineLink from "@components/InlineLink";
import { useAccount } from "@/modules/account/useAccount";

type Props = {
  peer: Peer;
  value: boolean;
  onChange: (value: boolean) => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  type?: "login-expiration" | "inactivity-expiration";
} & FancyToggleSwitchVariants;

export const PeerExpirationToggle = ({
  peer,
  value,
  onChange,
  title,
  description,
  icon,
  className,
  variant = "default",
  type = "login-expiration",
}: Props) => {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const account = useAccount();
  const resolvedTitle = title ?? t("authenticationTab.sessionExpiration");
  const resolvedDescription =
    description ?? t("peer.sessionExpirationToggleDescription");

  const noPermissionOrNoUser = !peer.user_id || !permission?.peers.update;

  const isAccountLoginExpirationDisabled =
    account && account?.settings?.peer_login_expiration_enabled === false;
  const isAccountInactivityExpirationDisabled =
    account && account?.settings?.peer_inactivity_expiration_enabled === false;

  const isGlobalSettingDisabled =
    type === "login-expiration"
      ? isAccountLoginExpirationDisabled
      : isAccountInactivityExpirationDisabled;

  const tooltipContent = useMemo(() => {
    if (noPermissionOrNoUser) {
      return (
        <div className={"flex gap-2 items-center !text-nb-gray-300 text-xs"}>
          {!peer.user_id ? (
            <>
              <IconInfoCircle size={14} />
              <span>{t("peer.settingDisabledForSetupKeyPeers")}</span>
            </>
          ) : (
            <>
              <LockIcon size={14} />
              <span>{t("peer.updateSettingPermissionDenied")}</span>
            </>
          )}
        </div>
      );
    }
    if (isGlobalSettingDisabled) {
      const setting =
        type === "login-expiration"
          ? t("peer.peerSessionExpirationLabel")
          : t("peer.requireLoginAfterDisconnect");
      return (
        <div className={"flex flex-col gap-2 text-xs max-w-xs"}>
          <div>
            {t("peer.globalSettingDisabledPrefix", { setting })}{" "}
            <InlineLink href={"/settings"}>
              {t("peer.goToSettings")} <ArrowUpRightIcon size={12} />
            </InlineLink>
          </div>
        </div>
      );
    }
  }, [noPermissionOrNoUser, peer, type, isGlobalSettingDisabled, t]);

  return (
    <FullTooltip
      content={tooltipContent}
      className={"w-full block"}
      disabled={tooltipContent === undefined}
    >
      <FancyToggleSwitch
        className={className}
        disabled={isGlobalSettingDisabled || noPermissionOrNoUser}
        value={isGlobalSettingDisabled ? false : value}
        onChange={onChange}
        variant={variant}
        label={
          <>
            {icon}
            {resolvedTitle}
          </>
        }
        helpText={resolvedDescription}
      />
    </FullTooltip>
  );
};
