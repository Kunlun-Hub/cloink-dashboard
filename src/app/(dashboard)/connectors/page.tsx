"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import Card from "@components/Card";
import { useDialog } from "@/contexts/DialogProvider";
import { PlusCircle, Trash2, Server } from "lucide-react";
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

export default function ConnectorsPage() {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { connectors, isLoading, refresh } = useConnectors();
  const { deleteConnector } = useConnectorActions();
  const { confirm } = useDialog();
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Connector | null>(null);

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
        <p className="text-sm opacity-70 mt-1">{t("connectors.description")}</p>
      </div>

      <RestrictedAccess hasAccess={permission.networks.read}>
        <div className="p-default grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-3">
            {isLoading && <p className="text-sm opacity-60">{t("common.loading")}</p>}
            {!isLoading && connectors.length === 0 && (
              <Card className="p-6 text-center text-sm opacity-70">
                {t("connectors.empty")}
              </Card>
            )}
            {connectors.map((c) => (
              <Card
                key={c.networkId}
                className={`p-4 cursor-pointer hover:border-nb-primary transition-colors ${
                  selected?.networkId === c.networkId ? "border-nb-primary" : ""
                }`}
                onClick={() => setSelected(c)}
              >
                <div className="flex items-center gap-3">
                  <Server size={20} className="shrink-0 opacity-70" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{c.peerName}</div>
                    <div className="text-xs opacity-60">
                      {t("connectors.routeCount").replace(
                        "{n}",
                        String(c.announced.filter((r) => r.enabled).length),
                      )}{" "}
                      ·{" "}
                      {t("connectors.effectiveCount").replace(
                        "{n}",
                        String(c.effective.length),
                      )}
                    </div>
                  </div>
                  {permission.networks.delete && (
                    <button
                      className="text-red-500 hover:text-red-400 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.announced
                    .filter((r) => r.enabled)
                    .slice(0, 3)
                    .map((r, i) => (
                      <code
                        key={i}
                        className="text-xs bg-nb-gray-800 px-1.5 py-0.5 rounded font-mono"
                      >
                        {r.cidr}
                      </code>
                    ))}
                  {c.announced.filter((r) => r.enabled).length > 3 && (
                    <span className="text-xs opacity-60">
                      +{c.announced.filter((r) => r.enabled).length - 3}
                    </span>
                  )}
                </div>
              </Card>
            ))}
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
              <Card className="p-12 text-center text-sm opacity-60">
                {t("connectors.selectHint")}
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
