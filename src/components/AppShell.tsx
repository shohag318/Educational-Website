"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { RecentlyVisitedBar } from "@/components/RecentlyVisitedBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If viewing the dedicated login portal, render standalone full-screen view
  const isAuthPage =
    pathname?.startsWith("/portal-login") ||
    pathname?.startsWith("/login");

  if (isAuthPage) {
    return <div className="min-h-screen w-full bg-slate-900 overflow-y-auto">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <RecentlyVisitedBar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
