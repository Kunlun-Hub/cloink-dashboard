import ButtonGroup from "@components/ButtonGroup";
import { useI18n } from "@/i18n/I18nProvider";
import * as React from "react";

type Props = {
  value?: string;
  onChange?: (value: string) => void;
};

export const TrafficEventsConnectionTypeFilter = ({
  value,
  onChange,
}: Props) => {
  const { t } = useI18n();
  return (
    <ButtonGroup>
      <ButtonGroup.Button
        onClick={() => onChange?.("")}
        variant={value == undefined || value == "" ? "tertiary" : "secondary"}
      >
        {t("common.all")}
      </ButtonGroup.Button>
      <ButtonGroup.Button
        onClick={() => onChange?.("P2P")}
        variant={value === "P2P" ? "tertiary" : "secondary"}
      >
        P2P
      </ButtonGroup.Button>
      <ButtonGroup.Button
        onClick={() => onChange?.("ROUTED")}
        variant={value === "ROUTED" ? "tertiary" : "secondary"}
      >
        {t("trafficEvents.routed")}
      </ButtonGroup.Button>
    </ButtonGroup>
  );
};
