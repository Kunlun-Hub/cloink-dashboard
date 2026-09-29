"use client";

import Button from "@components/Button";
import { Input } from "@components/Input";
import { cn } from "@utils/helpers";
import { Folder, FolderPlus, Pencil, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { PolicyGroup } from "./usePolicyGroups";

type Props = {
  groups: PolicyGroup[];
  selectedGroupId: string | null; // null = all
  onSelect: (groupId: string | null) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  counts: Record<string, number>;
  totalCount: number;
};

export default function PolicyGroupsSidebar({
  groups,
  selectedGroupId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  counts,
  totalCount,
}: Props) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAdd(name);
    setNewName("");
    setAdding(false);
  };

  const handleRename = (id: string) => {
    const name = editName.trim();
    if (name) onRename(id, name);
    setEditingId(null);
  };

  return (
    <div className="w-60 shrink-0 border-r border-nb-gray-200 dark:border-nb-gray-700 pr-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-nb-gray-900 dark:text-nb-gray-100">
          {t("accessControl.policyGroups")}
        </h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setAdding(true)}
          title={t("accessControl.addGroup")}
        >
          <FolderPlus size={16} />
        </Button>
      </div>

      {adding && (
        <div className="flex gap-2 mb-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("accessControl.groupNamePlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleAdd}>
            {t("common.add")}
          </Button>
        </div>
      )}

      <div className="space-y-1">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm",
            "hover:bg-nb-gray-100 dark:hover:bg-nb-gray-800",
            selectedGroupId === null
              ? "bg-nb-gray-100 dark:bg-nb-gray-800 font-medium"
              : "text-nb-gray-600 dark:text-nb-gray-400",
          )}
        >
          <span className="flex items-center gap-2">
            <Folder size={15} />
            {t("common.all")}
          </span>
          <span className="text-xs text-nb-gray-400">{totalCount}</span>
        </button>

        {groups.map((group) => (
          <div key={group.id} className="group relative">
            {editingId === group.id ? (
              <div className="flex gap-2 px-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(group.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={() => handleRename(group.id)}>
                  {t("common.save")}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => onSelect(group.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm",
                  "hover:bg-nb-gray-100 dark:hover:bg-nb-gray-800",
                  selectedGroupId === group.id
                    ? "bg-nb-gray-100 dark:bg-nb-gray-800 font-medium"
                    : "text-nb-gray-600 dark:text-nb-gray-400",
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder size={15} />
                  <span className="truncate">{group.name}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-xs text-nb-gray-400">
                    {counts[group.id] || 0}
                  </span>
                  {group.id !== "default" && (
                    <span className="hidden group-hover:flex items-center gap-1 ml-1">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(group.id);
                          setEditName(group.name);
                        }}
                        className="p-1 hover:text-nb-gray-900 dark:hover:text-nb-gray-100"
                      >
                        <Pencil size={13} />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(group.id);
                        }}
                        className="p-1 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </span>
                    </span>
                  )}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
