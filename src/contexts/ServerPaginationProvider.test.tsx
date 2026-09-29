import { ColumnDef } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/events/traffic",
}));

vi.mock("swr", () => ({
  useSWRConfig: () => ({ mutate: async () => undefined }),
}));

type Row = { id: string; name: string };

// Stands in for the management API: it honours `page`/`page_size` exactly like
// /events/network-traffic does, so the test exercises the real pagination flow
// (provider -> DataTable -> onPaginationChange -> new request) rather than a stub.
const ALL_ROWS: Row[] = Array.from({ length: 6 }, (_, i) => ({
  id: `row-${i + 1}`,
  name: `Row ${i + 1}`,
}));

vi.mock("@utils/api", () => ({
  default: (url: string) => {
    const params = new URLSearchParams(url.split("?")[1] ?? "");
    const page = Number(params.get("page") ?? "1");
    const pageSize = Number(params.get("page_size") ?? "20");
    const start = (page - 1) * pageSize;
    const data = ALL_ROWS.slice(start, start + pageSize);
    return {
      data: {
        data,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(ALL_ROWS.length / pageSize),
        total_records: ALL_ROWS.length,
      },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: async () => undefined,
    };
  },
}));

const { DataTable } = await import("@components/table/DataTable");
const { default: ServerPaginationProvider, useServerPagination } = await import(
  "@/contexts/ServerPaginationProvider"
);

const columns: ColumnDef<Row>[] = [
  { id: "name", accessorKey: "name", header: "Name" },
];

function PaginatedTable() {
  const { data, ...pagination } = useServerPagination<Row[]>();
  return (
    <DataTable
      {...pagination}
      columns={columns}
      data={data}
      showSearchAndFilters={false}
      keepStateInLocalStorage={false}
      serverSidePagination
    />
  );
}

afterEach(cleanup);

describe("ServerPaginationProvider + DataTable", () => {
  it("renders the second page after a single next-page click", async () => {
    const { container } = render(
      <ServerPaginationProvider url="/events/network-traffic" defaultPageSize={2}>
        <PaginatedTable />
      </ServerPaginationProvider>,
    );

    expect(screen.getByText("Row 1")).toBeTruthy();
    expect(screen.queryByText("Row 3")).toBeNull();

    const next = Array.from(container.querySelectorAll("button")).find((b) =>
      b.querySelector("svg.lucide-chevron-right"),
    );
    expect(next).toBeTruthy();
    fireEvent.click(next as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByText("Row 3")).toBeTruthy();
    });
    expect(screen.queryByText("Row 1")).toBeNull();
  });
});
