"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { getAuthSession } from "@/lib/authSession";
import { PATHS } from "@/config-global";

const PUBLIC_PATHS = [PATHS.auth.login, PATHS.auth.portalLogin];

function isPublicPath(pathname: string | null) {
  if (!pathname) return false;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`));
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const publicRoute = isPublicPath(pathname);
    const session = getAuthSession();

    if (publicRoute) {
      if (session && (pathname === PATHS.auth.login || pathname === PATHS.auth.portalLogin)) {
        router.replace(session.role === "SUPER_ADMIN" ? PATHS.superAdmin : PATHS.root);
        setAllowed(false);
        setReady(true);
        return;
      }
      setAllowed(true);
      setReady(true);
      return;
    }

    if (!session) {
      router.replace(PATHS.auth.login);
      setAllowed(false);
      setReady(true);
      return;
    }

    setAllowed(true);
    setReady(true);
  }, [pathname, router]);

  if (!ready || !allowed) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "grey.900",
        }}
      >
        <CircularProgress size={28} sx={{ color: "primary.light" }} />
      </Box>
    );
  }

  return <>{children}</>;
}
