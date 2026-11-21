"use client";

import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { AddCircleOutlineIcon, TuneIcon } from "@/components/iconify/mui-icons";
import { CustomBreadcrumbs, NoDataFound } from "@/components";
import { ModulePageShell } from "@/components/layout/module-page-shell";
import { ModulePanel } from "@/components/layout/module-panel";
import { PATHS } from "@/config-global";
import { ResultNavHeader } from "@/sections/results/component/result-nav-header";
import { RADIUS, SPACING } from "@/theme/spacing";
import { THEME_PLATE } from "@/theme/plate";

/** Shared frame for every Results & Exams page. */
export function ResultsPageShell({
  children,
  maxWidth,
}: {
  children: ReactNode;
  /** Kept for call-site compatibility; plate uses a single max width. */
  maxWidth?: "lg" | "xl" | false;
}) {
  return (
    <ModulePageShell
      nav={<ResultNavHeader />}
      maxWidth={maxWidth === false ? false : THEME_PLATE.layout.pageMaxWidth}
    >
      {children}
    </ModulePageShell>
  );
}

/** Simple heading + breadcrumbs (same pattern as session/create). */
export function ResultsPageHeader({
  heading,
  current,
  action,
}: {
  heading: string;
  /** Breadcrumb leaf label — defaults to heading */
  current?: string;
  action?: ReactNode;
}) {
  return (
    <Box className="no-print">
      <CustomBreadcrumbs
        heading={heading}
        links={[
          { name: "Overview", href: PATHS.root, icon: <AddCircleOutlineIcon sx={{ fontSize: 16 }} /> },
          { name: "Results & Exams", href: PATHS.academic.rules },
          { name: current || heading },
        ]}
        action={action}
      />
    </Box>
  );
}

/** White content surface — thin wrapper over ModulePanel. */
export function ResultsPanel({
  children,
  sx,
  padded = true,
  className,
}: {
  children: ReactNode;
  sx?: object;
  padded?: boolean;
  className?: string;
}) {
  return (
    <ModulePanel padded={padded} className={className} sx={sx}>
      {children}
    </ModulePanel>
  );
}

/** Filter / controls card — children should be MUI fields (AppSelect, SessionSelect, AppTextField). */
export function ResultsFilterCard({
  title = "Filters",
  active = false,
  onReset,
  children,
  resetLabel = "Reset",
  columns = 4,
}: {
  title?: string;
  active?: boolean;
  onReset?: () => void;
  children: ReactNode;
  resetLabel?: string;
  columns?: 3 | 4 | 5 | 6 | 7;
}) {
  return (
    <ResultsPanel className="no-print" sx={{ bgcolor: "grey.50" }}>
      <Stack
        direction="row"
        spacing={SPACING.inline}
        sx={{ alignItems: "center", justifyContent: "space-between", mb: SPACING.section }}
      >
        <Stack direction="row" spacing={SPACING.inline} sx={{ alignItems: "center", minWidth: 0 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: `${RADIUS.chip}px`,
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.lighter",
              color: "primary.dark",
              flexShrink: 0,
            }}
          >
            <TuneIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {active ? (
            <Chip size="small" color="primary" label="Filtered" sx={{ height: 22, fontWeight: 700 }} />
          ) : null}
        </Stack>
        {active && onReset ? (
          <Chip
            size="small"
            variant="outlined"
            label={resetLabel}
            onClick={onReset}
            sx={{ height: 26, cursor: "pointer", fontWeight: 500 }}
          />
        ) : null}
      </Stack>
      <Box
        sx={{
          display: "grid",
          gap: SPACING.section,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: `repeat(${Math.min(columns, 3)}, minmax(0, 1fr))`,
            lg: `repeat(${Math.min(columns, 4)}, minmax(0, 1fr))`,
          },
          alignItems: "start",
          "& .MuiFormControl-root": { width: "100%", bgcolor: "background.paper", borderRadius: 1 },
        }}
      >
        {children}
      </Box>
    </ResultsPanel>
  );
}

/** Table / list card with consistent toolbar. */
export function ResultsTableCard({
  title,
  count,
  badge,
  action,
  children,
}: {
  title: string;
  count?: number | string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ResultsPanel padded={false}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={SPACING.stack}
        sx={{
          px: { xs: SPACING.section, sm: SPACING.page },
          py: SPACING.section,
          alignItems: { sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={SPACING.inline} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
            {count !== undefined ? (
              <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                {" "}
                ({count})
              </Typography>
            ) : null}
          </Typography>
          {badge}
        </Stack>
        {action ? <Box sx={{ display: "flex", gap: SPACING.inline, flexWrap: "wrap" }}>{action}</Box> : null}
      </Stack>
      <Divider />
      {children}
    </ResultsPanel>
  );
}

export function ResultsSectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      sx={{
        alignItems: { sm: "center" },
        justifyContent: "space-between",
        mb: 2,
        pb: 1.5,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  );
}

export function ResultsEmpty({
  title,
  description,
  icon,
}: {
  /** Ignored for UI consistency — always shows shared No Data Found. */
  title?: string;
  description?: string;
  icon?: string;
}) {
  void title;
  void description;
  return <NoDataFound icon={icon} />;
}

export function ResultsNotice({
  children,
  severity = "info",
}: {
  children: ReactNode;
  severity?: "info" | "success" | "warning" | "error";
}) {
  return (
    <Alert severity={severity} variant="outlined" sx={{ borderRadius: 2 }} className="no-print">
      {children}
    </Alert>
  );
}

export function ResultsStat({
  label,
  value,
  hint,
  color = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  color?: "primary" | "success" | "warning" | "error" | "info" | "secondary";
}) {
  return (
    <ModulePanel sx={{ height: 1, p: 2.25 }} padded={false}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: THEME_PLATE.fonts.weights.bold,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          mt: 0.75,
          fontWeight: THEME_PLATE.fonts.weights.bold,
          color: `${color}.dark`,
          fontSize: { xs: 24, sm: 28 },
        }}
      >
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
    </ModulePanel>
  );
}
