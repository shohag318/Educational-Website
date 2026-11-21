"use client";

import type { ReactNode } from "react";
import { ModulePageShell } from "@/components/layout/module-page-shell";
import { StudentNavHeader } from "@/sections/student/component/student-nav-header";

interface StudentAdminPageShellProps {
  children: ReactNode;
}

export function StudentAdminPageShell({ children }: StudentAdminPageShellProps) {
  return <ModulePageShell nav={<StudentNavHeader />}>{children}</ModulePageShell>;
}
