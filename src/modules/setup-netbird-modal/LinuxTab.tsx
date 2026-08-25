import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/Accordion";
import Button from "@components/Button";
import Code from "@components/Code";
import { SelectDropdown } from "@components/select/SelectDropdown";
import Separator from "@components/Separator";
import Steps from "@components/Steps";
import TabsContentPadding, { TabsContent } from "@components/Tabs";
import loadConfig from "@utils/config";
import { DownloadIcon, PackageIcon, TerminalSquareIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
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

const apiOrigin = loadConfig().apiOrigin.replace(/\/+$/, "");

export default function LinuxTab({
  setupKey,
  setupKeyContent,
  setupKeyPlaceholder,
  showSetupKeyInfo = false,
  hostname,
}: Readonly<Props>) {
  const { t } = useI18n();
  const releases = useVersionReleases("linux");
  const [selectedReleaseID, setSelectedReleaseID] = useState("");
  const runStep = setupKeyContent ? 3 : 2;
  const usingSetupKey = !!setupKey || !!setupKeyPlaceholder;

  const releaseOptions = useMemo(() => {
    const architectureLabels: Record<string, string> = {
      amd64: t("versionReleases.architectureAmd64"),
      arm64: t("versionReleases.architectureArm64"),
      armv7: t("versionReleases.architectureArmv7"),
      universal: t("versionReleases.architectureUniversal"),
    };

    return releases.map((release) => ({
      label: `${release.version} / ${
        architectureLabels[release.architecture] ?? release.architecture
      }${release.isLatest ? ` (${t("linuxTab.latest")})` : ""}`,
      value: release.id,
    }));
  }, [releases, t]);

  const selectedRelease =
    releases.find((release) => release.id === selectedReleaseID) ?? releases[0];
  const effectiveReleaseID = selectedRelease?.id ?? "";
  const downloadURL = selectedRelease
    ? resolveReleaseDownloadURL(selectedRelease.downloadUrl)
    : "";
  const installScriptURL = apiOrigin ? `${apiOrigin}/install.sh` : "";
  const oneLineInstallCommand =
    selectedRelease && installScriptURL
      ? `curl -fsSL "${installScriptURL}" | sudo bash -s -- --api-url "${apiOrigin}" --version "${selectedRelease.version}" --architecture "${selectedRelease.architecture}"`
      : "";
  const manualDownloadCommand = downloadURL
    ? `curl -fL "${downloadURL}" -o cloink.tar.gz`
    : "";
  const manualInstallCommand = `tar -xzf cloink.tar.gz
CLOINK_BIN="$(find . -type f -name cloink | head -n 1)"
[ -n "$CLOINK_BIN" ] || { echo "cloink binary not found" >&2; exit 1; }
CLOINK_DIR="$(dirname "$CLOINK_BIN")"
sudo cloink service stop 2>/dev/null || true
sudo cloink service uninstall 2>/dev/null || true
sudo install -m 0755 "$CLOINK_DIR/cloink" /usr/bin/cloink
if [ -f "$CLOINK_DIR/cloink-ui" ]; then
  sudo install -m 0755 "$CLOINK_DIR/cloink-ui" /usr/bin/cloink-ui
fi
sudo cloink service install
sudo cloink service start`;

  const releaseSelector = (testID: string) => (
    <SelectDropdown
      value={effectiveReleaseID}
      className="w-[260px] max-w-full"
      onChange={setSelectedReleaseID}
      disabled={releaseOptions.length === 0}
      placeholder={
        releaseOptions.length === 0
          ? t("linuxTab.noPublishedRelease")
          : t("linuxTab.selectRelease")
      }
      options={releaseOptions}
      data-testid={testID}
    />
  );

  return (
    <TabsContent value={String(OperatingSystem.LINUX)}>
      <TabsContentPadding>
        <p className="flex items-center gap-3 text-base font-medium">
          <TerminalSquareIcon size={16} />
          {t("linuxTab.installWithCli")}
        </p>
        <Steps>
          <Steps.Step step={1}>
            <p className="mb-2 text-sm text-nb-gray-400">
              {t("linuxTab.oneClickDescription")}
            </p>
            <div className="mb-3">
              {releaseSelector("linux-release-select")}
            </div>
            {oneLineInstallCommand ? (
              <Code codeToCopy={oneLineInstallCommand}>
                <Code.Line>{oneLineInstallCommand}</Code.Line>
              </Code>
            ) : (
              <p className="text-sm text-nb-gray-500">
                {t("linuxTab.publishReleaseFirst")}
              </p>
            )}
          </Steps.Step>
          {setupKeyContent && (
            <Steps.Step step={2}>{setupKeyContent}</Steps.Step>
          )}
          <Steps.Step step={runStep} line={false}>
            <p>
              {t("linuxTab.runCloink")}{" "}
              {!usingSetupKey && t("setupNetbirdModal.andLogInBrowser")}
              {showSetupKeyInfo && <RoutingPeerSetupKeyInfo />}
            </p>
            <NetBirdUpCommand
              setupKey={setupKey}
              setupKeyPlaceholder={setupKeyPlaceholder}
              hostname={hostname}
            />
          </Steps.Step>
        </Steps>
      </TabsContentPadding>

      <Separator />

      <TabsContentPadding>
        <Accordion type="single" collapsible>
          <AccordionItem value="manual">
            <AccordionTrigger>
              <PackageIcon size={16} />
              {t("linuxTab.installManually")}
            </AccordionTrigger>
            <AccordionContent>
              <Steps>
                <Steps.Step step={1}>
                  <p className="mb-2">{t("linuxTab.chooseAndDownload")}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-4">
                    {releaseSelector("linux-manual-release-select")}
                    <Button
                      variant="primary"
                      disabled={!downloadURL}
                      onClick={() =>
                        window.open(
                          downloadURL,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      <DownloadIcon size={14} />
                      {t("versionReleases.download")}
                    </Button>
                  </div>
                  {manualDownloadCommand && (
                    <div className="mt-3">
                      <Code codeToCopy={manualDownloadCommand}>
                        <Code.Line>{manualDownloadCommand}</Code.Line>
                      </Code>
                    </div>
                  )}
                </Steps.Step>
                <Steps.Step step={2}>
                  <p>{t("linuxTab.extractAndInstall")}</p>
                  <Code codeToCopy={manualInstallCommand}>
                    <Code.Comment>
                      # {t("linuxTab.extractArchive")}
                    </Code.Comment>
                    <Code.Line>tar -xzf cloink.tar.gz</Code.Line>
                    <Code.Line>
                      {
                        'CLOINK_BIN="$(find . -type f -name cloink | head -n 1)"'
                      }
                    </Code.Line>
                    <Code.Line>
                      {
                        '[ -n "$CLOINK_BIN" ] || { echo "cloink binary not found" >&2; exit 1; }'
                      }
                    </Code.Line>
                    <Code.Line>
                      {'CLOINK_DIR="$(dirname "$CLOINK_BIN")"'}
                    </Code.Line>
                    <Code.Comment>
                      # {t("linuxTab.installBinaries")}
                    </Code.Comment>
                    <Code.Line>
                      sudo cloink service stop 2&gt;/dev/null || true
                    </Code.Line>
                    <Code.Line>
                      sudo cloink service uninstall 2&gt;/dev/null || true
                    </Code.Line>
                    <Code.Line>
                      sudo install -m 0755 &quot;$CLOINK_DIR/cloink&quot;
                      /usr/bin/cloink
                    </Code.Line>
                    <Code.Line>
                      if [ -f &quot;$CLOINK_DIR/cloink-ui&quot; ]; then
                    </Code.Line>
                    <Code.Line>
                      {"  "}sudo install -m 0755
                      &quot;$CLOINK_DIR/cloink-ui&quot; /usr/bin/cloink-ui
                    </Code.Line>
                    <Code.Line>fi</Code.Line>
                    <Code.Comment>
                      # {t("linuxTab.installService")}
                    </Code.Comment>
                    <Code.Line>sudo cloink service install</Code.Line>
                    <Code.Line>sudo cloink service start</Code.Line>
                  </Code>
                </Steps.Step>
                <Steps.Step step={3} line={false}>
                  <p>
                    {t("linuxTab.runCloink")}{" "}
                    {!usingSetupKey && t("setupNetbirdModal.andLogInBrowser")}
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
