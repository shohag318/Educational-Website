"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import type { ReactNode } from "react";
import { TableNoData } from "@/components/table/table-no-data";

export interface AppTableColumn<T> {
  id: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: number | string;
  render?: (row: T, index: number) => ReactNode;
}

interface AppTableProps<T> {
  columns: AppTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyIcon?: string;
  maxHeight?: number | string;
}

export function AppTable<T>({
  columns,
  rows,
  rowKey,
  emptyIcon,
  maxHeight = 640,
}: AppTableProps<T>) {
  return (
    <TableContainer sx={{ maxHeight }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.id} align={col.align} sx={{ width: col.width }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableNoData colSpan={columns.length} icon={emptyIcon} />
          ) : (
            rows.map((row, index) => (
              <TableRow key={rowKey(row, index)} hover>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align}>
                    {col.render
                      ? col.render(row, index)
                      : String((row as Record<string, unknown>)[col.id] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
