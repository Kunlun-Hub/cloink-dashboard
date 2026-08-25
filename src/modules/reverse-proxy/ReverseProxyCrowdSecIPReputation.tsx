import * as React from "react";
import { ReactNode, useMemo } from "react";
import { Label } from "@components/Label";
import HelpText from "@components/HelpText";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { EyeIcon, PowerOffIcon, ShieldCheckIcon } from "lucide-react";
import { HelpTooltip } from "@components/HelpTooltip";
import { CrowdSecMode } from "@/interfaces/ReverseProxy";
import Image from "next/image";
import CrowdSecIconImage from "@/assets/integrations/crowdsec.png";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  value: CrowdSecMode;
  onChange: (value: CrowdSecMode) => void;
};

type CrowdSecOption = {
  label: string;
  description?: string;
  icon: ReactNode;
};

export const ReverseProxyCrowdSecIPReputation = ({
  value,
  onChange,
}: Props) => {
  const { t } = useI18n();

  const crowdsecOptions = useMemo<Record<CrowdSecMode, CrowdSecOption>>(
    () => ({
      [CrowdSecMode.OFF]: {
        label: t("common.disabled"),
        icon: <PowerOffIcon size={14} />,
      },
      [CrowdSecMode.ENFORCE]: {
        label: t("reverseProxy.crowdsecEnforce"),
        description: t("reverseProxy.crowdsecEnforceDescription"),
        icon: <ShieldCheckIcon size={14} />,
      },
      [CrowdSecMode.OBSERVE]: {
        label: t("reverseProxy.crowdsecObserve"),
        description: t("reverseProxy.crowdsecObserveDescription"),
        icon: <EyeIcon size={14} />,
      },
    }),
    [t],
  );

  const selected = crowdsecOptions[value];

  return (
    <div className="flex items-center gap-0 justify-between mb-6">
      <div className="flex gap-4">
        <div
          className={
            "h-12 w-12 flex items-center justify-center rounded-md bg-nb-gray-900/70 p-2 border border-nb-gray-900/70 shrink-0 relative"
          }
        >
          <Image
            src={CrowdSecIconImage}
            alt={"CrowdSec"}
            className={"rounded-[4px]"}
          />
        </div>
        <div>
          <Label>{t("reverseProxy.crowdsecTitle")}</Label>
          <HelpText>
            {t("reverseProxy.crowdsecDescriptionPrefix")}{" "}
            <b className={"text-white"}>{t("reverseProxy.crowdsecEnforce")}</b>{" "}
            {t("reverseProxy.crowdsecDescriptionMiddle")}{" "}
            <b className={"text-white"}>{t("reverseProxy.crowdsecObserve")}</b>{" "}
            {t("reverseProxy.crowdsecDescriptionSuffix")}
          </HelpText>
        </div>
      </div>

      <Select value={value} onValueChange={(v) => onChange(v as CrowdSecMode)}>
        <SelectTrigger className="w-[260px]" data-testid="crowdsec-mode-trigger">
          <div className="flex items-center gap-2 whitespace-nowrap">
            {selected.icon}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(crowdsecOptions).map(([mode, config]) => (
            <SelectItem
              key={mode}
              value={mode}
              data-testid={`crowdsec-mode-${mode}`}
              extra={
                config.description ? (
                  <HelpTooltip
                    triggerClassName="ml-[0.01rem]"
                    align="center"
                    side="right"
                    content={<>{config.description}</>}
                  />
                ) : undefined
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
