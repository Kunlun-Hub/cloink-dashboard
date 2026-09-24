import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import { notify } from "@components/Notification";
import { DataTableMultiSelectPopup } from "@components/table/DataTableMultiSelectPopup";
import { ErrorResponse, useApiCall } from "@utils/api";
import { FolderGit2, Trash2 } from "lucide-react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { Group } from "@/interfaces/Group";
import { GroupUsage } from "@/modules/groups/useGroupsUsage";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  selectedGroups?: GroupUsage[];
  onCanceled?: () => void;
};

export const GroupsMultiSelect = ({
  selectedGroups = [],
  onCanceled,
}: Readonly<Props>) => {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const { confirm } = useDialog();
  const { deleteGroupDropdownOption } = useGroups();
  const { permission } = usePermissions();
  const groupCall = useApiCall<Group>("/groups", true);
  const groupCount = selectedGroups.length;

  const deleteAllGroups = async () => {
    if (!permission.groups.delete || groupCount === 0) return;

    const choice = await confirm({
      title:
        groupCount > 1
          ? t("groupsMultiSelect.deleteTitlePlural", { count: groupCount })
          : t("groupsMultiSelect.deleteTitleSingle", { count: groupCount }),
      description:
        groupCount > 1
          ? t("groupsMultiSelect.deleteDescriptionPlural")
          : t("groupsMultiSelect.deleteDescriptionSingle"),
      confirmText: t("groupsMultiSelect.deleteAll"),
      cancelText: t("common.cancel"),
      type: "danger",
    });
    if (!choice) return;

    // Take the batch and drop the selection now rather than when the requests
    // land, so a slow batch cannot wipe a selection the user made in the
    // meantime, and the popup acknowledges the confirmation immediately.
    const groupsToDelete = selectedGroups;
    onCanceled?.();

    // allSettled, not all: the in-use counts driving the checkboxes come from a
    // client-side snapshot, so the server can still reject an individual group.
    // The table has to refresh for the ones that did get deleted either way.
    const promise = Promise.allSettled(
      groupsToDelete.map((group) => groupCall.del({}, `/${group.id}`)),
    ).then((results) => {
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          deleteGroupDropdownOption(groupsToDelete[index].name);
        }
      });
      mutate("/groups");

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length === 0) return;

      const firstError = failures[0].reason as ErrorResponse | undefined;
      const failureMessage =
        firstError?.message ?? t("notification.genericError");
      return Promise.reject({
        code: firstError?.code ?? 418,
        requestId: firstError?.requestId,
        message:
          failures.length === groupCount
            ? failureMessage
            : `${t("groupsMultiSelect.partialFailure", {
                failed: failures.length,
                total: groupCount,
              })} ${failureMessage}`,
      } satisfies ErrorResponse);
    });

    notify({
      title: t("groupsMultiSelect.deleteNotifyTitle"),
      description:
        groupCount > 1
          ? t("groupsMultiSelect.deleteNotifyPlural")
          : t("groupsMultiSelect.deleteNotifySingle"),
      promise,
      loadingMessage:
        groupCount > 1
          ? t("groupsMultiSelect.deletingPlural")
          : t("groupsMultiSelect.deletingSingle"),
    });
  };

  return (
    <DataTableMultiSelectPopup
      selectedItems={selectedGroups}
      label={
        groupCount === 1
          ? t("groupsMultiSelect.selectedSingle")
          : t("groupsMultiSelect.selectedPlural")
      }
      onCanceled={onCanceled}
      icon={<FolderGit2 size={16} />}
      rightSide={
        <FullTooltip
          content={
            <span className={"text-xs"}>{t("groupsMultiSelect.deleteAll")}</span>
          }
        >
          <Button
            variant={"danger-outline"}
            size={"xs"}
            className={"!h-9 !w-9"}
            onClick={deleteAllGroups}
            disabled={!permission.groups.delete}
            aria-label={t("groupsMultiSelect.deleteAllTooltip")}
          >
            <Trash2 size={16} className={"shrink-0"} />
          </Button>
        </FullTooltip>
      }
    />
  );
};
