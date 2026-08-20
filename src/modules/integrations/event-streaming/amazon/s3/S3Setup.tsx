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
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Mark } from "@components/ui/Mark";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import {
  ExternalLinkIcon,
  Globe,
  GlobeIcon,
  KeyRound,
  PencilLine,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useI18n } from "@/i18n/I18nProvider";
import s3Logo from "@/assets/integrations/s3.svg";
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

export default function S3Setup({
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

  const s3Regions = AmazonRegions.map((region) => {
    return {
      label: region.name,
      value: region.code,
      icon: region.icon,
    } as SelectOption;
  });

  const iamDashboardURL = "https://console.aws.amazon.com/iam/home";
  const iamDocsURL =
    "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html";
  const s3DashboardURL = "https://console.aws.amazon.com/s3/home";

  const [selectedRegion, setSelectedRegion] = useState(s3Regions[0].value);

  const changeRegion = (region: string) => {
    setSelectedRegion(region);
  };

  const [secretKey, setSecretKey] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const accessKeyPlaceholder = useMemo(exampleAwsAccessKeyId, []);
  const secretKeyPlaceholder = useMemo(exampleAwsSecretAccessKey, []);
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState(s3Regions[0].value);
  const [step, setStep] = useState(1);

  const secretKeyEntered = secretKey.length > 0 && secretKey != "";
  const accessKeyEntered = accessKey.length > 0 && accessKey != "";
  const bucketNameEntered = bucketName.length > 0 && bucketName != "";
  const regionEntered = region.length > 0 && region != "";

  const dataEntered =
    secretKeyEntered && accessKeyEntered && bucketNameEntered && regionEntered;

  const connect = async () => {
    notify({
      title: t("s3.notifyTitle"),
      description: t("s3.notifyDescription"),
      promise: integrationRequest
        .post({
          platform: "s3",
          config: {
            access_key: accessKey,
            secret_key: secretKey,
            bucket_name: bucketName,
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
        image={s3Logo}
        title={t("s3.connectTitle")}
        description={t("s3.connectDescription")}
      />

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col mt-4 z-0"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <GlobeIcon size={16} />
            {t("s3.selectRegionTitle")}
          </p>
          <p className={"mb-3 mt-2"}>
            {t("s3.selectRegionHelp")}{" "}
            <InlineLink
              href={s3DashboardURL}
              target={"_blank"}
              variant={"default"}
              className={"inline"}
            >
              {t("s3.dashboardLink")}
            </InlineLink>
          </p>
          <SelectDropdown
            value={selectedRegion}
            onChange={changeRegion}
            options={s3Regions}
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
            {t("s3.createBucketTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>{t("s3.navigateDashboard")}</p>
              <div className={"flex gap-4"}>
                <Link href={s3DashboardURL} passHref target={"_blank"}>
                  <Button variant={"primary"} size={"xs"}>
                    <ExternalLinkIcon size={14} />
                    Amazon S3 Dashboard
                  </Button>
                </Link>
              </div>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("s3.clickCreatePrefix")} <Mark>Create bucket</Mark>
                {t("s3.clickCreateSuffix")}
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("s3.giveNamePrefix")}{" "}
                <Mark copy>netbird-activity-events</Mark>
                {t("s3.andClick")} <Mark>Create bucket</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={4} line={false}>
              <p className={"font-normal"}>{t("s3.enterBucketName")}</p>
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
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value)}
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
            {t("s3.createIamTitle")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>{t("s3.navigateIamDashboard")}</p>
              <div className={"flex gap-4"}>
                <Link href={iamDashboardURL} passHref target={"_blank"}>
                  <Button variant={"primary"} size={"xs"}>
                    <ExternalLinkIcon size={14} />
                    Amazon IAM Dashboard
                  </Button>
                </Link>
              </div>
            </Steps.Step>
            <Steps.Step step={2}>
              <p>
                {t("s3.createIamUserPrefix")}{" "}
                <InlineLink href={iamDocsURL} target={"_blank"}>
                  {t("s3.amazonDocs")}
                  <ExternalLinkIcon size={12} />
                </InlineLink>
                )
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("s3.createPolicyPrefix")} <Mark>s3:PutObject</Mark> {t("s3.createPolicyMiddle")}
                <Mark>s3:PutObjectAcl</Mark> {t("s3.createPolicySuffix")}
              </p>
            </Steps.Step>
            <Steps.Step step={4}>
              <p className={"font-normal"}>
                {t("s3.securityCredentialsPrefix")} <Mark>Security Credentials</Mark>
                {t("s3.securityCredentialsTab")} <Mark>Create access key</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={5}>
              <p className={"font-normal"}>{t("s3.enterAccessKey")}</p>
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
              <p className={"font-normal"}>{t("s3.enterSecretKey")}</p>
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
              disabled={!bucketNameEntered}
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
