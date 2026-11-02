"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppBar, Box, Chip, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ShieldIcon from "@mui/icons-material/GppMaybe";
import LogoutIcon from "@mui/icons-material/Logout";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import MenuIcon from "@mui/icons-material/Menu";
import { getStoredSchoolInfo, SchoolBasicInfo, SETTINGS_UPDATED_EVENT, DEFAULT_SCHOOL_INFO } from "@/utils/settings-store";
import {
  isInstitutionLoggedIn,
  getAuthSession,
  clearAuthSession,
  AUTH_SESSION_EVENT,
  AuthSession,
} from "@/utils/auth-session";
import { AppButton } from "@/components/button/app-button";
import { CONFIG, PATHS } from "@/config-global";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [info, setInfo] = useState<SchoolBasicInfo>(DEFAULT_SCHOOL_INFO);
  const [isInstLogin, setIsInstLogin] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setInfo(getStoredSchoolInfo());
    setIsInstLogin(isInstitutionLoggedIn());
    setSession(getAuthSession());

    const handleUpdate = () => setInfo(getStoredSchoolInfo());
    const handleAuthChange = () => {
      setIsInstLogin(isInstitutionLoggedIn());
      setSession(getAuthSession());
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(AUTH_SESSION_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(AUTH_SESSION_EVENT, handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    const code = session?.institutionCode || info.eiin;
    clearAuthSession();
    router.push(`${PATHS.auth.portalLogin}?inst=${encodeURIComponent(code)}`);
  };

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      className="no-print"
      sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", zIndex: 20 }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 1.5, md: 3 }, justifyContent: "space-between", gap: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          {onMenuClick && (
            <IconButton onClick={onMenuClick} edge="start" sx={{ display: { md: "none" } }} aria-label="Open navigation">
              <MenuIcon />
            </IconButton>
          )}
          <Chip
            size="small"
            label={`EIIN: ${info.eiin || CONFIG.defaultTenantCode}`}
            color="success"
            variant="outlined"
            sx={{ fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}
          />
          <Box sx={{ minWidth: 0, display: { xs: "none", sm: "block" } }}>
            <Typography variant="subtitle2" noWrap sx={{ lineHeight: 1.2 }}>
              {info.name || CONFIG.defaultSchoolName}
            </Typography>
            {info.nameBn && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {info.nameBn}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
          {!isInstLogin && (
            <AppButton
              component={Link}
              href={PATHS.superAdmin}
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<ShieldIcon fontSize="small" />}
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              Super Admin HQ
            </AppButton>
          )}

          {isInstLogin && (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Chip
                size="small"
                icon={<VerifiedUserIcon />}
                label={session?.adminId || "Campus Admin"}
                sx={{ fontFamily: "monospace", display: { xs: "none", sm: "inline-flex" } }}
              />
              <AppButton size="small" variant="outlined" startIcon={<LogoutIcon fontSize="small" />} onClick={handleLogout}>
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  Sign Out
                </Box>
              </AppButton>
            </Stack>
          )}

          <AppButton
            component={Link}
            href={PATHS.settings.root}
            size="small"
            variant="outlined"
            startIcon={<SettingsIcon fontSize="small" />}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Settings
            </Box>
          </AppButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
