"use client";

import { TableCell, TableRow } from "@mui/material";
import { NoDataFound } from "@/components/table/no-data-found";

interface TableNoDataProps {
  colSpan: number;
  icon?: string;
}

export function TableNoData({ colSpan, icon }: TableNoDataProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ border: 0, p: 0, bgcolor: "transparent" }}>
        <NoDataFound icon={icon} />
      </TableCell>
    </TableRow>
  );
}
