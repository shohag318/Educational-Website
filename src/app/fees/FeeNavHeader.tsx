"use client";

import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";

export function FeeNavHeader() {
  const navItems: ModuleNavItem[] = [
    {
      href: "/fees",
      label: "Fee Setup",
    },
    {
      href: "/fees/waiver",
      label: "Waivers & Scholarships",
    },
    {
      href: "/fees/absent-fine",
      label: "Absent Fines",
    },
    {
      href: "/fees/collection",
      label: "Fee Collection",
    },
  ];

  return <ModuleMenuBar moduleName="Fees" items={navItems} activeTheme="emerald" />;
}
