import CopyToClipboardText from "@components/CopyToClipboardText";
import CircleIcon from "@/assets/icons/CircleIcon";
import { ReverseProxyCluster } from "@/interfaces/ReverseProxy";
import { ClusterTypeIndicator } from "@/modules/reverse-proxy/clusters/ClusterTypeIndicator";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  cluster: ReverseProxyCluster;
};

export default function ClustersNameCell({ cluster }: Readonly<Props>) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5 ml-2">
      <CircleIcon active={cluster.online} size={8} inactiveDot={"gray"} />
      <CopyToClipboardText
        message={t("reverseProxy.clusterAddressCopied", { address: cluster.address })}
      >
        <span className="font-medium">{cluster.address}</span>
      </CopyToClipboardText>
      <ClusterTypeIndicator cluster={cluster} />
    </div>
  );
}
