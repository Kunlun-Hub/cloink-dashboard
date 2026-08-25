"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import FullScreenLoading from "@components/ui/FullScreenLoading";
import { usePortalElement } from "@hooks/usePortalElement";
import useFetchApi from "@utils/api";
import React, { Suspense } from "react";
import MSPIcon from "@/assets/icons/MSPIcon";
import { CustomersProvider } from "@/cloud/distributor/contexts/CustomersProvider";
import DistributorCustomersTable from "@/cloud/distributor/table/DistributorCustomersTable";
import { DistributorDocsLink } from "@/cloud/distributor/DistributorDocsLink";
import { useDistributor } from "@/cloud/distributor/contexts/DistributorProvider";
import { DistributorCustomer } from "@/cloud/distributor/interfaces/Distributor";
import PageContainer from "@/layouts/PageContainer";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";

export default function CustomersPage() {
  const { isDistributorInfoLoading } = useDistributor();
  if (isDistributorInfoLoading) return <FullScreenLoading fullScreen={false} />;
  return <CustomersPageContent />;
}

const CustomersPageContent = () => {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { data: customers, isLoading } = useFetchApi<DistributorCustomer[]>(
    "/integrations/msp/reseller/msps",
  );
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/customers"}
            label={t("customers.title")}
            icon={<MSPIcon size={15} />}
          />
        </Breadcrumbs>
        <h1 ref={headingRef}>{t("customers.title")}</h1>
        <Paragraph>
          {t("customers.description")}
        </Paragraph>
        <Paragraph>
          <DistributorDocsLink />
          {t("customers.docsSuffix")}
        </Paragraph>
      </div>
      <RestrictedAccess
        page={t("customers.title")}
        hasAccess={permission.tenants.create}
      >
        <Suspense fallback={<SkeletonTable />}>
          <CustomersProvider>
            <DistributorCustomersTable
              isLoading={isLoading}
              headingTarget={portalTarget}
              customers={customers}
            />
          </CustomersProvider>
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
};
