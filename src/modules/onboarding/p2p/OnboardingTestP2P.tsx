import Button from "@components/Button";
import Code from "@components/Code";
import InlineLink from "@components/InlineLink";
import Steps from "@components/Steps";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Peer } from "@/interfaces/Peer";
import { Policy } from "@/interfaces/Policy";

type Props = {
  firstDevice?: Peer;
  secondDevice?: Peer;
  policy?: Policy;
  onNext?: () => void;
  onTroubleshootingClick?: () => void;
};

export const OnboardingTestP2P = ({
  firstDevice,
  secondDevice,
  onNext,
  onTroubleshootingClick,
}: Props) => {
  const { t } = useI18n();

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center max-w-sm mx-auto"}>
          {t("onboarding.testResourceTitle")}
        </h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t("onboarding.testP2PDescription")}
        </div>
      </div>

      <Steps className={"stepper-bg-variant"}>
        <Steps.Step step={1}>
          <p className={"!text-nb-gray-300"}>
            {t("onboarding.testP2PStep1Prefix")}{" "}
            <span className={"text-white"}>{firstDevice?.name}</span>{" "}
            {t("onboarding.testP2PStep1Middle")}{" "}
            <span className={"text-white"}>{secondDevice?.name}</span>
            {t("onboarding.testP2PStep1Suffix")}
          </p>
          <Code message={t("onboarding.commandCopied")}>
            ping {secondDevice?.ip}
          </Code>
        </Steps.Step>
        <Steps.Step step={2} line={false} className={"pb-0"}>
          <p className={"!text-nb-gray-300"}>
            {t("onboarding.testStep2Prefix")}{" "}
            <InlineLink
              onClick={onTroubleshootingClick}
              href={"https://docs.netbird.io/how-to/troubleshooting-client"}
              target={"_blank"}
            >
              {t("onboarding.troubleshootingGuide")}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </p>
          <div className={"mt-2"}>
            <Button
              variant={"secondaryLighter"}
              className={"w-full"}
              onClick={onNext}
            >
              {t("onboarding.itWorksContinue")}
            </Button>
          </div>
        </Steps.Step>
      </Steps>
    </div>
  );
};
