"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Eye, EyeOff } from "@/components/iconify/lucide";
import { AppButton } from "@/components/button/app-button";
import { AppTextField } from "@/components/text-field/app-text-field";
import { saveAuthSession } from "@/lib/authSession";
import { saveStoredSchoolInfo, DEFAULT_SCHOOL_INFO } from "@/lib/settingsStore";
import { CONFIG, PATHS } from "@/config-global";
import { THEME_PLATE } from "@/theme/plate";
import { RADIUS, SPACING, TYPE } from "@/theme/spacing";

const DEMO = {
  institutionCode: "108254",
  adminId: "admin_108254",
  password: "Smart@1234",
} as const;

const SUPER_DEMO = {
  adminId: "superadmin",
  password: "Super@1234",
} as const;

export default function LoginView() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  const fillDemo = () => {
    setInstitutionCode(DEMO.institutionCode);
    setAdminId(DEMO.adminId);
    setPassword(DEMO.password);
    setErrorMessage("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!adminId.trim() || !password.trim()) {
      setErrorMessage("Enter your Admin ID and password.");
      return;
    }

    setSubmitting(true);
    try {
      if (
        adminId.trim().toLowerCase() === SUPER_DEMO.adminId &&
        password === SUPER_DEMO.password
      ) {
        saveAuthSession({
          role: "SUPER_ADMIN",
          adminId: SUPER_DEMO.adminId,
          institutionCode: DEMO.institutionCode,
          institutionName: "Smart Academy HQ",
          isInstitutionLogin: false,
          loginAt: new Date().toISOString(),
        });
        setLoginSuccess(true);
        setTimeout(() => router.push(PATHS.superAdmin), 700);
        return;
      }

      const res = await fetch("/api/auth/portal-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionCode: institutionCode.trim() || undefined,
          adminId: adminId.trim(),
          password: password.trim(),
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setErrorMessage(json.error || "Invalid login credentials.");
        return;
      }

      saveStoredSchoolInfo({
        ...DEFAULT_SCHOOL_INFO,
        name: json.institution.name,
        nameBn: json.institution.nameBn || "",
        eiin: json.institution.code,
        address: json.institution.address || "",
        email: json.institution.contactEmail || "",
        phone: json.institution.contactPhone || "",
      });

      saveAuthSession({
        role: "INSTITUTION_ADMIN",
        adminId: json.institution.adminId,
        institutionCode: json.institution.code,
        institutionName: json.institution.name,
        isInstitutionLogin: true,
        loginAt: new Date().toISOString(),
        accessibleModules: json.institution.accessibleModules || json.session?.accessibleModules,
      });

      setLoginSuccess(true);
      setTimeout(() => router.push(json.redirectUrl || PATHS.root), 700);
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: THEME_PLATE.fonts.sans,
        color: THEME_PLATE.colors.ink.primary,
        background: `
          radial-gradient(ellipse 80% 60% at 10% 20%, rgba(5, 150, 105, 0.12), transparent 55%),
          radial-gradient(ellipse 70% 50% at 90% 80%, rgba(15, 23, 42, 0.06), transparent 50%),
          linear-gradient(160deg, #F8FAFC 0%, #EEF2F6 45%, #E8F5F0 100%)
        `,
      }}
    >
      {/* Brand plane */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1,
          flexDirection: "column",
          justifyContent: "flex-end",
          p: { md: 6, lg: 8 },
          position: "relative",
          overflow: "hidden",
          background: `
            linear-gradient(145deg, ${THEME_PLATE.colors.ink.primary} 0%, #1E293B 48%, ${THEME_PLATE.colors.brand.darker} 100%)
          `,
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 30% 40%, rgba(52, 211, 153, 0.18), transparent 42%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05), transparent 40%)",
          }}
        />
        <Box sx={{ position: "relative", maxWidth: 420 }}>
          <Typography
            component="p"
            sx={{
              fontSize: TYPE.sm,
              fontWeight: THEME_PLATE.fonts.weights.medium,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: THEME_PLATE.colors.brand.light,
              mb: SPACING.stack,
            }}
          >
            {CONFIG.appName}
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontSize: { md: 36, lg: 42 },
              fontWeight: THEME_PLATE.fonts.weights.bold,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            School management, built for Bangladesh campuses.
          </Typography>
          <Typography
            sx={{
              mt: SPACING.section,
              fontSize: TYPE.body,
              lineHeight: 1.6,
              color: "rgba(226, 232, 240, 0.78)",
              maxWidth: 360,
            }}
          >
            Sign in to manage sessions, students, results, and campus operations.
          </Typography>
        </Box>
      </Box>

      {/* Form plane */}
      <Box
        sx={{
          flex: { xs: 1, md: "0 0 44%" },
          maxWidth: { md: 520 },
          width: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 4 },
          py: { xs: 6, md: 4 },
        }}
      >
        <Box sx={{ width: 1, maxWidth: 380 }}>
          <Typography
            component="p"
            sx={{
              display: { xs: "block", md: "none" },
              fontSize: TYPE.sm,
              fontWeight: THEME_PLATE.fonts.weights.bold,
              color: THEME_PLATE.colors.brand.main,
              mb: SPACING.inline,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {CONFIG.appName}
          </Typography>

          <Typography
            component="h2"
            sx={{
              fontSize: { xs: 26, sm: 28 },
              fontWeight: THEME_PLATE.fonts.weights.bold,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              color: THEME_PLATE.colors.ink.primary,
            }}
          >
            Sign in
          </Typography>
          <Typography
            sx={{
              mt: SPACING.tight,
              mb: SPACING.page,
              fontSize: TYPE.md,
              color: THEME_PLATE.colors.ink.secondary,
              lineHeight: 1.5,
            }}
          >
            Enter your institution credentials to continue.
          </Typography>

          {loginSuccess ? (
            <Box
              sx={{
                py: 4,
                textAlign: "center",
                borderRadius: `${RADIUS.card}px`,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                sx={{
                  fontWeight: THEME_PLATE.fonts.weights.bold,
                  fontSize: TYPE.lg,
                  color: THEME_PLATE.colors.brand.dark,
                }}
              >
                Welcome back
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: TYPE.md, color: "text.secondary" }}>
                Opening your workspace…
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={SPACING.section}>
                {errorMessage ? (
                  <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                    {errorMessage}
                  </Alert>
                ) : null}

                <AppTextField
                  label="Institution EIIN"
                  value={institutionCode}
                  onChange={(e) => setInstitutionCode(e.target.value)}
                  placeholder="e.g. 108254"
                  autoComplete="organization"
                />

                <AppTextField
                  label="Admin ID"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Your admin ID"
                  required
                  autoComplete="username"
                />

                <AppTextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                  endIcon={
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  }
                />

                <AppButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  loading={submitting}
                  disabled={submitting}
                  sx={{ mt: SPACING.tight, minHeight: 44 }}
                >
                  {submitting ? "Signing in…" : "Sign in"}
                </AppButton>

                <Typography
                  component="button"
                  type="button"
                  onClick={fillDemo}
                  sx={{
                    alignSelf: "center",
                    border: 0,
                    background: "none",
                    cursor: "pointer",
                    fontSize: TYPE.sm,
                    fontWeight: THEME_PLATE.fonts.weights.medium,
                    color: THEME_PLATE.colors.ink.muted,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    p: 0,
                    "&:hover": { color: THEME_PLATE.colors.brand.main },
                  }}
                >
                  Use demo account
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
