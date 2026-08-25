import Button from "@components/Button";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import Separator from "@components/Separator";
import { Textarea } from "@components/Textarea";
import { useApiCall } from "@utils/api";
import { trim } from "lodash";
import {
  DownloadIcon,
  FileArchiveIcon,
  PackageIcon,
  PlusCircle,
  SaveIcon,
  UploadIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";
import type {
  ArchitectureType,
  PlatformType,
  VersionRelease,
} from "./VersionReleasesTab";

type Props = {
  open: boolean;
  onClose: () => void;
  versionRelease?: VersionRelease | null;
};

type UploadResponse = {
  id: string;
  filename: string;
  size: number;
  sha256: string;
  downloadUrl: string;
};

const platforms: Array<{ value: PlatformType; label: MessageKey }> = [
  { value: "macos", label: "versionReleases.platformMacos" },
  { value: "windows", label: "versionReleases.platformWindows" },
  { value: "linux", label: "versionReleases.platformLinux" },
  { value: "android", label: "versionReleases.platformAndroid" },
];

const architectures: Array<{
  value: ArchitectureType;
  label: MessageKey;
}> = [
  { value: "amd64", label: "versionReleases.architectureAmd64" },
  { value: "arm64", label: "versionReleases.architectureArm64" },
  { value: "armv7", label: "versionReleases.architectureArmv7" },
  { value: "universal", label: "versionReleases.architectureUniversal" },
];

export default function VersionModal({
  open,
  onClose,
  versionRelease,
}: Readonly<Props>) {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { mutate } = useSWRConfig();
  const isEditing = Boolean(versionRelease);
  const canEdit = isEditing
    ? permission.version_releases.update
    : permission.version_releases.create;

  const createRequest = useApiCall<VersionRelease>("/version-releases");
  const updateRequest = useApiCall<VersionRelease>(
    `/version-releases/${versionRelease?.id}`,
  );
  const uploadRequest = useApiCall<UploadResponse>(
    "/version-releases/upload",
  );

  const [version, setVersion] = useState("");
  const [platform, setPlatform] = useState<PlatformType>("linux");
  const [architecture, setArchitecture] =
    useState<ArchitectureType>("amd64");
  const [channel, setChannel] = useState("stable");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [description, setDescription] = useState("");
  const [sha256, setSha256] = useState("");
  const [isLatest, setIsLatest] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVersion(versionRelease?.version ?? "");
    setPlatform(versionRelease?.platform ?? "linux");
    setArchitecture(versionRelease?.architecture ?? "amd64");
    setChannel(versionRelease?.channel ?? "stable");
    setDownloadUrl(versionRelease?.downloadUrl ?? "");
    setDescription(versionRelease?.description ?? "");
    setSha256(versionRelease?.sha256 ?? "");
    setIsLatest(versionRelease?.isLatest ?? false);
    setSelectedFile(null);
    setIsUploading(false);
  }, [open, versionRelease]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !permission.version_releases.create) return;

    setSelectedFile(file.name);
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await uploadRequest.post(formData);
      setDownloadUrl(result.downloadUrl);
      setSha256(result.sha256);
    } catch {
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const submit = () => {
    if (!canEdit || isUploading) return;
    const payload = {
      version: trim(version),
      platform,
      architecture,
      channel: trim(channel).toLowerCase() || "stable",
      downloadUrl: trim(downloadUrl),
      description: trim(description),
      sha256: trim(sha256).toLowerCase(),
      isLatest,
    };
    const request = isEditing
      ? updateRequest.put(payload)
      : createRequest.post(payload);

    notify({
      title: isEditing
        ? t("versionReleases.updateTitle")
        : t("versionReleases.createTitle"),
      description: isEditing
        ? t("versionReleases.updated")
        : t("versionReleases.created"),
      promise: request.then(() => {
        mutate("/version-releases");
        onClose();
      }),
      loadingMessage: isEditing
        ? t("versionReleases.updating")
        : t("versionReleases.creating"),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(state) => !state && onClose()}
      key={open ? "open" : "closed"}
    >
      <ModalContent maxWidthClass="max-w-2xl">
        <ModalHeader
          icon={isEditing ? <PackageIcon size={20} /> : <PlusCircle size={20} />}
          title={
            isEditing
              ? t("versionReleases.editTitle")
              : t("versionReleases.addTitle")
          }
          description={t("versionReleases.modalDescription")}
          color="netbird"
        />
        <Separator />
        <div className="flex flex-col gap-5 px-8 py-6">
          <div>
            <Label>{t("versionReleases.version")}</Label>
            <HelpText>{t("versionReleases.versionHelp")}</HelpText>
            <Input
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="0.77.0"
              disabled={!canEdit}
              customPrefix={<PackageIcon size={16} />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>{t("versionReleases.platform")}</Label>
              <Select
                value={platform}
                onValueChange={(value) => setPlatform(value as PlatformType)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {t(item.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("versionReleases.architecture")}</Label>
              <Select
                value={architecture}
                onValueChange={(value) =>
                  setArchitecture(value as ArchitectureType)
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {architectures.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {t(item.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t("versionReleases.channel")}</Label>
            <HelpText>{t("versionReleases.channelHelp")}</HelpText>
            <Input
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              placeholder="stable"
              disabled={!canEdit}
            />
          </div>

          <div>
            <Label>{t("versionReleases.downloadUrl")}</Label>
            <HelpText>{t("versionReleases.downloadUrlHelp")}</HelpText>
            <Input
              value={downloadUrl}
              onChange={(event) => setDownloadUrl(event.target.value)}
              placeholder="https://downloads.example.com/cloink.tar.gz"
              disabled={!canEdit}
              customPrefix={<DownloadIcon size={16} />}
            />
          </div>

          <div>
            <Label>{t("versionReleases.uploadArtifact")}</Label>
            <HelpText>{t("versionReleases.uploadHelp")}</HelpText>
            <label
              htmlFor="version-release-artifact"
              className={`flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-neutral-300 px-4 py-4 dark:border-nb-gray-800 ${
                !canEdit || isUploading
                  ? "pointer-events-none opacity-50"
                  : "hover:border-netbird"
              }`}
            >
              {isUploading ? (
                <UploadIcon size={18} className="animate-pulse" />
              ) : selectedFile ? (
                <FileArchiveIcon size={18} className="text-netbird" />
              ) : (
                <UploadIcon size={18} />
              )}
              <span className="text-sm text-nb-gray-300">
                {isUploading
                  ? t("versionReleases.uploading")
                  : selectedFile || t("versionReleases.chooseFile")}
              </span>
              <input
                id="version-release-artifact"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={!canEdit || isUploading}
              />
            </label>
          </div>

          <div>
            <Label>SHA256</Label>
            <HelpText>{t("versionReleases.sha256Help")}</HelpText>
            <Input
              value={sha256}
              onChange={(event) => setSha256(event.target.value)}
              placeholder={t("versionReleases.sha256Placeholder")}
              disabled={!canEdit}
              className="font-mono text-xs"
            />
          </div>

          <div>
            <Label>{t("versionReleases.descriptionLabel")}</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("versionReleases.descriptionPlaceholder")}
              disabled={!canEdit}
              resize
            />
          </div>

          <FancyToggleSwitch
            value={isLatest}
            onChange={setIsLatest}
            disabled={!canEdit}
            label={t("versionReleases.latest")}
            helpText={t("versionReleases.latestHelp")}
            variant="blank"
          />
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="secondary">{t("common.cancel")}</Button>
          </ModalClose>
          <Button
            variant="primary"
            onClick={submit}
            disabled={!canEdit || isUploading || !trim(version) || !trim(downloadUrl)}
          >
            {isEditing ? <SaveIcon size={16} /> : <PlusCircle size={16} />}
            {isEditing ? t("common.save") : t("versionReleases.add")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
