"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import dayjs from "dayjs";
import { ArrowLeftRightIcon, ExternalLinkIcon } from "lucide-react";
import React, { useMemo } from "react";
import ActivityIcon from "@/assets/icons/ActivityIcon";
import { TRAFFIC_EVENTS_DOC_LINK } from "@/cloud/traffic-events/TrafficEventSetting";
import TrafficEventsTable from "@/cloud/traffic-events/TrafficEventsTable";
import PeersProvider from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ServerPaginationProvider from "@/contexts/ServerPaginationProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import { useAccount } from "@/modules/account/useAccount";
import { EventStreamingCard } from "@/modules/integrations/event-streaming/EventStreamingCard";

export default function NetworkTrafficPage() {
  const account = useAccount();
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();
  const isEnabled = !!account?.settings?.extra?.network_traffic_logs_enabled;

  const defaultFilters = useMemo(
    () => ({
      start_date: dayjs().subtract(7, "day").startOf("day").toISOString(),
      end_date: dayjs().endOf("day").toISOString(),
    }),
    [],
  );

  return (
    <PageContainer>
      <div className="p-default py-6">
        <Breadcrumbs>
          <Breadcrumbs.Item
            label={t("nav.activity")}
            disabled
            icon={<ActivityIcon size={13} />}
          />
          <Breadcrumbs.Item
            href="/events/traffic"
            label={t("nav.trafficEvents")}
            icon={<ArrowLeftRightIcon size={15} />}
          />
        </Breadcrumbs>

        <h1 ref={headingRef}>{t("nav.trafficEvents")}</h1>

        <Paragraph>
          {t("trafficEvents.description")}
        </Paragraph>

        <Paragraph>
          {t("common.learnMoreAbout")}{" "}
          <InlineLink href={TRAFFIC_EVENTS_DOC_LINK} target="_blank">
            {t("nav.trafficEvents")} <ExternalLinkIcon size={12} />
          </InlineLink>{" "}
          {t("trafficEvents.inDocumentation")}
        </Paragraph>
      </div>

      <RestrictedAccess
        page={t("events.trafficEventsPage")}
        hasAccess={permission.events.read}
      >
        <EventStreamingCard />
        <PeersProvider>
          <ServerPaginationProvider
            url={"/events/network-traffic"}
            defaultPageSize={10}
            defaultFilters={defaultFilters}
            enabled={true}
          >
            <TrafficEventsTable
              headingTarget={portalTarget}
              isSettingEnabled={isEnabled}
            />
          </ServerPaginationProvider>
        </PeersProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
