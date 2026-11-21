"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, Drawer } from "@mui/material";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { RecentlyVisitedBar } from "@/components/RecentlyVisitedBar";
import { AuthGuard } from "@/components/auth-guard";
import { PATHS } from "@/config-global";
import { RADIUS, SPACING } from "@/theme/spacing";
import { THEME_PLATE } from "@/theme/plate";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const isAuthPage =
    pathname?.startsWith(PATHS.auth.portalLogin) || pathname?.startsWith(PATHS.auth.login);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <AuthGuard>
      {isAuthPage ? (
        <Box component="div" sx={{ minHeight: "100vh", width: "100%", bgcolor: "grey.900", overflowY: "auto" }}>
          {children}
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            height: "100vh",
            overflow: "hidden",
            bgcolor: THEME_PLATE.colors.surface.canvas,
            width: "100%",
          }}
        >
          <Box sx={{ display: { xs: "none", md: "block" }, flexShrink: 0 }}>
            <Sidebar />
          </Box>
          <Drawer
            open={navOpen}
            onClose={() => setNavOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { md: "none" },
              "& .MuiDrawer-paper": { width: 288, bgcolor: "transparent", border: 0 },
            }}
          >
            <Sidebar />
          </Drawer>

          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              height: "100vh",
              overflow: "hidden",
              bgcolor: THEME_PLATE.colors.surface.canvas,
            }}
          >
            <Header onMenuClick={() => setNavOpen(true)} />
            <RecentlyVisitedBar />

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                p: SPACING.gutter,
                pt: { xs: 1.25, md: 1.5 },
                bgcolor: THEME_PLATE.colors.surface.canvas,
              }}
            >
              <Box
                component="main"
                className="app-content-surface"
                sx={{
                  height: "100%",
                  overflowY: "auto",
                  minWidth: 0,
                  bgcolor: THEME_PLATE.colors.surface.content,
                  borderRadius: `${RADIUS.surface}px`,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: THEME_PLATE.shadows.surface,
                  px: SPACING.contentX,
                  py: SPACING.contentY,
                  fontFamily: THEME_PLATE.fonts.sans,
                  "& > .MuiContainer-root > .MuiStack-root": {
                    gap: `${SPACING.page * 8}px`,
                  },
                }}
              >
                {children}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </AuthGuard>
  );
}
