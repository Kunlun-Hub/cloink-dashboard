import Button from "@components/Button";
import Code from "@components/Code";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import Separator from "@components/Separator";
import { useApiCall } from "@utils/api";
import loadConfig from "@utils/config";
import { trim } from "lodash";
import {
  FingerprintIcon,
  GlobeIcon,
  IdCard,
  KeyIcon,
  PlusCircle,
  SaveIcon,
  TagIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { idpIcon } from "@/assets/icons/IdentityProviderIcons";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import {
  SSOIdentityProvider,
  SSOIdentityProviderOptions,
  SSOIdentityProviderRequest,
  SSOIdentityProviderType,
} from "@/interfaces/IdentityProvider";

const issuerHints: Partial<Record<SSOIdentityProviderType, string>> = {
  keycloak: "https://keycloak.example.com/realms/{REALM}",
  authentik: "https://authentik.example.com/application/o/{APP_SLUG}/",
  zitadel: "https://{INSTANCE}.zitadel.cloud",
  okta: "https://{ORG}.okta.com",
  entra: "https://login.microsoftonline.com/{TENANT_ID}/v2.0",
  pocketid: "https://pocketid.example.com",
  adfs: "https://adfs.example.com/adfs",
};

const defaultNames: Record<SSOIdentityProviderType, string> = {
  oidc: "Generic OIDC",
  google: "Google",
  microsoft: "Microsoft",
  entra: "Microsoft Entra",
  okta: "Okta",
  zitadel: "Zitadel",
  pocketid: "PocketID",
  authentik: "Authentik",
  keycloak: "Keycloak",
  adfs: "Microsoft AD FS",
  wechatwork: "WeCom",
};

type Props = {
  open: boolean;
  onClose: () => void;
  provider?: SSOIdentityProvider | null;
};

const config = loadConfig();
const redirectUrl = `${config.apiOrigin}/oauth2/callback`;
const logoutUrl = `${config.apiOrigin}/oauth2/logout/callback`;

export default function IdentityProviderModal({
  open,
  onClose,
  provider,
}: Readonly<Props>) {
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();
  const { t } = useI18n();
  const isEditing = !!provider;

  const createRequest = useApiCall<SSOIdentityProvider>("/identity-providers");
  const updateRequest = useApiCall<SSOIdentityProvider>(
    "/identity-providers/" + provider?.id,
  );

  const [type, setType] = useState<SSOIdentityProviderType>(
    provider?.type ?? "oidc",
  );
  const [name, setName] = useState(provider?.name ?? "");
  const [issuer, setIssuer] = useState(provider?.issuer ?? "");
  const [clientId, setClientId] = useState(provider?.client_id ?? "");
  const [agentId, setAgentId] = useState(provider?.agent_id ?? "");
  const [clientSecret, setClientSecret] = useState("");

  const isWeChatWork = type === "wechatwork";
  const requiresIssuer =
    type !== "google" && type !== "microsoft" && !isWeChatWork;

  const clientIdChanged = isEditing && trim(clientId) !== provider?.client_id;

  const isDisabled = useMemo(() => {
    const trimmedName = trim(name);
    const trimmedIssuer = trim(issuer);
    const trimmedClientId = trim(clientId);
    const trimmedAgentId = trim(agentId);
    const trimmedClientSecret = trim(clientSecret);

    if (trimmedName.length === 0) return true;
    if (requiresIssuer && trimmedIssuer.length === 0) return true;
    if (trimmedClientId.length === 0) return true;
    if (isWeChatWork && trimmedAgentId.length === 0) return true;
    // Client secret required for new providers, or when client ID changed during edit
    if ((!isEditing || clientIdChanged) && trimmedClientSecret.length === 0)
      return true;

    return false;
  }, [
    name,
    issuer,
    clientId,
    agentId,
    clientSecret,
    isEditing,
    clientIdChanged,
    isWeChatWork,
    requiresIssuer,
  ]);

  const submit = () => {
    const payload: SSOIdentityProviderRequest = {
      type,
      name: trim(name),
      issuer: trim(issuer),
      client_id: trim(clientId),
      agent_id: isWeChatWork ? trim(agentId) : undefined,
      client_secret: trim(clientSecret),
    };

    if (isEditing) {
      notify({
        title: t("identityProviderModal.updateTitle"),
        description: t("identityProviderModal.updatedDescription"),
        promise: updateRequest.put(payload).then(() => {
          mutate("/identity-providers");
          onClose();
        }),
        loadingMessage: t("identityProviderModal.updating"),
      });
    } else {
      notify({
        title: t("identityProviderModal.createTitle"),
        description: t("identityProviderModal.createdDescription"),
        promise: createRequest.post(payload).then(() => {
          mutate("/identity-providers");
          onClose();
        }),
        loadingMessage: t("identityProviderModal.creating"),
      });
    }
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={(state) => !state && onClose()}
        key={open ? 1 : 0}
      >
        <ModalContent maxWidthClass={"max-w-xl"}>
          <ModalHeader
            icon={<FingerprintIcon size={20} />}
            title={
              isEditing
                ? t("identityProviderModal.editModalTitle")
                : t("identityProviderModal.addModalTitle")
            }
            description={
              isEditing
                ? t("identityProviderModal.editModalDescription")
                : t("identityProviderModal.addModalDescription")
            }
            color={"netbird"}
          />

          <Separator />

          <div className={"px-8 py-6 flex flex-col gap-6"}>
            <div>
              <Label>{t("identityProviderModal.providerType")}</Label>
              <HelpText>{t("identityProviderModal.providerTypeHelp")}</HelpText>
              <Select
                value={type}
                onValueChange={(v) => {
                  const newType = v as SSOIdentityProviderType;
                  setType(newType);
                  if (!isEditing) {
                    setName(
                      newType === "wechatwork"
                        ? t("identityProviderModal.wechatworkName")
                        : defaultNames[newType],
                    );
                  }
                }}
                disabled={isEditing}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("identityProviderModal.selectProviderType")} />
                </SelectTrigger>
                <SelectContent>
                  {SSOIdentityProviderOptions.map((idp) => (
                    <SelectItem key={idp.value} value={idp.value}>
                      <div className="flex items-center gap-2">
                        {idpIcon(idp.value)}
                        <span>
                          {idp.value === "wechatwork"
                            ? t("identityProviderModal.wechatworkName")
                            : idp.label}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t("identityProviderModal.name")}</Label>
              <HelpText>{t("identityProviderModal.nameHelp")}</HelpText>
              <Input
                placeholder={t("identityProviderModal.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                customPrefix={
                  <TagIcon size={16} className="text-nb-gray-300" />
                }
              />
            </div>

            {requiresIssuer && (
              <div>
                <Label>{t("identityProviderModal.issuerUrl")}</Label>
                <HelpText>{t("identityProviderModal.issuerUrlHelp")}</HelpText>
                <Input
                  placeholder={issuerHints[type] ?? "https://login.example.com"}
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  customPrefix={
                    <GlobeIcon size={16} className="text-nb-gray-300" />
                  }
                />
              </div>
            )}

            <div>
              <Label>
                {isWeChatWork
                  ? t("identityProviderModal.wechatworkCorpId")
                  : t("identityProviderModal.clientId")}
              </Label>
              <HelpText>
                {isWeChatWork
                  ? t("identityProviderModal.wechatworkCorpIdHelp")
                  : t("identityProviderModal.clientIdHelp")}
              </HelpText>
              <Input
                placeholder={
                  isWeChatWork
                    ? t("identityProviderModal.wechatworkCorpIdPlaceholder")
                    : t("identityProviderModal.clientIdPlaceholder")
                }
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                customPrefix={<IdCard size={16} className="text-nb-gray-300" />}
              />
            </div>

            {isWeChatWork && (
              <div>
                <Label>{t("identityProviderModal.agentId")}</Label>
                <HelpText>{t("identityProviderModal.agentIdHelp")}</HelpText>
                <Input
                  placeholder={t("identityProviderModal.agentIdPlaceholder")}
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  customPrefix={
                    <IdCard size={16} className="text-nb-gray-300" />
                  }
                />
              </div>
            )}

            <div>
              <Label>
                {isWeChatWork
                  ? t("identityProviderModal.wechatworkSecret")
                  : t("identityProviderModal.clientSecret")}
              </Label>
              <HelpText>
                {isWeChatWork
                  ? isEditing
                    ? t("identityProviderModal.wechatworkSecretKeepExisting")
                    : t("identityProviderModal.wechatworkSecretHelp")
                  : isEditing
                  ? clientIdChanged
                    ? t("identityProviderModal.clientSecretChangedHelp")
                    : t("identityProviderModal.clientSecretOptionalHelp")
                  : t("identityProviderModal.clientSecretHelp")}
              </HelpText>
              <Input
                type="password"
                placeholder={
                  isWeChatWork
                    ? isEditing
                      ? t(
                          "identityProviderModal.wechatworkSecretKeepPlaceholder",
                        )
                      : t("identityProviderModal.wechatworkSecretPlaceholder")
                    : isEditing
                    ? t("identityProviderModal.clientSecretMaskedPlaceholder")
                    : t("identityProviderModal.clientSecretPlaceholder")
                }
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                customPrefix={
                  <KeyIcon size={16} className="text-nb-gray-300" />
                }
              />
            </div>

            <Separator />

            <div className={"flex flex-col gap-3"}>
              <div>
                <Label>{t("identityProviderModal.endpointUrls")}</Label>
                <HelpText margin={false}>
                  {t("identityProviderModal.endpointUrlsHelp")}
                </HelpText>
              </div>

              <div>
                <Label className={"text-xs mb-1"}>{t("identityProviderModal.redirectCallback")}</Label>
                <Code
                  codeToCopy={
                    isWeChatWork ? `${redirectUrl}/{connector_id}` : redirectUrl
                  }
                  message={t("identityProviderModal.redirectCopied")}
                >
                  <Code.Line>
                    {isWeChatWork
                      ? `${redirectUrl}/{connector_id}`
                      : redirectUrl}
                  </Code.Line>
                </Code>
              </div>

              <div>
                <Label className={"text-xs mb-1"}>{t("identityProviderModal.logout")}</Label>
                <Code codeToCopy={logoutUrl} message={t("identityProviderModal.logoutCopied")}>
                  <Code.Line>{logoutUrl}</Code.Line>
                </Code>
                <HelpText margin={false} className={"mt-1.5"}>
                  {t("identityProviderModal.logoutHelp")}{" "}
                  <InlineLink
                    href={
                      "https://docs.netbird.io/selfhosted/identity-providers"
                    }
                    target={"_blank"}
                  >
                    {t("common.learnMore")}
                  </InlineLink>
                </HelpText>
              </div>
            </div>
          </div>

          <ModalFooter className={"items-center"}>
            <div className={"flex gap-3 w-full justify-end"}>
              <ModalClose asChild={true}>
                <Button variant={"secondary"}>{t("common.cancel")}</Button>
              </ModalClose>

              <Button
                variant={"primary"}
                onClick={submit}
                disabled={
                  isDisabled ||
                  (isEditing
                    ? !permission.identity_providers.update
                    : !permission.identity_providers.create)
                }
              >
                {isEditing ? (
                  <>
                    <SaveIcon size={16} />
                    {t("common.saveChanges")}
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    {t("identityProviderModal.addProvider")}
                  </>
                )}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
