import DescriptionWithTooltip from "@components/ui/DescriptionWithTooltip";
import React from "react";
import { Policy } from "@/interfaces/Policy";
import ActiveInactiveRow from "@/modules/common-table-rows/ActiveInactiveRow";
import { useI18n } from "@/i18n/I18nProvider";
import {
  localizePolicyDescription,
  localizePolicyName,
} from "@/utils/serverLabels";

type Props = {
  policy: Policy;
};

export default function AccessControlNameCell({ policy }: Readonly<Props>) {
  const { t } = useI18n();
  const displayName = localizePolicyName(policy.name, t);
  const displayDescription = localizePolicyDescription(
    policy.name,
    policy.description,
    t,
  );
  return (
    <ActiveInactiveRow
      active={policy.enabled}
      inactiveDot={"gray"}
      text={displayName}
      data-testid={policy.name}
    >
      <DescriptionWithTooltip className={"mt-1"} text={displayDescription} />
    </ActiveInactiveRow>
  );
}
