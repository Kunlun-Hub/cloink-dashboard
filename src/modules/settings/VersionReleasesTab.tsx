import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import { notify } from "@components/Notification";
import Paragraph from "@components/Paragraph";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import { DataTableRowsPerPage } from "@components/table/DataTableRowsPerPage";
import GetStartedTest from "@components/ui/GetStartedTest";
import * as Tabs from "@radix-ui/react-tabs";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import useFetchApi, { useApiCall } from "@utils/api";
import {
  DownloadIcon,
  MoreVertical,
  PackageIcon,
  PencilIcon,
  PlusCircle,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { useSWRConfig } from "swr";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";
import loadConfig from "@/utils/config";
import VersionModal from "./VersionModal";

export type PlatformType = "macos" | "windows" | "linux" | "android";
export type ArchitectureType = "amd64" | "arm64" | "armv7" | "universal";

export interface VersionRelease {
  id: string;
  version: string;
  platform: PlatformType;
  architecture: ArchitectureType;
  channel: string;
  downloadUrl: string;
  description?: string;
  sha256?: string;
  isLatest?: boolean;
  createdAt: string;
  updatedAt: string;
}

const platformLabelKeys: Record<PlatformType, MessageKey> = {
  macos: "versionReleases.platformMacos",
  windows: "versionReleases.platformWindows",
  linux: "versionReleases.platformLinux",
  android: "versionReleases.platformAndroid",
};

const architectureLabelKeys: Record<ArchitectureType, MessageKey> = {
  amd64: "versionReleases.architectureAmd64",
  arm64: "versionReleases.architectureArm64",
  armv7: "versionReleases.architectureArmv7",
  universal: "versionReleases.architectureUniversal",
};

const apiConfig = loadConfig();

function resolveDownloadURL(downloadUrl: string) {
  try {
    return new URL(downloadUrl, `${apiConfig.apiOrigin}/`).toString();
  } catch {
    return downloadUrl;
  }
}

function ReleaseActions({
  release,
  onEdit,
}: Readonly<{
  release: VersionRelease;
  onEdit: (release: VersionRelease) => void;
}>) {
  const { t } = useI18n();
  const { confirm } = useDialog();
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();
  const deleteRequest = useApiCall<Record<string, never>>(
    `/version-releases/${release.id}`,
  );

  const deleteRelease = async () => {
    const confirmed = await confirm({
      title: t("versionReleases.deleteTitle", { version: release.version }),
      description: t("versionReleases.deleteDescription"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      type: "danger",
    });
    if (!confirmed) return;

    notify({
      title: t("versionReleases.deleteTitle", { version: release.version }),
      description: t("versionReleases.deleted"),
      promise: deleteRequest.del().then(() => mutate("/version-releases")),
      loadingMessage: t("versionReleases.deleting"),
    });
  };

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            className="p-2"
            aria-label={t("versionReleases.actions")}
          >
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onEdit(release)}
            disabled={!permission.version_releases.update}
          >
            <PencilIcon size={14} className="mr-2" />
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={deleteRelease}
            disabled={!permission.version_releases.delete}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2 size={14} className="mr-2" />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function VersionReleasesTab() {
  const { t, locale } = useI18n();
  const { permission } = usePermissions();
  const { mutate } = useSWRConfig();
  const { data: releases, isLoading } = useFetchApi<VersionRelease[]>(
    "/version-releases",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editRelease, setEditRelease] = useState<VersionRelease | null>(null);
  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "cloink-table-sort-version-releases",
    [{ id: "createdAt", desc: true }],
  );

  const openCreate = () => {
    setEditRelease(null);
    setModalOpen(true);
  };

  const openEdit = (release: VersionRelease) => {
    setEditRelease(release);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditRelease(null);
  };

  const columns: ColumnDef<VersionRelease>[] = [
    {
      accessorKey: "version",
      header: ({ column }) => (
        <DataTableHeader column={column}>
          {t("versionReleases.version")}
        </DataTableHeader>
      ),
      sortingFn: "text",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <PackageIcon size={16} className="text-nb-gray-400" />
          <span className="font-medium">{row.original.version}</span>
          {row.original.isLatest && (
            <span className="rounded bg-netbird-600 px-2 py-0.5 text-xs text-white">
              {t("versionReleases.latest")}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "platform",
      header: ({ column }) => (
        <DataTableHeader column={column}>
          {t("versionReleases.platform")}
        </DataTableHeader>
      ),
      cell: ({ row }) => t(platformLabelKeys[row.original.platform]),
    },
    {
      accessorKey: "architecture",
      header: ({ column }) => (
        <DataTableHeader column={column}>
          {t("versionReleases.architecture")}
        </DataTableHeader>
      ),
      cell: ({ row }) => t(architectureLabelKeys[row.original.architecture]),
    },
    {
      accessorKey: "channel",
      header: ({ column }) => (
        <DataTableHeader column={column}>
          {t("versionReleases.channel")}
        </DataTableHeader>
      ),
      cell: ({ row }) => row.original.channel,
    },
    {
      accessorKey: "sha256",
      header: ({ column }) => (
        <DataTableHeader column={column}>SHA256</DataTableHeader>
      ),
      cell: ({ row }) => (
        <span className="max-w-[180px] truncate font-mono text-xs text-nb-gray-400">
          {row.original.sha256 || t("versionReleases.notAvailable")}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableHeader column={column}>
          {t("versionReleases.publishedAt")}
        </DataTableHeader>
      ),
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleString(locale),
    },
    {
      id: "actions",
      accessorKey: "id",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            className="p-2"
            aria-label={t("versionReleases.download")}
            onClick={() =>
              window.open(
                resolveDownloadURL(row.original.downloadUrl),
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <DownloadIcon size={14} />
          </Button>
          <ReleaseActions release={row.original} onEdit={openEdit} />
        </div>
      ),
    },
  ];

  return (
    <Tabs.Content value="version-releases" className="w-full">
      <div className="p-default py-6">
        <Breadcrumbs>
          <Breadcrumbs.Item
            href="/settings"
            label={t("settings.title")}
            icon={<SettingsIcon size={13} />}
          />
          <Breadcrumbs.Item
            href="/settings?tab=version-releases"
            label={t("settings.versionReleases")}
            icon={<PackageIcon size={14} />}
            active
          />
        </Breadcrumbs>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1>{t("versionReleases.title")}</h1>
            <Paragraph>{t("versionReleases.description")}</Paragraph>
          </div>
        </div>
      </div>

      <VersionModal
        open={modalOpen}
        key={modalOpen ? editRelease?.id || "new" : "closed"}
        onClose={closeModal}
        versionRelease={editRelease}
      />

      <DataTable
        isLoading={isLoading}
        text={t("versionReleases.title")}
        sorting={sorting}
        setSorting={setSorting}
        columns={columns}
        data={releases}
        onRowClick={(row) => openEdit(row.original)}
        searchPlaceholder={t("versionReleases.searchPlaceholder")}
        getStartedCard={
          <GetStartedTest
            icon={
              <SquareIcon
                icon={<PackageIcon size={20} />}
                color="gray"
                size="large"
              />
            }
            title={t("versionReleases.emptyTitle")}
            description={t("versionReleases.emptyDescription")}
            button={
              <Button
                variant="primary"
                onClick={openCreate}
                disabled={!permission.version_releases.create}
              >
                <PlusCircle size={16} />
                {t("versionReleases.add")}
              </Button>
            }
          />
        }
        rightSide={() =>
          releases && releases.length > 0 ? (
            <Button
              variant="primary"
              className="ml-auto"
              onClick={openCreate}
              disabled={!permission.version_releases.create}
            >
              <PlusCircle size={16} />
              {t("versionReleases.add")}
            </Button>
          ) : null
        }
      >
        {(table) => (
          <>
            <DataTableRowsPerPage
              table={table}
              disabled={!releases || releases.length === 0}
            />
            <DataTableRefreshButton
              isDisabled={!releases || releases.length === 0}
              onClick={() => mutate("/version-releases")}
            />
          </>
        )}
      </DataTable>
    </Tabs.Content>
  );
}
