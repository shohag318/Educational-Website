"use client";

import type { ReactNode } from "react";
import { ModulePageShell } from "@/components/layout/module-page-shell";
import { AssetNavHeader } from "@/sections/assets/component/asset-nav-header";

export function AssetsPageShell({ children }: { children: ReactNode }) {
  return <ModulePageShell nav={<AssetNavHeader />}>{children}</ModulePageShell>;
}
