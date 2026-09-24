import Button from "@components/Button";
import { Table } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { countLabel } from "@utils/helpers";
import { useI18n } from "@/i18n/I18nProvider";

interface Props<TData> {
  table: Table<TData>;
}
export default function DataTableMultiSelectActions<TData>({
  table,
}: Props<TData>) {
  const { t } = useI18n();
  return table.getFilteredSelectedRowModel().rows.length > 0 ? (
    <div>
      <Button variant={"danger-outline"}>
        <Trash2 size={16} />
        {t("setupKeys.revoke")}{" "}
        {countLabel(
          t,
          table.getFilteredSelectedRowModel().rows.length,
          "counts.key",
          "counts.keys",
        )}
      </Button>
    </div>
  ) : null;
}
