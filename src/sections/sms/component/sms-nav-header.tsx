"use client";

import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";

export function SmsNavHeader() {
  const navItems: ModuleNavItem[] = [
    {
      href: "/notifications/sms",
      aliases: ["/notifications/sms", "/sms/result", "/sms"],
      label: "Result SMS",
    },
    {
      href: "/sms/custom",
      aliases: ["/sms/custom"],
      label: "Custom SMS",
    },
  ];

  return <ModuleMenuBar moduleName="SMS & Notices" items={navItems} activeTheme="violet" />;
}
