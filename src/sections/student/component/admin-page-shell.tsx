"use client";

import { Box, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { StudentNavHeader } from "@/sections/student/component/student-nav-header";

interface StudentAdminPageShellProps {
  children: ReactNode;
}

export function StudentAdminPageShell({ children }: StudentAdminPageShellProps) {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", width: 1, minWidth: 0, pb: { xs: 8, md: 4 } }}>
      <Box className="no-print" sx={{ mb: 2.5 }}>
        <StudentNavHeader />
      </Box>
      <Stack spacing={2.5} sx={{ width: 1 }}>
        {children}
      </Stack>
    </Box>
  );
}
