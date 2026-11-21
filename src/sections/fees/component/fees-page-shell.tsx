"use client";

import type { ReactNode } from "react";
import { ModulePageShell } from "@/components/layout/module-page-shell";
import { FeeNavHeader } from "@/sections/fees/component/fee-nav-header";

export function FeesPageShell({ children }: { children: ReactNode }) {
  return <ModulePageShell nav={<FeeNavHeader />}>{children}</ModulePageShell>;
}
