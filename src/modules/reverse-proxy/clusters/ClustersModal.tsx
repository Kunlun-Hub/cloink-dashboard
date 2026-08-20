import Button from "@components/Button";
import { Callout } from "@components/Callout";
import { notify } from "@components/Notification";
import CardTable from "@components/CardTable";
import Code from "@components/Code";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import InlineLink from "@components/InlineLink";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import Paragraph from "@components/Paragraph";
import ModalHeader from "@components/modal/ModalHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import {
  ExternalLinkIcon,
  GlobeIcon,
  ListIcon,
  Loader2,
  ServerIcon,
  SquareTerminalIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useApiCall } from "@/utils/api";
import { cn, validator } from "@utils/helpers";
import { GRPC_API_ORIGIN, isNetBirdCloud } from "@/utils/netbird";
import { SelectDropdown } from "@components/select/SelectDropdown";
import {
  REVERSE_PROXY_CLUSTERS_DOCS_LINK,
  REVERSE_PROXY_ENV_REFERENCE_DOCS_LINK,
  REVERSE_PROXY_SELFHOSTED_ROUTING_DOCS_LINK,
  ReverseProxyClusterToken,
} from "@/interfaces/ReverseProxy";
import {
  ClusterCloudDeploy,
  CloudProvider,
} from "@/modules/reverse-proxy/clusters/ClusterCloudDeploy";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DeployMethod =
  | "docker"
  | "compose"
  | "kubernetes"
  | "hetzner"
  | "digitalocean"
  | "aws";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const renderHighlightedCommand = (command: string, highlights: string[]) => {
  const valid = highlights.filter((h) => h && h.trim().length > 0);
  const pattern =
    valid.length > 0
      ? new RegExp(`(${valid.map(escapeRegExp).join("|")})`, "g")
      : null;

  return command.split("\n").map((line, lineIndex) => (
    <Code.Line key={lineIndex}>
      {pattern
        ? line.split(pattern).map((part, partIndex) =>
            valid.includes(part) ? (
              <span key={partIndex} className={"text-netbird"}>
                {part}
              </span>
            ) : (
              part
            ),
          )
        : line}
    </Code.Line>
  ));
};

