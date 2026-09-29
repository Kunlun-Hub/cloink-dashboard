"use client";

import Button from "@components/Button";
import Card from "@components/Card";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { Textarea } from "@components/Textarea";
import { PeerSelector } from "@components/PeerSelector";
import { PlusCircle, Server, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { mutate } from "swr";
import { useI18n } from "@/i18n/I18nProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { Network, NetworkRouter } from "@/interfaces/Network";
import { Peer } from "@/interfaces/Peer";
import useFetchApi, { useApiCall } from "@utils/api";

type Props = {
  children?: React.ReactNode;
  onCreated?: () => void;
};

export interface ConnectorInfo {
  network: Network;
  routers: NetworkRouter[];
  peerNames: string[];
}

export function useConnectors() {
  const { data: networks = [] } = useFetchApi<Network[]>("/networks");
  // Filter networks that look like connectors (created via connector UI)
  // For now, treat all networks as potential connectors
  return { networks };
}

function ConnectorModalContent({ onCreated }: { onCreated?: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cidrs, setCidrs] = useState("");
  const [selectedPeer, setSelectedPeer] = useState<Peer | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const createNetwork = useApiCall<Network>("/networks").post;

  const handleSave = async () => {
    if (!name.trim() || !selectedPeer) {
      setError(t("connector.nameAndPeerRequired"));
      return;
    }
    const cidrList = cidrs
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (cidrList.length === 0) {
      setError(t("connector.cidrRequired"));
      return;
    }

    setSaving(true);
    setError("");
    try {
      // Step 1: Create network
      const network = await createNetwork({
        name: name.trim(),
        description: `Connector for ${selectedPeer.name} (announces: ${cidrList.join(", ")})`,
      });

      // Step 2: Add peer as router
      const routerRes = await fetch(`/api/networks/${network.id}/routers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peer: selectedPeer.id,
          masquerade: true,
          metric: 9999,
          enabled: true,
        }),
      });
      if (!routerRes.ok) throw new Error("Failed to add router");

      // TODO: Store announced CIDRs as network metadata
      // For now, CIDRs are in the description

      mutate("/networks");
      onCreated?.();
      setOpen(false);
      setName("");
      setCidrs("");
      setSelectedPeer(undefined);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button>
          <PlusCircle size={16} className="mr-1" />
          {t("connector.addConnector")}
        </Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader
          title={t("connector.addConnector")}
          description={t("connector.addConnectorDesc")}
        />
        <div className="space-y-4 py-4">
          <div>
            <Label>{t("connector.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("connector.namePlaceholder")}
            />
          </div>
          <div>
            <Label>{t("connector.peer")}</Label>
            <PeerSelector
              value={selectedPeer}
              onChange={setSelectedPeer}
            />
          </div>
          <div>
            <Label>{t("connector.announcedCidrs")}</Label>
            <Textarea
              value={cidrs}
              onChange={(e) => setCidrs(e.target.value)}
              placeholder={t("connector.cidrPlaceholder")}
              rows={4}
            />
            <p className="text-xs text-nb-gray-400 mt-1">
              {t("connector.cidrHelp")}
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function ConnectorsSection() {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { data: networks = [], isLoading } = useFetchApi<Network[]>("/networks");

  const canEdit = permission.networks.create;

  if (isLoading) return null;

  return (
    <div className="px-8 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{t("connector.title")}</h2>
          <p className="text-sm text-nb-gray-500">{t("connector.description")}</p>
        </div>
        {canEdit && <ConnectorModalContent />}
      </div>

      {networks.length === 0 ? (
        <Card className="p-8 text-center text-nb-gray-400">
          <Server size={32} className="mx-auto mb-2 opacity-50" />
          <p>{t("connector.noConnectors")}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map((network) => (
            <ConnectorCard key={network.id} network={network} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectorCard({ network }: { network: Network }) {
  const { t } = useI18n();
  const { data: routers = [] } = useFetchApi<NetworkRouter[]>(
    `/networks/${network.id}/routers`,
  );

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Server size={16} className="text-nb-gray-400" />
          <h3 className="font-medium">{network.name}</h3>
        </div>
      </div>
      {network.description && (
        <p className="text-xs text-nb-gray-400 mb-2">{network.description}</p>
      )}
      <div className="text-xs text-nb-gray-500">
        <span className="font-medium">{t("connector.routers")}:</span>{" "}
        {routers.length > 0
          ? routers.map((r) => r.peer).join(", ")
          : t("common.none")}
      </div>
      <div className="text-xs text-nb-gray-500 mt-1">
        <span className="font-medium">{t("connector.resources")}:</span>{" "}
        {network.resources?.length || 0}
      </div>
    </Card>
  );
}
