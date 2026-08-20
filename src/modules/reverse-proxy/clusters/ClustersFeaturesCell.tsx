import Badge from "@components/Badge";
import FullTooltip from "@components/FullTooltip";
import { Lock, ShieldAlert, SlidersHorizontal, Globe } from "lucide-react";
import { ReverseProxyCluster } from "@/interfaces/ReverseProxy";
import EmptyRow from "@/modules/common-table-rows/EmptyRow";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  cluster: ReverseProxyCluster;
};

type Feature = {
  key: string;
  label: string;
  description: React.ReactNode;
  icon: React.ReactNode;
};

// ClustersFeaturesCell renders one badge per supported capability.
// Only "true" flags get a badge; nil and false are omitted (the
// backend distinguishes "unsupported" from "not yet reported" via
// nullable booleans, but visually both mean "not available here").
export default function ClustersFeaturesCell({ cluster }: Readonly<Props>) {
  const { t } = useI18n();
  const features: Feature[] = [];
  if (cluster.supports_custom_ports) {
    features.push({
      key: "custom-ports",
      label: t("reverseProxy.featureCustomPorts"),
      description: t("reverseProxy.featureCustomPortsDescription"),
      icon: <SlidersHorizontal size={14} className={"text-netbird"} />,
    });
  }
  if (cluster.require_subdomain) {
    features.push({
      key: "subdomain",
      label: t("reverseProxy.featureSubdomainRequired"),
      description: t("reverseProxy.featureSubdomainRequiredDescription"),
      icon: <Globe size={14} className={"text-nb-gray-300"} />,
    });
  }
  if (cluster.supports_crowdsec) {
    features.push({
      key: "crowdsec",
      label: t("reverseProxy.crowdSec"),
      description: t("reverseProxy.featureCrowdSecDescription"),
      icon: <ShieldAlert size={14} className={"text-green-500"} />,
    });
  }
  if (cluster.private) {
    features.push({
      key: "private",
      label: t("reverseProxy.featurePrivate"),
      description: (
        <>
          {t("reverseProxy.privateClusterDescriptionPrefix")}{" "}
          <span className={"font-medium text-white"}>{t("reverseProxy.netBirdOnlyAccess")}</span>{" "}
          {t("reverseProxy.privateClusterDescriptionMiddle")}{" "}
          <span className={"font-medium text-white"}>{t("reverseProxy.proxyCluster")}</span>{" "}
          {t("reverseProxy.privateClusterDescriptionSuffix")}
        </>
      ),
      icon: <Lock size={14} className={"text-netbird"} />,
    });
  }

  if (features.length === 0) {
    return <EmptyRow />;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {features.map((f) => (
        <FullTooltip
          key={f.key}
          content={
            <div className={"text-xs max-w-xs"}>
              <div className={"font-medium text-white"}>{f.label}</div>
              <div className={"text-nb-gray-300 mt-1"}>{f.description}</div>
            </div>
          }
        >
          <Badge variant={"gray"} className={"h-[34px] cursor-help"}>
            {f.icon}
            <span className="font-medium text-xs">{f.label}</span>
          </Badge>
        </FullTooltip>
      ))}
    </div>
  );
}
