"use client";

import { HelpTooltip } from "@components/HelpTooltip";
import useCopyToClipboard from "@hooks/useCopyToClipboard";
import { Copy } from "lucide-react";
import React from "react";
import { useI18n } from "@/i18n/I18nProvider";

// EndpointBadge is the "API Base URL" card — the one presentation of the
// endpoint everywhere it appears (providers page, Connect Agent). It shows the
// URL and copies it; the per-tool config that goes with it lives inline on the
// Connect Agent page, which is the only place it belongs.
export default function EndpointBadge({
  endpoint,
}: {
  // Bare endpoint host, e.g. "sailcloth.eu.proxy.netbird.io".
  endpoint: string;
}) {
  const { t } = useI18n();
  const [, copy] = useCopyToClipboard(`https://${endpoint}`);
  return (
    <div
      className={
        "inline-flex items-center gap-3 rounded-lg border border-nb-gray-800 bg-nb-gray-900/40 p-3 min-w-[300px]"
      }
    >
      <div className={"flex flex-col"}>
        <div
          className={
            "text-[10px] text-nb-gray-400 uppercase tracking-wider font-medium inline-flex items-center gap-1.5"
          }
        >
          {t("agentNetwork.apiBaseUrl")}
          <HelpTooltip
            iconSize={11}
            content={
              <>
                {t("agentNetwork.apiBaseUrlTooltipPrefix")}
                <code className={"font-mono"}> base_url</code>
                {t("agentNetwork.apiBaseUrlTooltipMiddle")}{" "}
                <code className={"font-mono"}>baseURL</code>
                {t("agentNetwork.apiBaseUrlTooltipSuffix")}
              </>
            }
          />
        </div>
        <code
          className={
            "font-mono text-xs text-nb-gray-100 leading-tight mt-0.5 whitespace-nowrap"
          }
        >
          https://{endpoint}
        </code>
      </div>
      <button
        type={"button"}
        className={
          "inline-flex items-center gap-1.5 rounded-md border border-nb-gray-700 bg-nb-gray-800/60 px-2.5 py-1.5 text-[11px] font-medium text-nb-gray-200 hover:bg-nb-gray-800 hover:text-white transition-colors shrink-0"
        }
        onClick={() => copy(t("agentNetwork.endpointCopied"))}
        aria-label={t("agentNetwork.copyEndpoint")}
      >
        <Copy size={12} />
        {t("agentNetwork.copy")}
      </button>
    </div>
  );
}
