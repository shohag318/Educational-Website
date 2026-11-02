"use client";

import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";

export function StudentNavHeader() {
  const navItems: ModuleNavItem[] = [
    {
      href: "/setup/students",
      label: "Enrollment",
    },
    {
      href: "/academic/subject-mapping",
      label: "Subject Allocation",
    },
    {
      href: "/student/profile",
      label: "Student Profiles",
    },
    {
      href: "/student/attendance",
      label: "Attendance",
    },
    {
      href: "/student/status",
      label: "Student Status",
    },
  ];

  return <ModuleMenuBar moduleName="Students" items={navItems} activeTheme="emerald" />;
}
