"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import Card from "@components/Card";
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
import { Textarea } from "@components/Textarea";
import { useDialog } from "@/contexts/DialogProvider";
import { cn } from "@utils/helpers";
import useFetchApi, { useApiCall } from "@utils/api";
import { Copy, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import NetworkRoutesIcon from "@/assets/icons/NetworkRoutesIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { Group } from "@/interfaces/Group";
import { NetworkResource } from "@/interfaces/Network";
import {
  Connector,
  useConnectors,
} from "@/modules/connectors/useConnectors";
import {
  createResourceInConnector,
  isRouteResource,
  parseBatchResources,
} from "@/modules/connectors/connectorService";
import { normalizeToCIDRs } from "@/modules/connectors/cidr";
import ResourceGroupDetail from "@/modules/connectors/ResourceGroupDetail";

/** Marker for resource-group ordering in group description */
const ORDER_MARKER = "cloink-rg-order:";
const ASSOC_MARKER = "cloink-rg-assoc:";

function getOrder(g: Group): number {
  const m = g.name.match(/^(\d+)\.\s/);
  return m ? parseInt(m[1], 10) : 9999;
}

interface RGResource {
  id: string;
  networkId: string;
  address: string;
  note: string;
  name: string;
}

export default function ResourceGroupsPage() {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { connectors, groups, isLoading, refresh } = useConnectors();
  const { mutate } = useSWRConfig();
  const { confirm } = useDialog();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const sortedGroups = useMemo(() => {
    const q = search.toLowerCase();
    return (groups || [])
      .filter((g) => !q || g.name.toLowerCase().includes(q))
      .sort((a, b) => getOrder(a) - getOrder(b) || a.name.localeCompare(b.name));
  }, [groups, search]);

  const selected = groups?.find((g) => g.id === selectedId) || null;

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            label={t("nav.networkRouting")}
            icon={<NetworkRoutesIcon size={13} />}
          />
          <Breadcrumbs.Item href={"/resource-groups"} label={t("nav.resourceGroups")} />
        </Breadcrumbs>
        <h1>{t("resourceGroups.title")}</h1>
        <p className="text-sm opacity-70 mt-1">{t("resourceGroups.description")}</p>
      </div>

      <RestrictedAccess hasAccess={permission.networks.read}>
        <div className="p-default flex gap-4" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
          {/* Left sidebar */}
          <Card className="w-72 shrink-0 flex flex-col p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{t("resourceGroups.listTitle")}</span>
              {permission.groups.create && (
                <button
                  className="p-1 hover:bg-nb-gray-800 rounded"
                  onClick={() => setShowCreate(true)}
                  title={t("resourceGroups.create")}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            <Input
              placeholder={t("resourceGroups.searchGroup")}
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="flex-1 overflow-y-auto space-y-1">
              {isLoading && <p className="text-sm opacity-60">{t("common.loading")}</p>}
              {sortedGroups.map((g, idx) => (
                <GroupRow
                  key={g.id}
                  group={g}
                  index={idx}
                  selected={selectedId === g.id}
                  onSelect={() => setSelectedId(g.id || null)}
                  onChanged={() => {
                    mutate("/groups");
                    refresh();
                  }}
                />
              ))}
              {!isLoading && sortedGroups.length === 0 && (
                <p className="text-sm opacity-60 text-center py-8">
                  {t("resourceGroups.empty")}
                </p>
              )}
            </div>
          </Card>

          {/* Right panel */}
          <div className="flex-1 min-w-0">
            {selected ? (
              <ResourceGroupDetail
                key={selected.id}
                group={selected}
                connectors={connectors}
                onChanged={() => {
                  mutate("/groups");
                  refresh();
                }}
              />
            ) : (
              <Card className="p-12 text-center text-sm opacity-60 h-full">
                {t("resourceGroups.selectHint")}
              </Card>
            )}
          </div>
        </div>
      </RestrictedAccess>

      <CreateGroupModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(g) => {
          mutate("/groups");
          setSelectedId(g.id || null);
        }}
      />
    </PageContainer>
  );
}

function GroupRow({
  group,
  index,
  selected,
  onSelect,
  onChanged,
}: {
  group: Group;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { confirm } = useDialog();
  const groupCall = useApiCall<Group>("/groups");
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const displayName = group.name.replace(/^\d+\.\s*/, "");

  const handleDelete = async () => {
    const ok = await confirm({
      title: t("resourceGroups.deleteTitle"),
      description: t("resourceGroups.deleteDescription").replace("{name}", displayName),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      type: "danger",
    });
    if (!ok || !group.id) return;
    await groupCall.del("", `/${group.id}`);
    onChanged();
  };

  const handleRename = async () => {
    const name = renameValue.trim();
    if (!name || !group.id) {
      setRenaming(false);
      return;
    }
    await groupCall.put({ name: `${index + 1}. ${name}` }, `/${group.id}`);
    setRenaming(false);
    onChanged();
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm",
        selected ? "bg-nb-primary/15 text-nb-primary" : "hover:bg-nb-gray-800",
      )}
      onClick={onSelect}
    >
      <span className="opacity-50 w-6 shrink-0">{index + 1}.</span>
      {renaming ? (
        <Input
          value={renameValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setRenameValue(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setRenaming(false);
          }}
          onBlur={handleRename}
          autoFocus
          className="text-xs h-7 flex-1"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate flex-1">{displayName}</span>
      )}
      <span className="text-xs opacity-50">{group.resources_count || 0}</span>
      {permission.groups.update && (
        <div className="relative">
          <button
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-nb-gray-700 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-20 bg-nb-gray-900 border rounded-lg shadow-lg py-1 min-w-32">
              <button
                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-nb-gray-800"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setRenameValue(displayName);
                  setRenaming(true);
                }}
              >
                {t("resourceGroups.rename")}
              </button>
              <button
                className="block w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-nb-gray-800"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  handleDelete();
                }}
              >
                {t("common.delete")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateGroupModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (g: Group) => void;
}) {
  const { t } = useI18n();
  const groupCall = useApiCall<Group>("/groups");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const g = await groupCall.post({ name: name.trim() });
      notify({ title: t("resourceGroups.createdTitle"), description: name.trim() });
      onOpenChange(false);
      setName("");
      onCreated(g);
    } catch (e) {
      notify({ title: t("resourceGroups.createFailed"), description: String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass="max-w-md">
        <ModalHeader
          title={t("resourceGroups.createTitle")}
          description={t("resourceGroups.createHint")}
        />
        <div className="px-6 py-4">
          <Label>{t("resourceGroups.groupName")}</Label>
          <Input
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder={t("resourceGroups.groupNamePlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="secondary">{t("common.cancel")}</Button>
          </ModalClose>
          <Button onClick={handleCreate} disabled={!name.trim() || saving}>
            {t("common.confirm")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
