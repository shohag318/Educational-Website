"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, subtitle, action, icon }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 3 }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.lighter",
              color: "primary.dark",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h5" sx={{ fontSize: { xs: 20, sm: 24 }, lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {action && (
        <Box
          sx={{
            width: { xs: 1, sm: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", sm: "flex-end" },
            "& > *": { width: { xs: 1, sm: "auto" } },
          }}
        >
          {action}
        </Box>
      )}
    </Stack>
  );
}
