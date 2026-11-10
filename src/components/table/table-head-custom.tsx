'use client';

import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';

import { visuallyHidden } from './utils';

import type { TableOrder, TableHeadCellProps } from './types';

// ----------------------------------------------------------------------

type TableHeadCustomProps = {
  orderBy: string;
  rowCount: number;
  numSelected?: number;
  order: TableOrder;
  onSort: (id: string) => void;
  headLabel: TableHeadCellProps[];
  onSelectAllRows?: (checked: boolean) => void;
  showCheckbox?: boolean;
};

export function TableHeadCustom({
  order,
  onSort,
  orderBy,
  rowCount,
  headLabel,
  numSelected = 0,
  onSelectAllRows,
  showCheckbox = false,
}: TableHeadCustomProps) {
  return (
    <TableHead>
      <TableRow>
        {showCheckbox && onSelectAllRows && (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onSelectAllRows(event.target.checked)
              }
            />
          </TableCell>
        )}

        {headLabel.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align || 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ width: headCell.width, minWidth: headCell.minWidth }}
          >
            {headCell.id ? (
              <TableSortLabel
                hideSortIcon
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={() => onSort(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box sx={{ ...visuallyHidden }}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
