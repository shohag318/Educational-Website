"use client";

import type { ReactNode } from "react";
import { ModulePageShell } from "@/components/layout/module-page-shell";
import { UserRoleNavHeader } from "@/sections/user-role/component/user-role-nav-header";

export function UserRolePageShell({ children }: { children: ReactNode }) {
  return <ModulePageShell nav={<UserRoleNavHeader />}>{children}</ModulePageShell>;
}
