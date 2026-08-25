"use client";

import Badge from "@components/Badge";
import { Globe, Server } from "lucide-react";
import React from "react";
import { ReverseProxyDomain } from "@/interfaces/ReverseProxy";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  domain: ReverseProxyDomain;
};

export default function CustomDomainClusterCell({ domain }: Readonly<Props>) {
  const { t } = useI18n();
  const hasCluster = !!domain.target_cluster;

  if (!hasCluster) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="gray" className="font-normal">
          <Globe size={12} />
          {t("common.all")}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={"gray"} className={"font-normal"}>
        <Server size={11} className={"text-nb-gray-400"} />
        {domain.target_cluster}
      </Badge>
    </div>
  );
}
