import ButtonGroup from "@components/ButtonGroup";
import { PaginationState, Table } from "@tanstack/react-table";
import { cn } from "@utils/helpers";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  text?: string;
  paginationPadding?: string;
  totalRecords?: number;
  manualPagination?: boolean;
  pagination?: PaginationState;
  pageCount?: number;
  onPaginationChange?: (pagination: PaginationState) => void;
}

export function DataTablePagination<TData>({
  table,
  text,
  paginationPadding = "px-8 py-8",
  totalRecords,
  manualPagination = false,
  pagination,
  pageCount,
  onPaginationChange,
}: DataTablePaginationProps<TData>) {
  const { t } = useI18n();
  const textLabel = text ?? t("dataTablePagination.rows");
  const controlledPagination = manualPagination ? pagination : undefined;
  const rowsPerPage =
    controlledPagination?.pageSize ?? table.getState().pagination.pageSize;
  const pageIndex =
    controlledPagination?.pageIndex ?? table.getState().pagination.pageIndex;
  const currentPage = pageIndex + 1;
  const resolvedPageCount = pageCount ?? table.getPageCount();

  const totalRows =
    totalRecords !== undefined
      ? totalRecords
      : table.getFilteredRowModel().rows.length;

  const showingFrom = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingTo = Math.min(currentPage * rowsPerPage, totalRows);
  const canPreviousPage = currentPage > 1;
  const canNextPage =
    resolvedPageCount === -1 || currentPage < resolvedPageCount;

  const goToPage = (nextPageIndex: number) => {
    if (manualPagination && pagination && onPaginationChange) {
      onPaginationChange({ pageIndex: nextPageIndex, pageSize: rowsPerPage });
      return;
    }
    table.setPageIndex(nextPageIndex);
  };

  return (
    resolvedPageCount > 1 && (
      <div
        className={cn("flex items-center justify-between", paginationPadding)}
      >
        <div className="text-nb-gray-400">
          {t("dataTablePagination.showing", {
            from: showingFrom,
            to: showingTo,
            total: totalRows,
            text: textLabel,
          })}
        </div>
        {resolvedPageCount > 1 && (
          <div className={"flex items-center gap-3"}>
            <div className="flex items-center space-x-2">
              <ButtonGroup>
                <ButtonGroup.Button
                  onClick={() => goToPage(0)}
                  disabled={!canPreviousPage}
                >
                  <ChevronsLeft size={16} />
                </ButtonGroup.Button>
                <ButtonGroup.Button
                  onClick={() => goToPage(pageIndex - 1)}
                  disabled={!canPreviousPage}
                >
                  <ChevronLeft size={18} />
                </ButtonGroup.Button>
                <ButtonGroup.Button>
                  <div>
                    {t("dataTablePagination.pageOf", {
                      currentPage,
                      pageCount: resolvedPageCount,
                    })}
                  </div>
                </ButtonGroup.Button>
                <ButtonGroup.Button
                  onClick={() => goToPage(pageIndex + 1)}
                  disabled={!canNextPage}
                >
                  <ChevronRight size={18} />
                </ButtonGroup.Button>
                <ButtonGroup.Button
                  onClick={() => goToPage(resolvedPageCount - 1)}
                  disabled={!canNextPage}
                >
                  <ChevronsRight size={18} />
                </ButtonGroup.Button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>
    )
  );
}
