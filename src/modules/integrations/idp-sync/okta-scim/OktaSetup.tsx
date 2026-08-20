import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import Steps from "@components/Steps";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Lightbox } from "@components/ui/Lightbox";
import { Mark } from "@components/ui/Mark";
import { MinimalList } from "@components/ui/MinimalList";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { isEmpty } from "lodash";
import {
  Box,
  Clock4,
  FolderGit2,
  LogInIcon,
  MailIcon,
  PlusCircle,
  Settings2,
  Share2,
  Shield,
  UserCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useEmbeddedIdentityProviders } from "@/hooks/useEmbeddedIdentityProviders";
import integrationImage from "@/assets/integrations/okta.png";
import { OktaIntegration } from "@/interfaces/IdentityProvider";
import oktaGroupsAssignments from "@/modules/integrations/idp-sync/okta-scim/images/okta-groups-assignments.png";
import oktaSCIMToApp from "@/modules/integrations/idp-sync/okta-scim/images/okta-scim-to-app-sync-enabled.png";
import oktaSSO from "@/modules/integrations/idp-sync/okta-scim/images/okta-sso-configuration.png";
import oktaSyncGroups from "@/modules/integrations/idp-sync/okta-scim/images/okta-sync-groups.png";
import { EmbeddedIdentityProviderSelect } from "@/modules/integrations/idp-sync/EmbeddedIdentityProviderSelect";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
import { useEnterpriseConnections } from "@/modules/integrations/sso/useEnterpriseConnections";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function OktaSetup({ open, onOpenChange, onSuccess }: Props) {
  const [authToken, setAuthToken] = useState("");
  const [connectorId, setConnectorId] = useState("");
  const { oktaConnection } = useEnterpriseConnections();

  const integrationsRequest = useApiCall<OktaIntegration[]>(
    "/integrations/okta-scim-idp",
  );

  const authTokenRequest = useApiCall<OktaIntegration>(
    "/integrations/okta-scim-idp",
    true,
  ).post;

  useEffect(() => {
    if (!open) return;
    if (!oktaConnection) return;
    const getAuthToken = async () => {
      const integration = await integrationsRequest.get();
      if (!isEmpty(integration)) {
        const integrationId = integration[0].id;
        if (authToken != "") return authToken;
        const okta = await authTokenRequest(
          {
            connection_name: oktaConnection.name,
          },
          `/${integrationId}/token`,
        );
        if (!okta) return "";
        return okta.auth_token;
      } else {
        const okta = await authTokenRequest({
          connection_name: oktaConnection.name,
          ...(connectorId ? { connector_id: connectorId } : {}),
        });
        if (!okta) return "";
        return okta.auth_token;
      }
    };

    getAuthToken().then((t) => setAuthToken(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {open && (
        <SetupContent
          authToken={authToken}
          connectorId={connectorId}
          onConnectorIdChange={setConnectorId}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess && onSuccess();
          }}
        />
      )}
    </Modal>
  );
}

type ModalProps = {
  onSuccess: () => void;
  authToken: string;
  connectorId?: string;
  onConnectorIdChange?: (value: string) => void;
};

export function SetupContent({
  onSuccess,
  authToken,
  connectorId = "",
  onConnectorIdChange,
}: ModalProps) {
  const { t } = useI18n();
  const { isEmbeddedIdPEnabled } = useEmbeddedIdentityProviders();
  const [step, setStep] = useState(isEmbeddedIdPEnabled ? -1 : 0);
  const maxSteps = 5;

  return (
    <ModalContent
      maxWidthClass={cn(
        "relative",
        step == 0
          ? "max-w-lg"
          : step == 2
          ? "max-w-2xl"
          : step == 1
          ? "max-w-lg"
          : "max-w-xl",
        step === -1 && "max-w-lg",
      )}
      showClose={true}
      className={""}
      onEscapeKeyDown={(e) => step > 0 && e.preventDefault()}
      onInteractOutside={(e) => step > 0 && e.preventDefault()}
      onPointerDownOutside={(e) => step > 0 && e.preventDefault()}
    >
      <GradientFadedBackground />

      {step > 0 && (
        <div className={"flex gap-2 w-full items-center justify-center mb-4"}>
          {Array.from({ length: maxSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-8 h-1 rounded-full bg-nb-gray-800",
                step >= index + 1 && "bg-netbird",
              )}
            />
          ))}
        </div>
      )}

      <IntegrationModalHeader
        image={integrationImage}
        title={t("oktaSetup.connectTitle")}
        description={t("oktaSetup.connectDescription")}
      />

      {step === -1 && onConnectorIdChange && (
        <EmbeddedIdentityProviderSelect
          value={connectorId}
          onChange={onConnectorIdChange}
          location="setup"
          filterByType={["okta"]}
        />
      )}

      {step == 0 && (
        <div
          className={
            "px-8 py-3 flex z-0 flex-col gap-0 text-sm mb-3 text-center justify-center items-center"
          }
        >
          <div
            className={
              "mt-6 text-base font-medium text-nb-gray-100 flex gap-2 items-center justify-center"
            }
          >
            <Shield size={16} />
            {t("oktaSetup.requiredPermissions")}
          </div>
          <p className={"mt-2 !text-nb-gray-300 !leading-[1.5]"}>
            {t("oktaSetup.accountPrefix")}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t("oktaSetup.accountType")}
            </span>{" "}
            {t("idpSync.requiredPermissions") === t("idpSync.requiredPermissions") ? t("oktaSetup.accountPrefix") !== t("oktaSetup.accountPrefix") ? "" : "" : ""}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t("oktaSetup.permissionsWord")}
            </span>
            .{" "}
            {t("oktaSetup.accountSuffix")}
          </p>
          <div
            className={
              "flex items-center flex-col gap-0 mt-2 w-full justify-center max-w-lg"
            }
          >
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <PlusCircle size={14} className={"text-sky-500"} />
              {t("oktaSetup.permAdd")}
            </div>
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <Settings2 size={14} className={"text-sky-500"} />
              {t("oktaSetup.permConfigure")}
            </div>
          </div>
        </div>
      )}

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <LogInIcon size={20} />
            {t("oktaSetup.configureSsoTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("oktaSetup.configureSsoStep1")}{" "}
                <Mark>{"Applications > Applications"}</Mark>
                {t("oktaSetup.configureSsoStep1Suffix")}{" "}
                <Mark>NetBird</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("oktaSetup.configureSsoStep2")} <Mark>{"Sign On > Settings"}</Mark>{" "}
                {t("oktaSetup.configureSsoStep2Suffix")}{" "}
                <Mark>Edit</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t("oktaSetup.configureSsoStep3Prefix")} <Mark>Credentials Details</Mark>{" "}
                {t("oktaSetup.configureSsoStep3Middle")}
                <Mark>Application username format</Mark> {t("oktaSetup.configureSsoStep3To")} <Mark>Email</Mark>{" "}
                {t("oktaSetup.configureSsoStep3AndSelect")} <Mark>Save</Mark>
              </p>
              <Lightbox image={oktaSSO} />
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Share2 size={20} />
            {t("oktaSetup.enableScimTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t("oktaSetup.enableScimStep1")}{" "}
                <Mark>{"Applications > Applications"}</Mark>
                {t("oktaSetup.enableScimStep1AndSelect")}{" "}
                <Mark>NetBird</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("oktaSetup.enableScimStep2Prefix")} <Mark>Provisioning</Mark>{" "}
                {t("oktaSetup.enableScimStep2Tab")}{" "}
                <Mark>Integration</Mark>
                {t("oktaSetup.enableScimStep2Then")}{" "}
                <Mark>Configure API Integration</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("oktaSetup.enableScimStep3Prefix")} <Mark>Enable API integration</Mark>{" "}
                {t("oktaSetup.enableScimStep3Middle")} <Mark>API Token</Mark>{" "}
                {t("oktaSetup.enableScimStep3Field")}
              </p>
              <MinimalList
                data={[{ label: "Authorization (Bearer)", value: authToken }]}
              />
            </Steps.Step>
            <Steps.Step step={4} line={false}>
              <p className={"font-normal"}>
                {t("oktaSetup.enableScimStep4Prefix")} <Mark>Test API Credentials</Mark>{" "}
                {t("oktaSetup.enableScimStep4Middle")} <Mark>Save</Mark>
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 3 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Box size={20} />
            {t("oktaSetup.configureScimTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t("oktaSetup.configureScimStep1Prefix")} <Mark>{"Provisioning > Settings > To App"}</Mark>{" "}
                {t("oktaSetup.configureScimStep1AndClick")} <Mark>Edit</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t("oktaSetup.configureScimStep2Prefix")} <Mark>Create Users</Mark>
                {t("oktaSetup.configureScimStep2Middle")}{" "}
                <Mark>Update User Attributes</Mark>
                {t("oktaSetup.configureScimStep2And")}{" "}
                <Mark>Deactivate Users</Mark> {t("oktaSetup.configureScimStep2Suffix")} <Mark>Save</Mark>
              </p>
              <Lightbox image={oktaSCIMToApp} />
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 4 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <UserCircle size={20} />
            {t("oktaSetup.syncUsersTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t("oktaSetup.syncUsersStep1Prefix")} <Mark>Assignments</Mark>{" "}
                {t("oktaSetup.syncUsersStep1Tab")}{" "}
                <Mark>Assign</Mark> {t("oktaSetup.syncUsersStep1AndClick")} <Mark>Assign to Groups</Mark>
              </p>
              <Lightbox image={oktaGroupsAssignments} />
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("oktaSetup.syncUsersStep2Prefix")}{" "}
                <Mark>Assign</Mark> {t("oktaSetup.syncUsersStep2AndClick")} <Mark>Save and Go Back</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t("oktaSetup.syncUsersStep3Prefix")} <Mark>Done</Mark>{" "}
                {t("oktaSetup.syncUsersStep3Suffix")}
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 5 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <FolderGit2 size={20} />
            {t("oktaSetup.syncGroupsTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t("oktaSetup.syncGroupsStep1Prefix")} <Mark>Push Groups</Mark>{" "}
                {t("oktaSetup.syncGroupsStep1Tab")}{" "}
                <Mark>Push Groups</Mark> {t("oktaSetup.syncGroupsStep1AndClick")}{" "}
                <Mark>Find groups by name</Mark>
              </p>
              <Lightbox image={oktaSyncGroups} />
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t("oktaSetup.syncGroupsStep2Prefix")} <Mark>Save</Mark>
                {t("oktaSetup.syncGroupsStep2Suffix")}
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      <ModalFooter className={"items-center gap-4"}>
        {step === -1 && (
          <Button
            variant={"primary"}
            className={"w-full"}
            onClick={() => setStep(step + 1)}
            disabled={!connectorId || connectorId === ""}
          >
            {t("common.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step > 0 && (
          <Button
            variant={"secondary"}
            className={"w-full"}
            onClick={() => setStep(step - 1)}
          >
            <IconArrowLeft size={16} />
            {t("common.back")}
          </Button>
        )}
        {step >= 0 && step < maxSteps && (
          <Button
            variant={"primary"}
            className={"w-full"}
            onClick={() => setStep(step + 1)}
          >
            {step == 0 ? t("idpSync.getStarted") : t("common.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step == maxSteps && (
          <Button
            variant={"primary"}
            className={"w-full"}
            onClick={() => {
              onSuccess();
            }}
          >
            {t("idpSync.finishSetup")}
          </Button>
        )}
      </ModalFooter>
      {(step == 0 || step == -1) && (
        <div
          className={
            "text-center z-0 mt-2.5 text-xs text-nb-gray-300 flex items-center justify-center gap-2 font-normal"
          }
        >
          <Clock4 size={12} />
          <div>
            {t("idpSync.estimatedSetupTime")}
            <span className={"font-medium"}> {t("oktaSetup.estimatedTime")}</span>
          </div>
        </div>
      )}
    </ModalContent>
  );
}

export function SetupSSOContent() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const maxSteps = 2;

  return (
    <ModalContent
      maxWidthClass={cn("relative", step == 2 ? "max-w-xl" : "max-w-lg")}
      showClose={true}
      className={""}
      onEscapeKeyDown={(e) => step > 0 && e.preventDefault()}
      onInteractOutside={(e) => step > 0 && e.preventDefault()}
      onPointerDownOutside={(e) => step > 0 && e.preventDefault()}
    >
      <GradientFadedBackground />

      {step > 0 && (
        <div className={"flex gap-2 w-full items-center justify-center mb-4"}>
          {Array.from({ length: maxSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-8 h-1 rounded-full bg-nb-gray-800",
                step >= index + 1 && "bg-netbird",
              )}
            />
          ))}
        </div>
      )}

      <IntegrationModalHeader
        image={integrationImage}
        title={t("oktaSetup.ssoConnectTitle")}
        description={t("oktaSetup.ssoConnectDescription")}
      />

      {step == 0 && (
        <div
          className={
            "px-8 py-3 flex z-0 flex-col gap-0 text-sm mb-3 text-center justify-center items-center"
          }
        >
          <div
            className={
              "mt-6 text-base font-medium text-nb-gray-100 flex gap-2 items-center justify-center"
            }
          >
            <Shield size={16} />
            {t("oktaSetup.requiredPermissions")}
          </div>
          <p className={"mt-2 !text-nb-gray-300 !leading-[1.5]"}>
            {t("oktaSetup.accountPrefix")}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t("oktaSetup.accountType")}
            </span>{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t("oktaSetup.permissionsWord")}
            </span>
            .{" "}
            {t("oktaSetup.accountSuffix")}
          </p>
          <div
            className={
              "flex items-center flex-col gap-0 mt-2 w-full justify-center max-w-lg"
            }
          >
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <PlusCircle size={14} className={"text-sky-500"} />
              {t("oktaSetup.permAdd")}
            </div>
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <Settings2 size={14} className={"text-sky-500"} />
              {t("oktaSetup.permConfigure")}
            </div>
          </div>
        </div>
      )}

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Box size={20} />
            {t("oktaSetup.installAppTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t("oktaSetup.installAppStep1")}{" "}
                <InlineLink
                  className={"inline"}
                  target={"_blank"}
                  href={"https://www.okta.com/integrations/netbird"}
                >
                  {t("okta.step1Link")}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("oktaSetup.installAppStep2Prefix")} <Mark>+ Add Integration</Mark>{" "}
                {t("oktaSetup.installAppStep2AndThen")} <Mark>Done</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p>
                {t("oktaSetup.installAppStep3Prefix")}{" "}
                <Mark>Assignments</Mark> {t("oktaSetup.installAppStep3Tab")} <Mark>Assign</Mark>{" "}
                {t("oktaSetup.installAppStep3AndClick")} <Mark>Assign to People</Mark>{" "}
                {t("oktaSetup.installAppStep3Suffix")}
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <MailIcon size={20} />
            {t("oktaSetup.shareDetailsTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("oktaSetup.shareDetailsStep1Prefix")} <Mark>{"Sign On"}</Mark>{" "}
                {t("oktaSetup.shareDetailsStep1Tab")} <br />
                {t("oktaSetup.shareDetailsStep1Of")} <Mark>Client ID</Mark> <Mark>Client secret</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("oktaSetup.shareDetailsStep2Prefix")}{" "}
                <Mark>Okta account domain</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("oktaSetup.shareDetailsStep3Prefix")} <Mark>Client ID</Mark> <Mark>Client secret</Mark>{" "}
                <Mark>Okta account domain</Mark> {t("oktaSetup.shareDetailsStep3And")} {"user's"}
                <Mark>Primary email domain</Mark> {t("oktaSetup.shareDetailsStep3With")}
              </p>
            </Steps.Step>
            <Steps.Step step={4} line={false}>
              <p className={"font-normal"}>
                Once the NetBird team has enabled the authentication for your
                account you will receive an email. After that you can visit{" "}
                <InlineLink href={"https://app.netbird.io"}>
                  app.netbird.io
                </InlineLink>{" "}
                and authenticate using your Okta’s credentials
              </p>
            </Steps.Step>
          </Steps>

          <div className={"flex flex-col gap-6 max-w-lg mb-4 z-0"}>
            <div
              className={
                "bg-netbird-950 px-6 py-4 rounded-md border border-netbird-500 "
              }
            >
              <p className={"!text-netbird-200"}>
                {t("oktaSetup.shareDetailsTipPrefix")}{" "}
                <InlineLink
                  href={"mailto:support@netbird.io"}
                  className={"inline !text-netbird-500 font-medium"}
                >
                  {" "}
                  1Password
                </InlineLink>{" "}
                {t("oktaSetup.shareDetailsTipMiddle")}{" "}
                <InlineLink
                  href={"mailto:support@netbird.io"}
                  className={"inline !text-netbird-500 font-medium"}
                >
                  {" "}
                  support@netbird.io
                </InlineLink>{" "}
              </p>
            </div>
          </div>
        </div>
      )}

      <ModalFooter className={"items-center gap-4"}>
        {step > 0 && (
          <Button
            variant={"secondary"}
            className={"w-full"}
            onClick={() => setStep(step - 1)}
          >
            <IconArrowLeft size={16} />
            {t("common.back")}
          </Button>
        )}
        {step >= 0 && step < maxSteps && (
          <Button
            variant={"primary"}
            className={"w-full"}
            onClick={() => setStep(step + 1)}
          >
            {step == 0 ? t("idpSync.getStarted") : t("common.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step == maxSteps && (
          <ModalClose asChild={true}>
            <Button variant={"primary"} className={"w-full"}>
              {t("common.close")}
            </Button>
          </ModalClose>
        )}
      </ModalFooter>
      {step == 0 && (
        <div
          className={
            "text-center z-0 mt-2.5 text-xs text-nb-gray-300 flex items-center justify-center gap-2 font-normal"
          }
        >
          <Clock4 size={12} />
          <div>
            {t("idpSync.estimatedSetupTime")}
            <span className={"font-medium"}> {t("oktaSetup.ssoEstimatedTime")}</span>
          </div>
        </div>
      )}
    </ModalContent>
  );
}
