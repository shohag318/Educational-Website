"use client";

import React from "react";
import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";

export function AssetNavHeader() {
  const navItems: ModuleNavItem[] = [
    {
      href: "/assets",
      label: "Asset Register",
    },
    {
      href: "/assets/categories",
      label: "Rooms & Locations",
    },
    {
      href: "/assets/maintenance",
      label: "Maintenance",
    },
    {
      href: "/assets/depreciation",
      label: "Depreciation",
    },
  ];

  return <ModuleMenuBar moduleName="Assets" items={navItems} activeTheme="blue" />;
}
