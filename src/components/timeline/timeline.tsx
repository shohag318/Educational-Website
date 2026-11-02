"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

export interface TimelineItemData {
  title: string;
  description?: string;
  time?: string;
  color?: "primary" | "info" | "success" | "warning" | "error";
  icon?: ReactNode;
}

interface TimelineProps {
  items: TimelineItemData[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <Stack spacing={0}>
      {items.map((item, index) => (
        <Stack key={`${item.title}-${index}`} direction="row" spacing={2}>
          <Stack sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: `${item.color || "primary"}.main`,
                mt: 0.5,
              }}
            />
            {index < items.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: "divider", my: 0.5 }} />}
          </Stack>
          <Box sx={{ pb: 3 }}>
            <Typography variant="subtitle2">{item.title}</Typography>
            {item.time && (
              <Typography variant="caption" color="text.secondary">
                {item.time}
              </Typography>
            )}
            {item.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {item.description}
              </Typography>
            )}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
