"use client";

import Button from "@components/Button";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import { DataTableRowsPerPage } from "@components/table/DataTableRowsPerPage";
import GetStartedTest from "@components/ui/GetStartedTest";
import { SmallBadge } from "@components/ui/SmallBadge";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  RadioTowerIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { useSWRConfig } from "swr";
import RoundedFlag from "@/assets/countries/RoundedFlag";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n/I18nProvider";
import { Relay } from "@/interfaces/Relay";
import DeployRelayModal from "@/modules/relays/DeployRelayModal";
import useFetchApi, { useApiCall } from "@/utils/api";

type Props = {
  headingTarget?: HTMLHeadingElement | null;
};

export default function RelaysTable({ headingTarget }: Readonly<Props>) {
  const { t } = useI18n();
  const { confirm } = useDialog();
  const { permission } = usePermissions();
  const { mutate } = useSWRConfig();
  const canUpdate = permission.settings.update;
  const path = usePathname();
  const [deployModal, setDeployModal] = React.useState(false);
  const [priorityRelay, setPriorityRelay] = React.useState<Relay | null>(null);
  const [priorityDraft, setPriorityDraft] = React.useState("30");
  const deleteRelay = useApiCall<unknown>("/relays", true).del;
  const updateRelay = useApiCall<unknown>("/relays", true).put;
  const applyRelayConfig = useApiCall<unknown>("/relays/apply", true).post;
  const { data: relays, isLoading } = useFetchApi<Relay[]>(
    "/relays",
    true,
    false,
    true,
    {
      shouldRetryOnError: false,
    },
  );

  const openPriorityModal = React.useCallback((relay: Relay) => {
    setPriorityRelay(relay);
    setPriorityDraft(String(relay.priority ?? 30));
  }, []);

  const saveRelayPriority = React.useCallback(
    (relay: Relay) => {
      if (!canUpdate) return;
      const relayID = relay.id;
      if (!relayID) return;

      const priority = Number(priorityDraft.trim());
      if (!Number.isInteger(priority) || priority <= 0) {
        notify({
          title: t("relays.priorityUpdateTitle"),
          description: t("relays.priorityInvalid"),
          backgroundColor: "bg-red-500",
        });
        return;
      }

      notify({
        title: t("relays.priorityUpdateTitle"),
        description: t("relays.priorityUpdated"),
        promise: updateRelay(
          { priority },
          "/" + encodeURIComponent(relayID),
        ).then(() => {
          mutate("/relays").then();
          setPriorityRelay(null);
        }),
        loadingMessage: t("relays.priorityUpdating"),
      });
    },
    [canUpdate, mutate, priorityDraft, t, updateRelay],
  );

  const columns = useMemo<ColumnDef<Relay>[]>(
    () => [
      {
        id: "name",
        accessorFn: (relay) => relay.name || relay.id || relay.address,
        header: ({ column }) => (
          <DataTableHeader column={column}>{t("relays.name")}</DataTableHeader>
        ),
        sortingFn: "text",
        cell: ({ row }) => (
          <div className={"flex items-center gap-3 min-w-[260px]"}>
            <SquareIcon
              icon={<RadioTowerIcon size={16} />}
              color={row.original.status === "online" ? "green" : "gray"}
              size={"small"}
              margin={"mt-0"}
            />
            <div className={"flex flex-col"}>
              <span className={"font-medium text-neutral-900 dark:text-nb-gray-100"}>
                {row.original.name || row.original.id || row.original.address}
              </span>
              <span className={"text-xs text-neutral-500 dark:text-nb-gray-400"}>
                {row.original.address}
              </span>
              {row.original.error && (
                <span
                  className={
                    "text-xs text-neutral-500 dark:text-nb-gray-400 max-w-xl truncate"
                  }
                >
                  {row.original.error}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableHeader column={column}>{t("relays.id")}</DataTableHeader>
        ),
        cell: ({ row }) => row.original.id || t("common.unknown"),
      },
      {
        accessorKey: "observed_id",
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("relays.observedId")}
          </DataTableHeader>
        ),
        cell: ({ row }) => row.original.observed_id || t("common.unknown"),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableHeader column={column}>{t("table.status")}</DataTableHeader>
        ),
        cell: ({ row }) => {
          const online = row.original.status === "online";
          return (
            <SmallBadge
              text={online ? t("relays.online") : t("relays.offline")}
              variant={online ? "green" : "yellow"}
              size={"md"}
            />
          );
        },
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("relays.priority")}
          </DataTableHeader>
        ),
        cell: ({ row }) => row.original.priority,
      },
      {
        accessorKey: "connected_clients",
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("relays.connectedClients")}
          </DataTableHeader>
        ),
        cell: ({ row }) => row.original.connected_clients ?? "-",
      },
      {
        accessorKey: "last_checked",
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("relays.lastChecked")}
          </DataTableHeader>
        ),
        cell: ({ row }) =>
          row.original.last_checked
            ? new Date(row.original.last_checked).toLocaleString()
            : t("common.unknown"),
      },
      {
        id: "address",
        accessorKey: "address",
      },
      {
        id: "searchString",
        accessorFn: (row) =>
          `${row.name ?? ""} ${row.id ?? ""} ${row.observed_id ?? ""} ${
            row.address
          } ${row.status} ${row.error ?? ""}`,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const relay = row.original;
          const canDelete = canUpdate && relay.registered && relay.id;
          return (
            <div className={"flex justify-end gap-2"}>
              <Button
                variant={"secondary"}
                size={"xs"}
                title={t("relays.editPriority")}
                disabled={!canUpdate}
                onClick={() => openPriorityModal(relay)}
              >
                <PencilIcon size={14} />
              </Button>
              <Button
                variant={"danger-outline"}
                size={"xs"}
                disabled={!canDelete}
                title={
                  canDelete
                    ? t("relays.delete")
                    : t("relays.staticRelayCannotDelete")
                }
                onClick={async () => {
                  if (!canDelete || !relay.id) return;
                  const choice = await confirm({
                    title: t("relays.delete"),
                    description: t("relays.deleteConfirm"),
                    confirmText: t("common.delete"),
                    cancelText: t("common.cancel"),
                    type: "danger",
                  });
                  if (!choice) return;
                  notify({
                    title: t("relays.delete"),
                    description: t("relays.deleteConfirm"),
                    promise: deleteRelay(
                      {},
                      "/" + encodeURIComponent(relay.id),
                    ).then(() => mutate("/relays")),
                    loadingMessage: t("relays.delete"),
                  });
                }}
              >
                <Trash2Icon size={14} />
              </Button>
            </div>
          );
        },
      },
    ],
    [canUpdate, confirm, deleteRelay, mutate, openPriorityModal, t],
  );

  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [{ id: "address", desc: false }],
  );

  const relayList = relays ?? [];

  const applyConfig = () => {
    if (!canUpdate) return;
    notify({
      title: t("relays.applyTitle"),
      description: t("relays.applyReady"),
      promise: applyRelayConfig({}).then(() => {
        mutate("/relays").then();
      }),
      loadingMessage: t("relays.applyLoading"),
    });
  };

  return (
    <>
      <DataTable
        headingTarget={headingTarget}
        isLoading={isLoading}
        inset={false}
        keepStateInLocalStorage={false}
        text={t("relays.title")}
        sorting={sorting}
        setSorting={setSorting}
        columns={columns}
        data={relayList}
        searchPlaceholder={t("relays.searchPlaceholder")}
        columnVisibility={{ address: false, searchString: false }}
        getStartedCard={
          <GetStartedTest
            icon={
              <SquareIcon
                icon={
                  <RadioTowerIcon
                    className={"text-neutral-700 dark:text-nb-gray-200"}
                    size={20}
                  />
                }
                color={"gray"}
                size={"large"}
              />
            }
            title={t("relays.emptyTitle")}
            description={t("relays.emptyDescription")}
          />
        }
        renderExpandedRow={(relay) => <RelayExpandedRow relay={relay} />}
      >
        {(table) => (
          <>
            <Button
              variant={"primary"}
              size={"sm"}
              disabled={!canUpdate}
              onClick={() => setDeployModal(true)}
            >
              <PlusIcon size={16} />
              {t("relays.deployButton")}
            </Button>
            <Button
              variant={"secondary"}
              size={"sm"}
              disabled={!canUpdate || relayList.length === 0}
              onClick={applyConfig}
            >
              <SendIcon size={16} />
              {t("relays.applyButton")}
            </Button>
            <DataTableRowsPerPage
              table={table}
              disabled={relayList.length === 0}
            />
            <DataTableRefreshButton
              isDisabled={relayList.length === 0}
              onClick={() => {
                mutate("/relays").then();
              }}
            />
          </>
        )}
      </DataTable>
      <DeployRelayModal
        open={deployModal && canUpdate}
        canUpdate={canUpdate}
        onOpenChange={setDeployModal}
      />
      <RelayPriorityModal
        relay={priorityRelay}
        value={priorityDraft}
        onValueChange={setPriorityDraft}
        onOpenChange={(open) => {
          if (!open) setPriorityRelay(null);
        }}
        onSave={() => {
          if (priorityRelay) saveRelayPriority(priorityRelay);
        }}
      />
    </>
  );
}

