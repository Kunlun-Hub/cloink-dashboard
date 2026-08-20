import React, { ReactNode, useEffect, useMemo } from "react";
import {
  isL4Mode as isL4ServiceMode,
  type ReverseProxyDomain,
  ServiceMode,
} from "@/interfaces/ReverseProxy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { ArrowRightFromLine, Globe, LockKeyhole } from "lucide-react";
import { HelpTooltip } from "@components/HelpTooltip";
import { Label } from "@components/Label";
import HelpText from "@components/HelpText";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  value?: ServiceMode;
  onChange: (value: ServiceMode) => void;
  disabled?: boolean;
  domain?: ReverseProxyDomain;
};

type ServiceModeConfig = {
  label: string;
  description: string;
  icon: ReactNode;
};

/** @deprecated Use useServiceModes() for translated labels. Kept for backward compatibility. */
export const SERVICE_MODES: Record<ServiceMode, ServiceModeConfig> = {
  [ServiceMode.HTTP]: {
    label: "HTTPS Service",
    description:
      "Reverse proxy with path routing and built-in authentication (SSO, PIN, password). Typically used for web applications and APIs.",
    icon: <Globe size={14} />,
  },
  [ServiceMode.TLS]: {
    label: "TLS Passthrough",
    description:
      "Passes encrypted TLS traffic straight through to the backend. Typically used for services that manage their own TLS certificates.",
    icon: <LockKeyhole size={14} />,
  },
  [ServiceMode.TCP]: {
    label: "TCP Service",
    description:
      "Forwards raw TCP traffic to your backend on a dedicated port. Typically used for databases, custom protocols, or any TCP-based service.",
    icon: <ArrowRightFromLine size={14} />,
  },
  [ServiceMode.UDP]: {
    label: "UDP Service",
    description:
      "Forwards raw UDP traffic to your backend on a dedicated port. Typically used for real-time services like voice, video, or streaming.",
    icon: <ArrowRightFromLine size={14} />,
  },
};

export const useServiceModes = (): Record<ServiceMode, ServiceModeConfig> => {
  const { t } = useI18n();

  return useMemo(
    () => ({
      [ServiceMode.HTTP]: {
        label: t("reverseProxy.serviceModeHttp"),
        description: t("reverseProxy.serviceModeHttpDescription"),
        icon: <Globe size={14} />,
      },
      [ServiceMode.TLS]: {
        label: t("reverseProxy.serviceModeTls"),
        description: t("reverseProxy.serviceModeTlsDescription"),
        icon: <LockKeyhole size={14} />,
      },
      [ServiceMode.TCP]: {
        label: t("reverseProxy.serviceModeTcp"),
        description: t("reverseProxy.serviceModeTcpDescription"),
        icon: <ArrowRightFromLine size={14} />,
      },
      [ServiceMode.UDP]: {
        label: t("reverseProxy.serviceModeUdp"),
        description: t("reverseProxy.serviceModeUdpDescription"),
        icon: <ArrowRightFromLine size={14} />,
      },
    }),
    [t],
  );
};

export const ReverseProxyServiceModeSelector = ({
  value,
  onChange,
  disabled,
  domain,
}: Props) => {
  const { t } = useI18n();
  const serviceModes = useServiceModes();
  const selected = value ?? ServiceMode.HTTP;
  const selectedMode = serviceModes[selected];
  const isL4Supported = domain?.supports_custom_ports !== undefined;

  // Reset to HTTP if the current L4 mode becomes unsupported (e.g. domain changed)
  useEffect(() => {
    if (!isL4Supported && isL4ServiceMode(selected)) {
      onChange(ServiceMode.HTTP);
    }
  }, [isL4Supported, selected, onChange]);

  return (
    <div className="flex justify-between items-center gap-10 mt-2">
      <div>
        <Label>{t("reverseProxy.serviceType")}</Label>
        <HelpText>
          {t("reverseProxy.serviceTypeHelp")}
        </HelpText>
      </div>
      <Select
        value={selected}
        onValueChange={(v) => onChange(v as ServiceMode)}
        disabled={disabled}
      >
        <SelectTrigger className="max-w-[240px] min-w-[200px]">
          <div
            className={"flex items-center gap-2 whitespace-nowrap"}
            data-testid={"service-mode-select-button"}
          >
            {selectedMode.icon}
            <SelectValue placeholder={t("reverseProxy.selectServiceType")} />
          </div>
        </SelectTrigger>
        <SelectContent data-testid={"service-mode-selection"}>
          {Object.entries(serviceModes)
            .filter(
              ([mode]) =>
                isL4Supported || !isL4ServiceMode(mode as ServiceMode),
            )
            .map(([mode, config]) => (
              <SelectItem
                key={mode}
                value={mode}
                data-testid={`service-mode-option-${mode}`}
                extra={
                  <HelpTooltip
                    triggerClassName={"ml-[0.01rem]"}
                    align={"center"}
                    side={"right"}
                    content={<>{config.description}</>}
                  />
                }
              >
                <span className="whitespace-nowrap">{config.label}</span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};
