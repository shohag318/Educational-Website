"use client";

import { Box, BoxProps } from "@mui/material";
import { forwardRef } from "react";

export const Scrollbar = forwardRef<HTMLDivElement, BoxProps>(function Scrollbar({ children, sx, ...other }, ref) {
  return (
    <Box
      ref={ref}
      sx={{
        overflow: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(148, 163, 184, 0.8) transparent",
        "&::-webkit-scrollbar": { width: 8, height: 8 },
        "&::-webkit-scrollbar-thumb": {
          borderRadius: 8,
          backgroundColor: "rgba(148, 163, 184, 0.8)",
        },
        "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
});
