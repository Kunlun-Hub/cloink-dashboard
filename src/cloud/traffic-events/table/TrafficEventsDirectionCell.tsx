import Badge from "@components/Badge";
import * as React from "react";
import {
  TrafficEvent,
  TrafficEventDirection,
} from "@/cloud/traffic-events/interfaces/TrafficEvent";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  event: TrafficEvent;
};

export const TrafficEventsDirectionCell = ({ event }: Props) => {
  const { t } = useI18n();
  const direction = event.direction;
  const isInbound = direction === TrafficEventDirection.INGRESS;

  return direction === TrafficEventDirection.UNKNOWN ? (
    <Badge variant={"gray"} className={"py-1 w-[80px]"}>
      {t("common.unknown")}
    </Badge>
  ) : (
    <Badge variant={"gray"} className={"py-1 w-[80px]"}>
      {isInbound
        ? t("trafficEvents.filterInboundLabel")
        : t("trafficEvents.filterOutboundLabel")}
    </Badge>
  );
};
