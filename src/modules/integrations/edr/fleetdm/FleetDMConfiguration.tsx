import Button from "@components/Button";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import { notify } from "@components/Notification";
import Paragraph from "@components/Paragraph";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { useHasChanges } from "@hooks/useHasChanges";
import { IconInfoCircle } from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn, validator } from "@utils/helpers";
import {
  AlertOctagon,
  Cog,
  ExternalLinkIcon,
  FolderGit2,
  GlobeIcon,
  KeyRound,
  RefreshCcw,
  ShieldCheckIcon,
} from "lucide-react";
import React, { useMemo, useReducer, useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/fleetdm.png";
import { useI18n } from "@/i18n/I18nProvider";
import FullTooltip from "@/components/FullTooltip";
import { PeerGroupSelector } from "@/components/PeerGroupSelector";
import { useDialog } from "@/contexts/DialogProvider";
import { useGroups } from "@/contexts/GroupsProvider";
import { FleetDMIntegration } from "@/interfaces/EDR";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import { matchAttributesReducer } from "@/modules/integrations/edr/fleetdm/FleetDM";
import { FleetDMMatchSettings } from "@/modules/integrations/edr/fleetdm/FleetDMMatchSettings";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  config: FleetDMIntegration;
};

export default function FleetDMConfiguration({
  open,
  onOpenChange,
  onSuccess,
  config,
}: Props) {
  const { isLoading } = useGroups();

  return (
    !isLoading && (
      <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
        <ConfigurationContent
          onSuccess={() => {
            onOpenChange(false);
            onSuccess && onSuccess();
          }}
          config={config}
        />
      </Modal>
    )
  );
}

type ModalProps = {
  onSuccess: () => void;
  config: FleetDMIntegration;
};

