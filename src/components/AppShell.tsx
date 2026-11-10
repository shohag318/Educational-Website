"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, Drawer } from "@mui/material";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { RecentlyVisitedBar } from "@/components/RecentlyVisitedBar";
import { AuthGuard } from "@/components/auth-guard";
import { PATHS } from "@/config-global";

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
            bgcolor: "grey.100",
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
              bgcolor: "grey.100",
            }}
          >
            <Header onMenuClick={() => setNavOpen(true)} />
            <RecentlyVisitedBar />

            {/* Depth gutter between header/sidebar and content card */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                p: { xs: 1.25, sm: 1.5, md: 2 },
                pt: { xs: 1.25, md: 1.5 },
                bgcolor: "grey.100",
              }}
            >
              <Box
                component="main"
                className="app-content-surface"
                sx={{
                  height: "100%",
                  overflowY: "auto",
                  minWidth: 0,
                  // Soft grey canvas so white section cards show clear gaps between them
                  bgcolor: "grey.50",
                  borderRadius: { xs: 2, md: 2.5 },
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)",
                  px: { xs: 1.5, sm: 2, md: 2.5 },
                  py: { xs: 1.5, sm: 2, md: 2.25 },
                  // Default vertical rhythm between top-level page blocks/cards
                  "& > .MuiContainer-root > .MuiStack-root": {
                    gap: "20px",
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
