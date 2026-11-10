'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { SearchIcon } from '@/components/iconify/mui-icons';
import { AppTextField } from '@/components/text-field/app-text-field';
import { AppTabs, type AppTabItem } from '@/components/ui/tabs-component';

// ----------------------------------------------------------------------

type TableToolbarProps = {
  filterName?: string;
  onFilterName?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  children?: ReactNode;
  showSearch?: boolean;
  tabs?: AppTabItem[];
  tabValue?: string;
  onTabChange?: (value: string) => void;
  filters?: ReactNode;
};

export function TableToolbar({
  filterName = '',
  onFilterName,
  placeholder = 'Search...',
  children,
  showSearch = true,
  tabs,
  tabValue,
  onTabChange,
  filters,
}: TableToolbarProps) {
  return (
    <Stack spacing={2} sx={{ width: 1 }}>
      {tabs?.length ? (
        <AppTabs value={tabValue} onValueChange={onTabChange} items={tabs} />
      ) : null}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        useFlexGap
        sx={{
          alignItems: { md: 'center' },
          flexWrap: 'wrap',
          width: 1,
          '& .MuiFormControl-root': {
            minWidth: { xs: '100%', sm: 160 },
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.25,
            bgcolor: 'common.white',
          },
        }}
      >
        {showSearch && onFilterName ? (
          <AppTextField
            size="small"
            value={filterName}
            onChange={onFilterName}
            placeholder={placeholder}
            startIcon={<SearchIcon fontSize="small" />}
            sx={{
              flex: { md: '1 1 280px' },
              minWidth: { xs: 1, md: 260 },
              maxWidth: { md: 420 },
            }}
          />
        ) : null}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            '& > *': { flex: { xs: '1 1 140px', md: '0 1 auto' } },
          }}
        >
          {filters}
          {children}
        </Box>
      </Stack>
    </Stack>
  );
}
