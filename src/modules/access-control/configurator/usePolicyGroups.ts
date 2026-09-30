"use client";

import { useCallback, useEffect, useState } from "react";
import { Policy } from "@/interfaces/Policy";

export interface PolicyGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

const STORAGE_KEY = "cloink-policy-groups";
const POLICY_GROUP_KEY = "cloink-policy-group-map"; // policyId -> groupId
const POLICY_ORDER_KEY = "cloink-policy-order"; // policyId[] in priority order

const DEFAULT_GROUPS: PolicyGroup[] = [
  { id: "default", name: "默认组", color: "#6b7280" },
];

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function usePolicyGroups() {
  const [groups, setGroups] = useState<PolicyGroup[]>(() =>
    load(STORAGE_KEY, DEFAULT_GROUPS),
  );
  const [policyGroupMap, setPolicyGroupMap] = useState<Record<string, string>>(
    () => load(POLICY_GROUP_KEY, {}),
  );
  const [policyOrder, setPolicyOrder] = useState<string[]>(() =>
    load(POLICY_ORDER_KEY, []),
  );

  useEffect(() => save(STORAGE_KEY, groups), [groups]);
  useEffect(() => save(POLICY_GROUP_KEY, policyGroupMap), [policyGroupMap]);
  useEffect(() => save(POLICY_ORDER_KEY, policyOrder), [policyOrder]);

  const addGroup = useCallback((name: string, description?: string) => {
    const group: PolicyGroup = {
      id: `group-${Date.now()}`,
      name,
      description,
      color: "#6b7280",
    };
    setGroups((prev) => [...prev, group]);
    return group;
  }, []);

  const renameGroup = useCallback((id: string, name: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
  }, []);

  const deleteGroup = useCallback(
    (id: string) => {
      if (id === "default") return;
      setGroups((prev) => prev.filter((g) => g.id !== id));
      // Move policies in deleted group back to default
      setPolicyGroupMap((prev) => {
        const next = { ...prev };
        for (const pid of Object.keys(next)) {
          if (next[pid] === id) next[pid] = "default";
        }
        return next;
      });
    },
    [],
  );

  const assignPolicyToGroup = useCallback((policyId: string, groupId: string) => {
    setPolicyGroupMap((prev) => ({ ...prev, [policyId]: groupId }));
  }, []);

  const getPolicyGroup = useCallback(
    (policyId: string | undefined): string => {
      if (!policyId) return "default";
      return policyGroupMap[policyId] || "default";
    },
    [policyGroupMap],
  );

  const getGroupName = useCallback(
    (groupId: string): string => {
      return groups.find((g) => g.id === groupId)?.name || "默认组";
    },
    [groups],
  );

  // Priority: lower index = higher priority (evaluated first)
  const getPriority = useCallback(
    (policyId: string | undefined, allPolicies: Policy[]): number => {
      if (!policyId) return 999;
      const idx = policyOrder.indexOf(policyId);
      if (idx >= 0) return idx + 1;
      // Not in order list yet: append at end
      return policyOrder.length + allPolicies.findIndex((p) => p.id === policyId) + 1;
    },
    [policyOrder],
  );

  const movePolicyPriority = useCallback(
    (policyId: string, direction: "up" | "down", allPolicies: Policy[]) => {
      setPolicyOrder((prev) => {
        // Build full ordered list: existing order + any new policies appended
        const ordered = [...prev];
        for (const p of allPolicies) {
          if (p.id && !ordered.includes(p.id)) ordered.push(p.id);
        }
        const idx = ordered.indexOf(policyId);
        if (idx < 0) return prev;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= ordered.length) return prev;
        const next = [...ordered];
        [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
        return next;
      });
    },
    [],
  );

  const sortByPriority = useCallback(
    (policies: Policy[]): Policy[] => {
      const orderMap = new Map<string, number>();
      const ordered = [...policyOrder];
      for (const p of policies) {
        if (p.id && !ordered.includes(p.id)) ordered.push(p.id);
      }
      ordered.forEach((id, idx) => orderMap.set(id, idx));
      return [...policies].sort((a, b) => {
        const ai = a.id ? orderMap.get(a.id) ?? 9999 : 9999;
        const bi = b.id ? orderMap.get(b.id) ?? 9999 : 9999;
        return ai - bi;
      });
    },
    [policyOrder],
  );

  return {
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
  };
}
