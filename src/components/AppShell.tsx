"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, Drawer } from "@mui/material";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { RecentlyVisitedBar } from "@/components/RecentlyVisitedBar";
import { PATHS } from "@/config-global";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const isAuthPage =
    pathname?.startsWith(PATHS.auth.portalLogin) || pathname?.startsWith(PATHS.auth.login);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (isAuthPage) {
    return (
      <Box component="div" sx={{ minHeight: "100vh", width: "100%", bgcolor: "grey.900", overflowY: "auto" }}>
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "background.default", width: "100%" }}>
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
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
        <Header onMenuClick={() => setNavOpen(true)} />
        <RecentlyVisitedBar />
        <Box component="main" sx={{ flex: 1, p: { xs: 1.5, sm: 2, md: 3 }, overflowY: "auto", minWidth: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
