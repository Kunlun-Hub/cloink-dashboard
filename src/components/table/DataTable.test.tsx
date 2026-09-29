import { ColumnDef } from "@tanstack/react-table";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// A column's `meta.className` must land on both its header cell and its body
// cells, otherwise a responsive class such as `hidden xl:table-cell` would hide
// one half of the column and leave the other behind.
vi.mock("next/navigation", () => ({
  usePathname: () => "/test",
}));

const { DataTable } = await import("@components/table/DataTable");

type Row = { id: string; name: string; enabled: boolean };

const rows: Row[] = [
  { id: "a", name: "First", enabled: true },
  { id: "b", name: "Second", enabled: false },
];

const columns: ColumnDef<Row>[] = [
  { id: "name", accessorKey: "name", header: "Name" },
  {
    id: "enabled",
    accessorKey: "enabled",
    header: "Active",
    meta: { className: "hidden xl:table-cell" },
    cell: ({ row }) => (row.original.enabled ? "on" : "off"),
  },
];

afterEach(cleanup);

describe("DataTable column meta className", () => {
  it("applies the class to the column's header cell", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={rows}
        showSearchAndFilters={false}
        keepStateInLocalStorage={false}
      />,
    );
    const headers = container.querySelectorAll("thead th");
    expect(headers[0].className).not.toContain("xl:table-cell");
    expect(headers[1].className).toContain("hidden");
    expect(headers[1].className).toContain("xl:table-cell");
  });

  it("applies the class to every body cell of the column", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={rows}
        showSearchAndFilters={false}
        keepStateInLocalStorage={false}
      />,
    );
    const bodyRows = container.querySelectorAll("tbody tr");
    expect(bodyRows).toHaveLength(rows.length);
    bodyRows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      expect(cells[0].className).not.toContain("xl:table-cell");
      expect(cells[1].className).toContain("hidden");
      expect(cells[1].className).toContain("xl:table-cell");
    });
  });

  it("combines tableHeadClassName with the column meta class", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={rows}
        showSearchAndFilters={false}
        keepStateInLocalStorage={false}
        tableHeadClassName={"px-4"}
      />,
    );
    const headers = container.querySelectorAll("thead th");
    expect(headers[0].className).toContain("px-4");
    expect(headers[1].className).toContain("px-4");
    expect(headers[1].className).toContain("xl:table-cell");
  });
});

// Regression: a controlled server-paginated table must forward the user's first
// "next page" click. A one-shot initial-render guard used to swallow it, so the
// table stayed on page 1 even though the request had already been fired.
describe("DataTable manual pagination", () => {
  const clickNextPage = (container: HTMLElement) => {
    const next = Array.from(container.querySelectorAll("button")).find((b) =>
      b.querySelector("svg.lucide-chevron-right"),
    );
    expect(next).toBeTruthy();
    fireEvent.click(next as HTMLButtonElement);
  };

  it("forwards the first next-page click to onPaginationChange", () => {
    const onPaginationChange = vi.fn();
    const { container } = render(
      <DataTable
        columns={columns}
        data={rows}
        showSearchAndFilters={false}
        keepStateInLocalStorage={false}
        manualPagination
        pageCount={3}
        pagination={{ pageIndex: 0, pageSize: 2 }}
        onPaginationChange={onPaginationChange}
        totalRecords={6}
        initialPageSize={2}
      />,
    );
    clickNextPage(container);
    expect(onPaginationChange).toHaveBeenCalledWith({
      pageIndex: 1,
      pageSize: 2,
    });
  });

  it("does not forward a no-op pagination update", () => {
    const onPaginationChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows}
        showSearchAndFilters={false}
        keepStateInLocalStorage={false}
        manualPagination
        pageCount={3}
        pagination={{ pageIndex: 0, pageSize: 2 }}
        onPaginationChange={onPaginationChange}
        totalRecords={6}
        initialPageSize={2}
      />,
    );
    expect(onPaginationChange).not.toHaveBeenCalled();
  });
});
