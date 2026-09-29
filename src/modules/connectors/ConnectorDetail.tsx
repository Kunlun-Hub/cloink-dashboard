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
        <h2 className="text-lg font-medium">{connector.peerName}</h2>
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

      <div className="flex gap-1 border-b mb-4">
        <TabButton active={tab === "announced"} onClick={() => setTab("announced")}>
          {t("connectors.announcedRoutes")} ({announced.filter((r) => r.enabled).length})
        </TabButton>
        <TabButton active={tab === "excluded"} onClick={() => setTab("excluded")}>
          {t("connectors.excludedRoutes")} ({excluded.filter((r) => r.enabled).length})
        </TabButton>
        <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
          {t("connectors.preview")} ({preview.length})
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
          <Paragraph className="text-xs opacity-60 mb-2">
            {t("connectors.previewHint")}
          </Paragraph>
          <div className="border rounded-lg divide-y">
            {preview.length === 0 && (
              <p className="p-4 text-sm opacity-60">{t("connectors.previewEmpty")}</p>
            )}
            {preview.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                <code className="font-mono">{r.cidr}</code>
                <span className="text-xs opacity-50 truncate">
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
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm border-b-2 -mb-px transition-colors",
        active
          ? "border-nb-primary text-nb-primary font-medium"
          : "border-transparent opacity-60 hover:opacity-100",
      )}
    >
      {children}
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
    return <p className="text-sm opacity-60 py-4">{t("connectors.noRoutes")}</p>;
  return (
    <div className="border rounded-lg divide-y">
      {routes.map((r, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm",
            !r.enabled && "opacity-50",
          )}
        >
          <FancyToggleSwitch value={r.enabled} onChange={() => onToggle(i)} />
          <code className="font-mono">{r.cidr}</code>
          {r.description && (
            <span className="opacity-60 truncate text-xs">{r.description}</span>
          )}
          <button
            className="ml-auto text-red-500 hover:text-red-400"
            onClick={() => onDelete(i)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
