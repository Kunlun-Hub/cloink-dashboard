"use client";

import Button from "@components/Button";
import Card from "@components/Card";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import { Input } from "@components/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { cn } from "@utils/helpers";
import { Check, Pencil, PlusCircle, X } from "lucide-react";
import React, { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";
import { NetworkResource } from "@/interfaces/Network";

type Props = {
  resources: NetworkResource[];
  groups: Group[];
  onUpdate: (resource: NetworkResource, updates: Partial<NetworkResource>) => Promise<void>;
  onAdd: () => void;
  canEdit: boolean;
};

type EditingState = {
  id: string;
  field: "name" | "address" | "description";
  value: string;
} | null;

export default function EditableResourcesTable({
  resources,
  groups,
  onUpdate,
  onAdd,
  canEdit,
}: Props) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<EditingState>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (r: NetworkResource, field: "name" | "address" | "description") => {
    if (!canEdit) return;
    setEditing({ id: r.id, field, value: String(r[field] || "") });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    const resource = resources.find((r) => r.id === editing.id);
    if (!resource) return;
    setSaving(true);
    try {
      await onUpdate(resource, { [editing.field]: editing.value });
    } finally {
      setSaving(false);
      setEditing(null);
    }
  };

  const renderEditableCell = (
    r: NetworkResource,
    field: "name" | "address" | "description",
    display: React.ReactNode,
    mono?: boolean,
  ) => {
    const isEditing = editing?.id === r.id && editing?.field === field;
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editing.value}
            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            autoFocus
            className={cn("h-8 text-sm", mono && "font-mono")}
            disabled={saving}
          />
          <button
            onClick={saveEdit}
            disabled={saving}
            className="p-1 text-green-600 hover:text-green-700"
            title={t("common.save")}
          >
            <Check size={14} />
          </button>
          <button
            onClick={cancelEdit}
            disabled={saving}
            className="p-1 text-nb-gray-400 hover:text-nb-gray-600"
            title={t("common.cancel")}
          >
            <X size={14} />
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => startEdit(r, field)}
        className={cn(
          "group flex items-center gap-1.5 text-left max-w-full",
          canEdit && "hover:bg-nb-gray-100 dark:hover:bg-nb-gray-800 rounded px-1 -mx-1",
          mono && "font-mono text-[13px]",
        )}
        title={canEdit ? t("networkResources.clickToEdit") : undefined}
      >
        <span className="truncate">{display}</span>
        {canEdit && (
          <Pencil
            size={12}
            className="shrink-0 opacity-0 group-hover:opacity-50"
          />
        )}
      </button>
    );
  };

  return (
    <Card className="flex-1 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-nb-gray-200 dark:border-nb-gray-700 text-left">
              <th className="px-4 py-3 font-medium text-nb-gray-500">
                {t("networkResources.name")}
              </th>
              <th className="px-4 py-3 font-medium text-nb-gray-500">
                {t("networkResources.address")}
              </th>
              <th className="px-4 py-3 font-medium text-nb-gray-500">
                {t("networkResources.description")}
              </th>
              <th className="px-4 py-3 font-medium text-nb-gray-500 w-24">
                {t("networkResources.type")}
              </th>
              <th className="px-4 py-3 font-medium text-nb-gray-500 w-20">
                {t("common.status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-nb-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <p>{t("networkResources.noResources")}</p>
                    {canEdit && (
                      <Button onClick={onAdd} variant="secondary" size="sm">
                        <PlusCircle size={15} className="mr-1" />
                        {t("networkResources.addResource")}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {resources.map((r) => (
              <tr
                key={r.id}
                className={cn(
                  "border-b border-nb-gray-100 dark:border-nb-gray-800",
                  "hover:bg-nb-gray-50 dark:hover:bg-nb-gray-800/50",
                  !r.enabled && "opacity-50",
                )}
              >
                <td className="px-4 py-3 max-w-48">
                  {renderEditableCell(r, "name", r.name || "-")}
                </td>
                <td className="px-4 py-3 max-w-56">
                  {renderEditableCell(r, "address", r.address || "-", true)}
                </td>
                <td className="px-4 py-3 max-w-64">
                  {renderEditableCell(r, "description", r.description || "-")}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-nb-gray-100 dark:bg-nb-gray-800 text-nb-gray-600 dark:text-nb-gray-400">
                    {r.type || "host"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <FancyToggleSwitch
                    value={r.enabled}
                    onChange={() => onUpdate(r, { enabled: !r.enabled })}
                    disabled={!canEdit}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
