"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import useFetchApi from "@utils/api";
import { isNetBirdCloud } from "@utils/netbird";
import { User2 } from "lucide-react";
import React, { lazy, Suspense } from "react";
import TeamIcon from "@/assets/icons/TeamIcon";
import { AccountMfaCard } from "@/cloud/mfa/AccountMFACard";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { User } from "@/interfaces/User";
import PageContainer from "@/layouts/PageContainer";
import { IdentityProviderCard } from "@/modules/integrations/idp-sync/IdentityProviderCard";

const UsersTable = lazy(() => import("@/modules/users/UsersTable"));

export default function TeamUsers() {
  const { isLoading: isGroupsLoading } = useGroups();
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { data: users, isLoading } = useFetchApi<User[]>(
    "/users?service_user=false",
  );

  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/team"}
            label={t("nav.team")}
            icon={<TeamIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/team/users"}
            label={t("nav.users")}
            active
            icon={<User2 size={16} />}
          />
        </Breadcrumbs>
        <h1 ref={headingRef}>{t("users.title")}</h1>
      </div>
      <RestrictedAccess page={t("team.usersPage")} hasAccess={permission.users.read}>
        <Suspense fallback={<SkeletonTable />}>
          {permission.settings.read && (
            <div className={"flex flex-wrap gap-4 p-default pb-6"}>
              {(permission?.idp?.read || !isNetBirdCloud()) && (
                <IdentityProviderCard />
              )}
              <AccountMfaCard />
            </div>
          )}
          <UsersTable
            users={users}
            isLoading={isLoading || isGroupsLoading}
            headingTarget={portalTarget}
          />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
