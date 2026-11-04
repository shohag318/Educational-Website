import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "@/global.css";
import { AppShell } from "@/components/AppShell";
import { TenantInterceptor } from "@/components/TenantInterceptor";
import { ThemeProvider } from "@/theme/theme-provider";
import { CONFIG } from "@/config-global";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

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
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body className={roboto.className} suppressHydrationWarning>
        <ThemeProvider>
          <TenantInterceptor />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
