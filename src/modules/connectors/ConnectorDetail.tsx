"use client";

import Button from "@components/Button";
import Card from "@components/Card";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { notify } from "@components/Notification";
import Paragraph from "@components/Paragraph";
import { Pencil, Plus, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  computeEffectiveRoutes,
  isValidRouteInput,
  normalizeToCIDRs,
  RouteEntry,
} from "./cidr";
import { Connector, useConnectorActions } from "./useConnectors";
import { cn } from "@utils/helpers";

type Tab = "announced" | "excluded" | "preview";

export default function ConnectorDetail({
  connector,
  onChanged,
}: {
  connector: Connector;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const { syncRoutes } = useConnectorActions();
  const [tab, setTab] = useState<Tab>("announced");
  const [editing, setEditing] = useState(false);
  const [announced, setAnnounced] = useState<RouteEntry[]>(connector.announced);
  const [excluded, setExcluded] = useState<RouteEntry[]>(connector.excluded);
  const [saving, setSaving] = useState(false);

  // Reset drafts when connector changes
  React.useEffect(() => {
    setAnnounced(connector.announced);
    setExcluded(connector.excluded);
    setEditing(false);
  }, [connector.networkId, connector.announced, connector.excluded]);

  const preview = useMemo(
    () => computeEffectiveRoutes(announced, excluded),
    [announced, excluded],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await syncRoutes(connector, announced, excluded);
      notify({
        title: t("connectors.savedTitle"),
        description: connector.peerName,
      });
      setEditing(false);
      onChanged();
    } catch (e) {
      notify({ title: t("connectors.saveFailed"), description: String(e) });
    } finally {
      setSaving(false);
    }
  };

  const toggleRoute = (kind: "announce" | "exclude", idx: number) => {
    const list = kind === "announce" ? announced : excluded;
    const set = kind === "announce" ? setAnnounced : setExcluded;
    set(list.map((r, i) => (i === idx ? { ...r, enabled: !r.enabled } : r)));
    setEditing(true);
  };

  const deleteRoute = (kind: "announce" | "exclude", idx: number) => {
    if (kind === "announce") setAnnounced(announced.filter((_, i) => i !== idx));
    else setExcluded(excluded.filter((_, i) => i !== idx));
    setEditing(true);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-lg font-semibold">{connector.peerName}</h2>
          <p className="text-xs text-nb-gray-500 mt-0.5 font-mono truncate max-w-md">{connector.peerId}</p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setAnnounced(connector.announced);
                setExcluded(connector.excluded);
                setEditing(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? t("common.savingChanges") : t("common.save")}
            </Button>
          </div>
        ) : null}
      </div>
      <Paragraph className="text-sm opacity-70 mb-4">
        {t("connectors.detailHint")}
      </Paragraph>

      <div className="flex gap-1 border-b border-nb-gray-800 mb-4">
        <TabButton
          active={tab === "announced"}
          onClick={() => setTab("announced")}
          count={announced.filter((r) => r.enabled).length}
        >
          {t("connectors.announcedRoutes")}
        </TabButton>
        <TabButton
          active={tab === "excluded"}
          onClick={() => setTab("excluded")}
          count={excluded.filter((r) => r.enabled).length}
        >
          {t("connectors.excludedRoutes")}
        </TabButton>
        <TabButton active={tab === "preview"} onClick={() => setTab("preview")} count={preview.length}>
          {t("connectors.preview")}
        </TabButton>
      </div>

      {tab !== "preview" && (
        <>
          <AddRouteRow
            kind={tab === "announced" ? "announce" : "exclude"}
            onAdd={(entry) => {
              if (tab === "announced") setAnnounced([...announced, entry]);
              else setExcluded([...excluded, entry]);
              setEditing(true);
            }}
          />
          <RouteTable
            routes={tab === "announced" ? announced : excluded}
            onToggle={(i) => toggleRoute(tab === "announced" ? "announce" : "exclude", i)}
            onDelete={(i) => deleteRoute(tab === "announced" ? "announce" : "exclude", i)}
          />
        </>
      )}

      {tab === "preview" && (
        <div>
          <Paragraph className="text-xs text-nb-gray-500 mb-3">
            {t("connectors.previewHint")}
          </Paragraph>
          <div className="border border-nb-gray-800 rounded-lg divide-y divide-nb-gray-800 overflow-hidden">
            {preview.length === 0 && (
              <p className="p-8 text-sm text-nb-gray-500 text-center">
                {t("connectors.previewEmpty")}
              </p>
            )}
            {preview.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-nb-gray-800/50">
                <span className="w-6 text-xs text-nb-gray-600">{i + 1}</span>
                <code className="font-mono text-[13px] bg-green-500/10 border border-green-500/20 text-green-300 px-2 py-0.5 rounded">
                  {r.cidr}
                </code>
                <span className="text-xs text-nb-gray-500 truncate">
                  ← {r.sourceCidr}
                  {r.sourceDescription ? ` (${r.sourceDescription})` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors flex items-center gap-1.5",
        active
          ? "border-nb-primary text-nb-primary font-medium"
          : "border-transparent text-nb-gray-400 hover:text-nb-gray-200",
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "text-[11px] px-1.5 py-0.5 rounded-full",
            active ? "bg-nb-primary/15 text-nb-primary" : "bg-nb-gray-800 text-nb-gray-400",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function AddRouteRow({
  kind,
  onAdd,
}: {
  kind: "announce" | "exclude";
  onAdd: (entry: RouteEntry) => void;
}) {
  const { t } = useI18n();
  const [cidr, setCidr] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!isValidRouteInput(cidr)) {
      setError(t("connectors.invalidCidr"));
      return;
    }
    setError("");
    onAdd({
      cidr: normalizeToCIDRs(cidr)[0],
      description: note || undefined,
      enabled: true,
    });
    setCidr("");
    setNote("");
  };

  return (
    <div className="mb-3">
      <div className="flex gap-2">
        <Input
          placeholder={t("connectors.cidrPlaceholder")}
          value={cidr}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCidr(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Input
          placeholder={t("connectors.notePlaceholder")}
          value={note}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
          className="w-40"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button variant="secondary" size="sm" onClick={handleAdd}>
          <Plus size={14} className="mr-1" />
          {t("common.add")}
        </Button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function RouteTable({
  routes,
  onToggle,
  onDelete,
}: {
  routes: RouteEntry[];
  onToggle: (idx: number) => void;
  onDelete: (idx: number) => void;
}) {
  const { t } = useI18n();
  if (routes.length === 0)
    return (
      <div className="border border-dashed border-nb-gray-700 rounded-lg p-8 text-center">
        <p className="text-sm text-nb-gray-500">{t("connectors.noRoutes")}</p>
      </div>
    );
  return (
    <div className="border border-nb-gray-800 rounded-lg divide-y divide-nb-gray-800 overflow-hidden">
      {routes.map((r, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-nb-gray-800/50 transition-colors",
            !r.enabled && "opacity-50",
          )}
        >
          <FancyToggleSwitch value={r.enabled} onChange={() => onToggle(i)} />
          <code className="font-mono text-[13px] bg-nb-gray-800 px-2 py-0.5 rounded">
            {r.cidr}
          </code>
          {r.description && (
            <span className="text-nb-gray-400 truncate text-xs flex-1">{r.description}</span>
          )}
          <button
            className="ml-auto text-nb-gray-500 hover:text-red-400 p-1 rounded hover:bg-nb-gray-800 transition-colors shrink-0"
            onClick={() => onDelete(i)}
            title={t("common.delete")}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
