import FancyToggleSwitch from "@components/FancyToggleSwitch";
import { BrickWallShieldIcon, ShieldCheckIcon, ShieldIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  DEFAULT_HUNTRESS_MATCH_ATTRIBUTES,
  HuntressMatchAttributes,
} from "@/interfaces/EDR";

type Props = {
  value: HuntressMatchAttributes;
  dispatch: React.Dispatch<any>;
};

export const HuntressMatchSettings = ({
  value: matchAttributes,
  dispatch: dispatchMatchAttributes,
}: Props) => {
  const { t } = useI18n();
  return (
    <div className={"mt-6 grid grid-cols-1 gap-6 mb-3"}>
      <FancyToggleSwitch
        value={!!matchAttributes.defender_status}
        variant={"blank"}
        onChange={(val) => {
          if (val) {
            dispatchMatchAttributes({
              type: "SET_DEFENDER_STATUS",
              payload: DEFAULT_HUNTRESS_MATCH_ATTRIBUTES.defender_status,
            });
            dispatchMatchAttributes({
              type: "SET_DEFENDER_SUBSTATUS",
              payload: DEFAULT_HUNTRESS_MATCH_ATTRIBUTES.defender_substatus,
            });
          } else {
            dispatchMatchAttributes({
              type: "SET_DEFENDER_STATUS",
              payload: undefined,
            });
            dispatchMatchAttributes({
              type: "SET_DEFENDER_SUBSTATUS",
              payload: undefined,
            });
          }
        }}
        label={
          <>
            <ShieldIcon size={14} />
            {t("edr.huntress.managedDefender")}
          </>
        }
        helpText={t("edr.huntress.managedDefenderHelp")}
      />

      <FancyToggleSwitch
        value={!!matchAttributes.defender_policy_status}
        variant={"blank"}
        onChange={(val) =>
          dispatchMatchAttributes({
            type: "SET_DEFENDER_POLICY_STATUS",
            payload: val
              ? DEFAULT_HUNTRESS_MATCH_ATTRIBUTES.defender_policy_status
              : undefined,
          })
        }
        label={
          <>
            <ShieldCheckIcon size={14} />
            {t("edr.huntress.defenderPolicyCompliance")}
          </>
        }
        helpText={t("edr.huntress.defenderPolicyComplianceHelp")}
      />

      <FancyToggleSwitch
        value={!!matchAttributes.firewall_status}
        variant={"blank"}
        onChange={(val) =>
          dispatchMatchAttributes({
            type: "SET_FIREWALL_STATUS",
            payload: val
              ? DEFAULT_HUNTRESS_MATCH_ATTRIBUTES.firewall_status
              : undefined,
          })
        }
        label={
          <>
            <BrickWallShieldIcon size={14} />
            {t("edr.huntress.firewall")}
          </>
        }
        helpText={
          <span>
            {t("edr.huntress.firewallHelpPrefix")} <br />
            {t("edr.huntress.firewallHelpSuffix")}
          </span>
        }
      />
    </div>
  );
};
