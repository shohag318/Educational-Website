"use client";

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

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
  emptyText?: string;
  maxHeight?: number | string;
}

export function AppTable<T>({
  columns,
  rows,
  rowKey,
  emptyText = "No records found",
  maxHeight = 640,
}: AppTableProps<T>) {
  return (
    <TableContainer component={Paper} sx={{ maxHeight, borderRadius: 2 }}>
      <Table stickyHeader size="small">
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
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyText}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={rowKey(row, index)} hover>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align}>
                    {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.id] ?? "")}
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
