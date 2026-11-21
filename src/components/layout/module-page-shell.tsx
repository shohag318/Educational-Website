"use client";

import type { ReactNode } from "react";
import { Box, Stack, type SxProps, type Theme } from "@mui/material";
import { THEME_PLATE } from "@/theme/plate";
import { SPACING } from "@/theme/spacing";

export type ModulePageShellProps = {
  children: ReactNode;
  /** Module tab bar (SessionNavHeader, ResultNavHeader, …). */
  nav?: ReactNode;
  /** Optional breadcrumb / page header above content stack. */
  header?: ReactNode;
  hideNav?: boolean;
  /** Content max width — defaults to theme plate layout.pageMaxWidth (1280). */
  maxWidth?: number | false;
  className?: string;
  sx?: SxProps<Theme>;
};

/**
 * Common page layout for every module:
 * [nav] → [optional header] → stacked section cards with SPACING.page gaps.
 */
export function ModulePageShell({
  children,
  nav,
  header,
  hideNav = false,
  maxWidth = THEME_PLATE.layout.pageMaxWidth,
  className,
  sx,
}: ModulePageShellProps) {
  return (
    <Box
      className={className}
      sx={{
        maxWidth: maxWidth === false ? "none" : maxWidth,
        mx: "auto",
        width: 1,
        minWidth: 0,
        pb: THEME_PLATE.layout.pagePb,
        fontFamily: THEME_PLATE.fonts.sans,
        ...sx,
      }}
    >
      {!hideNav && nav ? (
        <Box className="no-print" sx={{ mb: SPACING.page }}>
          {nav}
        </Box>
      ) : null}

      {header ? <Box className="no-print">{header}</Box> : null}

      <Stack spacing={SPACING.page} useFlexGap sx={{ width: 1 }}>
        {children}
      </Stack>
    </Box>
  );
}

/** Content-only stack (same gap as ModulePageShell) when nav lives elsewhere. */
export function ModuleContentStack({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Stack spacing={SPACING.page} useFlexGap sx={{ width: 1, ...sx }}>
      {children}
    </Stack>
  );
}
