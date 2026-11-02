"use client";

import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";

export function AccountantNavHeader() {
  const navItems: ModuleNavItem[] = [
    {
      href: "/accountant",
      label: "Overview & Ledger",
    },
    {
      href: "/accountant/income",
      label: "Income",
    },
    {
      href: "/accountant/expense",
      label: "Expenses",
    },
    {
      href: "/accountant/payroll",
      label: "Payroll",
    },
    {
      href: "/accountant/audit",
      label: "Trial Balance",
    },
  ];

  return <ModuleMenuBar moduleName="Accounts & Finance" items={navItems} activeTheme="emerald" />;
}
