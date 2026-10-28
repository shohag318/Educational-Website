"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  School,
  KeyRound,
  ExternalLink,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { saveStoredSchoolInfo, DEFAULT_SCHOOL_INFO } from "@/lib/settingsStore";
import { saveAuthSession } from "@/lib/authSession";

function PortalLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const instParam = searchParams.get("inst") || searchParams.get("code") || "";

  const [institutionCode, setInstitutionCode] = useState(instParam);
  const [institutionInfo, setInstitutionInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [availableInstitutions, setAvailableInstitutions] = useState<any[]>([]);

  // Form state
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any>(null);

  // Fetch institution info if code provided
  useEffect(() => {
    if (instParam) {
      setInstitutionCode(instParam);
      fetchInstitutionDetails(instParam);
    } else {
      fetchInstitutionsList();
    }
  }, [instParam]);

  const fetchInstitutionsList = async () => {
    try {
      const res = await fetch("/api/auth/portal-info");
      const json = await res.json();
      if (json.success && json.list) {
        setAvailableInstitutions(json.list);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInstitutionDetails = async (code: string) => {
    try {
      setLoadingInfo(true);
      setErrorMessage("");
      const res = await fetch(`/api/auth/portal-info?code=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.success && json.institution) {
        setInstitutionInfo(json.institution);
        // Pre-fill suggested admin ID if empty
        if (json.institution.adminId && !adminId) {
          setAdminId(json.institution.adminId);
        }
      } else {
        setInstitutionInfo(null);
        setErrorMessage(`Institution code '${code}' was not found.`);
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Network error fetching institution details.");
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleInstitutionSelect = (code: string) => {
    setInstitutionCode(code);
    if (code) {
      fetchInstitutionDetails(code);
    } else {
      setInstitutionInfo(null);
    }
  };

  // Submit Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!adminId.trim() || !password.trim()) {
      setErrorMessage("Please enter both Admin ID and Password.");
      return;
    }

    try {
      setSubmitting(true);
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

      if (json.success) {
        setLoginSuccess(true);
        setSuccessInfo(json.institution);

        // Sync institution profile to client-side localStorage settings
        saveStoredSchoolInfo({
          ...DEFAULT_SCHOOL_INFO,
          name: json.institution.name,
          nameBn: json.institution.nameBn || "",
          eiin: json.institution.code,
          address: json.institution.address || "",
          email: json.institution.contactEmail || "",
          phone: json.institution.contactPhone || "",
        });

        // Save structured auth session marking this explicitly as an Institution Login
        saveAuthSession({
          role: "INSTITUTION_ADMIN",
          adminId: json.institution.adminId,
          institutionCode: json.institution.code,
          institutionName: json.institution.name,
          isInstitutionLogin: true,
          loginAt: new Date().toISOString(),
          accessibleModules: json.institution.accessibleModules || json.session?.accessibleModules,
        });

        // Redirect after brief pleasant animation
        setTimeout(() => {
          router.push(json.redirectUrl || "/");
        }, 1200);
      } else {
        setErrorMessage(json.error || "Invalid login credentials. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage("Network connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden font-sans text-slate-100">
      {/* Background Graphic Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="px-6 py-4 flex items-center justify-between z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-xs tracking-wider shadow-sm">
            NCTB
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wide text-white">Smart Academy</span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Institutional Portal
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Official Campus Portal
          </span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-8">
        <div className="w-full max-w-md">
          {/* Card Frame */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950 p-6 border-b border-slate-800 text-center relative">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-3 shadow-lg shadow-indigo-950">
                <School className="w-7 h-7" />
              </div>

              {institutionInfo ? (
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    EIIN: {institutionInfo.code}
                  </span>
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {institutionInfo.name}
                  </h1>
                  {institutionInfo.nameBn && (
                    <p className="text-xs text-slate-400">{institutionInfo.nameBn}</p>
                  )}
                  {institutionInfo.address && (
                    <p className="text-[11px] text-slate-400">{institutionInfo.address}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    Institution Portal Login
                  </h1>
                  <p className="text-xs text-slate-400">
                    Sign in with your assigned Institution ID and Password
                  </p>
                </div>
              )}
            </div>

            {/* Success State */}
            {loginSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Login Successful!</h2>
                  <p className="text-xs text-emerald-400 mt-1 font-medium">
                    Authenticated as {adminId}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Loading campus control workspace...
                  </p>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full animate-pulse"></div>
                </div>
              </div>
            ) : (
              /* Login Form */
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Institution Selector if not in query param */}
                {!instParam && availableInstitutions.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Select Institution</span>
                    </label>
                    <select
                      value={institutionCode}
                      onChange={(e) => handleInstitutionSelect(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                    >
                      <option value="">-- Choose your campus / EIIN --</option>
                      {availableInstitutions.map((i) => (
                        <option key={i.id} value={i.code}>
                          {i.name} (EIIN: {i.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Admin ID / Login ID */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Assigned Admin ID</span>
                    </span>
                    {institutionInfo && (
                      <span className="text-[10px] text-slate-400 font-mono font-normal">
                        e.g. {institutionInfo.adminId}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="Enter assigned Admin ID or email"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Assigned Password</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember & Help */}
                <div className="flex items-center justify-between pt-1 text-slate-400">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Remember this device</span>
                  </label>
                  <span className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer">
                    Forgot password? Contact Super Admin
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  {submitting ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In to Institution Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Super Admin Testing Helper */}
                {institutionInfo && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center justify-between text-indigo-300 font-semibold">
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Quick Test Helper</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminId(institutionInfo.adminId || `admin_${institutionInfo.code}`);
                          setPassword(`SmartAdmin@${institutionInfo.code}`);
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-200 underline font-semibold"
                      >
                        Auto-Fill
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      ID: <span className="font-mono text-slate-200">{institutionInfo.adminId}</span> | 
                      Default Pass: <span className="font-mono text-slate-200">SmartAdmin@{institutionInfo.code}</span>
                    </p>
                  </div>
                )}
              </form>
            )}

            {/* Portal Footer */}
            <div className="p-4 bg-slate-950/50 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
              Secured by Smart Academy Multi-Campus Engine • Bangladesh NCTB Standard
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        Smart Academy Enterprise © {new Date().getFullYear()} • Result Processing & Campus Management System
      </footer>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">
          Loading portal login...
        </div>
      }
    >
      <PortalLoginContent />
    </Suspense>
  );
}
