"use client";

import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
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
    <Container maxWidth={maxWidth} sx={{ py: { xs: 2, md: 2.5 }, pb: 8 }}>
      <Box className="no-print" sx={{ mb: 2.5 }}>
        <ResultNavHeader />
      </Box>
      <Stack spacing={2.5}>{children}</Stack>
    </Container>
  );
}

/** Minimal page title row — easy to scan. */
export function ResultsPageHeader({
  title,
  subtitle,
  icon,
  action,
  stepHint,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Optional workflow hint, e.g. "Step 3 of 4" */
  stepHint?: string;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}
      className="no-print"
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", minWidth: 0 }}>
        {icon ? (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.lighter",
              color: "primary.dark",
              flexShrink: 0,
              "& svg": { width: 20, height: 20 },
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Box sx={{ minWidth: 0 }}>
          {stepHint ? (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.25,
                fontWeight: 700,
                letterSpacing: 0.4,
                textTransform: "uppercase",
                color: "primary.main",
              }}
            >
              {stepHint}
            </Typography>
          ) : null}
          <Typography variant="h5" sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 700, lineHeight: 1.25 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 640 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      {action ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            width: { xs: 1, sm: "auto" },
            justifyContent: { xs: "stretch", sm: "flex-end" },
            "& > *": { flexShrink: 0 },
          }}
        >
          {action}
        </Box>
      ) : null}
    </Stack>
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
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
        ...(padded ? { p: { xs: 2, sm: 2.5 } } : null),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

/** Filter / controls card with clear title. */
export function ResultsFilterCard({
  title = "Filters",
  active = false,
  onReset,
  children,
  resetLabel = "Reset filters",
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
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
            {title}
          </Typography>
          {active ? <Chip size="small" color="primary" label="Active" sx={{ height: 22, fontWeight: 700 }} /> : null}
        </Stack>
        {active && onReset ? (
          <Chip
            size="small"
            variant="outlined"
            label={resetLabel}
            onClick={onReset}
            sx={{ height: 24, cursor: "pointer", fontWeight: 600 }}
          />
        ) : null}
      </Stack>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: `repeat(${Math.min(columns, 3)}, minmax(0, 1fr))`,
            lg: `repeat(${columns}, minmax(0, 1fr))`,
          },
          "& label": { display: "block", mb: 0.75, fontSize: 12, fontWeight: 600, color: "text.secondary" },
          "& select, & .MuiInputBase-root": {
            width: "100%",
            bgcolor: "background.paper",
          },
          "& select": {
            p: 1.25,
            borderRadius: 1.5,
            border: 1,
            borderColor: "divider",
            fontSize: 13,
            fontWeight: 500,
            color: "text.primary",
            outline: "none",
          },
        }}
      >
        {children}
      </Box>
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
  title = "No data found",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Box sx={{ py: 6, px: 2, textAlign: "center" }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
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
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        height: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: "text.secondary" }}
      >
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: `${color}.dark` }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}
