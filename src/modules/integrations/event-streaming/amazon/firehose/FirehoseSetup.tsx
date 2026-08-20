import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import Steps from "@components/Steps";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/Tooltip";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Mark } from "@components/ui/Mark";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import {
  ExternalLinkIcon,
  Globe,
  GlobeIcon,
  InfoIcon,
  KeyRound,
  PencilLine,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useI18n } from "@/i18n/I18nProvider";
import firehoseLogo from "@/assets/integrations/firehose.png";
import { EventStream } from "@/interfaces/EventStream";
import { AmazonRegions } from "@/modules/integrations/event-streaming/amazon/AmazonRegions";
import {
  exampleAwsAccessKeyId,
  exampleAwsSecretAccessKey,
} from "@/modules/integrations/event-streaming/amazon/exampleCredentials";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function FirehoseSetup({
  open,
  onOpenChange,
  onSuccess,
}: Readonly<Props>) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
      <SetupContent
        onSuccess={() => {
          onOpenChange(false);
          onSuccess && onSuccess();
        }}
      />
    </Modal>
  );
}

type ModalProps = {
  onSuccess: () => void;
};

export function SetupContent({ onSuccess }: Readonly<ModalProps>) {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();

  const integrationRequest = useApiCall<EventStream>(
    "/integrations/event-streaming",
    true,
  );

  const firehoseRegions = AmazonRegions.map((region) => {
    return {
      label: region.name,
      value: region.code,
      icon: region.icon,
    } as SelectOption;
  });

  const iamDashboardURL = "https://console.aws.amazon.com/iam/home";
  const iamDocsURL =
    "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html";
  const firehoseDashboardURL = "https://console.aws.amazon.com/firehose/home";

  const [selectedRegion, setSelectedRegion] = useState(
    firehoseRegions[0].value,
  );

  const changeRegion = (region: string) => {
    setSelectedRegion(region);
  };

  const [secretKey, setSecretKey] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const accessKeyPlaceholder = useMemo(exampleAwsAccessKeyId, []);
  const secretKeyPlaceholder = useMemo(exampleAwsSecretAccessKey, []);
  const [streamName, setStreamName] = useState("");
  const [region, setRegion] = useState(firehoseRegions[0].value);
  const [step, setStep] = useState(1);

  const secretKeyEntered = secretKey.length > 0 && secretKey != "";
  const accessKeyEntered = accessKey.length > 0 && accessKey != "";
  const streamNameEntered = streamName.length > 0 && streamName != "";
  const regionEntered = region.length > 0 && region != "";

  const dataEntered =
    secretKeyEntered && accessKeyEntered && streamNameEntered && regionEntered;

  const connect = async () => {
    notify({
      title: t("firehose.notifyTitle"),
      description: t("firehose.notifyDescription"),
      promise: integrationRequest
        .post({
          platform: "firehose",
          config: {
            access_key: accessKey,
            secret_key: secretKey,
            stream_name: streamName,
            region: selectedRegion,
          },
          enabled: true,
        })
        .then(() => {
          mutate("/integrations/event-streaming");
          onSuccess();
        }),
      loadingMessage: t("idpSync.settingUpIntegration"),
    });
  };

  return (
    <ModalContent
      maxWidthClass={cn("relative", step === 1 ? "max-w-md" : "max-w-lg")}
      showClose={true}
      onEscapeKeyDown={(e) => step > 1 && e.preventDefault()}
      onInteractOutside={(e) => step > 1 && e.preventDefault()}
      onPointerDownOutside={(e) => step > 1 && e.preventDefault()}
    >
      <GradientFadedBackground />

      <IntegrationModalHeader
        image={firehoseLogo}
        title={t("firehose.connectTitle")}
        description={t("firehose.connectDescription")}
      />

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col mt-4 z-0"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <GlobeIcon size={16} />
            {t("firehose.selectRegionTitle")}
          </p>
          <p className={"mb-3 mt-2"}>
            {t("firehose.selectRegionHelp")}{" "}
            <InlineLink
              href={firehoseDashboardURL}
              target={"_blank"}
              variant={"default"}
              className={"inline"}
            >
              {t("firehose.dashboardLink")}
            </InlineLink>
          </p>
          <SelectDropdown
            value={selectedRegion}
            onChange={changeRegion}
            options={firehoseRegions}
            showValues={true}
          />
          <div className={"mt-3 hidden"}>
            <Input
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"flex items-center gap-2"}>
                  <Globe size={16} className={"text-nb-gray-300"} />
                </div>
              }
              placeholder={"eu-central-1"}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>

          <div className={"mb-3"}></div>
        </div>
      )}
      {step == 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 z-0"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <KeyRound size={16} />
            {t("firehose.createStreamTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>{t("firehose.navigateDashboard")}</p>
              <div className={"flex gap-4"}>
                <Link href={firehoseDashboardURL} passHref target={"_blank"}>
                  <Button variant={"primary"} size={"xs"}>
                    <ExternalLinkIcon size={14} />
                    {t("firehose.dashboardButton")}
                  </Button>
                </Link>
              </div>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("firehose.clickCreatePrefix")} <Mark>{t("integrations.createFirehoseStream")}</Mark>
                {t("firehose.clickCreateSuffix")}
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("firehose.asSourcePrefix")} <Mark>{t("integrations.source")}</Mark>
                {t("firehose.asSourceSelect")} <Mark>{t("integrations.directPut")}</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={4}>
              <p className={"font-normal"}>
                {t("firehose.asDestinationPrefix")} <Mark>{t("integrations.destination")}</Mark>
                {t("firehose.asDestinationSuffix")}
              </p>
            </Steps.Step>
            <Steps.Step step={5}>
              <p className={"font-normal"}>
                {t("firehose.giveNamePrefix")}{" "}
                <Mark copy>netbird-activity-events</Mark>
                {t("firehose.andClick")} <Mark>{t("integrations.createFirehoseStream")}</Mark>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon
                      size={16}
                      className={"inline-block ml-1 text-netbird"}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className={"max-w-[200px] text-xs"}>
                      {t("firehose.streamNameTooltip")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </p>
            </Steps.Step>
            <Steps.Step step={6} line={false}>
              <p className={"font-normal"}>{t("firehose.enterStreamName")}</p>
              <div className={"mb-4"}>
                <Input
                  type={"text"}
                  className={"w-full"}
                  customPrefix={
                    <div className={"flex items-center gap-2"}>
                      <PencilLine size={16} className={"text-nb-gray-300"} />
                    </div>
                  }
                  placeholder={"netbird-activity-events"}
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                />
              </div>
            </Steps.Step>
          </Steps>
        </div>
      )}
      {step == 3 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 z-0"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <KeyRound size={16} />
            {t("firehose.createIamTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>{t("firehose.navigateIamDashboard")}</p>
              <div className={"flex gap-4"}>
                <Link href={iamDashboardURL} passHref target={"_blank"}>
                  <Button variant={"primary"} size={"xs"}>
                    <ExternalLinkIcon size={14} />
                    {t("firehose.iamDashboardButton")}
                  </Button>
                </Link>
              </div>
            </Steps.Step>
            <Steps.Step step={2}>
              <p>
                {t("firehose.createIamUserPrefix")}{" "}
                <InlineLink href={iamDocsURL} target={"_blank"}>
                  {t("firehose.amazonDocs")}
                  <ExternalLinkIcon size={12} />
                </InlineLink>
                )
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("firehose.createPolicyPrefix")} <Mark>firehose:PutRecord</Mark>
                {t("firehose.createPolicyMiddle")} <Mark>firehose:PutRecordBatch</Mark>
                {t("firehose.createPolicySuffix")}
              </p>
            </Steps.Step>
            <Steps.Step step={4}>
              <p className={"font-normal"}>
                {t("firehose.securityCredentialsPrefix")} <Mark>{t("integrations.securityCredentials")}</Mark>
                {t("firehose.securityCredentialsTab")} <Mark>{t("integrations.createAccessKey")}</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={5}>
              <p className={"font-normal"}>{t("firehose.enterAccessKey")}</p>
              <div className={"mb-4"}>
                <Input
                  type={"text"}
                  className={"w-full"}
                  customPrefix={
                    <div className={"flex items-center gap-2"}>
                      <KeyRound size={16} className={"text-nb-gray-300"} />
                    </div>
                  }
                  placeholder={accessKeyPlaceholder}
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                />
              </div>
            </Steps.Step>
            <Steps.Step step={6} line={false}>
              <p className={"font-normal"}>{t("firehose.enterSecretKey")}</p>
              <div className={"mb-4"}>
                <Input
                  type={"text"}
                  className={"w-full"}
                  customPrefix={
                    <div className={"flex items-center gap-2"}>
                      <KeyRound size={16} className={"text-nb-gray-300"} />
                    </div>
                  }
                  placeholder={secretKeyPlaceholder}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
              </div>
            </Steps.Step>
          </Steps>
        </div>
      )}

      <ModalFooter className={"items-center gap-4"}>
        {step == 1 && (
          <Button
            variant={"primary"}
            className={"w-full"}
            disabled={!regionEntered}
            onClick={() => setStep(2)}
          >
            {t("common.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step == 2 && (
          <>
            <Button
              variant={"secondary"}
              className={"w-full"}
              onClick={() => setStep(1)}
            >
              <IconArrowLeft size={16} />
              {t("common.back")}
            </Button>
            <Button
              variant={"primary"}
              className={"w-full"}
              disabled={!streamNameEntered}
              onClick={() => setStep(3)}
            >
              {t("common.continue")}
              <IconArrowRight size={16} />
            </Button>
          </>
        )}
        {step == 3 && (
          <>
            <Button
              variant={"secondary"}
              className={"w-full"}
              onClick={() => setStep(2)}
            >
              <IconArrowLeft size={16} />
              {t("common.back")}
            </Button>
            <Button
              variant={"primary"}
              className={"w-full"}
              disabled={!dataEntered}
              onClick={connect}
            >
              <Repeat size={16} />
              {t("idpSync.connect")}
            </Button>
          </>
        )}
      </ModalFooter>
    </ModalContent>
  );
}
