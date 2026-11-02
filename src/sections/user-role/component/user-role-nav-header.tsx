"use client";

import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";

export function UserRoleNavHeader() {
  const navItems: ModuleNavItem[] = [
    {
      href: "/user-role/roles",
      label: "Roles & Permissions",
    },
    {
      href: "/user-role",
      aliases: ["/settings/user-role"],
      label: "User Accounts",
    },
    {
      href: "/user-role/delegation",
      label: "Teacher Access",
    },
    {
      href: "/user-role/audit-logs",
      label: "Audit Logs",
    },
  ];

  return <ModuleMenuBar moduleName="User Roles" items={navItems} activeTheme="purple" />;
}
