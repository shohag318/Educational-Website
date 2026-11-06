"use client";

import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { AddCircleOutlineIcon, TuneIcon } from "@/components/iconify/mui-icons";
import { CustomBreadcrumbs, NoDataFound } from "@/components";
import { PATHS } from "@/config-global";
import { ResultNavHeader } from "@/sections/results/component/result-nav-header";

/** Shared frame for every Results & Exams page. */
export function ResultsPageShell({
  children,
  maxWidth = "xl",
}: {
  children: ReactNode;
  maxWidth?: "lg" | "xl" | false;
}) {
  return (
    <Container maxWidth={maxWidth} sx={{ py: { xs: 2, md: 3 }, pb: 10 }}>
      <Box className="no-print" sx={{ mb: 3 }}>
        <ResultNavHeader />
      </Box>
      <Stack spacing={2.5}>{children}</Stack>
    </Container>
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

/** White content surface. */
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
    <Paper
      elevation={0}
      className={className}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "background.paper",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        ...(padded ? { p: { xs: 2, sm: 2.5 } } : null),
        ...sx,
      }}
    >
      {children}
    </Paper>
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
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
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
            sx={{ height: 26, cursor: "pointer", fontWeight: 600 }}
          />
        ) : null}
      </Stack>
      <Box
        sx={{
          display: "grid",
          gap: 2,
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
        spacing={1.5}
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 2,
          alignItems: { sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
            {count !== undefined ? (
              <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>
                {" "}
                ({count})
              </Typography>
            ) : null}
          </Typography>
          {badge}
        </Stack>
        {action ? <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{action}</Box> : null}
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
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        height: 1,
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: "text.secondary" }}
      >
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.75, fontWeight: 800, color: `${color}.dark`, fontSize: { xs: 24, sm: 28 } }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}
