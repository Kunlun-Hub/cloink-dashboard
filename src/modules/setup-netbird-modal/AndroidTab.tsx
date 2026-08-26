import Button from "@components/Button";
import Code from "@components/Code";
import { SelectDropdown } from "@components/select/SelectDropdown";
import Steps from "@components/Steps";
import TabsContentPadding, { TabsContent } from "@components/Tabs";
import { GRPC_API_ORIGIN } from "@utils/netbird";
import { DownloadIcon, PackageOpenIcon } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import useVersionReleases, {
  resolveReleaseDownloadURL,
} from "@/hooks/useVersionReleases";
import { useI18n } from "@/i18n/I18nProvider";
import { OperatingSystem } from "@/interfaces/OperatingSystem";

export default function AndroidTab() {
  const { t } = useI18n();
  const releases = useVersionReleases("android");
  const releaseOptions = useMemo(
    () =>
      releases.map((release) => {
        const architectureLabels: Record<string, string> = {
          amd64: t("versionReleases.architectureAmd64"),
          arm64: t("versionReleases.architectureArm64"),
          armv7: t("versionReleases.architectureArmv7"),
          universal: t("versionReleases.architectureUniversal"),
        };
        return {
          label: `v${release.version} · ${
            architectureLabels[release.architecture] ?? release.architecture
          }`,
          value: resolveReleaseDownloadURL(release.downloadUrl),
        };
      }),
    [releases, t],
  );
  const [selectedAndroidUrl, setSelectedAndroidUrl] = useState("");
  const androidUrl = releaseOptions.some(
    (option) => option.value === selectedAndroidUrl,
  )
    ? selectedAndroidUrl
    : (releaseOptions[0]?.value ?? "");
  const hasPublishedRelease = releaseOptions.length > 0;
  return (
    <TabsContent value={String(OperatingSystem.ANDROID)}>
      <TabsContentPadding>
        <p className={"font-medium flex gap-3 items-center text-base"}>
          <PackageOpenIcon size={16} />
          {t("androidTab.installOnAndroid")}
        </p>
        <Steps>
          <Steps.Step step={1}>
            <p>{t("androidTab.downloadInstaller")}</p>
            <div className={"flex gap-4 mt-1"}>
              <SelectDropdown
                value={androidUrl}
                className={"w-[240px]"}
                onChange={setSelectedAndroidUrl}
                placeholder={t("androidTab.selectRelease")}
                options={releaseOptions}
                disabled={!hasPublishedRelease}
                data-testid="android-release-select"
              />
              {hasPublishedRelease ? (
                <Link
                  href={androidUrl}
                  passHref
                  target={"_blank"}
                  rel="noopener noreferrer"
                >
                  <Button variant={"primary"}>
                    <DownloadIcon size={14} />
                    {t("setupModal.downloadNetBird")}
                  </Button>
                </Link>
              ) : (
                <Button variant={"primary"} disabled>
                  <DownloadIcon size={14} />
                  {t("setupModal.downloadNetBird")}
                </Button>
              )}
            </div>
            {!hasPublishedRelease && (
              <p className="mt-2 text-sm text-nb-gray-400">
                {t("androidTab.noPublishedRelease")}.{" "}
                {t("androidTab.publishReleaseFirst")}
              </p>
            )}
          </Steps.Step>
          {GRPC_API_ORIGIN && (
            <Steps.Step step={2}>
              <p>{t("setupNetbirdModal.clickChangeServer")}</p>
              <Code>
                <Code.Line>{GRPC_API_ORIGIN}</Code.Line>
              </Code>
            </Steps.Step>
          )}

          <Steps.Step step={GRPC_API_ORIGIN ? 3 : 2}>
            <p>
              {t("setupNetbirdModal.clickConnectButton")}
            </p>
          </Steps.Step>
          <Steps.Step step={GRPC_API_ORIGIN ? 4 : 3} line={false}>
            <p>{t("setupNetbirdModal.signUpEmail")}</p>
          </Steps.Step>
        </Steps>
      </TabsContentPadding>
    </TabsContent>
  );
}
