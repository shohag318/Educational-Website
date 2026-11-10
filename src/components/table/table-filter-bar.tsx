"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { SearchIcon } from "@/components/iconify/mui-icons";
import { AppTextField } from "@/components/text-field/app-text-field";
import { AppTabs, type AppTabItem } from "@/components/ui/tabs-component";

export type TableFilterBarProps = {
  /** Extra filters in the same row as search (selects, date pickers, chips). */
  filters?: ReactNode;
  /** Optional segmented tabs above the filter row. */
  tabs?: AppTabItem[];
  tabValue?: string;
  onTabChange?: (value: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  selectionBar?: ReactNode;
  endAdornment?: ReactNode;
  children?: ReactNode;
};

/**
 * Screenshot-style chrome: wide search + compact filters in one row.
 */
export function TableFilterBar({
  filters,
  tabs,
  tabValue,
  onTabChange,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  selectionBar,
  endAdornment,
  children,
}: TableFilterBarProps) {
  return (
    <Stack spacing={2}>
      {tabs?.length ? (
        <AppTabs value={tabValue} onValueChange={onTabChange} items={tabs} />
      ) : null}

      {(showSearch && onSearchChange) || filters || endAdornment ? (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          useFlexGap
          sx={{
            alignItems: { md: "center" },
            flexWrap: "wrap",
            "& .MuiFormControl-root": {
              minWidth: { xs: "100%", sm: 160 },
            },
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.25,
              bgcolor: "common.white",
            },
          }}
        >
          {showSearch && onSearchChange ? (
            <AppTextField
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              startIcon={<SearchIcon fontSize="small" />}
              sx={{
                flex: { md: "1 1 280px" },
                minWidth: { xs: 1, md: 260 },
                maxWidth: { md: 420 },
              }}
            />
          ) : null}

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
              flex: 1,
              minWidth: 0,
              justifyContent: { xs: "stretch", md: "flex-start" },
              "& > *": { flex: { xs: "1 1 140px", md: "0 1 auto" } },
            }}
          >
            {filters}
            {endAdornment}
          </Box>
        </Stack>
      ) : null}

      {selectionBar}

      {children}
    </Stack>
  );
}
