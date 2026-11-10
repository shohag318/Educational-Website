'use client';

import type { TableRowProps } from '@mui/material/TableRow';

import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type TableNoDataProps = TableRowProps & {
  searchQuery?: string;
  colSpan?: number;
};

export function TableNoData({ colSpan = 8, searchQuery: _searchQuery, ...other }: TableNoDataProps) {
  return (
    <TableRow {...other}>
      <TableCell align="center" colSpan={colSpan}>
        <Box
          sx={{
            py: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              color: 'text.disabled',
              bgcolor: 'action.hover',
            }}
          >
            <Iconify icon="solar:inbox-bold" width={32} />
          </Box>

          <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            No Data
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}
