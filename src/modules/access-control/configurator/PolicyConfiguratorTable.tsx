"use client";

import Button from "@components/Button";
import Card from "@components/Card";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { cn } from "@utils/helpers";
import { ArrowDown, ArrowUp, PlusCircle } from "lucide-react";
import React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Policy } from "@/interfaces/Policy";
import { PolicyGroup } from "./usePolicyGroups";

type Props = {
  policies: Policy[];
  groups: PolicyGroup[];
  getPolicyGroup: (policyId: string | undefined) => string;
  getGroupName: (groupId: string) => string;
  getPriority: (policyId: string | undefined, all: Policy[]) => number;
  onMovePriority: (policyId: string, direction: "up" | "down") => void;
  onAssignGroup: (policyId: string, groupId: string) => void;
  onToggleEnabled: (policy: Policy) => void;
  onAdd: () => void;
  onEdit: (policy: Policy) => void;
  canEdit: boolean;
};

function formatSources(policy: Policy): string {
  try {
    const rule = policy.rules?.[0];
    if (!rule?.sources || rule.sources.length === 0) return "-";
    return rule.sources
      .map((s) => (typeof s === "string" ? s : s.name))
      .slice(0, 3)
      .join(", ");
  } catch {
    return "-";
  }
}

function formatDestinations(policy: Policy): string {
  try {
    const rule = policy.rules?.[0];
    const parts: string[] = [];
    if (rule?.destinations && rule.destinations.length > 0) {
      parts.push(
        rule.destinations
          .map((d) => (typeof d === "string" ? d : d.name))
          .slice(0, 2)
          .join(", "),
      );
    }
    if (rule?.ports && rule.ports.length > 0) {
      parts.push(`:${rule.ports.slice(0, 3).join(",")}`);
    }
    return parts.join(" ") || "-";
  } catch {
    return "-";
  }
}

function formatAction(policy: Policy): string {
  try {
    const action = policy.rules?.[0]?.action;
    if (action === "accept") return "允许";
    if (action === "drop") return "拒绝";
    return action || "-";
  } catch {
    return "-";
  }
}

export default function PolicyConfiguratorTable({
  policies,
  groups,
  getPolicyGroup,
  getGroupName,
  getPriority,
  onMovePriority,
  onAssignGroup,
  onToggleEnabled,
  onAdd,
  onEdit,
  canEdit,
}: Props) {
  const { t } = useI18n();

  return (
    <Card className="flex-1 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-nb-gray-200 dark:border-nb-gray-700 text-left">
              <th className="px-4 py-3 font-medium text-nb-gray-500 w-16">
                {t("accessControl.priority")}
              </th>
              <th className="px-4 py-3 font-medium text-nb-gray-500">
                {t("accessControl.name")}
              </th>
              <th className="px-4 py-3 font-medium text-nb-gray-500">
                {t("accessControl.policyGroup")}
              </th>
              <th className="px-4 py-3 font-medium text-nb-gray-500">
                {t("accessControl.sources")}
              </th>
              <th className="px-4 py-3 font-medium text-nb-gray-500 w-24">
                {t("accessControl.action")}
              </th>
              <th className="px-4 py-3 font-medium text-nb-gray-500">
                {t("accessControl.destinations")}
              </th>
              <th className="px-4 py-3 font-medium text-nb-gray-500 w-20">
                {t("common.status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-nb-gray-400"
                >
                  <div className="flex flex-col items-center gap-3">
                    <p>{t("accessControl.noPolicies")}</p>
                    {canEdit && (
                      <Button onClick={onAdd} variant="secondary" size="sm">
                        <PlusCircle size={15} className="mr-1" />
                        {t("accessControl.addPolicy")}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {policies.map((policy) => {
              const groupId = getPolicyGroup(policy.id);
              const priority = getPriority(policy.id, policies);
              return (
                <tr
                  key={policy.id}
                  className={cn(
                    "border-b border-nb-gray-100 dark:border-nb-gray-800",
                    "hover:bg-nb-gray-50 dark:hover:bg-nb-gray-800/50",
                    !policy.enabled && "opacity-50",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-nb-gray-500 w-6">
                        {priority}
                      </span>
                      {canEdit && (
                        <span className="flex flex-col">
                          <button
                            onClick={() =>
                              policy.id && onMovePriority(policy.id, "up")
                            }
                            className="p-0.5 hover:text-nb-gray-900 dark:hover:text-nb-gray-100 text-nb-gray-400"
                            title={t("accessControl.moveUp")}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() =>
                              policy.id && onMovePriority(policy.id, "down")
                            }
                            className="p-0.5 hover:text-nb-gray-900 dark:hover:text-nb-gray-100 text-nb-gray-400"
                            title={t("accessControl.moveDown")}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onEdit(policy)}
                      className="font-medium text-left hover:underline"
                    >
                      {policy.name}
                    </button>
                    {policy.description && (
                      <p className="text-xs text-nb-gray-400 truncate max-w-48">
                        {policy.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <Select
                        value={groupId}
                        onValueChange={(v) =>
                          policy.id && onAssignGroup(policy.id, v)
                        }
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs">{getGroupName(groupId)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-nb-gray-600 dark:text-nb-gray-400 max-w-48 truncate">
                    {formatSources(policy)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                        policy.rules?.[0]?.action === "accept"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                      )}
                    >
                      {formatAction(policy)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-nb-gray-600 dark:text-nb-gray-400 max-w-48 truncate">
                    {formatDestinations(policy)}
                  </td>
                  <td className="px-4 py-3">
                    <FancyToggleSwitch
                      value={policy.enabled}
                      onChange={() => onToggleEnabled(policy)}
                      disabled={!canEdit}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
