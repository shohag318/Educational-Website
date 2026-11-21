"use client";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { ModulePanel } from "@/components/layout/module-panel";

interface AppCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}

/** Shared card — delegates to ModulePanel so padding/radius match the theme plate. */
export function AppCard({ title, action, children, sx, className }: AppCardProps) {
  return (
    <ModulePanel title={title} action={action} className={className} sx={sx}>
      {children}
    </ModulePanel>
  );
}
