"use client";

import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";

export function ResultNavHeader() {
  const navItems: ModuleNavItem[] = [
    {
      href: "/academic/rules",
      label: "Grading Rules",
    },
    {
      href: "/setup/exams",
      label: "Exam Configuration",
    },
    {
      href: "/setup/exam-routine",
      label: "Exam Routine",
    },
    {
      href: "/marks/entry",
      aliases: ["/marks/entry", "/marks/audit"],
      label: "Mark Entry",
    },
    {
      href: "/results/review",
      label: "Process & Review",
    },
    {
      href: "/results/publish",
      label: "Publish Results",
    },
    {
      href: "/reports/tabulation",
      label: "Tabulation Sheet",
    },
    {
      href: "/reports/at-a-glance",
      label: "At a Glance",
    },
    {
      href: "/reports/marksheet",
      label: "Report Cards",
    },
    {
      href: "/reports/fail-list",
      label: "Failed Students",
    },
  ];

  return <ModuleMenuBar moduleName="Results" items={navItems} activeTheme="emerald" />;
}
