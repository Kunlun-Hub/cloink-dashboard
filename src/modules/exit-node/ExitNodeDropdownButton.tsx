import { DropdownMenuItem } from "@components/DropdownMenu";
import { Modal } from "@components/modal/Modal";
import { IconCirclePlus, IconDirectionSign } from "@tabler/icons-react";
import * as React from "react";
import { useState } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import RoutesProvider from "@/contexts/RoutesProvider";
import { Peer } from "@/interfaces/Peer";
import { useHasExitNodes } from "@/modules/exit-node/useHasExitNodes";
import { RouteModalContent } from "@/modules/routes/RouteModal";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  peer: Peer;
};

export const ExitNodeDropdownButton = ({ peer }: Props) => {
  const [modal, setModal] = useState(false);
  const { t } = useI18n();
  const exitNodeInfo = useHasExitNodes(peer);
  const { permission } = usePermissions();

  return (
    <>
      <DropdownMenuItem
        onClick={() => setModal(true)}
        disabled={!permission.routes.create}
      >
        <div className={"flex gap-3 items-center w-full"}>
          {exitNodeInfo.hasExitNode ? (
            <>
              <IconCirclePlus size={14} className={"shrink-0"} />
              <div className={"flex justify-between items-center w-full"}>
                {t("exitNodes.add")}
              </div>
            </>
          ) : (
            <>
              <IconDirectionSign
                size={14}
                className={"shrink-0 text-yellow-400"}
              />
              <div className={"flex justify-between items-center w-full"}>
                {t("exitNodes.setup")}
              </div>
            </>
          )}
        </div>
      </DropdownMenuItem>
      <Modal open={modal} onOpenChange={setModal}>
        {modal && (
          <RoutesProvider>
            <RouteModalContent
              onSuccess={() => setModal(false)}
              peer={peer}
              exitNode={true}
            />
          </RoutesProvider>
        )}
      </Modal>
    </>
  );
};
