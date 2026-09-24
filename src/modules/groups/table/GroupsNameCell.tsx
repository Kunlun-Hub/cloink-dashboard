import { GroupBadgeIcon } from "@components/ui/GroupBadgeIcon";
import TextWithTooltip from "@components/ui/TextWithTooltip";
import { useRouter } from "next/navigation";
import React from "react";
import CircleIcon from "@/assets/icons/CircleIcon";
import { Group } from "@/interfaces/Group";
import { useI18n } from "@/i18n/I18nProvider";
import { localizeGroupName } from "@/utils/serverLabels";

type Props = {
  active: boolean;
  group: Group;
};
export default function GroupsNameCell({ active, group }: Readonly<Props>) {
  const router = useRouter();
  const { t } = useI18n();
  const displayName = localizeGroupName(group?.name, t);
  return (
    <div className={""}>
      <div
        className={
          "inline-flex items-center justify-start text-nb-gray-300 gap-2.5 py-2 px-3 pr-4 hover:bg-nb-gray-800/60 cursor-pointer rounded-md"
        }
        onClick={() => router.push("/group?id=" + group.id)}
      >
        <div className={"flex items-center justify-center h-full"}>
          <GroupBadgeIcon id={group?.id} issued={group?.issued} />
        </div>

        <div
          className={"flex flex-col min-w-0 cursor-pointer"}
          aria-label={`View details of group ${displayName}`}
        >
          <div className={"font-medium flex gap-2 items-center justify-center"}>
            <TextWithTooltip text={displayName} maxChars={50} />
          </div>
        </div>
        <CircleIcon
          size={8}
          active={active}
          inactiveDot={"gray"}
          className={"shrink-0"}
        />
      </div>
    </div>
  );
}
