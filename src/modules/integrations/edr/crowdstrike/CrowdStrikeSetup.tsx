import Button from "@components/Button";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import { PeerGroupSelector } from "@components/PeerGroupSelector";
import { SelectDropdown } from "@components/select/SelectDropdown";
import Steps from "@components/Steps";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Mark } from "@components/ui/Mark";
import {
  IconArrowLeft,
  IconArrowRight,
  IconDevicesCheck,
} from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { isEmpty } from "lodash";
import {
  Clock4,
  ExternalLinkIcon,
  GlobeIcon,
  KeyRound,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useSWRConfig } from "swr";
import { useI18n } from "@/i18n/I18nProvider";
import integrationImage from "@/assets/integrations/crowdstrike.png";
import { Account } from "@/interfaces/Account";
import { CrowdstrikeIntegration } from "@/interfaces/EDR";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import {
  CrowdStrikeRegions,
  CrowdStrikeRegionsData,
} from "@/modules/integrations/edr/crowdstrike/CrowdStrikeRegions";
import { CrowdStrikeZtaScoreInput } from "@/modules/integrations/edr/crowdstrike/CrowdStrikeZtaScoreInput";
import { CrowdStrikeZtaToggle } from "@/modules/integrations/edr/crowdstrike/CrowdStrikeZtaToggle";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  account: Account;
};

export default function CrowdStrikeSetup({
  open,
  onOpenChange,
  onSuccess,
  account,
}: Props) {
  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
        <SetupContent
          account={account}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess && onSuccess();
          }}
        />
      </Modal>
    </>
  );
}

type ModalProps = {
  onSuccess: () => void;
  account: Account;
};

