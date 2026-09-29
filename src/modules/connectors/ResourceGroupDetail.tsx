"use client";

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
import { cn } from "@utils/helpers";
import { useApiCall } from "@utils/api";
import { Copy, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useI18n } from "@/i18n/I18nProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { Group } from "@/interfaces/Group";
import { NetworkResource } from "@/interfaces/Network";
import { Connector } from "@/modules/connectors/useConnectors";
import {
  createResourceInConnector,
  parseBatchResources,
} from "@/modules/connectors/connectorService";
import { normalizeToCIDRs } from "@/modules/connectors/cidr";

interface DraftRow {
  key: string;
  ip: string;
  note: string;
  resourceId?: string;
  networkId?: string;
  dirty: boolean;
  error?: string;
}

export default function ResourceGroupDetail({
  group,
  connectors,
  onChanged,
}: {
  group: Group;
  connectors: Connector[];
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { mutate } = useSWRConfig();
  const networksCall = useApiCall<NetworkResource>("/networks");
  const [tab, setTab] = useState<"group" | "preview">("group");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBatch, setShowBatch] = useState(false);

  const displayName = group.name.replace(/^\d+\.\s*/, "");

  // Load resources belonging to this group across all connector networks
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const out: DraftRow[] = [];
      const gid = group.id;
      for (const c of connectors) {
        try {
          const res = await networksCall.get(`/${c.networkId}/resources`);
          const list = (Array.isArray(res) ? res : []) as NetworkResource[];
          for (const r of list) {
            if (r.description?.startsWith("cloink-route:")) continue; // route resources
            const gids = ((r.groups || []) as (Group | string)[]).map((g) =>
              typeof g === "string" ? g : g.id,
            );
            if (gid && gids.includes(gid)) {
              out.push({
                key: r.id,
                ip: r.address,
                note: r.description || "",
                resourceId: r.id,
                networkId: c.networkId,
                dirty: false,
              });
            }
          }
        } catch {
          // ignore per-network failures
        }
      }
      if (!cancelled) {
        setRows(out);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, connectors.map((c) => c.networkId).join(",")]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        !q ||
        r.ip.toLowerCase().includes(q) ||
        r.note.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const hasChanges = rows.some((r) => r.dirty || !r.resourceId);

  const updateRow = (key: string, patch: Partial<DraftRow>) => {
    setRows(rows.map((r) => (r.key === key ? { ...r, ...patch, dirty: true } : r)));
  };

  const addRow = () => {
    setRows([
      ...rows,
      { key: `new-${Date.now()}`, ip: "", note: "", dirty: true },
    ]);
  };

  const removeRow = (key: string) => {
    setRows(rows.filter((r) => r.key !== key));
  };

  const duplicateRow = (key: string) => {
    const r = rows.find((x) => x.key === key);
    if (!r) return;
    setRows([
      ...rows,
      { key: `new-${Date.now()}`, ip: r.ip, note: r.note, dirty: true },
    ]);
  };

  const handleSave = async () => {
    if (!group.id) return;
    setSaving(true);
    const api = {
      post: <T,>(url: string, data: unknown) =>
        networksCall.post(data, url.replace(/^\/networks/, "")) as Promise<T>,
      put: <T,>(url: string, data: unknown) =>
        networksCall.put(data, url.replace(/^\/networks/, "")) as Promise<T>,
      del: <T,>(url: string) =>
        networksCall.del("", url.replace(/^\/networks/, "")) as Promise<T>,
      get: <T,>(url: string) =>
        networksCall.get(url.replace(/^\/networks/, "")) as Promise<T>,
    };
    try {
      // Validate all rows first
      let valid = true;
      const validated = rows.map((r) => {
        const cidrs = normalizeToCIDRs(r.ip);
        if (cidrs.length === 0 && r.ip.trim()) {
          valid = false;
          return { ...r, error: t("resourceGroups.invalidIp") };
        }
        return { ...r, ip: cidrs[0] || r.ip, error: undefined };
      });
      setRows(validated);
      if (!valid) {
        setSaving(false);
        return;
      }

      for (const r of validated) {
        if (!r.ip.trim()) continue;
        if (r.resourceId && r.networkId) {
          if (r.dirty) {
            await api.put<NetworkResource>(
              `/networks/${r.networkId}/resources/${r.resourceId}`,
              {
                name: r.ip,
                description: r.note,
                address: r.ip,
                enabled: true,
              },
            );
          }
        } else {
          // New row: resolve connector and create
          try {
            await createResourceInConnector(
              api,
              connectors,
              r.ip,
              r.ip,
              r.note || undefined,
              group.id ? [group.id] : [],
            );
          } catch (e) {
            if (String(e).startsWith("Error: no-connector:")) {
              setRows((prev) =>
                prev.map((x) =>
                  x.key === r.key
                    ? { ...x, error: t("resourceGroups.noConnector") }
                    : x,
                ),
              );
              throw new Error("no-connector");
            }
            throw e;
          }
        }
      }
      // Handle deletions: rows removed from UI need resource deletion
      // (tracked via initial load diff — simplified: we delete on removeRow? No,
      // we handle it here by comparing; for now deletions happen immediately in removeRow)
      notify({
        title: t("resourceGroups.savedTitle"),
        description: displayName,
      });
      onChanged();
    } catch (e) {
      if (String(e) !== "Error: no-connector") {
        notify({ title: t("resourceGroups.saveFailed"), description: String(e) });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (row: DraftRow) => {
    if (row.resourceId && row.networkId) {
      try {
        await networksCall.del(
          "",
          `/${row.networkId}/resources/${row.resourceId}`,
        );
      } catch (e) {
        notify({ title: t("resourceGroups.deleteFailed"), description: String(e) });
        return;
      }
    }
    removeRow(row.key);
    onChanged();
  };

  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex gap-1 border-b mb-4">
        <button
          onClick={() => setTab("group")}
          className={cn(
            "px-4 py-2 text-sm border-b-2 -mb-px",
            tab === "group"
              ? "border-nb-primary text-nb-primary font-medium"
              : "border-transparent opacity-60 hover:opacity-100",
          )}
        >
          {t("resourceGroups.tabGroup")}
        </button>
        <button
          onClick={() => setTab("preview")}
          className={cn(
            "px-4 py-2 text-sm border-b-2 -mb-px",
            tab === "preview"
              ? "border-nb-primary text-nb-primary font-medium"
              : "border-transparent opacity-60 hover:opacity-100",
          )}
        >
          {t("resourceGroups.tabPreview")}
        </button>
      </div>

      {tab === "group" && (
        <>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder={t("resourceGroups.searchIp")}
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              className="flex-1"
            />
            {permission.networks.update && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setShowBatch(true)}>
                  {t("resourceGroups.batchEdit")}
                </Button>
                <Button variant="secondary" size="sm" onClick={addRow}>
                  <Plus size={14} />
                </Button>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-nb-gray-900">
                <tr className="text-left text-xs opacity-60">
                  <th className="px-3 py-2 w-12">{t("resourceGroups.colIndex")}</th>
                  <th className="px-3 py-2">{t("resourceGroups.colIp")}</th>
                  <th className="px-3 py-2">{t("resourceGroups.colNote")}</th>
                  <th className="px-3 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center opacity-60">
                      {t("common.loading")}
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((r, i) => (
                    <tr key={r.key} className={cn(r.error && "bg-red-500/5")}>
                      <td className="px-3 py-1.5 opacity-50">{i + 1}</td>
                      <td className="px-3 py-1.5">
                        <Input
                          value={r.ip}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateRow(r.key, { ip: e.target.value, error: undefined })
                          }
                          placeholder="172.16.0.8"
                          className="font-mono text-xs"
                          disabled={!permission.networks.update}
                        />
                        {r.error && (
                          <p className="text-red-500 text-xs mt-0.5">{r.error}</p>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          value={r.note}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateRow(r.key, { note: e.target.value })
                          }
                          placeholder={t("resourceGroups.notePlaceholder")}
                          className="text-xs"
                          disabled={!permission.networks.update}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex gap-1">
                          <button
                            className="p-1 hover:bg-nb-gray-800 rounded text-xs"
                            title={t("resourceGroups.duplicate")}
                            onClick={() => duplicateRow(r.key)}
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            className="p-1 hover:bg-nb-gray-800 rounded text-red-500"
                            title={t("common.delete")}
                            onClick={() => handleDeleteResource(r)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center opacity-60 text-sm">
                      {t("resourceGroups.noResources")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-3">
            <p className="text-xs opacity-50">{t("resourceGroups.ipFormatHint")}</p>
            {permission.networks.update && (
              <Button onClick={handleSave} disabled={!hasChanges || saving}>
                {saving ? t("common.savingChanges") : t("common.save")}
              </Button>
            )}
          </div>
        </>
      )}

      {tab === "preview" && (
        <div>
          <p className="text-xs opacity-60 mb-2">{t("resourceGroups.previewHint")}</p>
          <div className="border rounded-lg divide-y">
            {filtered.map((r, i) => (
              <div key={r.key} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="opacity-50 w-8">{i + 1}</span>
                <code className="font-mono">{r.ip}</code>
                {r.note && <span className="text-xs opacity-60">{r.note}</span>}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="p-4 text-sm opacity-60">{t("resourceGroups.noResources")}</p>
            )}
          </div>
        </div>
      )}

      <BatchEditModal
        open={showBatch}
        onOpenChange={setShowBatch}
        onApply={(items) => {
          setRows([
            ...rows,
            ...items.map((it, i) => ({
              key: `new-${Date.now()}-${i}`,
              ip: it.ip,
              note: it.note,
              dirty: true,
            })),
          ]);
        }}
      />
    </Card>
  );
}

function BatchEditModal({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onApply: (items: { ip: string; note: string }[]) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleApply = () => {
    const parsed = parseBatchResources(text);
    const bad = parsed.filter((p) => p.error);
    if (bad.length > 0) {
      setError(
        t("resourceGroups.batchError").replace("{n}", String(bad.length)),
      );
      return;
    }
    setError("");
    onApply(parsed);
    setText("");
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass="max-w-lg">
        <ModalHeader
          title={t("resourceGroups.batchTitle")}
          description={t("resourceGroups.batchHint")}
        />
        <div className="px-6 py-4">
          <Textarea
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setText(e.target.value)
            }
            rows={10}
            className="font-mono text-sm"
            placeholder={"172.16.0.8,办公电脑\n172.16.0.0/24,办公网段"}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="secondary">{t("common.cancel")}</Button>
          </ModalClose>
          <Button onClick={handleApply}>{t("common.confirm")}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
