"use client";

import type { ReactNode } from "react";
import { Box, Divider, Paper, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import { RADIUS, SPACING, TYPE } from "@/theme/spacing";
import { THEME_PLATE } from "@/theme/plate";

export type ModulePanelProps = {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  toolbar?: ReactNode;
  /** When false, no inner padding (tables flush to edges). */
  padded?: boolean;
  /** filter = muted bg; section = gradient header strip; table = flush body; default = white card */
  variant?: "default" | "filter" | "section" | "table";
  className?: string;
  sx?: SxProps<Theme>;
};

/**
 * Shared content surface — replaces one-off AppCard / ResultsPanel / Tailwind white cards.
 */
export function ModulePanel({
  children,
  title,
  subtitle,
  action,
  toolbar,
  padded = true,
  variant = "default",
  className,
  sx,
}: ModulePanelProps) {
  const showHeader = title != null || action != null || subtitle != null;
  const isFilter = variant === "filter";
  const isSection = variant === "section";
  const isTable = variant === "table";
  const chrome = showHeader || Boolean(toolbar);

  return (
    <Paper
      elevation={0}
      className={className}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: `${RADIUS.panel}px`,
        overflow: "hidden",
        bgcolor: isFilter ? "grey.50" : "background.paper",
        boxShadow: THEME_PLATE.shadows.xs,
        fontFamily: THEME_PLATE.fonts.sans,
        ...(padded && !chrome && !isTable ? { p: { xs: SPACING.section, sm: SPACING.page } } : null),
        ...sx,
      }}
    >
      {showHeader ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={SPACING.stack}
          sx={{
            px: { xs: SPACING.section, sm: SPACING.page },
            py: SPACING.section,
            alignItems: { sm: isSection ? "flex-start" : "center" },
            justifyContent: "space-between",
            ...(isSection
              ? {
                  background:
                    "linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(255,255,255,1) 100%)",
                }
              : null),
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {title != null ? (
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: THEME_PLATE.fonts.weights.bold,
                  fontSize: TYPE.xl,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.35,
                  color: "text.primary",
                }}
              >
                {title}
              </Typography>
            ) : null}
            {subtitle != null ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: SPACING.tight, maxWidth: 640, lineHeight: 1.55 }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {action ? (
            <Box sx={{ display: "flex", gap: SPACING.inline, flexWrap: "wrap", flexShrink: 0 }}>
              {action}
            </Box>
          ) : null}
        </Stack>
      ) : null}

      {toolbar ? (
        <>
          {showHeader ? <Divider /> : null}
          <Box
            sx={{
              px: { xs: SPACING.section, sm: SPACING.page },
              py: SPACING.section,
              bgcolor: "grey.50",
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiFormControl-root": {
                width: "100%",
                bgcolor: "background.paper",
                borderRadius: 1,
              },
            }}
          >
            {toolbar}
          </Box>
        </>
      ) : showHeader && (isSection || isTable) ? (
        <Divider />
      ) : null}

      {isSection ? (
        <Box
          sx={{
            px: { xs: SPACING.section, sm: SPACING.page },
            py: { xs: SPACING.section, sm: SPACING.page },
            bgcolor: "grey.50",
            "& > .MuiStack-root": { gap: SPACING.stack },
          }}
        >
          {children}
        </Box>
      ) : isTable ? (
        children
      ) : chrome && padded ? (
        <Box sx={{ p: { xs: SPACING.section, sm: SPACING.page } }}>{children}</Box>
      ) : (
        children
      )}
    </Paper>
  );
}