export function ConfigurationContent({
  onSuccess,
  config,
}: Readonly<ModalProps>) {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const { confirm } = useDialog();

  const [tab, setTab] = useState<string>("peer-approval");

  const integrationRequest = useApiCall<FleetDMIntegration>(
    "/integrations/edr/fleetdm",
  );

  const [apiUrl, setApiUrl] = useState(config.api_url);
  const secretPlaceholder = "******************************";
  const [apiToken, setApiToken] = useState(secretPlaceholder);
  const [lastSyncedInterval, setLastSyncedInterval] = useState(
    config.last_synced_interval?.toString() || "24",
  );
  const [matchAttributes, dispatchMatchAttributes] = useReducer(
    matchAttributesReducer,
    config.match_attributes,
  );

  const [groups, setGroups, { save: saveGroups }] = useGroupHelper({
    initial: config.groups.map((g) => {
      const isString = typeof g === "string";
      return isString ? g : g.id;
    }) as string[],
  });

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
      title: t("fleetdm.notifyTitle"),
      description: t("fleetdm.notifyDeleted"),
      promise: integrationRequest.del({}).then(() => {
        mutate("/integrations/edr/fleetdm");
        onSuccess();
      }),
      loadingMessage: t("idpSync.deletingIntegration"),
    });
  };

  const updateIntegration = async () => {
    const savedGroups = await saveGroups();

    notify({
      title: t("fleetdm.notifyTitle"),
      description: t("fleetdm.notifyUpdated"),
      promise: integrationRequest
        .put({
          api_token: secretPlaceholder === apiToken ? undefined : apiToken,
          api_url: apiUrl,
          groups: savedGroups.map((group) => group.id) || [],
          last_synced_interval: Number(lastSyncedInterval || 24),
          match_attributes: matchAttributes,
          enabled: config.enabled,
        })
        .then(() => {
          mutate("/integrations/edr/fleetdm");
          onSuccess();
        }),
      loadingMessage: t("idpSync.updatingIntegration"),
    });
  };

  const urlError = useMemo(() => {
    if (apiUrl === "") return "";
    if (!validator.isValidUrl(apiUrl)) {
      return t("fleetdm.urlError");
    }
    return "";
  }, [apiUrl, t]);

  const { hasChanges } = useHasChanges([
    apiToken,
    apiUrl,
    matchAttributes,
    groups,
    lastSyncedInterval,
  ]);
  const canSave = hasChanges && groups.length && urlError === "";

  return (
    <ModalContent
      maxWidthClass={cn("relative max-w-[650px]")}
      showClose={true}
      className={""}
      autoFocus={false}
    >
      <GradientFadedBackground />

      <IntegrationModalHeader
        image={integrationImage}
        title={t("fleetdm.configTitle")}
        description={t("fleetdm.configDescription")}
      />

      <Tabs
        defaultValue={tab}
        onValueChange={(v) => setTab(v)}
        className={"mt-6"}
      >
        <TabsList justify={"start"} className={"px-8"}>
          <TabsTrigger value={"peer-approval"}>
            <FolderGit2
              size={14}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("fleetdm.tabPeerApproval")}
          </TabsTrigger>
          <TabsTrigger value={"compliance"}>
            <ShieldCheckIcon
              size={14}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("fleetdm.tabCompliance")}
          </TabsTrigger>
          <TabsTrigger value={"settings"}>
            <Cog
              size={14}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("idpSync.settings")}
          </TabsTrigger>
          <TabsTrigger value={"danger"}>
            <AlertOctagon
              size={14}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("idpSync.dangerZone")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={"peer-approval"} className={"px-8"}>
          <div>
            <Label>
              <div className={"flex gap-2 items-center"}>
                <FolderGit2 size={14} />
                {t("fleetdm.groupsLabel")}
              </div>
            </Label>
            <HelpText className={"mt-2"}>
              {t("fleetdm.groupsHelp")}
            </HelpText>

            <PeerGroupSelector
              values={groups}
              onChange={setGroups}
              showResourceCounter={false}
            />
          </div>
        </TabsContent>

        <TabsContent value={"compliance"} className={"px-8"}>
          <div className={""}>
            <Label>
              <div className={"flex gap-2 items-center"}>{t("fleetdm.requirementsLabel")}</div>
            </Label>
            <HelpText className={"mt-2"}>
              {t("fleetdm.requirementsHelp")}
            </HelpText>

            <FleetDMMatchSettings
              value={matchAttributes}
              dispatch={dispatchMatchAttributes}
            />
          </div>
        </TabsContent>

        <TabsContent value={"settings"} className={"px-8 text-sm"}>
          <div className={"mb-3 flex flex-row gap-3 w-full justify-between"}>
            <div>
              <Label>
                <div className={"flex gap-2 items-center"}>
                  <RefreshCcw size={14} />
                  {t("fleetdm.syncWindowLabel")}
                </div>
              </Label>
              <FullTooltip
                interactive={false}
                content={
                  <div className={"max-w-xs text-xs"}>
                    {t("fleetdm.syncWindowTooltip")}
                  </div>
                }
              >
                <HelpText className={"max-w-sm mt-1"}>
                  {t("fleetdm.syncWindowHelp")}
                  <IconInfoCircle
                    size={14}
                    className={"relative inline ml-1 -top-[1px]"}
                  />
                </HelpText>
              </FullTooltip>
            </div>

            <Input
              placeholder={"24"}
              min={24}
              max={336}
              className={"w-full min-w-[130px] ml-auto"}
              value={lastSyncedInterval}
              type={"number"}
              onChange={(e) => setLastSyncedInterval(e.target.value)}
              customSuffix={t("fleetdm.hoursSuffix")}
            />
          </div>

          <div className={"flex-col gap-3 flex"}>
            <Input
              autoCorrect={"off"}
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"min-w-[165px] flex gap-2 items-center"}>
                  <GlobeIcon size={16} />
                  {t("fleetdm.serverUrlLabel")}
                </div>
              }
              placeholder={"https://fleet.example.com"}
              value={apiUrl}
              error={urlError}
              onChange={(e) => setApiUrl(e.target.value)}
            />

            <Input
              autoCorrect={"off"}
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"min-w-[165px] flex gap-2 items-center"}>
                  <KeyRound size={16} />
                  {t("fleetdm.apiTokenLabel")}
                </div>
              }
              placeholder={t("fleetdm.apiTokenPlaceholder")}
              value={apiToken}
              onFocus={(e) => {
                if (e.target.value == secretPlaceholder) {
                  e.target.value = "";
                }
              }}
              onBlur={(e) => {
                if (!e.target.value.length) {
                  e.target.value = secretPlaceholder;
                }
              }}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value={"danger"} className={"px-8"}>
          <div>
            <Label>
              <div className={"flex gap-2 items-center"}>
                <AlertOctagon size={14} />
                {t("idpSync.deleteIntegrationLabel")}
              </div>
            </Label>
            <HelpText className={"max-w-lg mt-2"}>
              {t("fleetdm.deleteHelp")}
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
        <div className={"w-full"}>
          <Paragraph className={"text-sm mt-auto"}>
            {t("common.learnMoreAbout")}
            <InlineLink
              href={"https://fleetdm.com/docs/rest-api/rest-api"}
              target={"_blank"}
            >
              {t("fleetdm.learnMoreLink")}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </Paragraph>
        </div>
        <div className={"flex gap-4"}>
          <ModalClose asChild={true}>
            <Button variant={"secondary"} className={"w-full"}>
              {t("common.cancel")}
            </Button>
          </ModalClose>

          <Button
            variant={"primary"}
            className={"w-full"}
            disabled={!canSave}
            onClick={updateIntegration}
          >
            {t("common.saveChanges")}
          </Button>
        </div>
      </ModalFooter>
    </ModalContent>
  );
}
