"use client";

import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";

export function SessionNavHeader() {
  const navItems: ModuleNavItem[] = [
    {
      href: "/setup/classes",
      label: "Classes & Sections",
    },
    {
      href: "/setup/subject-mapping",
      label: "Subject Mapping",
    },
    {
      href: "/session/create",
      label: "Create Session",
    },
    {
      href: "/session",
      label: "Session Manager",
    },
  ];

  return <ModuleMenuBar moduleName="Sessions" items={navItems} activeTheme="emerald" />;
}