export function SetupContent({ onSuccess, account }: ModalProps) {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const [step, setStep] = useState(0);
  const maxSteps = 2;

  const falconRequest = useApiCall<CrowdstrikeIntegration>(
    "/integrations/edr/falcon",
    true,
  ).post;

  const settingsRequest = useApiCall<Account>("/accounts/" + account.id);

  const [selectedRegion, setSelectedRegion] = useState(
    CrowdStrikeRegionsData[0].value,
  );
  const [groups, setGroups, { save: saveGroups }] = useGroupHelper({
    initial: [],
  });

  const [secret, setSecret] = useState("");
  const [clientId, setClientId] = useState("");

  const secretEntered = secret.length > 0 && secret != "";
  const clientIDEntered = clientId.length > 0 && clientId != "";
  const secretAndClientIDEntered = secretEntered && clientIDEntered;

  const apiPageUrl =
    CrowdStrikeRegions.find((region) => region.cloud_id == selectedRegion)
      ?.site + "/api-clients-and-keys";

  const [ztaScore, setZtaScore] = useState("80");
  const [ztaEnabled, setZtaEnabled] = useState(false);

  const connect = async () => {
    await settingsRequest.put({
      id: account.id,
      settings: {
        ...account.settings,
        peer_login_expiration_enabled:
          account?.settings?.peer_login_expiration_enabled,
        peer_login_expiration: account?.settings?.peer_login_expiration,
        extra: {
          ...account.settings?.extra,
          peer_approval_enabled: false,
        },
      },
    });
    const savedGroups = await saveGroups();
    const score = parseInt(ztaScore);

    notify({
      title: t("crowdStrike.setup.notifyTitle"),
      description: t("crowdStrike.setup.notifyDescription"),
      promise: falconRequest({
        client_id: clientId,
        secret: secret,
        cloud_id: selectedRegion,
        groups: savedGroups.map((group) => group.id) || [],
        zta_score_threshold:
          ztaEnabled && score > 0 && score <= 100 ? score : 0,
      }).then(() => {
        mutate("/accounts");
        mutate("/integrations/edr/falcon");
        onSuccess();
      }),
      loadingMessage: t("idpSync.settingUpIntegration"),
    });
  };

  const ztaError =
    ztaEnabled && (parseInt(ztaScore) <= 0 || parseInt(ztaScore) > 100)
      ? t("crowdStrike.ztaScoreError")
      : undefined;

  const hasZtaError = ztaError != undefined;

  const isDisabled =
    (step == 1 && !secretAndClientIDEntered) || (step == 2 && isEmpty(groups));

  return (
    <ModalContent
      maxWidthClass={cn("relative", step == 0 ? "max-w-md" : "max-w-xl")}
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
        title={t("crowdStrike.connectTitle")}
        description={t("crowdStrike.connectDescription")}
      />

      {step == 0 && (
        <div className={"px-8 py-3 flex flex-col mt-4 z-0"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <GlobeIcon size={16} />
            {t("crowdStrike.setup.selectRegionTitle")}
          </p>
          <p className={"mb-3 mt-2"}>
            {t("crowdStrike.setup.selectRegionHelp")}
          </p>
          <SelectDropdown
            value={selectedRegion}
            onChange={setSelectedRegion}
            options={CrowdStrikeRegionsData}
          />

          <div className={"mb-3"}></div>
        </div>
      )}

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 z-0"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <KeyRound size={16} />
            {t("crowdStrike.setup.apiCredentialsTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>{t("crowdStrike.setup.navigateApiClients")}</p>
              <div className={"flex gap-4"}>
                <Link href={apiPageUrl} passHref target={"_blank"}>
                  <Button variant={"primary"} size={"xs"}>
                    <ExternalLinkIcon size={14} />
                    {t("crowdStrike.setup.apiClientsButton")}
                  </Button>
                </Link>
              </div>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("crowdStrike.setup.step2Click")} <Mark>{t("edr.createApiClient")}</Mark>{" "}
                {t("crowdStrike.setup.step2AndEnter")}
                <Mark copy>NetBird</Mark>
                {t("crowdStrike.setup.step2AsClientName")}{" "}
                <Mark>{t("edr.hostsRead")}</Mark> {t("crowdStrike.setup.step2And")}{" "}
                <Mark>{t("edr.zeroTrustAssessmentRead")}</Mark>{" "}
                {t("crowdStrike.setup.step2AsScope")}
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t("crowdStrike.setup.step3Click")} <Mark>{t("edr.create")}</Mark>{" "}
                {t("crowdStrike.setup.step3AndEnterCredentials")}
              </p>
            </Steps.Step>
          </Steps>
          <div className={"mb-4 flex-col gap-4 flex"}>
            <Input
              type={"text"}
              className={"w-full"}
              customPrefix={<div className={"min-w-[60px]"}>{t("crowdStrike.setup.clientIdLabel")}</div>}
              placeholder={"9f6c80ac8a384e1d88a1fd1f279541d0"}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <Input
              type={"text"}
              className={"w-full"}
              customPrefix={<div className={"min-w-[60px]"}>{t("crowdStrike.setup.secretLabel")}</div>}
              placeholder={"qF41DKYkQJBS53w0XPVyO6v9AtZ8WMbHp72eIdml"}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </div>
        </div>
      )}

      {step == 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <IconDevicesCheck size={20} />
            {t("crowdStrike.setup.peerApprovalTitle")}
          </p>

          <div className={"flex flex-col gap-6"}>
            <div>
              <HelpText className={"max-w-lg mt-2"}>
                {t("crowdStrike.setup.peerApprovalHelp")}
              </HelpText>

              <PeerGroupSelector values={groups} onChange={setGroups} />
            </div>
            <div>
              <CrowdStrikeZtaToggle
                value={ztaEnabled}
                onChange={setZtaEnabled}
              />
              <CrowdStrikeZtaScoreInput
                enabled={ztaEnabled}
                value={ztaScore}
                error={ztaError}
                onChange={setZtaScore}
              />
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
            disabled={isDisabled}
          >
            {step == 0 ? t("idpSync.getStarted") : t("common.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step == maxSteps && (
          <Button
            variant={"primary"}
            className={"w-full"}
            onClick={connect}
            disabled={isDisabled || hasZtaError}
          >
            <Repeat size={16} />
            {t("idpSync.connect")}
          </Button>
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
            <span className={"font-medium"}> {t("crowdStrike.setup.estimatedTime")}</span>
          </div>
        </div>
      )}
    </ModalContent>
  );
}
