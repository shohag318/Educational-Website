"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  School,
  User,
} from "@/components/iconify/lucide";
import { AppButton } from "@/components/button/app-button";
import { saveAuthSession } from "@/lib/authSession";
import { saveStoredSchoolInfo, DEFAULT_SCHOOL_INFO } from "@/lib/settingsStore";
import { CONFIG, PATHS } from "@/config-global";

const DEMO_CREDENTIALS = {
  institutionCode: "108254",
  adminId: "admin_108254",
  password: "Smart@1234",
  institutionName: CONFIG.defaultSchoolName,
} as const;

const SUPER_DEMO = {
  adminId: "superadmin",
  password: "Super@1234",
} as const;

export default function LoginView() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [institutionCode, setInstitutionCode] = useState(DEMO_CREDENTIALS.institutionCode);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  const fillDemo = () => {
    setInstitutionCode(DEMO_CREDENTIALS.institutionCode);
    setAdminId(DEMO_CREDENTIALS.adminId);
    setPassword(DEMO_CREDENTIALS.password);
    setErrorMessage("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!adminId.trim() || !password.trim()) {
      setErrorMessage("Please enter Admin ID and Password.");
      return;
    }

    setSubmitting(true);
    try {
      // Dummy super-admin shortcut (no API needed)
      if (
        adminId.trim().toLowerCase() === SUPER_DEMO.adminId &&
        password === SUPER_DEMO.password
      ) {
        saveAuthSession({
          role: "SUPER_ADMIN",
          adminId: SUPER_DEMO.adminId,
          institutionCode: DEMO_CREDENTIALS.institutionCode,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/5 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-black tracking-wider text-slate-950">
            NCTB
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">{CONFIG.appName}</div>
            <div className="text-[11px] text-slate-400">{CONFIG.appTagline}</div>
          </div>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
          Demo Login
        </span>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-slate-800 bg-gradient-to-b from-slate-800/80 to-slate-900 px-6 py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
              <School className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">Sign in</h1>
            <p className="mt-1 text-xs text-slate-400">
              Use the demo credentials below to enter the campus portal.
            </p>
          </div>

          {loginSuccess ? (
            <div className="space-y-3 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="text-sm font-bold text-white">Login successful</div>
              <p className="text-xs text-slate-400">Opening workspace…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {errorMessage ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-slate-300">
                <div className="mb-1.5 font-bold text-emerald-300">Dummy credentials</div>
                <div className="space-y-0.5 font-mono text-slate-400">
                  <div>EIIN: {DEMO_CREDENTIALS.institutionCode}</div>
                  <div>Admin ID: {DEMO_CREDENTIALS.adminId}</div>
                  <div>Password: {DEMO_CREDENTIALS.password}</div>
                </div>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="mt-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  Fill demo credentials
                </button>
                <div className="mt-2 border-t border-slate-700/60 pt-2 text-slate-500">
                  Super Admin: <span className="font-mono text-slate-400">{SUPER_DEMO.adminId}</span> /{" "}
                  <span className="font-mono text-slate-400">{SUPER_DEMO.password}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Institution EIIN</label>
                <input
                  value={institutionCode}
                  onChange={(e) => setInstitutionCode(e.target.value)}
                  placeholder="108254"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 font-mono text-xs text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <User className="h-3.5 w-3.5 text-emerald-400" />
                  Admin ID
                </label>
                <input
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="admin_108254"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 font-mono text-xs text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 pr-10 font-mono text-xs text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <AppButton
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? "Signing in…" : "Sign in"}
              </AppButton>
            </form>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-slate-800/80 px-5 py-3 text-center text-[11px] text-slate-500">
        {CONFIG.appName} · Mock authentication for demo use
      </footer>
    </div>
  );
}
