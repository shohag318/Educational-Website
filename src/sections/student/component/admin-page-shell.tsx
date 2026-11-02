"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { StudentNavHeader } from "@/sections/student/component/student-nav-header";

interface StudentAdminPageShellProps {
  children: ReactNode;
}

export function StudentAdminPageShell({ children }: StudentAdminPageShellProps) {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", width: 1, minWidth: 0, pb: { xs: 8, md: 4 } }}>
      <StudentNavHeader />
      {children}
    </Box>
  );
}
