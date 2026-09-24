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
import { GRPC_API_ORIGIN } from "@utils/netbird";
import {
  DownloadIcon,
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
  ManagementUrlStep,
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
  // Only signed installers published in Settings → Version Releases are
  // offered — the official NetBird packages must never be served from here.
  const releases = useVersionReleases("macos");
  const macosReleaseUrl = releases.length
    ? resolveReleaseDownloadURL(releases[0].downloadUrl)
    : undefined;
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
              {macosReleaseUrl ? (
                <Link
                  href={macosReleaseUrl}
                  passHref
                  prefetch={false}
                  target={"_blank"}
                >
                  <Button variant={"primary"}>
                    <DownloadIcon size={14} />
                    {t("setupNetbirdModal.downloadNetBird")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Button variant={"primary"} disabled>
                    <DownloadIcon size={14} />
                    {t("setupNetbirdModal.downloadNetBird")}
                  </Button>
                  <p className={"text-sm font-light text-nb-gray-300 basis-full"}>
                    {t("setupNetbirdModal.noMacosReleasePublished")}
                  </p>
                </>
              )}
            </div>
          </Steps.Step>

          {GRPC_API_ORIGIN && (
            <Steps.Step step={baseMgmtStep}>
              <ManagementUrlStep trayName={t("setupModal.menuBar")} />
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
              {macosReleaseUrl ? (
                <Steps>
                  <Steps.Step step={1}>
                    <p>{t("setupNetbirdModal.downloadExtractCli")}</p>
                    <Code
                      codeToCopy={`curl -fSL -o cloink.tar.gz "${macosReleaseUrl}"\ntar -xzf cloink.tar.gz`}
                    >
                      <Code.Line>
                        curl -fSL -o cloink.tar.gz &quot;{macosReleaseUrl}&quot;
                      </Code.Line>
                      <Code.Line>tar -xzf cloink.tar.gz</Code.Line>
                    </Code>
                  </Steps.Step>
                  <Steps.Step step={2}>
                    <p>{t("setupNetbirdModal.installCliAndStartService")}</p>
                    <Code
                      codeToCopy={[
                        "sudo install -m 0755 cloink /usr/local/bin/cloink",
                        "sudo cloink service install",
                        "sudo cloink service start",
                      ].join("\n")}
                    >
                      <Code.Line>
                        sudo install -m 0755 cloink /usr/local/bin/cloink
                      </Code.Line>
                      <Code.Line>sudo cloink service install</Code.Line>
                      <Code.Line>sudo cloink service start</Code.Line>
                    </Code>
                  </Steps.Step>
                  <Steps.Step step={3} line={false}>
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
              ) : (
                <p className={"text-sm font-light text-nb-gray-300"}>
                  {t("setupNetbirdModal.noMacosReleasePublished")}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContentPadding>
    </TabsContent>
  );
}
