"use client";

import Button from "@components/Button";
import { PlusCircle } from "lucide-react";
import React, { useMemo, useState } from "react";
import { mutate } from "swr";
import { useI18n } from "@/i18n/I18nProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { Group } from "@/interfaces/Group";
import { NetworkResource } from "@/interfaces/Network";
import useFetchApi from "@utils/api";
import ResourceGroupsSidebar from "./ResourceGroupsSidebar";
import EditableResourcesTable from "./EditableResourcesTable";

type Props = {
  networkId: string;
  resources: NetworkResource[];
  isLoading: boolean;
};

function getGroupId(g: string | Group): string {
  return typeof g === "string" ? g : g.id || "";
}

export default function ResourceWorkstation({ networkId, resources = [], isLoading }: Props) {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { data: groups = [] } = useFetchApi<Group[]>("/groups");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const canEdit = permission.networks.update;

  const filteredResources = useMemo(() => {
    if (selectedGroupId === null) return resources;
    if (selectedGroupId === "ungrouped") {
      return resources.filter((r) => !r.groups || r.groups.length === 0);
    }
    return resources.filter((r) =>
      (r.groups || []).some((g) => getGroupId(g) === selectedGroupId),
    );
  }, [resources, selectedGroupId]);

  const handleUpdate = async (
    resource: NetworkResource,
    updates: Partial<NetworkResource>,
  ) => {
    const res = await fetch(
      `/api/networks/${networkId}/resources/${resource.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...resource, ...updates }),
      },
    );
    if (!res.ok) throw new Error("update failed");
    mutate(`/networks/${networkId}/resources`);
  };

  return (
    <div className="px-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-nb-gray-500">
          {t("networkResources.workstationHint")}
        </p>
        {canEdit && (
          <Button variant="secondary" size="sm">
            <PlusCircle size={15} className="mr-1" />
            {t("networkResources.addResource")}
          </Button>
        )}
      </div>
      <div className="flex gap-6 items-start">
        <ResourceGroupsSidebar
          resources={resources}
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
        />
        <EditableResourcesTable
          resources={filteredResources}
          groups={groups}
          onUpdate={handleUpdate}
          onAdd={() => {}}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
