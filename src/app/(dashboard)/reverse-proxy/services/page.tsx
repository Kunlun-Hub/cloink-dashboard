"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import { Callout } from "@components/Callout";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import { isNetBirdCloud } from "@utils/netbird";
import React, { lazy, Suspense } from "react";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ReverseProxiesProvider from "@/contexts/ReverseProxiesProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";

const ReverseProxyTable = lazy(
  () => import("@/modules/reverse-proxy/table/ReverseProxyTable"),
);

export default function ReverseProxyServicesPage() {
  const { t } = useI18n();
  const { permission } = usePermissions();

  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/reverse-proxy/services"}
            label={t("reverseProxy.title")}
            icon={<ReverseProxyIcon size={16} />}
          />
          <Breadcrumbs.Item
            href={"/reverse-proxy/services"}
            label={t("nav.services")}
            active={true}
          />
        </Breadcrumbs>
        <h1 ref={headingRef}>{t("reverseProxy.servicesTitle")}</h1>
        {isNetBirdCloud() ? (
          <Callout className={"max-w-xl mt-5"} variant={"info"}>
            {t("reverseProxy.betaHosted")}
          </Callout>
        ) : (
          <Callout className={"max-w-xl mt-5"} variant={"info"}>
            {t("reverseProxy.betaSelfHosted")}
          </Callout>
        )}
      </div>

      <RestrictedAccess
        page={t("nav.services")}
        hasAccess={permission?.services?.read}
      >
        <ReverseProxiesProvider>
          <Suspense fallback={<SkeletonTable />}>
            <ReverseProxyTable headingTarget={portalTarget} />
          </Suspense>
        </ReverseProxiesProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