export const ClustersModal = ({ open, onOpenChange }: Props) => {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const [tab, setTab] = useState("domain");
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [isGeneratingToken, setIsGeneratingToken] = useState(true);
  const [deployMethod, setDeployMethod] = useState<DeployMethod>("docker");
  const [proxyRegistered, setProxyRegistered] = useState(false);

  const tokenRequest = useApiCall<ReverseProxyClusterToken>(
    "/reverse-proxies/proxy-tokens",
  );

  const domainError = useMemo(() => {
    if (!domain) return "";
    const isValid = validator.isValidDomain(domain, {
      allowWildcard: false,
      allowOnlyTld: false,
      preventLeadingAndTrailingDots: true,
    });
    if (!isValid) {
      return t("reverseProxy.customDomainError");
    }
    return "";
  }, [domain]);

  // Same convention as the add-peer modals: prefer the configured gRPC
  // endpoint so self-hosted and stage deployments point at their own
  // management service; fall back to the cloud default.
  const managementUrl = GRPC_API_ORIGIN || "https://api.netbird.io:443";

  const tokenValue = token || "<TOKEN>";

  const dockerCommand = `docker run -d \\
 -v proxy_certs:/certs \\
 -e NB_PROXY_CERTIFICATE_DIRECTORY=/certs \\
 -e NB_PROXY_ALLOW_INSECURE=true \\
 -e NB_PROXY_MANAGEMENT_ADDRESS=${managementUrl} \\
 -e NB_PROXY_ACME_CERTIFICATES=true \\
 -e NB_PROXY_DOMAIN=${domain} \\
 -e NB_PROXY_LOG_LEVEL=info \\
 -e NB_PROXY_TOKEN=${tokenValue} \\
 -e NB_PROXY_PRIVATE=true \\
 -e NB_PROXY_ADDRESS=:443 \\
 -p 80:80 -p 443:443 \\
 netbirdio/reverse-proxy:latest`;

  const composeCommand = `services:
  reverse-proxy:
    image: netbirdio/reverse-proxy:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      NB_PROXY_CERTIFICATE_DIRECTORY: /certs
      NB_PROXY_ALLOW_INSECURE: "true"
      NB_PROXY_MANAGEMENT_ADDRESS: "${managementUrl}"
      NB_PROXY_ACME_CERTIFICATES: "true"
      NB_PROXY_DOMAIN: "${domain}"
      NB_PROXY_LOG_LEVEL: info
      NB_PROXY_TOKEN: "${tokenValue}"
      NB_PROXY_PRIVATE: "true"
      NB_PROXY_ADDRESS: ":443"
    volumes:
      - proxy_certs:/certs
volumes:
  proxy_certs:`;

  const kubernetesCommand = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: netbird-reverse-proxy
  labels:
    app: netbird-reverse-proxy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: netbird-reverse-proxy
  template:
    metadata:
      labels:
        app: netbird-reverse-proxy
    spec:
      containers:
        - name: reverse-proxy
          image: netbirdio/reverse-proxy:latest
          ports:
            - containerPort: 80
            - containerPort: 443
          env:
            - name: NB_PROXY_CERTIFICATE_DIRECTORY
              value: /certs
            - name: NB_PROXY_ALLOW_INSECURE
              value: "true"
            - name: NB_PROXY_MANAGEMENT_ADDRESS
              value: "${managementUrl}"
            - name: NB_PROXY_ACME_CERTIFICATES
              value: "true"
            - name: NB_PROXY_DOMAIN
              value: "${domain}"
            - name: NB_PROXY_LOG_LEVEL
              value: info
            - name: NB_PROXY_TOKEN
              value: "${tokenValue}"
            - name: NB_PROXY_PRIVATE
              value: "true"              
            - name: NB_PROXY_ADDRESS
              value: ":443"
          volumeMounts:
            - name: certs
              mountPath: /certs
      volumes:
        - name: certs
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: netbird-reverse-proxy
spec:
  type: LoadBalancer
  selector:
    app: netbird-reverse-proxy
  ports:
    - name: http
      port: 80
      targetPort: 80
    - name: https
      port: 443
      targetPort: 443`;

  const deployment = {
    docker: {
      label: t("reverseProxy.docker"),
      title: t("reverseProxy.deployTitleDocker"),
      command: dockerCommand,
    },
    compose: {
      label: t("reverseProxy.dockerCompose"),
      title: t("reverseProxy.deployTitleCompose"),
      command: composeCommand,
    },
    kubernetes: {
      label: t("reverseProxy.kubernetes"),
      title: t("reverseProxy.deployTitleKubernetes"),
      command: kubernetesCommand,
    },
    hetzner: {
      label: t("reverseProxy.hetznerCloud"),
      title: t("reverseProxy.deployTitleHetzner"),
      command: "",
    },
    digitalocean: {
      label: t("reverseProxy.digitalOcean"),
      title: t("reverseProxy.deployTitleDigitalOcean"),
      command: "",
    },
    aws: {
      label: t("reverseProxy.awsCloudFormation"),
      title: t("reverseProxy.deployTitleAws"),
      command: "",
    },
  }[deployMethod];

  const isCloudDeploy = ["hetzner", "digitalocean", "aws"].includes(
    deployMethod,
  );

  // Cloud one-click deploys provision the server and surface the DNS records
  // (with the real IP) after deployment, so the standalone DNS step only
  // applies to the manual paths. Bounce off it if the method flips to cloud.
  useEffect(() => {
    if (isCloudDeploy && tab === "dns") setTab("install");
  }, [isCloudDeploy, tab]);

  // A new deploy target means the proxy has not registered yet, so drop any
  // prior completion state that would otherwise unlock "Finish Setup".
  useEffect(() => {
    setProxyRegistered(false);
  }, [domain, deployMethod]);

  const deployDescription =
    deployMethod === "digitalocean"
      ? t("reverseProxy.deployDescriptionDigitalOcean")
      : deployMethod === "aws"
      ? t("reverseProxy.deployDescriptionAws")
      : isCloudDeploy
      ? t("reverseProxy.deployDescriptionCloud")
      : deployMethod === "kubernetes"
      ? t("reverseProxy.deployDescriptionKubernetes")
      : t("reverseProxy.deployDescriptionDefault");

  const generateToken = useCallback(async () => {
    setIsGeneratingToken(true);
    const promise = tokenRequest
      .post({
        name: domain,
        expires_in: 0,
      })
      .then((res) => {
        setToken(res?.plain_token ?? "");
      })
      .finally(() => {
        setIsGeneratingToken(false);
      });

    notify({
      title: t("reverseProxy.proxyToken"),
      description: t("reverseProxy.proxyTokenFailed"),
      promise,
      loadingMessage: t("reverseProxy.proxyTokenGenerating"),
      showOnlyError: true,
      preventSuccessToast: true,
    });
    return promise;
  }, [domain, tokenRequest]);

  const goToInstall = useCallback(() => {
    setTab("install");
    if (!token) generateToken();
  }, [token, generateToken]);

  const finishSetup = () => {
    onOpenChange(false);
    mutate("/reverse-proxies/clusters");
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"relative max-w-[600px]"} showClose={true}>
        <ModalHeader
          icon={<ServerIcon size={16} />}
          title={t("reverseProxy.clusterSetupTitle")}
          description={t("reverseProxy.clusterSetupDescription")}
          color={"netbird"}
        />

        <Tabs
          value={tab}
          onValueChange={(v) => (v === "install" ? goToInstall() : setTab(v))}
        >
          <TabsList justify={"start"} className={"px-8"}>
            <TabsTrigger value={"domain"}>
              <GlobeIcon size={14} />
              {t("reverseProxy.domain")}
            </TabsTrigger>
            {!isCloudDeploy && (
              <TabsTrigger
                value={"dns"}
                disabled={!domain.trim() || !!domainError}
              >
                <ListIcon size={14} />
                {t("reverseProxy.dnsRecords")}
              </TabsTrigger>
            )}
            <TabsTrigger
              value={"install"}
              disabled={!domain.trim() || !!domainError}
            >
              <SquareTerminalIcon size={14} />
              {isCloudDeploy ? t("reverseProxy.deploy") : t("reverseProxy.runProxy")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={"domain"} className={"pb-8"}>
            <div className={"px-8 flex flex-col gap-6"}>
              <div>
                <Label>{t("reverseProxy.domain")}</Label>
                <HelpText>
                  {t("reverseProxy.clusterDomainHelp")}
                </HelpText>
                <Input
                  autoFocus={true}
                  placeholder={t("reverseProxy.selfHostedDomainPlaceholder")}
                  value={domain}
                  error={domainError}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDomain(e.target.value)
                  }
                />
              </div>
              <div>
                <Label>{t("reverseProxy.deploymentMethod")}</Label>
                <HelpText>{deployDescription}</HelpText>
                <SelectDropdown
                  value={deployMethod}
                  onChange={(v) => setDeployMethod(v as DeployMethod)}
                  options={[
                    { value: "docker", label: t("reverseProxy.docker") },
                    { value: "compose", label: t("reverseProxy.dockerCompose") },
                    { value: "kubernetes", label: t("reverseProxy.kubernetes") },
                    { value: "hetzner", label: t("reverseProxy.hetznerCloud") },
                    { value: "digitalocean", label: t("reverseProxy.digitalOcean") },
                    { value: "aws", label: t("reverseProxy.awsCloudFormation") },
                  ]}
                />
              </div>
              {!isCloudDeploy && (
                <Callout variant={"info"}>
                  {t("reverseProxy.selfHostedRequirements")}
                  <ul className={"list-disc pl-4 mt-2 flex flex-col gap-1"}>
                    <li>
                      <span className={"text-white font-medium"}>
                        {t("reverseProxy.publiclyAccessibleIp")}
                      </span>
                    </li>
                    <li>
                      <span className={"text-white font-medium"}>Docker</span>{" "}
                      {t("reverseProxy.dockerInstalled")}
                    </li>
                    <li>
                      <span className={"text-white font-medium"}>
                        {t("reverseProxy.ports80And443")}
                      </span>{" "}
                      {t("reverseProxy.portsOpen")}
                    </li>
                  </ul>
                </Callout>
              )}
            </div>
          </TabsContent>

          <TabsContent value={"dns"} className={"pb-8"}>
            <div className={"px-8 flex flex-col"}>
              <div>
                <Label>{t("reverseProxy.configureDns")}</Label>
                <HelpText>
                  {t("reverseProxy.configureDnsHelp")}
                </HelpText>
              </div>
              <CardTable>
                <CardTable.Header>
                  <CardTable.HeaderCell width={100}>{t("reverseProxy.dnsType")}</CardTable.HeaderCell>
                  <CardTable.HeaderCell>{t("reverseProxy.dnsName")}</CardTable.HeaderCell>
                  <CardTable.HeaderCell>{t("reverseProxy.dnsContent")}</CardTable.HeaderCell>
                </CardTable.Header>
                <CardTable.Body>
                  <CardTable.Row>
                    <CardTable.Cell>A</CardTable.Cell>
                    <CardTable.Cell copy copyText={domain}>
                      {domain}
                    </CardTable.Cell>
                    <CardTable.Cell className={"italic"}>
                      {t("reverseProxy.yourMachineIp")}
                    </CardTable.Cell>
                  </CardTable.Row>
                  <CardTable.Row>
                    <CardTable.Cell>CNAME</CardTable.Cell>
                    <CardTable.Cell copy copyText={`*.${domain}`}>
                      {`*.${domain}`}
                    </CardTable.Cell>
                    <CardTable.Cell copy copyText={domain}>
                      {domain}
                    </CardTable.Cell>
                  </CardTable.Row>
                </CardTable.Body>
              </CardTable>
            </div>
          </TabsContent>

          <TabsContent value={"install"} className={"pb-8"}>
            <div className={"px-8 flex flex-col gap-4"}>
              <div>
                <Label>{deployment.title}</Label>
                <HelpText className={"mb-0"}>{deployDescription}</HelpText>
              </div>

              {!isNetBirdCloud() && (
                <Callout variant={"warning"}>
                  {t("reverseProxy.selfHostedRoutingWarning")}&nbsp;
                  <InlineLink
                    href={REVERSE_PROXY_SELFHOSTED_ROUTING_DOCS_LINK}
                    target={"_blank"}
                    className={"block mt-1"}
                  >
                    {t("reverseProxy.requiredRoutingEndpoints")}
                    <ExternalLinkIcon size={12} />
                  </InlineLink>
                </Callout>
              )}

              {isCloudDeploy ? (
                <ClusterCloudDeploy
                  provider={deployMethod as CloudProvider}
                  domain={domain}
                  token={token}
                  managementUrl={managementUrl}
                  isGeneratingToken={isGeneratingToken}
                  onRegistered={() => setProxyRegistered(true)}
                />
              ) : (
                <>
                  <Code
                    key={deployMethod}
                    codeToCopy={deployment.command}
                    className={cn(
                      "overflow-hidden",
                      isGeneratingToken && "!border-nb-gray-930",
                    )}
                    showCopyIcon={!isGeneratingToken}
                  >
                    {isGeneratingToken && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-nb-gray-100 bg-nb-gray-950/90">
                        <Loader2 size={16} className="animate-spin" />
                        {t("reverseProxy.proxyTokenGenerating")}
                      </div>
                    )}

                    {renderHighlightedCommand(deployment.command, [
                      managementUrl,
                      domain,
                      tokenValue,
                    ])}
                  </Code>

                  <HelpText className={"mb-0"}>
                    {t("reverseProxy.envReferenceHelp")}&nbsp;
                    <InlineLink
                      href={REVERSE_PROXY_ENV_REFERENCE_DOCS_LINK}
                      target={"_blank"}
                    >
                      {t("reverseProxy.environmentVariables")}
                      <ExternalLinkIcon size={12} />
                    </InlineLink>
                  </HelpText>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <ModalFooter className={"items-center"}>
          <div className={"w-full"}>
            <Paragraph className={"text-sm mt-auto"}>
              {t("reverseProxy.learnMoreAbout")}{" "}
              <InlineLink
                href={REVERSE_PROXY_CLUSTERS_DOCS_LINK}
                target={"_blank"}
              >
                {t("reverseProxy.proxyClusterLearnMore")}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </Paragraph>
          </div>
          <div className={"flex gap-3 w-full justify-end"}>
            {tab === "domain" && (
              <>
                <ModalClose asChild={true}>
                  <Button variant={"secondary"}>{t("common.cancel")}</Button>
                </ModalClose>
                <Button
                  variant={"primary"}
                  onClick={() => (isCloudDeploy ? goToInstall() : setTab("dns"))}
                  disabled={!domain.trim() || !!domainError}
                >
                  {t("common.continue")}
                </Button>
              </>
            )}
            {tab === "dns" && (
              <>
                <Button variant={"secondary"} onClick={() => setTab("domain")}>
                  {t("common.back")}
                </Button>
                <Button variant={"primary"} onClick={goToInstall}>
                  {t("common.continue")}
                </Button>
              </>
            )}
            {tab === "install" && (
              <>
                <Button
                  variant={"secondary"}
                  onClick={() => setTab(isCloudDeploy ? "domain" : "dns")}
                >
                  {t("common.back")}
                </Button>
                <Button
                  variant={"primary"}
                  onClick={finishSetup}
                  disabled={isCloudDeploy && !proxyRegistered}
                >
                  {t("reverseProxy.finishSetup")}
                </Button>
              </>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
