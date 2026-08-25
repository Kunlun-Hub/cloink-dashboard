import { cn } from "@utils/helpers";
import dayjs from "dayjs";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { useMemo } from "react";
import {
  getTrafficEventCounts,
  TrafficEvent,
  TrafficEventDirection,
  TrafficEventMachine,
  TrafficEventMachineType,
  TrafficEventType,
} from "@/cloud/traffic-events/interfaces/TrafficEvent";
import { getTrafficEventTypeText } from "@/cloud/traffic-events/TrafficEventsTable";
import { stripZeroPort } from "@/cloud/traffic-events/utils/parseAddress";
import { usePeers } from "@/contexts/PeersProvider";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  event: TrafficEvent;
  type: TrafficEventType;
  showCaret?: boolean;
};

const isResource = (m: TrafficEventMachine) => {
  return m.type !== TrafficEventMachineType.PEER;
};

const getNamePrefix = (
  m: TrafficEventMachine,
  t: (key: string) => string,
) => {
  switch (m.type) {
    case TrafficEventMachineType.PEER:
      return t("trafficEvents.peerPrefix");
    case TrafficEventMachineType.ROUTE:
      return t("trafficEvents.routePrefix");
    case TrafficEventMachineType.UNKNOWN:
      return "";
    default:
      return t("trafficEvents.resourcePrefix");
  }
};

