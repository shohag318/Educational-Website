"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  SettingsIcon,
  ShieldIcon,
  LogoutIcon,
  MenuIcon,
  CalendarMonthIcon,
  SchoolOutlinedIcon,
} from "@/components/iconify/mui-icons";
import {
  getStoredSchoolInfo,
  SchoolBasicInfo,
  SETTINGS_UPDATED_EVENT,
  DEFAULT_SCHOOL_INFO,
} from "@/utils/settings-store";
import {
  isInstitutionLoggedIn,
  getAuthSession,
  clearAuthSession,
  AUTH_SESSION_EVENT,
  AuthSession,
} from "@/utils/auth-session";
import { CONFIG, PATHS } from "@/config-global";

function initialsFrom(name?: string | null) {
  if (!name) return "SA";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

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
    clearAuthSession();
    router.push(PATHS.auth.login);
  };

  const schoolName = info.name || CONFIG.defaultSchoolName;
  const eiin = info.eiin || CONFIG.defaultTenantCode;
  const adminLabel = session?.adminId || "Campus Admin";
  const userInitials = useMemo(() => initialsFrom(adminLabel), [adminLabel]);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      className="no-print"
      sx={{
        zIndex: 20,
        color: "text.primary",
        bgcolor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundImage:
          "linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,0.88) 100%)",
        "&::after": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background:
            "linear-gradient(90deg, rgba(16,185,129,0.55), rgba(14,165,233,0.35), transparent 70%)",
          opacity: 0.85,
          pointerEvents: "none",
        },
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 64, md: 72 },
          px: { xs: 1.5, sm: 2, md: 3 },
          gap: { xs: 1, md: 2 },
          justifyContent: "space-between",
        }}
      >
        {/* Left — institution identity */}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0, flex: 1 }}>
          {onMenuClick ? (
            <IconButton
              onClick={onMenuClick}
              edge="start"
              aria-label="Open navigation"
              sx={{
                display: { md: "none" },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.paper",
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          ) : null}

          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              flexShrink: 0,
              display: { xs: "none", sm: "grid" },
              placeItems: "center",
              color: "success.dark",
              bgcolor: "rgba(16,185,129,0.12)",
              border: "1px solid",
              borderColor: "rgba(16,185,129,0.22)",
            }}
          >
            <SchoolOutlinedIcon fontSize="small" />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.25,
                  maxWidth: { xs: 160, sm: 280, lg: 420 },
                }}
              >
                {schoolName}
              </Typography>
              <Box
                component="span"
                sx={{
                  display: { xs: "none", md: "inline-flex" },
                  alignItems: "center",
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  letterSpacing: "0.04em",
                  color: "success.dark",
                  bgcolor: "rgba(16,185,129,0.1)",
                  border: "1px solid",
                  borderColor: "rgba(16,185,129,0.22)",
                  flexShrink: 0,
                }}
              >
                EIIN {eiin}
              </Box>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{
                display: { xs: "none", sm: "block" },
                lineHeight: 1.3,
                mt: 0.15,
                maxWidth: { sm: 320, lg: 480 },
              }}
            >
              {info.nameBn
                ? `${info.nameBn}${info.board ? ` · ${info.board} Board` : ""}`
                : info.board
                  ? `${info.board} Board`
                  : "Institution workspace"}
            </Typography>
          </Box>
        </Stack>

        {/* Center — session context */}
        <Box
          sx={{
            display: { xs: "none", lg: "flex" },
            alignItems: "center",
            gap: 1.25,
            px: 1.75,
            py: 0.85,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "rgba(248,250,252,0.9)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              color: "primary.main",
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 16 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontWeight: 700,
                color: "text.primary",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              Session {info.academicYear || "2026"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1.2 }}>
              {info.activeTerm || "Active term"}
            </Typography>
          </Box>
          <Box
            sx={{
              ml: 0.5,
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "success.main",
              boxShadow: "0 0 0 4px rgba(16,185,129,0.15)",
            }}
          />
        </Box>

        {/* Right — actions */}
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexShrink: 0 }}>
          {!isInstLogin ? (
            <Tooltip title="Super Admin HQ">
              <IconButton
                component={Link}
                href={PATHS.superAdmin}
                aria-label="Super Admin HQ"
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  color: "secondary.main",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ShieldIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                px: { xs: 0.5, sm: 1 },
                py: 0.5,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                maxWidth: { xs: 44, sm: 220 },
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  bgcolor: "success.main",
                  color: "common.white",
                }}
              >
                {userInitials}
              </Avatar>
              <Box sx={{ minWidth: 0, display: { xs: "none", sm: "block" } }}>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    display: "block",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {adminLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1, fontSize: "0.65rem" }}>
                  Signed in
                </Typography>
              </Box>
            </Stack>
          )}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.25, display: { xs: "none", sm: "block" }, my: 1 }} />

          <Tooltip title="Settings">
            <IconButton
              component={Link}
              href={PATHS.settings.root}
              aria-label="Settings"
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                "&:hover": { bgcolor: "action.hover", borderColor: "success.light" },
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {isInstLogin ? (
            <Tooltip title="Sign out">
              <IconButton
                onClick={handleLogout}
                aria-label="Sign out"
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  color: "error.main",
                  "&:hover": { bgcolor: "rgba(244,63,94,0.08)", borderColor: "error.light" },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