function RelayPriorityModal({
  relay,
  value,
  onValueChange,
  onOpenChange,
  onSave,
}: Readonly<{
  relay: Relay | null;
  value: string;
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}>) {
  const { t } = useI18n();

  return (
    <Modal open={!!relay} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"max-w-md"}>
        <ModalHeader
          icon={<PencilIcon size={18} />}
          title={t("relays.editPriority")}
          description={relay?.name || relay?.id || relay?.address || ""}
          className={"px-6 pb-5 pt-6"}
        />
        <div className={"border-y border-neutral-200 px-6 py-5 dark:border-nb-gray-900"}>
          <Label>{t("relays.priority")}</Label>
          <Input
            variant={"darker"}
            type={"number"}
            min={1}
            step={1}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
          />
        </div>
        <ModalFooter className={"justify-end"}>
          <Button
            variant={"secondary"}
            size={"sm"}
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button variant={"primary"} size={"sm"} onClick={onSave}>
            {t("actions.save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function RelayExpandedRow({ relay }: Readonly<{ relay: Relay }>) {
  const { t } = useI18n();
  const locationText =
    relay.city_name && relay.country_code
      ? `${relay.city_name}, ${relay.country_code}`
      : relay.country_code || t("common.unknown");

  const details = [
    {
      label: t("relays.publicIp"),
      value: relay.public_ip || t("common.unknown"),
    },
    {
      label: t("peerDetails.region"),
      value: relay.country_code ? (
        <span className={"inline-flex items-center gap-2"}>
          <RoundedFlag country={relay.country_code} size={14} />
          {locationText}
        </span>
      ) : (
        locationText
      ),
    },
    {
      label: t("relays.priority"),
      value: relay.priority,
    },
    {
      label: t("relays.connectedClients"),
      value: relay.connected_clients ?? "-",
    },
  ];

  return (
    <div
      className={
        "px-8 py-5 bg-neutral-50 border-t border-neutral-200 dark:bg-nb-gray-940/50 dark:border-nb-gray-900"
      }
    >
      <div
        className={
          "flex items-center gap-2 text-sm text-neutral-700 dark:text-nb-gray-200 mb-4"
        }
      >
        <MapPinIcon size={15} />
        {t("relays.details")}
      </div>
      <div className={"grid grid-cols-1 md:grid-cols-3 gap-3"}>
        {details.map((item) => (
          <div
            key={item.label}
            className={
              "rounded-md border border-neutral-200 bg-white px-4 py-3 dark:border-nb-gray-800 dark:bg-nb-gray-930"
            }
          >
            <div
              className={"text-xs text-neutral-500 dark:text-nb-gray-400 mb-1"}
            >
              {item.label}
            </div>
            <div
              className={
                "text-sm text-neutral-900 dark:text-nb-gray-100 font-medium"
              }
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
