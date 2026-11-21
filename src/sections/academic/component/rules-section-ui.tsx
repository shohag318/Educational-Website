"use client";

import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { ModuleContentStack } from "@/components/layout/module-page-shell";
import { ModulePanel } from "@/components/layout/module-panel";
import { ResultsFilterCard } from "@/sections/results/component/result-page-ui";
import { SPACING } from "@/theme/spacing";
import { THEME_PLATE } from "@/theme/plate";

/** Page content wrapper — stacks section cards with visible gaps (exam-config style). */
export function RulesAtmosphere({ children }: { children: ReactNode }) {
  return <ModuleContentStack>{children}</ModuleContentStack>;
}

export function RulesSection({
  title,
  subtitle,
  action,
  children,
  toolbar,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ModulePanel
      variant="section"
      title={title}
      subtitle={subtitle}
      action={action}
      toolbar={toolbar}
      padded={false}
    >
      {children}
    </ModulePanel>
  );
}

export function RulesFilterGrid({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: SPACING.section,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: `repeat(${columns}, minmax(0, 1fr))`,
        },
        alignItems: "start",
      }}
    >
      {children}
    </Box>
  );
}

export function RulesFormBlock({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        p: { xs: SPACING.section, sm: 2.25 },
        borderRadius: 2.5,
        border: 1,
        borderColor: "divider",
        bgcolor: "grey.50",
      }}
    >
      <Stack
        direction="row"
        spacing={SPACING.inline}
        sx={{ alignItems: "center", justifyContent: "space-between", mb: SPACING.section }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: THEME_PLATE.fonts.weights.bold,
            fontSize: "0.875rem",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

export function RulesListItem({
  title,
  meta,
  badges,
  actions,
}: {
  title: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Box
      sx={{
        p: SPACING.section,
        borderRadius: 2.5,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: "border-color 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          borderColor: "primary.light",
          boxShadow: THEME_PLATE.shadows.lg,
        },
      }}
    >
      <Stack
        direction="row"
        spacing={SPACING.stack}
        sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: THEME_PLATE.fonts.weights.bold,
              fontSize: "0.875rem",
              letterSpacing: "-0.01em",
              color: "text.primary",
            }}
          >
            {title}
          </Typography>
          {meta ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.6, fontSize: "0.78rem", lineHeight: 1.5 }}
            >
              {meta}
            </Typography>
          ) : null}
          {badges ? (
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", mt: 1.25 }}>
              {badges}
            </Stack>
          ) : null}
        </Box>
        {actions ? (
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

export { ResultsFilterCard };
