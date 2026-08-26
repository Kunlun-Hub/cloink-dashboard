"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import dayjs from "dayjs";
import { ArrowLeftRightIcon } from "lucide-react";
import React, { useMemo } from "react";
import ActivityIcon from "@/assets/icons/ActivityIcon";
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
      grouped: "true",
      start_date: dayjs().subtract(5, "minute").toISOString(),
      end_date: dayjs().toISOString(),
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
      </div>

      <RestrictedAccess
        page={t("events.trafficEventsPage")}
        hasAccess={permission.network_traffic.read}
      >
        <EventStreamingCard />
        <PeersProvider>
          <ServerPaginationProvider
            url={"/events/network-traffic"}
            defaultPageSize={20}
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
