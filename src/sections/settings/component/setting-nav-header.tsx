"use client";

import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";

export function SettingNavHeader() {
  const navItems: ModuleNavItem[] = [
    {
      href: "/settings",
      aliases: ["/settings"],
      label: "Institution Profile",
    },
    {
      href: "/settings/staff",
      aliases: ["/settings/staff", "/settings/teachers"],
      label: "Teachers & Staff",
    },
    {
      href: "/settings/signatures",
      aliases: ["/settings/signatures", "/settings/signature-setup"],
      label: "Signatures",
    },
    {
      href: "/user-role",
      aliases: [
        "/user-role",
        "/user-role/roles",
        "/user-role/delegation",
        "/user-role/audit-logs",
        "/settings/user-role",
      ],
      label: "User Roles",
    },
  ];

  return <ModuleMenuBar moduleName="Settings" items={navItems} activeTheme="cyan" />;
}
