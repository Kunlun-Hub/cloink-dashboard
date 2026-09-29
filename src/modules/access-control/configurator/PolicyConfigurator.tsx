"use client";

import Button from "@components/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { Policy } from "@/interfaces/Policy";
import { ClockFadingIcon, PlusCircle } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { usePolicies } from "@/contexts/PoliciesProvider";
import AccessControlModal, {
  AccessControlUpdateModal,
} from "@/modules/access-control/AccessControlModal";
import PolicyGroupsSidebar from "./PolicyGroupsSidebar";
import PolicyConfiguratorTable from "./PolicyConfiguratorTable";
import { usePolicyGroups } from "./usePolicyGroups";

type Props = {
  policies?: Policy[];
  isLoading: boolean;
};

export default function PolicyConfigurator({ policies = [], isLoading }: Props) {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { mutate } = useSWRConfig();
  const { updatePolicy, serializeRules } = usePolicies();

  const {
    groups,
    addGroup,
    renameGroup,
    deleteGroup,
    assignPolicyToGroup,
    getPolicyGroup,
    getGroupName,
    getPriority,
    movePolicyPriority,
    sortByPriority,
  } = usePolicyGroups();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const canEdit = permission.policies.create || permission.policies.update;

  const sortedPolicies = useMemo(() => sortByPriority(policies), [policies, sortByPriority]);

  const filteredPolicies = useMemo(() => {
    if (selectedGroupId === null) return sortedPolicies;
    return sortedPolicies.filter((p) => getPolicyGroup(p.id) === selectedGroupId);
  }, [sortedPolicies, selectedGroupId, getPolicyGroup]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of policies) {
      const gid = getPolicyGroup(p.id);
      c[gid] = (c[gid] || 0) + 1;
    }
    return c;
  }, [policies, getPolicyGroup]);

  const handleToggleEnabled = async (policy: Policy) => {
    if (!canEdit) return;
    const nextEnabled = !policy.enabled;
    await updatePolicy(
      policy,
      { enabled: nextEnabled, rules: serializeRules(policy.rules, nextEnabled) },
      () => {
        mutate("/policies");
        setLastSync(new Date());
      },
    );
  };

  const handleMovePriority = (policyId: string, direction: "up" | "down") => {
    movePolicyPriority(policyId, direction, policies);
  };

  const handleModalSuccess = () => {
    mutate("/policies");
    setLastSync(new Date());
    setShowAddModal(false);
    setEditingPolicy(null);
  };

  return (
    <div className="px-6 pb-6">
      {/* Top bar: last sync + add button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-nb-gray-400">
          <ClockFadingIcon size={14} />
          <span>
            {t("accessControl.lastSync")}: {lastSync.toLocaleString()}
          </span>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAddModal(true)}>
            <PlusCircle size={16} className="mr-1" />
            {t("accessControl.addPolicy")}
          </Button>
        )}
      </div>

      <div className="flex gap-6">
        <PolicyGroupsSidebar
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
          onAdd={addGroup}
          onRename={renameGroup}
          onDelete={deleteGroup}
          counts={counts}
          totalCount={policies.length}
        />
        <PolicyConfiguratorTable
          policies={filteredPolicies}
          groups={groups}
          getPolicyGroup={getPolicyGroup}
          getGroupName={getGroupName}
          getPriority={(pid) => getPriority(pid, policies)}
          onMovePriority={handleMovePriority}
          onAssignGroup={assignPolicyToGroup}
          onToggleEnabled={handleToggleEnabled}
          onAdd={() => setShowAddModal(true)}
          onEdit={setEditingPolicy}
          canEdit={canEdit}
        />
      </div>

      {showAddModal && (
        <AccessControlModal>
          <span />
        </AccessControlModal>
      )}
      {editingPolicy && (
        <AccessControlUpdateModal
          policy={editingPolicy}
          open={!!editingPolicy}
          onOpenChange={(open) => !open && setEditingPolicy(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