export const TrafficEventDescription = ({
  event,
  type,
  showCaret = false,
}: Props) => {
  const { peers } = usePeers();
  const { t } = useI18n();

  const routerName = useMemo(() => {
    const reporter = peers?.find((peer) => peer.id === event.reporter_id);
    return reporter ? <Mark>{reporter.name}</Mark> : <Mark>{t("common.unknown")}</Mark>;
  }, [event.reporter_id, peers, t]);

  const timestamp = event.events?.find((e) => e.type === type)?.timestamp;

  const { isAggregated } = getTrafficEventCounts(event);
  const eventWindow = useMemo(() => {
    if (!event.window_start || !event.window_end) return undefined;
    const first = dayjs(event.window_start);
    const last = dayjs(event.window_end);
    if (!first.isValid() || !last.isValid()) return undefined;
    if (first.isSame(last)) return undefined;
    return { first, last };
  }, [event.window_start, event.window_end]);

  const info = useMemo(() => {
    const isP2P =
      event.source.id === event.reporter_id ||
      event.destination.id === event.reporter_id;
    const isInbound = event.direction === TrafficEventDirection.INGRESS;
    const isOutbound = event.direction === TrafficEventDirection.EGRESS;
    const isStarted = type === TrafficEventType.CONNECTED;
    const isStopped = type === TrafficEventType.STOPPED;
    const isBlocked = type === TrafficEventType.BLOCKED;
    const isDestinationAResource = isResource(event.destination);
    const sourceAddress = stripZeroPort(event.source.address);
    const destinationAddress = stripZeroPort(event.destination.address);
    const sourceName = (
      <>
        {getNamePrefix(event.source, t)}{" "}
        <Mark>{event.source.name || sourceAddress}</Mark>
      </>
    );
    const destinationName = (
      <>
        {getNamePrefix(event.destination, t)}{" "}
        <Mark>{event.destination.name || destinationAddress}</Mark>
      </>
    );

    return {
      isP2P,
      isInbound,
      isOutbound,
      isStarted,
      isStopped,
      isBlocked,
      isDestinationAResource,
      sourceName,
      destinationName,
      type,
    };
  }, [event, t]);

  const aggregatedMessage = () => {
    const { starts, ends, drops } = getTrafficEventCounts(event);
    const connections = (n: number) =>
      n === 1
        ? t("trafficEvents.connection", { count: n.toLocaleString() })
        : t("trafficEvents.connections", { count: n.toLocaleString() });

    const joinClauses = (clauses: string[]) =>
      clauses.map((clause, index) => (
        <React.Fragment key={clause}>
          {index > 0 &&
            (index === clauses.length - 1
              ? t("trafficEvents.and")
              : t("trafficEvents.comma"))}
          {clause}
        </React.Fragment>
      ));

    const startVerb = info.isInbound
      ? t("trafficEvents.accepted")
      : t("trafficEvents.started");
    const initiated = [
      starts > 0 && `${startVerb} ${connections(starts)}`,
      ends > 0 && `${t("trafficEvents.ended")} ${connections(ends)}`,
    ].filter(Boolean) as string[];

    const sentences: React.ReactNode[] = [];
    if (initiated.length > 0) {
      sentences.push(
        info.isInbound ? (
          <>
            {info.destinationName} {joinClauses(initiated)}{" "}
            {t("trafficEvents.from")} {info.sourceName}
          </>
        ) : (
          <>
            {info.sourceName} {joinClauses(initiated)} {t("trafficEvents.to")}{" "}
            {info.destinationName}
          </>
        ),
      );
    }
    if (drops > 0) {
      sentences.push(
        <>
          {info.sourceName}
          {t("trafficEvents.gotBlocked")}
          {drops.toLocaleString()}{" "}
          {drops === 1 ? t("trafficEvents.time") : t("trafficEvents.times")}
          {t("trafficEvents.tryingToConnectTo")}
          {info.destinationName}
        </>,
      );
    }

    return (
      <>
        {sentences.map((sentence, index) => (
          <React.Fragment key={index}>
            {index > 0 && ". "}
            {sentence}
          </React.Fragment>
        ))}
      </>
    );
  };

  const getMessage = () => {
    if (isAggregated) return aggregatedMessage();

    /**
     * Connection between a peer and a resource
     */
    if (
      info.isP2P &&
      info.isOutbound &&
      info.isStarted &&
      info.isDestinationAResource
    ) {
      return (
        <>
          {info.sourceName} {t("trafficEvents.requestedConnectionTo")}{" "}
          {info.destinationName}
        </>
      );
    }

    if (
      info.isP2P &&
      info.isOutbound &&
      info.isStopped &&
      info.isDestinationAResource
    ) {
      return (
        <>
          {info.sourceName} {t("trafficEvents.stoppedConnectionTo")}{" "}
          {info.destinationName}
        </>
      );
    }

    /**
     * With routing peers
     */
    if (
      !info.isP2P &&
      info.isInbound &&
      info.isStarted &&
      info.isDestinationAResource
    ) {
      return (
        <>
          {t("trafficEvents.routingPeer")} {routerName}{" "}
          {t("trafficEvents.receivedConnectionTo")} {info.destinationName}{" "}
          {t("trafficEvents.from")} {info.sourceName}
        </>
      );
    }

    if (
      !info.isP2P &&
      info.isOutbound &&
      info.isStarted &&
      info.isDestinationAResource
    ) {
      return (
        <>
          {t("trafficEvents.routingPeer")} {routerName}{" "}
          {t("trafficEvents.startedRoutingTo")} {info.destinationName}{" "}
          {t("trafficEvents.from")} {info.sourceName}
        </>
      );
    }

    if (
      !info.isP2P &&
      info.isOutbound &&
      info.isStopped &&
      info.isDestinationAResource
    ) {
      return (
        <>
          {t("trafficEvents.routingPeer")} {routerName}{" "}
          {t("trafficEvents.stoppedRoutingTo")} {info.destinationName}{" "}
          {t("trafficEvents.from")} {info.sourceName}
        </>
      );
    }

    if (
      !info.isP2P &&
      info.isInbound &&
      info.isStopped &&
      info.isDestinationAResource
    ) {
      return (
        <>
          {t("trafficEvents.routingPeer")} {routerName}{" "}
          {t("trafficEvents.stoppedConnectionTo")} {info.destinationName}{" "}
          {t("trafficEvents.from")} {info.sourceName}
        </>
      );
    }

    if (
      !info.isP2P &&
      info.isDestinationAResource &&
      info.isBlocked &&
      info.isOutbound
    ) {
      return (
        <>
          {t("trafficEvents.connectionTo")} {info.destinationName}{" "}
          {t("trafficEvents.wasBlocked")}
        </>
      );
    }

    if (
      !info.isP2P &&
      info.isDestinationAResource &&
      info.isBlocked &&
      info.isInbound
    ) {
      return (
        <>
          {t("trafficEvents.routingPeer")} {routerName}{" "}
          {t("trafficEvents.blockedConnectionTo")} {info.destinationName}
        </>
      );
    }

    /**
     * P2P connection between two peers
     */
    if (info.isP2P && info.isOutbound && info.isStarted) {
      return (
        <>
          {info.sourceName} {t("trafficEvents.requestedP2PConnectionTo")}{" "}
          {info.destinationName}
        </>
      );
    }

    if (info.isP2P && info.isInbound && info.isStarted) {
      return (
        <>
          {info.destinationName} {t("trafficEvents.receivedP2PConnectionFrom")}{" "}
          {info.sourceName}
        </>
      );
    }

    if (info.isP2P && info.isOutbound && info.isStopped) {
      return (
        <>
          {info.sourceName} {t("trafficEvents.stoppedP2PConnectionTo")}{" "}
          {info.destinationName}
        </>
      );
    }

    if (info.isP2P && info.isInbound && info.isStopped) {
      return (
        <>
          {info.destinationName} {t("trafficEvents.stoppedP2PConnectionFrom")}{" "}
          {info.sourceName}
        </>
      );
    }

    if (info.isP2P && info.isOutbound && info.isBlocked) {
      return (
        <>
          {info.sourceName} {t("trafficEvents.blockedP2PConnectionTo")}{" "}
          {info.destinationName}
        </>
      );
    }

    if (info.isP2P && info.isInbound && info.isBlocked) {
      return (
        <>
          {info.destinationName} {t("trafficEvents.blockedP2PConnectionFrom")}{" "}
          {info.sourceName}
        </>
      );
    }

    // Fallback to generic message
    return (
      <>
        {getTrafficEventTypeText(t, info.type, info.isP2P, event.direction)}
      </>
    );
  };

  return (
    <div>
      <div className={"flex items-center mb-1.5 gap-2"}>
        <span className={"text-xs text-nb-gray-300 block"}>
          {isAggregated && eventWindow ? (
            <span>
              {eventWindow.first.format("MMM D, YYYY [at] h:mm A")} &ndash;{" "}
              {eventWindow.last.format(
                eventWindow.first.isSame(eventWindow.last, "day")
                  ? "h:mm A"
                  : "MMM D, h:mm A",
              )}
            </span>
          ) : (
            <span>{dayjs(timestamp).format("MMM D, YYYY [at] h:mm:ss A")}</span>
          )}
        </span>
      </div>
      <div
        className={cn(
          "text-nb-gray-250 text-sm min-w-[22rem] max-w-[23rem] font-light",
        )}
      >
        {getMessage()}
        {showCaret && (
          <div
            className={cn(
              "inline ml-2 text-xs text-nb-gray-300 -top-[1px] relative",
              "group-hover/accordion:text-nb-gray-200 transition-all",
            )}
          >
            <ChevronDownIcon
              size={18}
              className={
                "group-data-[accordion=opened]/accordion:hidden shrink-0 inline"
              }
            />
            <ChevronUpIcon
              size={18}
              className={
                "group-data-[accordion=closed]/accordion:hidden shrink-0 inline"
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

const Mark = ({ children }: { children: React.ReactNode }) => {
  return <span className={"text-white font-normal"}>{children}</span>;
};
