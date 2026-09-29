"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import Card from "@components/Card";
import { useDialog } from "@/contexts/DialogProvider";
import { PlusCircle, Trash2, Server, Circle } from "lucide-react";
import React, { useState } from "react";
import NetworkRoutesIcon from "@/assets/icons/NetworkRoutesIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import ConnectorModal from "@/modules/connectors/ConnectorModal";
import ConnectorDetail from "@/modules/connectors/ConnectorDetail";
import { Connector, useConnectors, useConnectorActions } from "@/modules/connectors/useConnectors";
import { notify } from "@components/Notification";
import { cn } from "@utils/helpers";

export default function ConnectorsPage() {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { connectors, peers, isLoading, refresh } = useConnectors();
  const { deleteConnector } = useConnectorActions();
  const { confirm } = useDialog();
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Connector | null>(null);

  const peerOnline = (peerId: string) => {
    const p = peers.find((x) => x.id === peerId);
    return !!p?.connected;
  };

  const handleDelete = async (c: Connector) => {
    const ok = await confirm({
      title: t("connectors.deleteTitle"),
      description: t("connectors.deleteDescription").replace("{name}", c.peerName),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      type: "danger",
    });
    if (!ok) return;
    try {
      await deleteConnector(c);
      notify({
        title: t("connectors.deletedTitle"),
        description: c.peerName,
      });
      if (selected?.networkId === c.networkId) setSelected(null);
    } catch (e) {
      notify({ title: t("connectors.deleteFailed"), description: String(e) });
    }
  };

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            label={t("nav.networkRouting")}
            icon={<NetworkRoutesIcon size={13} />}
          />
          <Breadcrumbs.Item href={"/connectors"} label={t("nav.connectors")} />
        </Breadcrumbs>
        <div className="flex items-center justify-between">
          <h1>{t("connectors.title")}</h1>
          {permission.networks.create && (
            <Button onClick={() => setShowCreate(true)}>
              <PlusCircle size={16} className="mr-1" />
              {t("connectors.addConnector")}
            </Button>
          )}
        </div>
        <p className="text-sm text-nb-gray-400 mt-1 max-w-3xl">
          {t("connectors.description")}
        </p>
      </div>

      <RestrictedAccess hasAccess={permission.networks.read}>
        <div className="p-default grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
          <div className="lg:col-span-1 space-y-3">
            {isLoading && (
              <>
                {[1, 2].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded bg-nb-gray-700 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-2/3 rounded bg-nb-gray-700 animate-pulse mb-1.5" />
                        <div className="h-3 w-1/2 rounded bg-nb-gray-800 animate-pulse" />
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
            {!isLoading && connectors.length === 0 && (
              <Card className="p-8 text-center">
                <Server size={32} className="mx-auto mb-3 text-nb-gray-500" />
                <p className="text-sm text-nb-gray-400 mb-4">{t("connectors.empty")}</p>
                {permission.networks.create && (
                  <Button size="sm" onClick={() => setShowCreate(true)}>
                    <PlusCircle size={14} className="mr-1" />
                    {t("connectors.addConnector")}
                  </Button>
                )}
              </Card>
            )}
            {connectors.map((c) => {
              const online = peerOnline(c.peerId);
              const enabledCount = c.announced.filter((r) => r.enabled).length;
              const isSelected = selected?.networkId === c.networkId;
              return (
                <Card
                  key={c.networkId}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md",
                    isSelected
                      ? "border-nb-primary ring-1 ring-nb-primary/30"
                      : "hover:border-nb-gray-600",
                  )}
                  onClick={() => setSelected(c)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Server size={20} className="text-nb-gray-400" />
                      <Circle
                        size={8}
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 fill-current",
                          online ? "text-green-500" : "text-nb-gray-600",
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate flex items-center gap-2">
                        {c.peerName}
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-normal shrink-0",
                            online
                              ? "bg-green-500/15 text-green-400"
                              : "bg-nb-gray-700 text-nb-gray-400",
                          )}
                        >
                          {online ? t("connectors.online") : t("connectors.offline")}
                        </span>
                      </div>
                      <div className="text-xs text-nb-gray-500 mt-0.5">
                        {t("connectors.routeCount").replace("{n}", String(enabledCount))}
                        {" · "}
                        {t("connectors.effectiveCount").replace(
                          "{n}",
                          String(c.effective.length),
                        )}
                      </div>
                    </div>
                    {permission.networks.delete && (
                      <button
                        className="text-nb-gray-500 hover:text-red-400 shrink-0 p-1 rounded hover:bg-nb-gray-800 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c);
                        }}
                        title={t("common.delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  {enabledCount > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {c.announced
                        .filter((r) => r.enabled)
                        .slice(0, 3)
                        .map((r, i) => (
                          <code
                            key={i}
                            className="text-[11px] bg-nb-gray-800 border border-nb-gray-700 px-1.5 py-0.5 rounded font-mono text-nb-gray-300"
                          >
                            {r.cidr}
                          </code>
                        ))}
                      {enabledCount > 3 && (
                        <span className="text-[11px] text-nb-gray-500 self-center">
                          +{enabledCount - 3}
                        </span>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <ConnectorDetail
                connector={
                  connectors.find((c) => c.networkId === selected.networkId) || selected
                }
                onChanged={refresh}
              />
            ) : (
              <Card className="p-12 text-center h-full min-h-64 flex flex-col items-center justify-center">
                <NetworkRoutesIcon size={36} className="mb-3 text-nb-gray-600" />
                <p className="text-sm text-nb-gray-500">{t("connectors.selectHint")}</p>
              </Card>
            )}
          </div>
        </div>
      </RestrictedAccess>

      <ConnectorModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={refresh}
      />
    </PageContainer>
  );
}
