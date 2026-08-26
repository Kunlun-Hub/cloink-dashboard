import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/Accordion";
import Button from "@components/Button";
import Code from "@components/Code";
import Separator from "@components/Separator";
import Steps from "@components/Steps";
import TabsContentPadding, { TabsContent } from "@components/Tabs";
import { GRPC_API_ORIGIN, pkgsDownloadUrl } from "@utils/netbird";
import {
  BeerIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PackageOpenIcon,
  TerminalSquareIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import useVersionReleases, {
  resolveReleaseDownloadURL,
} from "@/hooks/useVersionReleases";
import { useI18n } from "@/i18n/I18nProvider";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import {
  NetBirdUpCommand,
  RoutingPeerSetupKeyInfo,
} from "@/modules/setup-netbird-modal/SetupModal";

type Props = {
  setupKey?: string;
  setupKeyContent?: React.ReactNode;
  setupKeyPlaceholder?: string;
  showSetupKeyInfo?: boolean;
  hostname?: string;
};
export default function MacOSTab({
  setupKey,
  setupKeyContent,
  setupKeyPlaceholder,
  showSetupKeyInfo,
  hostname,
}: Readonly<Props>) {
  const { t } = useI18n();
  // Signed installers published in Settings → Version Releases take priority;
  // the static pkgs.netbird.io link remains as a fallback when none exist.
  const releases = useVersionReleases("macos");
  const macosUrl = releases.length
    ? resolveReleaseDownloadURL(releases[0].downloadUrl)
    : pkgsDownloadUrl("macos/universal");
  // Mirrors WindowsTab: server flow (setupKeyContent present) forces
  // the CLI run branch so the netbird up command stays visible while
  // the operator generates a key.
  const useCliRun = !!setupKey || !!setupKeyContent;
  const baseMgmtStep = 2;
  const keyStep = GRPC_API_ORIGIN ? 3 : 2;
  const runStep = keyStep + (setupKeyContent ? 1 : 0);
  const usingSetupKeyParam = !!setupKey || !!setupKeyPlaceholder;
  return (
    <TabsContent value={String(OperatingSystem.APPLE)}>
      <TabsContentPadding>
        <p className={"font-medium flex gap-3 items-center text-base"}>
          <PackageOpenIcon size={16} />
          {t("setupNetbirdModal.installOnMacOS")}
        </p>
        <Steps>
          <Steps.Step step={1}>
            <div className={"flex items-center gap-1 text-sm font-light"}>
              {t("setupNetbirdModal.downloadAndRunInstaller")}
            </div>
            <div className={"flex gap-4 mt-1 flex-wrap"}>
              <Link
                href={macosUrl}
                passHref
                prefetch={false}
                target={"_blank"}
              >
                <Button variant={"primary"}>
                  <DownloadIcon size={14} />
                  {t("setupNetbirdModal.downloadNetBird")}
                </Button>
              </Link>
            </div>
          </Steps.Step>

          {GRPC_API_ORIGIN && (
            <Steps.Step step={baseMgmtStep}>
              <p>
                {t("setupNetbirdModal.managementUrlInstructions")}
              </p>
              <Code>
                <Code.Line>{GRPC_API_ORIGIN}</Code.Line>
              </Code>
            </Steps.Step>
          )}

          {setupKeyContent && (
            <Steps.Step step={keyStep}>{setupKeyContent}</Steps.Step>
          )}

          {useCliRun ? (
            <Steps.Step step={runStep} line={false}>
              <p>
                {t("setupNetbirdModal.openTerminalAndRun")}{" "}
                {showSetupKeyInfo && <RoutingPeerSetupKeyInfo />}
              </p>

              <NetBirdUpCommand
                setupKey={setupKey}
                setupKeyPlaceholder={setupKeyPlaceholder}
                hostname={hostname}
              />
            </Steps.Step>
          ) : (
            <>
              <Steps.Step step={runStep}>
                <p>
                  {t("setupNetbirdModal.clickConnect")}
                </p>
              </Steps.Step>
              <Steps.Step step={runStep + 1} line={false}>
                <p>{t("setupNetbirdModal.signUpEmail")}</p>
              </Steps.Step>
            </>
          )}
        </Steps>
      </TabsContentPadding>
      <Separator />
      <TabsContentPadding>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <TerminalSquareIcon size={16} />
              {t("setupNetbirdModal.installManuallyTerminal")}
            </AccordionTrigger>
            <AccordionContent>
              <Steps>
                <Steps.Step step={1}>
                  <Code>
                    curl -fsSL https://pkgs.netbird.io/install.sh | sh
                  </Code>
                </Steps.Step>
                <Steps.Step step={2} line={false}>
                  <p>
                    {t("setupNetbirdModal.runNetBird")} {!usingSetupKeyParam && t("setupNetbirdModal.andLogInBrowser")}
                    {showSetupKeyInfo && <RoutingPeerSetupKeyInfo />}
                  </p>
                  <NetBirdUpCommand
                    setupKey={setupKey}
                    setupKeyPlaceholder={setupKeyPlaceholder}
                    hostname={hostname}
                  />
                </Steps.Step>
              </Steps>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContentPadding>
      <Separator />
      <TabsContentPadding>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <BeerIcon size={16} /> {t("setupNetbirdModal.installManuallyHomebrew")}
            </AccordionTrigger>
            <AccordionContent>
              <Steps>
                <Steps.Step step={1}>
                  <p>{t("setupNetbirdModal.downloadInstallHomebrew")}</p>
                  <div className={"flex gap-4"}>
                    <Link href={"https://brew.sh/"} passHref target={"_blank"}>
                      <Button variant={"primary"}>
                        <ExternalLinkIcon size={14} />
                        {t("setupNetbirdModal.homebrewInstallationGuide")}
                      </Button>
                    </Link>
                  </div>
                </Steps.Step>
                <Steps.Step step={2}>
                  <p>{t("common.installNetBird")}</p>
                  <Code
                    codeToCopy={[
                      `brew install netbirdio/tap/netbird`,
                      `brew install --cask netbirdio/tap/netbird-ui`,
                    ].join("\n")}
                  >
                    <Code.Comment># for CLI only</Code.Comment>
                    <Code.Line>brew install netbirdio/tap/netbird</Code.Line>
                    <Code.Comment># for GUI package</Code.Comment>
                    <Code.Line>
                      brew install --cask netbirdio/tap/netbird-ui
                    </Code.Line>
                  </Code>
                </Steps.Step>
                <Steps.Step step={3}>
                  <p>{t("setupNetbirdModal.startNetBirdDaemon")}</p>
                  <Code>
                    <Code.Line>sudo netbird service install</Code.Line>
                    <Code.Line>sudo netbird service start</Code.Line>
                  </Code>
                </Steps.Step>
                <Steps.Step step={4} line={false}>
                  <p>
                    {t("setupNetbirdModal.runNetBird")} {!usingSetupKeyParam && t("setupNetbirdModal.andLogInBrowser")}
                    {showSetupKeyInfo && <RoutingPeerSetupKeyInfo />}
                  </p>
                  <NetBirdUpCommand
                    setupKey={setupKey}
                    setupKeyPlaceholder={setupKeyPlaceholder}
                    hostname={hostname}
                  />
                </Steps.Step>
              </Steps>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContentPadding>
    </TabsContent>
  );
}
