"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import Checkbox from "@mui/material/Checkbox";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Typography from "@mui/material/Typography";

import { CommonTable } from "./table";
import { useTable } from "./use-table";
import type { TableHeadCellProps } from "./types";

export interface AppTableColumn<T> {
  id: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: number | string;
  minWidth?: number | string;
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
}

interface AppTableProps<T> {
  columns: AppTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyIcon?: string;
  maxHeight?: number | string;
  toolbar?: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  searchQuery?: string;
  minWidth?: number;
  defaultOrderBy?: string;
  rowsPerPageOptions?: number[];
  showCheckbox?: boolean;
  selected?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAllRows?: (checked: boolean) => void;
  /** Match subject-mapping: table sits inside an outer AppCard. */
  embedded?: boolean;
  hidePagination?: boolean;
}

function descendingComparator<T>(a: T, b: T, orderBy: string) {
  const aValue = (a as Record<string, unknown>)[orderBy];
  const bValue = (b as Record<string, unknown>)[orderBy];

  if (bValue == null && aValue != null) return -1;
  if (aValue == null && bValue != null) return 1;
  if (String(bValue) < String(aValue)) return -1;
  if (String(bValue) > String(aValue)) return 1;
  return 0;
}

function getComparator<T>(order: "asc" | "desc", orderBy: string) {
  return order === "desc"
    ? (a: T, b: T) => descendingComparator(a, b, orderBy)
    : (a: T, b: T) => -descendingComparator(a, b, orderBy);
}

function DefaultCell({ value }: { value: unknown }) {
  return (
    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.45 }}>
      {String(value ?? "")}
    </Typography>
  );
}

export function AppTable<T>({
  columns,
  rows,
  rowKey,
  toolbar,
  actions,
  loading = false,
  searchQuery,
  minWidth = 800,
  defaultOrderBy,
  rowsPerPageOptions = [5, 10, 25],
  showCheckbox = false,
  selected = [],
  onSelectRow,
  onSelectAllRows,
  embedded = false,
  hidePagination = false,
}: AppTableProps<T>) {
  const table = useTable({
    defaultOrderBy: defaultOrderBy || columns[0]?.id || "name",
    defaultRowsPerPage: rowsPerPageOptions[1] ?? rowsPerPageOptions[0] ?? 10,
  });

  const headLabel: TableHeadCellProps[] = columns.map((col) => ({
    id: col.sortable === false ? "" : col.id,
    label: col.label,
    align: col.align,
    width: col.width,
    minWidth: col.minWidth,
  }));

  const sortedRows = useMemo(() => {
    const comparator = getComparator<T>(table.order, table.orderBy);
    return [...rows].sort(comparator);
  }, [rows, table.order, table.orderBy]);

  const pagedRows = useMemo(() => {
    const start = table.page * table.rowsPerPage;
    return sortedRows.slice(start, start + table.rowsPerPage);
  }, [sortedRows, table.page, table.rowsPerPage]);

  const notFound = !loading && rows.length === 0;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allKeys = useMemo(
    () => rows.map((row, index) => rowKey(row, index)),
    [rows, rowKey]
  );

  return (
    <CommonTable
      toolbar={toolbar}
      actions={actions}
      headLabel={headLabel}
      order={table.order}
      orderBy={table.orderBy}
      onSort={table.onSort}
      rowCount={rows.length}
      numSelected={selected.length}
      showCheckbox={showCheckbox}
      onSelectAllRows={
        onSelectAllRows
          ? (checked) => {
              onSelectAllRows(checked);
              if (checked) table.onSelectAllRows(true, allKeys);
              else table.onSelectAllRows(false, []);
            }
          : undefined
      }
      loading={loading}
      notFound={notFound}
      searchQuery={searchQuery}
      page={table.page}
      count={rows.length}
      rowsPerPage={table.rowsPerPage}
      onPageChange={table.onChangePage}
      onRowsPerPageChange={table.onChangeRowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
      minWidth={minWidth}
      embedded={embedded}
      hidePagination={hidePagination}
    >
      {pagedRows.map((row, index) => {
        const absoluteIndex = table.page * table.rowsPerPage + index;
        const key = rowKey(row, absoluteIndex);
        const isSelected = selectedSet.has(key);

        return (
          <TableRow key={key} hover selected={isSelected}>
            {showCheckbox ? (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={isSelected}
                  onChange={() => onSelectRow?.(key)}
                  slotProps={{ input: { "aria-label": `Select row ${key}` } }}
                />
              </TableCell>
            ) : null}
            {columns.map((col) => (
              <TableCell key={col.id} align={col.align} sx={{ width: col.width, minWidth: col.minWidth }}>
                {col.render ? (
                  col.render(row, absoluteIndex)
                ) : (
                  <DefaultCell value={(row as Record<string, unknown>)[col.id]} />
                )}
              </TableCell>
            ))}
          </TableRow>
        );
      })}
    </CommonTable>
  );
}
