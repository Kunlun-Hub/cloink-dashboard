import { KeyRound, MessageCircle } from "lucide-react";
import React from "react";
import AuthentikIcon from "@/assets/icons/AuthentikIcon";
import EntraIcon from "@/assets/icons/EntraIcon";
import GoogleIcon from "@/assets/icons/GoogleIcon";
import KeycloakIcon from "@/assets/icons/KeycloakIcon";
import MicrosoftIcon from "@/assets/icons/MicrosoftIcon";
import OktaIcon from "@/assets/icons/OktaIcon";
import PocketIdIcon from "@/assets/icons/PocketIdIcon";
import ZitadelIcon from "@/assets/icons/ZitadelIcon";
import { SSOIdentityProviderType } from "@/interfaces/IdentityProvider";

export const idpIcon = (
  type: SSOIdentityProviderType,
  size: number = 16,
): React.ReactNode => {
  const icons: Record<SSOIdentityProviderType, React.ReactNode> = {
    google: <GoogleIcon size={size} />,
    microsoft: <MicrosoftIcon size={size} />,
    entra: <EntraIcon size={size} />,
    okta: <OktaIcon size={size} className="text-nb-gray-300" />,
    pocketid: <PocketIdIcon size={size} />,
    zitadel: <ZitadelIcon size={size} />,
    authentik: <AuthentikIcon size={size} />,
    keycloak: <KeycloakIcon size={size} />,
    adfs: <MicrosoftIcon size={size} />,
    oidc: <KeyRound size={size} className="text-nb-gray-400" />,
    wechatwork: <MessageCircle size={size} className="text-green-500" />,
  };

  return icons[type];
};
