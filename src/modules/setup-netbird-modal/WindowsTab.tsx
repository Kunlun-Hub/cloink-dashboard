import Button from "@components/Button";
import { SelectDropdown } from "@components/select/SelectDropdown";
import Steps from "@components/Steps";
import TabsContentPadding, { TabsContent } from "@components/Tabs";
import { GRPC_API_ORIGIN } from "@utils/netbird";
import { DownloadIcon, PackageOpenIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
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

export default function WindowsTab({
  setupKey,
  setupKeyContent,
  setupKeyPlaceholder,
  showSetupKeyInfo,
  hostname,
}: Readonly<Props>) {
  const { t } = useI18n();
  // Only signed installers published in Settings → Version Releases are
  // offered — the official NetBird packages must never be served from here.
  const releases = useVersionReleases("windows");
  const architectureLabels: Record<string, string> = {
    amd64: t("setupModal.arch64"),
    arm64: t("setupNetbirdModal.arm64"),
    armv7: "ARMv7",
    universal: t("versionReleases.architectureUniversal"),
  };
  const releaseOptions = useMemo(
    () =>
      releases.map((release) => ({
        label: `${architectureLabels[release.architecture] ?? release.architecture} (v${release.version})`,
        value: resolveReleaseDownloadURL(release.downloadUrl),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [releases],
  );
  const [windowsUrl, setWindowsUrl] = useState("");
  // Snap the selection onto the published releases once they load, unless the
  // user already picked one of them.
  useEffect(() => {
    if (
      releaseOptions.length > 0 &&
      !releaseOptions.some((option) => option.value === windowsUrl)
    ) {
      setWindowsUrl(releaseOptions[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseOptions]);
  // The CLI-run branch is required for the server flow (setupKeyContent
  // present) even before a key is generated — the placeholder keeps the
  // command shape consistent. Otherwise we fall back to the existing
  // setupKey-driven branching.
  const useCliRun = !!setupKey || !!setupKeyContent;
  const baseMgmtStep = 2;
  const keyStep = GRPC_API_ORIGIN ? 3 : 2;
  const runStep = keyStep + (setupKeyContent ? 1 : 0);
  return (
    <TabsContent value={String(OperatingSystem.WINDOWS)}>
      <TabsContentPadding>
        <p className={"font-medium flex gap-3 items-center text-base"}>
          <PackageOpenIcon size={16} />
          {t("windowsTab.installOnWindows")}
        </p>
        <Steps>
          <Steps.Step step={1}>
            <p>{t("windowsTab.downloadInstaller")}</p>
            <div className={"flex gap-4 mt-1 flex-wrap"}>
              <SelectDropdown
                value={windowsUrl}
                className={"w-[220px]"}
                onChange={setWindowsUrl}
                placeholder={t("common.selectArchitecturePlaceholder")}
                options={releaseOptions}
                disabled={releaseOptions.length === 0}
              />
              {releaseOptions.length > 0 ? (
                <Link
                  href={windowsUrl}
                  passHref
                  prefetch={false}
                  target={"_blank"}
                  rel="noopener noreferrer"
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
                    {t("setupNetbirdModal.noWindowsReleasePublished")}
                  </p>
                </>
              )}
            </div>
          </Steps.Step>

          {GRPC_API_ORIGIN && (
            <Steps.Step step={baseMgmtStep}>
              <ManagementUrlStep trayName={t("setupModal.systemTray")} />
            </Steps.Step>
          )}

          {setupKeyContent && (
            <Steps.Step step={keyStep}>{setupKeyContent}</Steps.Step>
          )}

          {useCliRun ? (
            <Steps.Step step={runStep} line={false}>
              <p>
                {t("setupModal.openCommandLineRunNetBird")} {" "}
                {showSetupKeyInfo && <RoutingPeerSetupKeyInfo />}
              </p>

              <NetBirdUpCommand
                setupKey={setupKey}
                setupKeyPlaceholder={setupKeyPlaceholder}
                hostname={hostname}
                continuation={"^"}
              />
            </Steps.Step>
          ) : (
            <>
              <Steps.Step step={runStep}>
                <p>{t("setupNetbirdModal.clickConnect")}</p>
              </Steps.Step>
              <Steps.Step step={runStep + 1} line={false}>
                <p>{t("setupNetbirdModal.signUpEmail")}</p>
              </Steps.Step>
            </>
          )}
        </Steps>
      </TabsContentPadding>
    </TabsContent>
  );
}
