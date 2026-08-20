import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { cn } from "@utils/helpers";
import {
  BrickWallShieldIcon,
  BugOffIcon,
  ChevronsLeftRightEllipsis,
  HardDrive,
  PowerIcon,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { SentinelOneMatchAttributes } from "@/interfaces/EDR";

type Props = {
  value: SentinelOneMatchAttributes;
  dispatch: React.Dispatch<any>;
};
export const SentinelOneMatchSettings = ({
  value: matchAttributes,
  dispatch: dispatchMatchAttributes,
}: Props) => {
  const { t } = useI18n();
  return (
    <>
      <div className={cn("flex justify-between mt-6 gap-5")}>
        <div className={"w-full"}>
          <Label>
            <TriangleAlert size={14} />
            {t("edr.sentinelOne.allowedActiveThreats")}
          </Label>
          <HelpText>
            {t("edr.sentinelOne.allowedActiveThreatsHelp")}
          </HelpText>
        </div>
        <Input
          placeholder={"0"}
          min={0}
          max={999}
          className={"w-full min-w-[130px]"}
          value={matchAttributes.active_threats}
          type={"number"}
          onChange={(e) =>
            dispatchMatchAttributes({
              type: "SET_ACTIVE_THREATS",
              payload: Number(e.target.value),
            })
          }
          customSuffix={t("edr.sentinelOne.threatsSuffix")}
        />
      </div>
      <div className={"mt-5 grid grid-cols-1 gap-6 mb-3"}>
        <FancyToggleSwitch
          value={matchAttributes.encrypted_applications ?? false}
          variant={"blank"}
          onChange={(val) =>
            dispatchMatchAttributes({
              type: "SET_ENCRYPTED_APPLICATIONS",
              payload: val,
            })
          }
          label={
            <>
              <HardDrive size={14} />
              {t("edr.sentinelOne.diskEncryption")}
            </>
          }
          helpText={t("edr.sentinelOne.diskEncryptionHelp")}
        />
        <FancyToggleSwitch
          value={matchAttributes.firewall_enabled ?? false}
          variant={"blank"}
          onChange={(val) =>
            dispatchMatchAttributes({
              type: "SET_FIREWALL_ENABLED",
              payload: val,
            })
          }
          label={
            <>
              <BrickWallShieldIcon size={14} />
              {t("edr.sentinelOne.firewall")}
            </>
          }
          helpText={t("edr.sentinelOne.firewallHelp")}
        />
        <FancyToggleSwitch
          value={matchAttributes.infected === false}
          variant={"blank"}
          onChange={(val) =>
            dispatchMatchAttributes({
              type: "SET_INFECTED",
              payload: val,
            })
          }
          label={
            <>
              <BugOffIcon size={14} />
              {t("edr.sentinelOne.blockInfectedDevices")}
            </>
          }
          helpText={t("edr.sentinelOne.blockInfectedDevicesHelp")}
        />
        <FancyToggleSwitch
          value={matchAttributes.network_status === "connected"}
          variant={"blank"}
          onChange={(val) =>
            dispatchMatchAttributes({
              type: "SET_NETWORK_STATUS",
              payload: val,
            })
          }
          label={
            <>
              <ChevronsLeftRightEllipsis size={14} />
              {t("edr.sentinelOne.networkConnectivity")}
            </>
          }
          helpText={t("edr.sentinelOne.networkConnectivityHelp")}
        />
        <FancyToggleSwitch
          value={matchAttributes.is_active ?? false}
          variant={"blank"}
          onChange={(val) =>
            dispatchMatchAttributes({
              type: "SET_IS_ACTIVE",
              payload: val,
            })
          }
          label={
            <>
              <PowerIcon size={14} />
              {t("edr.sentinelOne.activeStatus")}
            </>
          }
          helpText={t("edr.sentinelOne.activeStatusHelp")}
        />
        <FancyToggleSwitch
          value={matchAttributes.is_up_to_date ?? false}
          variant={"blank"}
          onChange={(val) =>
            dispatchMatchAttributes({
              type: "SET_IS_UP_TO_DATE",
              payload: val,
            })
          }
          label={
            <>
              <RefreshCcw size={14} />
              {t("edr.sentinelOne.latestAgentVersion")}
            </>
          }
          helpText={t("edr.sentinelOne.latestAgentVersionHelp")}
        />
      </div>
    </>
  );
};
