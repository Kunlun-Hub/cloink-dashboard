import SquareIcon from "@components/SquareIcon";
import AddPeerDropdown from "@components/ui/AddPeerDropdown";
import GetStartedTest from "@components/ui/GetStartedTest";
import * as React from "react";
import PeerIcon from "@/assets/icons/PeerIcon";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  showBackground?: boolean;
};

export const NoPeersGettingStarted = ({
  showBackground = true,
}: Readonly<Props>) => {
  const { t } = useI18n();

  return (
    <GetStartedTest
      showBackground={showBackground}
      icon={
        <SquareIcon
          icon={<PeerIcon className={"fill-nb-gray-200"} size={20} />}
          color={"gray"}
          size={"large"}
        />
      }
      title={t("noPeersGettingStarted.title")}
      description={t("noPeersGettingStarted.description")}
      button={<AddPeerDropdown />}
    />
  );
};
