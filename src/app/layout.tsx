import type { Metadata } from "next";
import "@/global.css";
import { AppShell } from "@/components/AppShell";
import { TenantInterceptor } from "@/components/TenantInterceptor";
import { ThemeProvider } from "@/theme/theme-provider";
import { CONFIG } from "@/config-global";

export const metadata: Metadata = {
  title: `${CONFIG.appName} - Central School Management & Super Admin Portal`,
  description: CONFIG.appDescription,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <TenantInterceptor />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
