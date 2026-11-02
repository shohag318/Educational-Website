"use client";

import type { ReactNode } from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { CustomBreadcrumbs } from "@/components";
import { PATHS } from "@/config-global";

interface StudentPageHeaderProps {
  heading: string;
  current: string;
  action?: ReactNode;
}

export function StudentPageHeader({ heading, current, action }: StudentPageHeaderProps) {
  return (
    <CustomBreadcrumbs
      heading={heading}
      links={[
        { name: "Overview", href: PATHS.root, icon: <AddCircleOutlineIcon sx={{ fontSize: 16 }} /> },
        { name: "Students", href: PATHS.setup.students },
        { name: current },
      ]}
      action={action}
    />
  );
}
