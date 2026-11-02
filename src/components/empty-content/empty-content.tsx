"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface EmptyContentProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyContent({ title = "Nothing here", description, action }: EmptyContentProps) {
  return (
    <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
      <Typography variant="subtitle1">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
