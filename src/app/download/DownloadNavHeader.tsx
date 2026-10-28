"use client";

import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";

export function DownloadNavHeader() {
  const navItems: ModuleNavItem[] = [
    {
      href: "/download",
      label: "Download Center",
    },
    {
      href: "/download/banbeis",
      label: "BANBEIS Census",
    },
    {
      href: "/download/admission-form",
      label: "Admission Form",
    },
    {
      href: "/download/academic-calendar",
      label: "Academic Calendar",
    },
    {
      href: "/setup/student-info",
      label: "Student Register",
    },
    {
      href: "/student/id-cards",
      label: "ID Cards",
    },
    {
      href: "/student/transcript",
      label: "Transcripts",
    },
    {
      href: "/student/seat-plan",
      label: "Seat Plan",
    },
  ];

  return <ModuleMenuBar moduleName="Downloads" items={navItems} activeTheme="amber" />;
}
