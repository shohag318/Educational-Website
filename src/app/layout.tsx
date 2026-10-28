import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { TenantInterceptor } from "@/components/TenantInterceptor";

export const metadata: Metadata = {
  title: "Smart Academy - Central School Management & Super Admin Portal",
  description: "Enterprise Multi-Campus Management & Result Processing System for Bangladesh National Curriculum",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="h-screen overflow-hidden bg-slate-50 text-slate-900 antialiased"
        suppressHydrationWarning
      >
        <TenantInterceptor />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
