import Button from "@components/Button";
import Card from "@components/Card";
import HelpText from "@components/HelpText";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import { notify } from "@components/Notification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { useHasChanges } from "@hooks/useHasChanges";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { trim } from "lodash";
import {
  AlertOctagon,
  Cog,
  FolderGit2,
  KeyRound,
  RefreshCcw,
  UserCircle,
} from "lucide-react";
import React, { useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/okta.png";
import { useDialog } from "@/contexts/DialogProvider";
import { OktaIntegration } from "@/interfaces/IdentityProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { EmbeddedIdentityProviderSelect } from "@/modules/integrations/idp-sync/EmbeddedIdentityProviderSelect";
import { GroupPrefixHelpText } from "@/modules/integrations/idp-sync/GroupPrefixHelpText";
import { GroupPrefixInput } from "@/modules/integrations/idp-sync/GroupPrefixInput";
import { useIntegrations } from "@/modules/integrations/idp-sync/useIntegrations";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function OktaConfiguration({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { okta } = useIntegrations();

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
        {okta && (
          <ConfigurationContent
            onSuccess={() => {
              onOpenChange(false);
              onSuccess && onSuccess();
            }}
            config={okta}
          />
        )}
      </Modal>
    </>
  );
}

type ModalProps = {
  onSuccess: () => void;
  config: OktaIntegration;
};

export function ConfigurationContent({ onSuccess, config }: ModalProps) {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const { confirm } = useDialog();

  const [tab, setTab] = useState<string>("settings");

  const oktaRequest = useApiCall<OktaIntegration>(
    "/integrations/okta-scim-idp",
  );

  const [connectorId, setConnectorId] = useState(config.connector_id || "");
  const clientSecretPlaceholder = "******************************";
  const [authToken, setAuthToken] = useState(
    config.auth_token || clientSecretPlaceholder,
  );

  const [groupPrefixes, setGroupPrefixes] = useState<string[]>(
    config.group_prefixes || [],
  );
  const [userGroupPrefixes, setUserGroupPrefixes] = useState<string[]>(
    config.user_group_prefixes || [],
  );

  const { hasChanges, updateRef } = useHasChanges([
    authToken,
    connectorId,
    groupPrefixes,
    userGroupPrefixes,
  ]);

  const regenerateAuthToken = async () => {
    const choice = await confirm({
      title: t("idpSync.regenerateAuthTokenTitle"),
      description: t("idpSync.regenerateAuthTokenDescription", {
        provider: "Okta",
      }),
      confirmText: t("idpSync.regenerate"),
      cancelText: t("common.cancel"),
      type: "default",
    });

    if (!choice) return;

    notify({
      title: t("idpSync.integrationTitle", { provider: "Okta" }),
      description: t("idpSync.authTokenRegenerated", { provider: "Okta" }),
      promise: oktaRequest.post({}, `/${config.id}/token`).then((r) => {
        mutate("/integrations/okta-scim-idp");
        setAuthToken(r.auth_token);
        updateRef([r.auth_token, groupPrefixes, userGroupPrefixes]);
      }),
      loadingMessage: t("idpSync.updatingAuthToken"),
    });
  };

  const deleteIntegration = async () => {
    const choice = await confirm({
      title: t("idpSync.deleteIntegrationTitle"),
      description: t("idpSync.deleteIntegrationDescription"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      type: "danger",
    });

    if (!choice) return;

    notify({
      title: t("idpSync.integrationTitle", { provider: "Okta" }),
      description: t("idpSync.integrationDeleted", { provider: "Okta" }),
      promise: oktaRequest.del({}, `/${config.id}`).then(() => {
        mutate("/integrations/okta-scim-idp");
        onSuccess();
      }),
      loadingMessage: t("idpSync.deletingIntegration"),
    });
  };

  const updateIntegration = async () => {
    notify({
      title: t("idpSync.integrationTitle", { provider: "Okta" }),
      description: t("idpSync.integrationUpdated", { provider: "Okta" }),
      promise: oktaRequest
        .put(
          {
            group_prefixes: groupPrefixes
              ? groupPrefixes.filter((prefix) => trim(prefix) !== "")
              : [],
            user_group_prefixes: userGroupPrefixes
              ? userGroupPrefixes.filter((prefix) => trim(prefix) !== "")
              : [],
            ...(connectorId ? { connector_id: connectorId } : {}),
          },
          `/${config.id}`,
        )
        .then(() => {
          mutate("/integrations/okta-scim-idp");
          onSuccess();
        }),
      loadingMessage: t("idpSync.updatingIntegration"),
    });
  };

  return (
    <ModalContent
      maxWidthClass={cn("relative max-w-xl")}
      showClose={true}
      className={""}
      autoFocus={false}
    >
      <GradientFadedBackground />

      <IntegrationModalHeader
        image={integrationImage}
        title={t("okta.configurationTitle")}
        description={t("okta.configurationDescription")}
      />

      <Tabs
        defaultValue={tab}
        onValueChange={(v) => setTab(v)}
        className={"mt-6"}
      >
        <TabsList justify={"start"} className={"px-8"}>
          <TabsTrigger value={"settings"}>
            <Cog
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("idpSync.settings")}
          </TabsTrigger>
          <TabsTrigger value={"group-sync"}>
            <FolderGit2
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("idpSync.groupSync")}
          </TabsTrigger>
          <TabsTrigger value={"user-sync"}>
            <UserCircle
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("idpSync.userSync")}
          </TabsTrigger>
          <TabsTrigger value={"danger"}>
            <AlertOctagon
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("idpSync.dangerZone")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={"settings"} className={"px-8 text-sm"}>
          <div className={"flex-col gap-3 flex"}>
            <Card className={"w-full"}>
              <Card.List>
                <Card.ListItem
                  copy={!authToken.includes("*")}
                  copyText={t("idpSync.authTokenCopy")}
                  label={
                    <>
                      <KeyRound size={16} />
                      {t("idpSync.authToken")}
                    </>
                  }
                  value={authToken}
                />
              </Card.List>
            </Card>
            <Button variant={"secondary"} onClick={regenerateAuthToken}>
              <RefreshCcw size={16} />
              {t("idpSync.regenerateAuthToken")}
            </Button>
            <EmbeddedIdentityProviderSelect
              value={connectorId}
              onChange={setConnectorId}
              location="settings"
            />
          </div>
        </TabsContent>

        <TabsContent value={"group-sync"} className={"px-8"}>
          <div>
            <Label>
              <div className={"flex gap-2 items-center"}>
                <FolderGit2 size={16} />
                {t("idpSync.synchronizeGroups")}
              </div>
            </Label>
            <GroupPrefixHelpText />
          </div>
          <GroupPrefixInput value={groupPrefixes} onChange={setGroupPrefixes} />
        </TabsContent>

        <TabsContent value={"user-sync"} className={"px-8"}>
          <div>
            <Label>
              <div className={"flex gap-2 items-center"}>
                <UserCircle size={16} />
                {t("idpSync.synchronizeUsers")}
              </div>
            </Label>
            <GroupPrefixHelpText type={"user-groups"} />
          </div>
          <GroupPrefixInput
            addText={t("idpSync.addUserGroupFilter")}
            text={t("idpSync.userGroupStartsWith")}
            value={userGroupPrefixes}
            onChange={setUserGroupPrefixes}
          />
        </TabsContent>

        <TabsContent value={"danger"} className={"px-8"}>
          <div>
            <Label>
              <div className={"flex gap-2 items-center"}>
                <AlertOctagon size={16} />
                {t("idpSync.deleteIntegrationLabel")}
              </div>
            </Label>
            <HelpText className={"max-w-lg mt-2"}>
              {t("idpSync.deleteIntegrationHelp")}
            </HelpText>
          </div>
          <Button
            variant={"danger"}
            size={"xs"}
            className={"mt-3"}
            onClick={deleteIntegration}
          >
            {t("idpSync.deleteIntegrationLabel")}
          </Button>
        </TabsContent>
      </Tabs>
      <div className={"h-6"}></div>

      <ModalFooter className={"items-center gap-4"}>
        <ModalClose asChild={true}>
          <Button variant={"secondary"} className={"w-full"}>
            {t("common.cancel")}
          </Button>
        </ModalClose>

        <Button
          variant={"primary"}
          className={"w-full"}
          disabled={!hasChanges}
          onClick={updateIntegration}
        >
          {t("common.save")}
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}
