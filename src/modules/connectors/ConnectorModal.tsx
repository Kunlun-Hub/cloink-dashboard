"use client";

import Button from "@components/Button";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import { PeerSelector } from "@components/PeerSelector";
import Paragraph from "@components/Paragraph";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import { Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Peer } from "@/interfaces/Peer";
import { isValidRouteInput, normalizeToCIDRs, RouteEntry } from "./cidr";
import { useConnectorActions } from "./useConnectors";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

/**
 * 创建连接器：选择设备 + 填写宣告网段。
 * 对标飞越云「添加设备xx的子网路由」对话框：
 * 类型（宣告/排除）、CIDR输入、备注、立即开启开关。
 */
export default function ConnectorModal({ open, onOpenChange, onCreated }: Props) {
  const { t } = useI18n();
  const { createConnector } = useConnectorActions();
  const [peer, setPeer] = useState<Peer | undefined>();
  const [announced, setAnnounced] = useState<RouteEntry[]>([]);
  const [excluded, setExcluded] = useState<RouteEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Route editor draft state
  const [draftKind, setDraftKind] = useState<"announce" | "exclude">("announce");
  const [draftCidr, setDraftCidr] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [draftEnabled, setDraftEnabled] = useState(true);
  const [draftError, setDraftError] = useState("");

  const addDraftRoute = () => {
    if (!isValidRouteInput(draftCidr)) {
      setDraftError(t("connectors.invalidCidr"));
      return;
    }
    setDraftError("");
    const cidrs = normalizeToCIDRs(draftCidr);
    if (cidrs.length === 0) {
      setDraftError(t("connectors.invalidCidr"));
      return;
    }
    const entry: RouteEntry = {
      cidr: cidrs[0],
      description: draftNote || undefined,
      enabled: draftEnabled,
    };
    if (draftKind === "announce") setAnnounced([...announced, entry]);
    else setExcluded([...excluded, entry]);
    setDraftCidr("");
    setDraftNote("");
    setDraftEnabled(true);
  };

  const removeRoute = (kind: "announce" | "exclude", idx: number) => {
    if (kind === "announce") setAnnounced(announced.filter((_, i) => i !== idx));
    else setExcluded(excluded.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    const selectedPeer = peer;
    const peerId = selectedPeer?.id;
    if (!selectedPeer || !peerId || announced.length === 0) return;
    setSaving(true);
    try {
      await createConnector({
        peerId,
        peerName: selectedPeer.name || selectedPeer.hostname || peerId,
        announced,
        excluded,
      });
      notify({
        title: t("connectors.createdTitle"),
        description: t("connectors.createdDescription"),
      });
      onOpenChange(false);
      onCreated?.();
      // reset
      setPeer(undefined);
      setAnnounced([]);
      setExcluded([]);
    } catch (e) {
      notify({
        title: t("connectors.createFailed"),
        description: String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass="max-w-2xl">
        <ModalHeader
          title={t("connectors.createTitle")}
          description={t("connectors.selectDeviceHint")}
        />
        <div className="space-y-5 px-6 py-4">
          <div>
            <Label>{t("connectors.selectDevice")}</Label>
            <Paragraph className="text-sm mb-2">
              {t("connectors.selectDeviceHint")}
            </Paragraph>
            <PeerSelector value={peer} onChange={setPeer} />
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <Label>{t("connectors.addRoute")}</Label>
            <div className="flex gap-2">
              <select
                value={draftKind}
                onChange={(e) => setDraftKind(e.target.value as "announce" | "exclude")}
                className="border rounded px-2 py-1.5 text-sm bg-transparent"
              >
                <option value="announce">{t("connectors.announcedRoute")}</option>
                <option value="exclude">{t("connectors.excludedRoute")}</option>
              </select>
              <Input
                placeholder={t("connectors.cidrPlaceholder")}
                value={draftCidr}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDraftCidr(e.target.value)
                }
                className="flex-1"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Input
                placeholder={t("connectors.notePlaceholder")}
                value={draftNote}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDraftNote(e.target.value)
                }
                className="flex-1"
              />
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <FancyToggleSwitch
                  value={draftEnabled}
                  onChange={setDraftEnabled}
                />
                {t("connectors.enableNow")}
              </label>
              <Button variant="secondary" size="sm" onClick={addDraftRoute}>
                <Plus size={14} className="mr-1" />
                {t("common.add")}
              </Button>
            </div>
            {draftError && <p className="text-red-500 text-sm">{draftError}</p>}
            <Paragraph className="text-xs opacity-70">
              {t("connectors.cidrFormatHint")}
            </Paragraph>
          </div>

          {announced.length > 0 && (
            <RouteList
              title={t("connectors.announcedRoutes")}
              routes={announced}
              onRemove={(i) => removeRoute("announce", i)}
            />
          )}
          {excluded.length > 0 && (
            <RouteList
              title={t("connectors.excludedRoutes")}
              routes={excluded}
              onRemove={(i) => removeRoute("exclude", i)}
            />
          )}
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="secondary">{t("common.cancel")}</Button>
          </ModalClose>
          <Button
            onClick={handleCreate}
            disabled={!peer || announced.length === 0 || saving}
          >
            {saving ? t("common.savingChanges") : t("common.confirm")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function RouteList({
  title,
  routes,
  onRemove,
}: {
  title: string;
  routes: RouteEntry[];
  onRemove: (idx: number) => void;
}) {
  return (
    <div>
      <Label>{title}</Label>
      <div className="mt-1 border rounded-lg divide-y">
        {routes.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
            <FancyToggleSwitch value={r.enabled} onChange={() => {}} disabled />
            <code className="font-mono">{r.cidr}</code>
            {r.description && (
              <span className="opacity-60 truncate">{r.description}</span>
            )}
            <button
              className="ml-auto text-red-500 hover:text-red-400"
              onClick={() => onRemove(i)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
