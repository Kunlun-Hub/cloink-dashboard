"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/Accordion";
import Button from "@components/Button";
import Code from "@components/Code";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import SquareIcon from "@components/SquareIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { DownloadIcon, RadioTowerIcon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useApiCall } from "@/utils/api";

type RelaySetupToken = {
  token: string;
  relay_auth_secret: string;
  expires_at?: string;
};

type Props = {
  open: boolean;
  canUpdate: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function DeployRelayModal({
  open,
  canUpdate,
  onOpenChange,
}: Readonly<Props>) {
  const { t } = useI18n();
  const setupTokenRequest = useApiCall<RelaySetupToken>(
    "/relays/setup-token",
    true,
  );
  const [setupToken, setSetupToken] = useState<RelaySetupToken>();
  const [loadingToken, setLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string>();
  const [relayID, setRelayID] = useState("HK-01");
  const [relayName, setRelayName] = useState("");
  const [domain, setDomain] = useState("");
  const [port, setPort] = useState("443");
  const [priority, setPriority] = useState("30");
  const [stunPorts, setStunPorts] = useState("3478,3479");
  const [imageTag, setImageTag] = useState("latest");

  useEffect(() => {
    if (!open || !canUpdate) return;
    const host = window.location.hostname;
    setDomain((value) => value || host);
    setLoadingToken(true);
    setTokenError(undefined);
    setupTokenRequest
      .post({})
      .then((response) => setSetupToken(response))
      .catch((err) => setTokenError(err?.message || t("relays.tokenError")))
      .finally(() => setLoadingToken(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const managementURL =
    typeof window === "undefined" ? "" : window.location.origin;

  const stunPortList = useMemo(
    () =>
      stunPorts
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    [stunPorts],
  );

  const installScript = useMemo(() => {
    const safeRelayName = relayName.trim();
    const relayNameLine = safeRelayName
      ? `  -e CL_RELAY_NAME="${safeRelayName}" \\\n`
      : "";
    const stunPortLines = stunPortList
      .map((p) => `  -p ${p}:${p}/udp \\`)
      .join("\n");
    return `docker run -d --name cloink-relay --restart unless-stopped \\
  -v ./certs:/certs:ro \\
  -p ${port}:${port}/tcp \\
  -p ${port}:${port}/udp \\
${stunPortLines}
  -e CL_SETUP_KEY="${setupToken?.token || "SETUP_TOKEN"}" \\
  -e CL_AUTH_SECRET="${setupToken?.relay_auth_secret || "RELAY_AUTH_SECRET"}" \\
  -e CL_RELAY_ID="${relayID || "HK-01"}" \\
${relayNameLine}  -e CL_MANAGEMENT_URL="${managementURL}" \\
  -e CL_RELAY_PRIORITY="${priority || "30"}" \\
  -e CL_RELAY_DOMAIN="${domain || "relay.example.com"}" \\
  -e CL_RELAY_PORT="${port}" \\
  -e CL_RELAY_SCHEME="rels" \\
  -e NB_LISTEN_ADDRESS=":${port}" \\
  -e NB_TLS_CERT_FILE="/certs/fullchain.pem" \\
  -e NB_TLS_KEY_FILE="/certs/privkey.key" \\
  -e NB_ENABLE_STUN="true" \\
  -e NB_STUN_PORTS="${stunPorts || "3478,3479"}" \\
  -e NB_HEALTH_LISTEN_ADDRESS=":9000" \\
  ohoimager/cloink-relay:${imageTag || "latest"}`;
  }, [
    domain,
    imageTag,
    managementURL,
    port,
    priority,
    relayID,
    relayName,
    setupToken?.relay_auth_secret,
    setupToken?.token,
    stunPortList,
    stunPorts,
  ]);

  const composeFile = useMemo(() => {
    const relayNameLine = relayName.trim()
      ? `      CL_RELAY_NAME: "${relayName.trim()}"\n`
      : "";
    const portLines = [
      `      - "${port}:${port}/tcp"`,
      `      - "${port}:${port}/udp"`,
      ...stunPortList.map((p) => `      - "${p}:${p}/udp"`),
    ].join("\n");
    return `services:
  cloink-relay:
    image: ohoimager/cloink-relay:${imageTag || "latest"}
    container_name: cloink-relay
    restart: unless-stopped
    volumes:
      - ./certs:/certs:ro
    ports:
${portLines}
    environment:
      CL_SETUP_KEY: "${setupToken?.token || "SETUP_TOKEN"}"
      CL_AUTH_SECRET: "${setupToken?.relay_auth_secret || "RELAY_AUTH_SECRET"}"
      CL_RELAY_ID: "${relayID || "HK-01"}"
${relayNameLine}      CL_MANAGEMENT_URL: "${managementURL}"
      CL_RELAY_PRIORITY: "${priority || "30"}"
      CL_RELAY_DOMAIN: "${domain || "relay.example.com"}"
      CL_RELAY_PORT: "${port}"
      CL_RELAY_SCHEME: "rels"
      NB_LISTEN_ADDRESS: ":${port}"
      NB_TLS_CERT_FILE: "/certs/fullchain.pem"
      NB_TLS_KEY_FILE: "/certs/privkey.key"
      NB_ENABLE_STUN: "true"
      NB_STUN_PORTS: "${stunPorts || "3478,3479"}"
      NB_HEALTH_LISTEN_ADDRESS: ":9000"
`;
  }, [
    domain,
    imageTag,
    managementURL,
    port,
    priority,
    relayID,
    relayName,
    setupToken?.relay_auth_secret,
    setupToken?.token,
    stunPortList,
    stunPorts,
  ]);

  const composeEOFScript = useMemo(
    () => `cat > docker-compose.yml <<'EOF'
${composeFile}EOF
docker compose up -d`,
    [composeFile],
  );

  const downloadCompose = () => {
    const blob = new Blob([composeFile], {
      type: "application/x-yaml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "docker-compose.yml";
    link.click();
    URL.revokeObjectURL(url);
  };

  const inputClassName = "w-full min-w-0";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"max-w-5xl"}>
        <ModalHeader
          icon={<RadioTowerIcon size={20} />}
          color={"netbird"}
          title={t("relays.deployTitle")}
          description={t("relays.deployDescription")}
        />
        <div className={"px-8 flex flex-col gap-5 min-w-0"}>
          <div
            className={
              "grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-5 min-w-0"
            }
          >
            <div className={"min-w-0"}>
              <Label>{t("relays.relayIdLabel")}</Label>
              <HelpText>{t("relays.relayIdHelp")}</HelpText>
              <Input
                maxWidthClass={inputClassName}
                value={relayID}
                onChange={(e) => setRelayID(e.target.value)}
              />
            </div>
            <div className={"min-w-0"}>
              <Label>{t("relays.relayNameLabel")}</Label>
              <HelpText>{t("relays.relayNameHelp")}</HelpText>
              <Input
                maxWidthClass={inputClassName}
                value={relayName}
                placeholder={t("relays.relayNamePlaceholder")}
                onChange={(e) => setRelayName(e.target.value)}
              />
            </div>
            <div className={"min-w-0"}>
              <Label>{t("relays.domainLabel")}</Label>
              <HelpText>{t("relays.domainHelp")}</HelpText>
              <Input
                maxWidthClass={inputClassName}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className={"min-w-0"}>
              <Label>{t("relays.portLabel")}</Label>
              <HelpText>{t("relays.portHelp")}</HelpText>
              <Input
                maxWidthClass={inputClassName}
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
            <div className={"min-w-0"}>
              <Label>{t("relays.priority")}</Label>
              <HelpText>{t("relays.priorityHelp")}</HelpText>
              <Input
                maxWidthClass={inputClassName}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            </div>
            <div className={"min-w-0"}>
              <Label>{t("relays.imageTagLabel")}</Label>
              <HelpText>{t("relays.imageTagHelp")}</HelpText>
              <Input
                maxWidthClass={inputClassName}
                value={imageTag}
                onChange={(e) => setImageTag(e.target.value)}
              />
            </div>
            <div className={"min-w-0"}>
              <Label>{t("relays.stunPortsLabel")}</Label>
              <HelpText>{t("relays.stunPortsHelp")}</HelpText>
              <Input
                maxWidthClass={inputClassName}
                value={stunPorts}
                onChange={(e) => setStunPorts(e.target.value)}
              />
            </div>
            <div className={"min-w-0"}>
              <Label>{t("relays.managementUrlLabel")}</Label>
              <HelpText>{t("relays.managementUrlHelp")}</HelpText>
              <Input
                maxWidthClass={inputClassName}
                value={managementURL}
                disabled={true}
              />
            </div>
          </div>

          <div
            className={
              "rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-950/20 dark:text-yellow-100"
            }
          >
            {t("relays.certificateRequirement")}
          </div>

          {tokenError ? (
            <div
              className={
                "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/20 dark:text-red-200"
              }
            >
              {tokenError}
            </div>
          ) : (
            <div
              className={
                "flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-nb-gray-800 dark:bg-nb-gray-930 dark:text-nb-gray-300"
              }
            >
              <SquareIcon
                icon={<RadioTowerIcon size={14} />}
                color={setupToken ? "green" : "gray"}
                size={"small"}
                margin={"mt-0"}
              />
              {loadingToken
                ? t("relays.generatingToken")
                : setupToken
                  ? t("relays.tokenReady")
                  : t("relays.tokenNotReady")}
            </div>
          )}

          <Accordion type={"single"} collapsible className={"min-w-0"}>
            <AccordionItem
              value={"install"}
              className={
                "rounded-md border border-neutral-200 bg-neutral-50 px-4 dark:border-nb-gray-800 dark:bg-nb-gray-930"
              }
            >
              <AccordionTrigger className={"my-0 py-4"}>
                <div className={"flex flex-col items-start gap-1"}>
                  <span className={"text-sm text-neutral-900 dark:text-nb-gray-100"}>
                    {t("relays.installCommand")}
                  </span>
                  <span className={"text-xs text-neutral-500 dark:text-nb-gray-400 font-normal"}>
                    {t("relays.installCommandHelp")}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Tabs defaultValue={"docker"} className={"pb-4"}>
                  <TabsList justify={"start"}>
                    <TabsTrigger value={"docker"}>
                      {t("relays.dockerMode")}
                    </TabsTrigger>
                    <TabsTrigger value={"compose"}>
                      {t("relays.composeMode")}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value={"docker"} className={"min-w-0"}>
                    <Code
                      codeToCopy={installScript}
                      dark={true}
                      className={"text-xs"}
                    >
                      <pre className={"whitespace-pre"}>{installScript}</pre>
                    </Code>
                  </TabsContent>
                  <TabsContent value={"compose"} className={"min-w-0"}>
                    <div className={"flex justify-end mb-3"}>
                      <Button
                        variant={"secondary"}
                        size={"xs"}
                        onClick={downloadCompose}
                      >
                        <DownloadIcon size={14} />
                        {t("relays.downloadCompose")}
                      </Button>
                    </div>
                    <div className={"flex flex-col gap-4"}>
                      <div>
                        <Label>{t("relays.composeWriteCommand")}</Label>
                        <Code
                          codeToCopy={composeEOFScript}
                          dark={true}
                          className={"text-xs"}
                        >
                          <pre className={"whitespace-pre"}>
                            {composeEOFScript}
                          </pre>
                        </Code>
                      </div>
                      <div>
                        <Label>{t("relays.composeFile")}</Label>
                        <Code
                          codeToCopy={composeFile}
                          dark={true}
                          className={"text-xs"}
                        >
                          <pre className={"whitespace-pre"}>{composeFile}</pre>
                        </Code>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <ModalFooter className={"justify-end"}>
          <Button variant={"secondary"} onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
