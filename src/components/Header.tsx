"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, ShieldAlert, LogOut, UserCheck } from "lucide-react";
import {
  getStoredSchoolInfo,
  SchoolBasicInfo,
  SETTINGS_UPDATED_EVENT,
  DEFAULT_SCHOOL_INFO,
} from "@/lib/settingsStore";
import {
  isInstitutionLoggedIn,
  getAuthSession,
  clearAuthSession,
  AUTH_SESSION_EVENT,
  AuthSession,
} from "@/lib/authSession";

export function Header() {
  const router = useRouter();
  const [info, setInfo] = useState<SchoolBasicInfo>(DEFAULT_SCHOOL_INFO);
  const [isInstLogin, setIsInstLogin] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setInfo(getStoredSchoolInfo());
    setIsInstLogin(isInstitutionLoggedIn());
    setSession(getAuthSession());

    const handleUpdate = () => {
      setInfo(getStoredSchoolInfo());
    };

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
    router.push(`/portal-login?inst=${encodeURIComponent(code)}`);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between no-print sticky top-0 z-20 shadow-xs">
      <div className="flex items-center space-x-3">
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 tracking-wide font-mono">
          EIIN: {info.eiin || "108254"}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800 leading-tight">
            {info.name || "Dhaka Ideal Model High School & College"}
          </span>
          {info.nameBn && (
            <span className="text-[11px] text-slate-500 leading-tight">
              {info.nameBn}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Only show Super Admin HQ if NOT logged in as institution admin */}
        {!isInstLogin && (
          <Link
            href="/super-admin"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 rounded-lg transition-colors shadow-2xs"
            title="Super Admin Dashboard: Manage all institutions & login links"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
            <span>Super Admin HQ</span>
          </Link>
        )}

        {/* If logged in as Institution Admin, show Campus Admin badge & Logout option */}
        {isInstLogin && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono font-semibold">{session?.adminId || "Campus Admin"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
              title="Sign out of institution portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}

        <Link
          href="/settings"
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors shadow-2xs"
          title="Manage School/College Basic Information & Controls"
        >
          <Settings className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </div>
    </header>
  );
}
