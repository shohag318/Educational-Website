'use client';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from './table-no-data';
import { TableHeadCustom } from './table-head-custom';

import type { TableOrder, TableHeadCellProps } from './types';

// ----------------------------------------------------------------------

export type CommonTableProps = {
  toolbar?: React.ReactNode;
  actions?: React.ReactNode;
  headLabel: TableHeadCellProps[];
  order: TableOrder;
  orderBy: string;
  onSort: (id: string) => void;
  rowCount: number;
  numSelected?: number;
  onSelectAllRows?: (checked: boolean) => void;
  showCheckbox?: boolean;
  loading?: boolean;
  notFound?: boolean;
  searchQuery?: string;
  children: React.ReactNode;
  page: number;
  count: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
  minWidth?: number;
  /** When true, skip outer Card — use inside an existing AppCard shell. */
  embedded?: boolean;
  /** Hide pagination footer. */
  hidePagination?: boolean;
};

export function CommonTable({
  toolbar,
  actions,
  headLabel,
  order,
  orderBy,
  onSort,
  rowCount,
  numSelected = 0,
  onSelectAllRows,
  showCheckbox = false,
  loading = false,
  notFound = false,
  searchQuery,
  children,
  page,
  count,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25],
  minWidth = 800,
  embedded = false,
  hidePagination = false,
}: CommonTableProps) {
  const colSpan = headLabel.length + (showCheckbox ? 1 : 0);

  const tableNode = (
    <>
      <Scrollbar>
        <TableContainer
          sx={{
            overflow: 'unset',
            borderRadius: 0,
            border: 0,
            boxShadow: 'none',
            bgcolor: 'background.paper',
          }}
        >
            <Table
              size="medium"
              sx={(theme) => {
                const greyChannel =
                  ((theme as { vars?: { palette: { grey: Record<string, string> } } }).vars?.palette
                    .grey?.['500Channel'] as string | undefined) || '100 116 139';

                return {
                  minWidth,
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  '& .MuiTableCell-root': {
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: 'text.primary',
                    py: 2,
                    px: 2,
                    verticalAlign: 'middle',
                    borderBottom: `1px solid ${varAlpha(greyChannel, 0.12)}`,
                  },
                  '& .MuiTableHead-root': {
                    bgcolor: 'grey.100',
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    color: 'text.primary',
                    fontWeight: 700,
                    fontSize: 13,
                    lineHeight: 1.4,
                    letterSpacing: '-0.01em',
                    bgcolor: 'grey.100',
                    whiteSpace: 'nowrap',
                    borderBottom: `1px solid ${varAlpha(greyChannel, 0.16)}`,
                    borderRadius: 0,
                    py: 1.75,
                  },
                  '& .MuiTableHead-root .MuiTableSortLabel-root': {
                    color: 'inherit',
                    fontWeight: 700,
                    '&:hover': { color: 'text.primary' },
                    '&.Mui-active': { color: 'text.primary' },
                  },
                  '& .MuiTableBody-root': {
                    bgcolor: 'background.paper',
                  },
                  '& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root': {
                    borderBottom: 0,
                  },
                  '& .MuiTableBody-root .MuiTypography-subtitle2, & .MuiTableBody-root .MuiTypography-body2':
                    {
                      fontSize: 13.5,
                      fontWeight: 700,
                      lineHeight: 1.45,
                      color: 'text.primary',
                    },
                  '& .MuiTableBody-root .MuiTypography-caption': {
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: 'text.secondary',
                  },
                };
              }}
            >
            <TableHeadCustom
              order={order}
              orderBy={orderBy}
              rowCount={rowCount}
              numSelected={numSelected}
              onSort={onSort}
              onSelectAllRows={onSelectAllRows}
              showCheckbox={showCheckbox}
              headLabel={headLabel}
            />

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              )}

              {!loading && children}

              {!loading && notFound && (
                <TableNoData searchQuery={searchQuery} colSpan={colSpan} />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      {!hidePagination ? (
        <TablePagination
          component="div"
          page={page}
          count={count}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          rowsPerPageOptions={rowsPerPageOptions}
          onRowsPerPageChange={onRowsPerPageChange}
          sx={{
            px: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '& .MuiTablePagination-toolbar': {
              minHeight: 56,
              px: 0,
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: 13,
              fontWeight: 500,
              color: 'text.secondary',
              m: 0,
            },
            '& .MuiTablePagination-select': {
              fontSize: 13,
              fontWeight: 600,
            },
          }}
        />
      ) : null}
    </>
  );

  return (
    <Box>
      {(toolbar || actions) && (
        <Box
          sx={{
            mb: 2,
            gap: 1.5,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: actions ? 'space-between' : 'flex-start',
            bgcolor: 'transparent',
          }}
        >
          {toolbar && <Box sx={{ flex: '1 1 auto', minWidth: 0, width: 1 }}>{toolbar}</Box>}
          {actions}
        </Box>
      )}

      {embedded ? (
        <Box
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {tableNode}
        </Box>
      ) : (
        <Card
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
          }}
        >
          {tableNode}
        </Card>
      )}
    </Box>
  );
}
