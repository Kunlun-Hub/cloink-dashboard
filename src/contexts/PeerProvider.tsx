import { notify } from "@components/Notification";
import SkeletonPeerDetail from "@components/skeletons/SkeletonPeerDetail";
import { useApiCall } from "@utils/api";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useUsers } from "@/contexts/UsersProvider";
import { Group, GroupPeer } from "@/interfaces/Group";
import { Peer } from "@/interfaces/Peer";
import { User } from "@/interfaces/User";
import { PeerSSHInstructions } from "@/modules/peer/PeerSSHInstructions";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  children: React.ReactNode;
  peer: Peer;
  isPeerDetailPage?: boolean;
};

const PeerContext = React.createContext(
  {} as {
    peer: Peer;
    user?: User;
    peerGroups: Group[];
    update: (props: {
      name?: string;
      ssh?: boolean;
      loginExpiration?: boolean;
      inactivityExpiration?: boolean;
      approval_required?: boolean;
      ip?: string;
      ipv6?: string;
    }) => Promise<Peer>;
    toggleSSH: (newState: boolean) => Promise<void>;
    setSSHInstructionsModal: (open: boolean) => void;
    deletePeer: () => void;
    isLoading: boolean;
  },
);

export default function PeerProvider({
  children,
  peer,
  isPeerDetailPage = false,
}: Props) {
  const { user, isLoading: isUserLoading } = usePeerUser(peer);
  const { peerGroups, isLoading: isGroupsLoading } = usePeerGroups(peer);
  const isLoading =
    isGroupsLoading || (peer.user_id ? isUserLoading : false);
  const peerRequest = useApiCall<Peer>("/peers", true);
  const { confirm } = useDialog();
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();
  const [sshInstructionsModal, setSSHInstructionsModal] = useState(false);
  const { t } = useI18n();

  const deletePeer = async () => {
    const choice = await confirm({
      title: t("peer.deleteTitle", { name: peer.name }),
      description: t("peer.deleteDescription"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      type: "danger",
    });
    if (choice) {
      notify({
        title: peer.name,
        description: t("peer.deleteSuccess"),
        promise: peerRequest.del({}, `/${peer.id}`).then(() => {
          mutate("/peers");
          mutate("/groups");
        }),
        loadingMessage: t("peer.deleteLoading"),
      });
    }
  };

  const update = async (props: {
    name?: string;
    ssh?: boolean;
    loginExpiration?: boolean;
    inactivityExpiration?: boolean;
    approval_required?: boolean;
    ip?: string;
    ipv6?: string;
  }) => {
    return peerRequest.put(
      {
        peerId: peer?.id,
        name: props.name != undefined ? props.name : peer.name,
        ssh_enabled: props.ssh != undefined ? props.ssh : peer.ssh_enabled,
        login_expiration_enabled:
          props.loginExpiration != undefined
            ? props.loginExpiration
            : peer.login_expiration_enabled,
        inactivity_expiration_enabled:
          props?.inactivityExpiration == undefined
            ? peer.inactivity_expiration_enabled
            : props.inactivityExpiration,
        approval_required:
          props?.approval_required == undefined
            ? undefined
            : props.approval_required,
        ip: props.ip != undefined ? props.ip : undefined,
        ipv6: props.ipv6 != undefined ? props.ipv6 : undefined,
      },
      `/${peer.id}`,
    );
  };

  const toggleSSH = async (enable: boolean) => {
    if (!permission.peers.update) return;
    notify({
      title: peer.name,
      description: enable
        ? t("peer.sshEnabled")
        : t("peer.sshDisabled"),
      promise: update({ ssh: enable }).then(() => {
        isPeerDetailPage ? mutate(`/peers/${peer.id}`) : mutate("/peers");
        setSSHInstructionsModal(false);
      }),
      loadingMessage: enable
        ? t("peer.sshEnabling")
        : t("peer.sshDisabling"),
    });
  };

  return !isLoading ? (
    <PeerContext.Provider
      value={{
        peer,
        peerGroups,
        user,
        update,
        toggleSSH,
        setSSHInstructionsModal,
        deletePeer,
        isLoading,
      }}
    >
      {sshInstructionsModal && (
        <PeerSSHInstructions
          open={sshInstructionsModal}
          onOpenChange={setSSHInstructionsModal}
          peer={peer}
          onSuccess={() => {
            mutate(`/peers/${peer.id}`);
            setSSHInstructionsModal(false);
          }}
        />
      )}

      {children}
    </PeerContext.Provider>
  ) : isPeerDetailPage ? (
    <SkeletonPeerDetail />
  ) : null;
}

/**
 * Get the groups of a peer
 * @param peer
 */
export const usePeerGroups = (peer?: Peer) => {
  const { groups, isLoading } = useGroups();

  const peerGroups = useMemo(() => {
    if (!peer) return [];
    const peerGroups = groups?.filter((group) => {
      const foundGroup = group.peers?.find((p) => {
        const peerGroup = p as GroupPeer;
        return peerGroup.id === peer.id;
      });
      return foundGroup !== undefined;
    });
    return peerGroups || [];
  }, [groups, peer]);

  return { peerGroups, isLoading };
};

/**
 * Get the user of a peer
 * @param peer
 */
export const usePeerUser = (peer: Peer) => {
  const { users, isLoading } = useUsers();

  const user = useMemo(() => {
    return users?.find((u) => u.id === peer.user_id);
  }, [users, peer]);

  return { user, isLoading };
};

/**
 * Access the peer context
 */
export const usePeer = () => React.useContext(PeerContext);
