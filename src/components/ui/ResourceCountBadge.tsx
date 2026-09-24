import Badge, { BadgeVariants } from "@components/Badge";
import { cn, countLabel } from "@utils/helpers";
import { LayersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Group } from "@/interfaces/Group";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  group?: Group;
  disableRedirect?: boolean;
} & React.HTMLAttributes<HTMLDivElement> &
  BadgeVariants;

export default function ResourceCountBadge({
  group,
  disableRedirect = false,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const hasId = !!group?.id;

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (disableRedirect) return;
    if (hasId) router.push(`/group?id=${group?.id}&tab=resources`);
  };

  return (
    <Badge
      className={cn("px-3 gap-2 whitespace-nowrap", hasId && "cursor-pointer")}
      variant={"gray"}
      onClick={onClick}
      useHover={hasId}
    >
      <LayersIcon size={12} />
      {countLabel(
        t,
        group?.resources_count ?? 0,
        "counts.resource",
        "counts.resources",
      )}
    </Badge>
  );
}
