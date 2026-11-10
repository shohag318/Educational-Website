"use client";

import type { ReactNode } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import {
  ResultsPanel,
  ResultsFilterCard,
} from "@/sections/results/component/result-page-ui";

/** Page content wrapper — stacks section cards with visible gaps (exam-config style). */
export function RulesAtmosphere({ children }: { children: ReactNode }) {
  return (
    <Stack spacing={2.5} sx={{ width: 1 }}>
      {children}
    </Stack>
  );
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
    <ResultsPanel padded={false}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          px: { xs: 2.25, sm: 2.75 },
          py: 2.25,
          alignItems: { sm: "flex-start" },
          justifyContent: "space-between",
          background:
            "linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(255,255,255,1) 100%)",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1rem", sm: "1.0625rem" },
              letterSpacing: "-0.01em",
              color: "text.primary",
              lineHeight: 1.35,
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.6,
                maxWidth: 640,
                fontSize: "0.8125rem",
                lineHeight: 1.55,
                fontWeight: 400,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action ? (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", flexShrink: 0 }}>{action}</Box>
        ) : null}
      </Stack>

      {toolbar ? (
        <>
          <Divider />
          <Box
            sx={{
              px: { xs: 2.25, sm: 2.75 },
              py: 2,
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
      ) : (
        <Divider />
      )}

      <Box
        sx={{
          px: { xs: 2.25, sm: 2.75 },
          py: { xs: 2.25, sm: 2.75 },
          bgcolor: "grey.50",
          // Nested white/list cards get a clear gap against this soft canvas
          "& > .MuiStack-root": { gap: 1.5 },
        }}
      >
        {children}
      </Box>
    </ResultsPanel>
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
        gap: 2,
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
        p: { xs: 2, sm: 2.25 },
        borderRadius: 2.5,
        border: 1,
        borderColor: "divider",
        bgcolor: "grey.50",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "-0.01em" }}
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
        p: 2,
        borderRadius: 2.5,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: "border-color 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          borderColor: "primary.light",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
        },
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "-0.01em", color: "text.primary" }}
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
