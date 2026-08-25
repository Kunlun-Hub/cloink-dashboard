"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import PeersProvider from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ServerPaginationProvider from "@/contexts/ServerPaginationProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import ReverseProxyEventsTable from "@/modules/reverse-proxy/events/ReverseProxyEventsTable";

export default function ProxyLogsPage() {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  const defaultFilters = useMemo(
    () => ({
      start_date: dayjs().subtract(7, "day").startOf("day").toISOString(),
      end_date: dayjs().endOf("day").toISOString(),
      sort_by: "timestamp",
      sort_order: "desc",
    }),
    [],
  );

  return (
    <PageContainer>
      <div className="p-default py-6">
        <Breadcrumbs>
          <Breadcrumbs.Item
            label={t("reverseProxy.title")}
            disabled
            icon={<ReverseProxyIcon size={15} />}
          />
          <Breadcrumbs.Item
            href="/reverse-proxy/logs"
            label={t("reverseProxy.accessLogs")}
            icon={<ReverseProxyIcon size={15} />}
          />
        </Breadcrumbs>

        <h1 ref={headingRef}>{t("proxyEvents.title")}</h1>
      </div>

      <RestrictedAccess
        page={t("reverseProxy.accessLogs")}
        hasAccess={permission?.services?.read}
      >
        <ServerPaginationProvider
          url="/events/proxy"
          defaultPageSize={25}
          defaultFilters={defaultFilters}
        >
          <PeersProvider>
            <ReverseProxyEventsTable headingTarget={portalTarget} />
          </PeersProvider>
        </ServerPaginationProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
