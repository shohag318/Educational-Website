"use client";

import type { ReactNode } from "react";
import { ModulePageShell } from "@/components/layout/module-page-shell";
import { SessionNavHeader } from "@/sections/session/component/session-nav-header";

interface AdminPageShellProps {
  children: ReactNode;
}

export function AdminPageShell({ children }: AdminPageShellProps) {
  return <ModulePageShell nav={<SessionNavHeader />}>{children}</ModulePageShell>;
}
