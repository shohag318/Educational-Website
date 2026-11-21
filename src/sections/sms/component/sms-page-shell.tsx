"use client";

import type { ReactNode } from "react";
import { ModulePageShell } from "@/components/layout/module-page-shell";
import { SmsNavHeader } from "@/sections/sms/component/sms-nav-header";

export function SmsPageShell({ children }: { children: ReactNode }) {
  return <ModulePageShell nav={<SmsNavHeader />}>{children}</ModulePageShell>;
}
