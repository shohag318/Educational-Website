"use client";

import type { ReactNode } from "react";
import { AddCircleOutlineIcon } from "@/components/iconify/mui-icons";
import { CustomBreadcrumbs } from "@/components";
import { PATHS } from "@/config-global";

interface SessionPageHeaderProps {
  heading: string;
  current: string;
  action?: ReactNode;
}

export function SessionPageHeader({ heading, current, action }: SessionPageHeaderProps) {
  return (
    <CustomBreadcrumbs
      heading={heading}
      links={[
        { name: "Overview", href: PATHS.root, icon: <AddCircleOutlineIcon sx={{ fontSize: 16 }} /> },
        { name: "Sessions", href: PATHS.session.manager },
        { name: current },
      ]}
      action={action}
    />
  );
}
