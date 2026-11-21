"use client";

import type { ReactNode } from "react";
import { ModulePageShell } from "@/components/layout/module-page-shell";
import { AccountantNavHeader } from "@/sections/accountant/component/accountant-nav-header";

export function AccountantPageShell({ children }: { children: ReactNode }) {
  return <ModulePageShell nav={<AccountantNavHeader />}>{children}</ModulePageShell>;
}
