"use client";

import { cn } from "@utils/helpers";
import { Folder, Layers } from "lucide-react";
import React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";
import { NetworkResource } from "@/interfaces/Network";

type Props = {
  resources: NetworkResource[];
  groups: Group[];
  selectedGroupId: string | null; // null = all, "ungrouped" = no group
  onSelect: (groupId: string | null) => void;
};

function getGroupId(g: string | Group): string {
  return typeof g === "string" ? g : g.id || "";
}

function getGroupName(g: string | Group): string {
  return typeof g === "string" ? g : g.name;
}

export default function ResourceGroupsSidebar({
  resources,
  groups,
  selectedGroupId,
  onSelect,
}: Props) {
  const { t } = useI18n();

  // Count resources per group
  const counts = React.useMemo(() => {
    const c: Record<string, number> = {};
    let ungrouped = 0;
    for (const r of resources) {
      if (!r.groups || r.groups.length === 0) {
        ungrouped++;
      } else {
        for (const g of r.groups) {
          const gid = getGroupId(g);
          if (gid) c[gid] = (c[gid] || 0) + 1;
        }
      }
    }
    c["ungrouped"] = ungrouped;
    return c;
  }, [resources]);

  // Only show groups that have resources, plus ungrouped
  const visibleGroups = groups.filter((g) => g.id && (counts[g.id] || 0) > 0);

  return (
    <div className="w-56 shrink-0 border-r border-nb-gray-200 dark:border-nb-gray-700 pr-4">
      <h3 className="text-sm font-semibold text-nb-gray-900 dark:text-nb-gray-100 mb-3">
        {t("networkResources.resourceGroups")}
      </h3>
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
            <Layers size={15} />
            {t("common.all")}
          </span>
          <span className="text-xs text-nb-gray-400">{resources.length}</span>
        </button>

        {visibleGroups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelect(group.id || null)}
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
            <span className="text-xs text-nb-gray-400">
              {group.id ? counts[group.id] || 0 : 0}
            </span>
          </button>
        ))}

        {(counts.ungrouped || 0) > 0 && (
          <button
            onClick={() => onSelect("ungrouped")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm",
              "hover:bg-nb-gray-100 dark:hover:bg-nb-gray-800",
              selectedGroupId === "ungrouped"
                ? "bg-nb-gray-100 dark:bg-nb-gray-800 font-medium"
                : "text-nb-gray-600 dark:text-nb-gray-400",
            )}
          >
            <span className="flex items-center gap-2">
              <Folder size={15} />
              {t("networkResources.ungrouped")}
            </span>
            <span className="text-xs text-nb-gray-400">{counts.ungrouped}</span>
          </button>
        )}
      </div>
    </div>
  );
}
