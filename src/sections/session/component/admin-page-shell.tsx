"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { SessionNavHeader } from "@/sections/session/component/session-nav-header";

interface AdminPageShellProps {
  children: ReactNode;
}

export function AdminPageShell({ children }: AdminPageShellProps) {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", width: 1, minWidth: 0, pb: { xs: 8, md: 4 } }}>
      <SessionNavHeader />
      {children}
    </Box>
  );
}
