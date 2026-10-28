"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  isInstitutionLoggedIn,
  AUTH_SESSION_EVENT,
  getAuthSession,
  AuthSession,
} from "@/lib/authSession";
import {
  School,
  Users,
  Calendar,
  BookOpen,
  Sliders,
  TableProperties,
  CheckCircle,
  FileEdit,
  Send,
  FileSpreadsheet,
  Award,
  AlertTriangle,
  LayoutDashboard,
  ShieldCheck,
  FileBarChart,
  Contact,
  CreditCard,
  CalendarCheck,
  FileText,
  LayoutGrid,
  Receipt,
  HandCoins,
  Banknote,
  Landmark,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  ShieldAlert,
  Settings,
  Building2,
  CalendarX2,
  Download,
  Boxes,
  Barcode,
  Wrench,
  MessageSquare,
  CalendarRange,
  PlusCircle,
  FileSignature,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [isInstLogin, setIsInstLogin] = useState(false);
  const [instSession, setInstSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setIsInstLogin(isInstitutionLoggedIn());
    setInstSession(getAuthSession());

    const handleAuthChange = () => {
      setIsInstLogin(isInstitutionLoggedIn());
      setInstSession(getAuthSession());
    };

    window.addEventListener(AUTH_SESSION_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, handleAuthChange);
    };
  }, []);

  const isModuleAccessible = (moduleKey: string) => {
    if (!isInstLogin) return true;
    if (!instSession?.accessibleModules || !Array.isArray(instSession.accessibleModules)) return true;
    return instSession.accessibleModules.includes(moduleKey);
  };

  // Collapsible state for tree groups (default expanded except result-mod which opens on clicking symbol)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    "session-mod": false,
    "student-info-mod": false,
    "sms-mod": false,
    "student-fee-mod": false,
    "manual-fee-mod": false,
    "accountant-mod": false,
    "assets-mod": false,
    "user-role-mod": false,
    "download-mod": false,
    "setting-mod": false,
    "result-mod": true,
    "phase-1": false,
    "phase-2": false,
    "phase-3": false,
    "phase-4": false,
  });

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isLinkActive = (href: string) => pathname === href;

  return (
    <aside className="w-72 bg-slate-900 text-slate-200 h-screen max-h-screen sticky top-0 flex flex-col border-r border-slate-800 no-print shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 shrink-0">
        <div className="bg-emerald-500 text-slate-950 font-black px-2.5 py-1.5 rounded-lg text-xs tracking-wider shadow-sm">
          NCTB
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm tracking-wide text-white truncate">Smart Academy</h1>
          <p className="text-[11px] text-slate-400">Bangladesh Standard</p>
        </div>
      </div>

      {/* Super Admin Central Hub - Hidden when logged in via Dedicated Institution Link */}
      {!isInstLogin && (
        <div className="px-3 pt-3">
          <Link
            href="/super-admin"
            className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
              pathname?.startsWith("/super-admin")
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md shadow-indigo-900/50"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-indigo-500/50"
            }`}
            title="Super Admin Dashboard: Manage institutions, assign credentials, portal links"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">Super Admin</div>
                <div className="text-[10px] text-slate-400 truncate">Institution Manager</div>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Admin
            </span>
          </Link>
        </div>
      )}

      {/* Navigation Tree */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-sans sidebar-scroll">
        {/* =========================================
            SECTION 1: CORE
        ========================================= */}
        <div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 px-2.5 mb-1.5">
            CORE
          </div>

          <div className="space-y-1">
            {/* Overview */}
            <Link
              href="/"
              className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                isLinkActive("/")
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Overview</span>
            </Link>

            {/* Session Control Module (Sub-group) - AT FIRST POSITION */}
            {isModuleAccessible("session") && (
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup("session-mod")}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <CalendarRange className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="truncate">Sessions</span>
                  </div>
                  {collapsed["session-mod"] ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                  )}
                </button>

                {/* Indented Sub-items with tree guide */}
                {!collapsed["session-mod"] && (
                  <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                    <Link
                      href="/setup/classes"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/setup/classes")
                          ? "bg-emerald-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <School className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>Classes & Sections</span>
                    </Link>

                    <Link
                      href="/setup/subject-mapping"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/setup/subject-mapping")
                          ? "bg-emerald-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>Subject Mapping</span>
                    </Link>

                    <Link
                      href="/session/create"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/session/create")
                          ? "bg-emerald-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>Create Session</span>
                    </Link>

                    <Link
                      href="/session"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/session")
                          ? "bg-emerald-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>Session Manager</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Student Information Module (Sub-group) */}
            {isModuleAccessible("student_info") && (
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup("student-info-mod")}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <GraduationCap className="w-4 h-4 shrink-0 text-sky-400" />
                    <span className="truncate">Students</span>
                  </div>
                  {collapsed["student-info-mod"] ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                  )}
                </button>

                {/* Indented Sub-items with tree guide */}
                {!collapsed["student-info-mod"] && (
                  <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                    <Link
                      href="/setup/students"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/setup/students")
                          ? "bg-emerald-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>Enrollment</span>
                    </Link>

                    <Link
                      href="/academic/subject-mapping"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/academic/subject-mapping")
                          ? "bg-emerald-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>Subject Allocation</span>
                    </Link>

                    <Link
                      href="/student/profile"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/student/profile")
                          ? "bg-emerald-600 text-white font-medium shadow-2xs"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Student Profiles</span>
                    </Link>

                    <Link
                      href="/student/attendance"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/student/attendance")
                          ? "bg-emerald-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <CalendarCheck className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>Attendance</span>
                    </Link>

                    <Link
                      href="/student/status"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/student/status")
                          ? "bg-emerald-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span>Student Status</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            SECTION 2: RESULT MODULE
        ========================================= */}
        {isModuleAccessible("results") && (
          <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => toggleGroup("result-mod")}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <Award className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="truncate">Results & Exams</span>
            </div>
            {collapsed["result-mod"] ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
            )}
          </button>

          {!collapsed["result-mod"] && (
            <div className="mt-2 space-y-2 ml-1 pl-2 border-l border-dashed border-slate-700/70">
            {/* Phase 1: Rules */}
            <div>
              <button
                type="button"
                onClick={() => toggleGroup("phase-1")}
                className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors font-semibold group"
              >
                <span className="truncate text-slate-200">Phase 1: Rules</span>
                {collapsed["phase-1"] ? (
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
                )}
              </button>

              {!collapsed["phase-1"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/academic/rules"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/academic/rules")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Grading Rules</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Phase 2: Setup */}
            <div>
              <button
                type="button"
                onClick={() => toggleGroup("phase-2")}
                className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors font-semibold group"
              >
                <span className="truncate text-slate-200">Phase 2: Setup</span>
                {collapsed["phase-2"] ? (
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
                )}
              </button>

              {!collapsed["phase-2"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/setup/exams"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/setup/exams")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Exam Configuration</span>
                  </Link>

                  <Link
                    href="/setup/exam-routine"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/setup/exam-routine")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <CalendarRange className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Exam Routine</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Phase 3: Mark Entry */}
            <div>
              <button
                type="button"
                onClick={() => toggleGroup("phase-3")}
                className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors font-semibold group"
              >
                <span className="truncate text-slate-200">Phase 3: Mark Entry</span>
                {collapsed["phase-3"] ? (
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
                )}
              </button>

              {!collapsed["phase-3"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/marks/entry"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/marks/entry")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <TableProperties className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Mark Entry</span>
                  </Link>

                  <Link
                    href="/results/review"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/results/review")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Process & Review</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Phase 4: Reports */}
            <div>
              <button
                type="button"
                onClick={() => toggleGroup("phase-4")}
                className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors font-semibold group"
              >
                <span className="truncate text-slate-200">Phase 4: Reports</span>
                {collapsed["phase-4"] ? (
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
                )}
              </button>

              {!collapsed["phase-4"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/results/publish"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/results/publish")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Publish Results</span>
                  </Link>

                  <Link
                    href="/reports/tabulation"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/reports/tabulation")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Tabulation Sheet</span>
                  </Link>

                  <Link
                    href="/reports/at-a-glance"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/reports/at-a-glance")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <FileBarChart className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>At a Glance</span>
                  </Link>

                  <Link
                    href="/reports/marksheet"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/reports/marksheet")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Report Cards</span>
                  </Link>

                  <Link
                    href="/reports/fail-list"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/reports/fail-list")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Failed Students</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
        )}

        {/* =========================================
            SECTION 3: SMS MODULE
        ========================================= */}
        {isModuleAccessible("sms_notice") && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => toggleGroup("sms-mod")}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Send className="w-4 h-4 shrink-0 text-violet-400" />
                  <span className="truncate">SMS & Notices</span>
                </div>
                {collapsed["sms-mod"] ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                )}
              </button>

              {/* Indented Sub-items */}
              {!collapsed["sms-mod"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/notifications/sms"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/notifications/sms") || isLinkActive("/sms/result")
                        ? "bg-violet-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                    <span>Result SMS</span>
                  </Link>

                  <Link
                    href="/sms/custom"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/sms/custom")
                        ? "bg-violet-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                    <span>Custom SMS</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            SECTION 4: STUDENT FEE MODULE
        ========================================= */}
        {isModuleAccessible("fees") && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => toggleGroup("student-fee-mod")}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Receipt className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="truncate">Student Fees</span>
                </div>
                {collapsed["student-fee-mod"] ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                )}
              </button>

              {/* Indented Sub-items */}
              {!collapsed["student-fee-mod"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/fees"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/fees")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Fee Setup</span>
                  </Link>

                  <Link
                    href="/fees/waiver"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/fees/waiver")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">Waivers & Scholarships</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            SECTION 4B: MANUALLY FEE COLLECTION
        ========================================= */}
        {isModuleAccessible("fees") && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => toggleGroup("manual-fee-mod")}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <HandCoins className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="truncate">Fee Collection</span>
                </div>
                {collapsed["manual-fee-mod"] ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                )}
              </button>

              {/* Indented Sub-items */}
              {!collapsed["manual-fee-mod"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/fees/collection"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/fees/collection")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Cash Counter</span>
                  </Link>

                  <Link
                    href="/fees/collection/history"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/fees/collection/history")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span className="truncate">Receipts & Ledger</span>
                  </Link>

                  <Link
                    href="/fees/absent-fine"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/fees/absent-fine")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <CalendarX2 className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span className="truncate">Absent Fines</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            SECTION 5: ACCOUNTANT MODULE
        ========================================= */}
        {isModuleAccessible("accountant") && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => toggleGroup("accountant-mod")}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Landmark className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="truncate">Accounts & Finance</span>
                </div>
                {collapsed["accountant-mod"] ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                )}
              </button>

              {/* Indented Sub-items */}
              {!collapsed["accountant-mod"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/accountant"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/accountant")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Overview & Ledger</span>
                  </Link>

                  <Link
                    href="/accountant/income"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/accountant/income")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Income</span>
                  </Link>

                  <Link
                    href="/accountant/expense"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/accountant/expense")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>Expenses</span>
                  </Link>

                  <Link
                    href="/accountant/payroll"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/accountant/payroll")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                    <span>Payroll</span>
                  </Link>

                  <Link
                    href="/accountant/audit"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/accountant/audit")
                        ? "bg-emerald-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Trial Balance</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            SECTION 6: DOWNLOAD MODULE
        ========================================= */}
        {isModuleAccessible("downloads") && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => toggleGroup("download-mod")}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Download className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="truncate">Downloads</span>
                </div>
                {collapsed["download-mod"] ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                )}
              </button>

              {/* Indented Sub-items */}
              {!collapsed["download-mod"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/download/banbeis"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/download/banbeis")
                        ? "bg-amber-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>BANBEIS Census</span>
                  </Link>

                  <Link
                    href="/download/admission-form"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/download/admission-form")
                        ? "bg-amber-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Admission Form</span>
                  </Link>

                  <Link
                    href="/download/academic-calendar"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/download/academic-calendar")
                        ? "bg-amber-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <CalendarRange className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Academic Calendar</span>
                  </Link>

                  <Link
                    href="/setup/student-info"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/setup/student-info")
                        ? "bg-amber-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Contact className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Student Register</span>
                  </Link>

                  <Link
                    href="/student/id-cards"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/student/id-cards")
                        ? "bg-amber-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>ID Cards</span>
                  </Link>

                  <Link
                    href="/student/transcript"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/student/transcript")
                        ? "bg-amber-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Transcripts</span>
                  </Link>

                  <Link
                    href="/student/seat-plan"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/student/seat-plan")
                        ? "bg-amber-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Seat Plan</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            SECTION 7: SETTING MODULE
        ========================================= */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => toggleGroup("setting-mod")}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Settings className="w-4 h-4 shrink-0 text-cyan-400" />
                <span className="truncate">Settings</span>
              </div>
              {collapsed["setting-mod"] ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
              )}
            </button>

            {/* Indented Sub-items */}
            {!collapsed["setting-mod"] && (
              <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                <Link
                  href="/settings"
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                    isLinkActive("/settings")
                      ? "bg-cyan-700 text-white font-medium"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  <span>Institution Profile</span>
                </Link>

                <Link
                  href="/settings/staff"
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                    isLinkActive("/settings/staff") || isLinkActive("/settings/teachers")
                      ? "bg-cyan-700 text-white font-medium"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  <span>Teachers & Staff</span>
                </Link>

                <Link
                  href="/settings/signatures"
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                    isLinkActive("/settings/signatures")
                      ? "bg-cyan-700 text-white font-medium"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <FileSignature className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  <span>Signatures</span>
                </Link>

                {/* User Role Sub-group */}
                {isModuleAccessible("user_roles") && (
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => toggleGroup("user-role-mod")}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                        <span className="truncate">User Roles</span>
                      </div>
                      {collapsed["user-role-mod"] ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                      )}
                    </button>

                    {!collapsed["user-role-mod"] && (
                      <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                        <Link
                          href="/user-role/roles"
                          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                            isLinkActive("/user-role/roles")
                              ? "bg-purple-700 text-white font-medium"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                          <span>Roles & Permissions</span>
                        </Link>

                        <Link
                          href="/user-role"
                          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                            isLinkActive("/user-role")
                              ? "bg-purple-700 text-white font-medium"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                          <span>User Accounts</span>
                        </Link>

                        <Link
                          href="/user-role/delegation"
                          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                            isLinkActive("/user-role/delegation")
                              ? "bg-purple-700 text-white font-medium"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>Teacher Access</span>
                        </Link>

                        <Link
                          href="/user-role/audit-logs"
                          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                            isLinkActive("/user-role/audit-logs")
                              ? "bg-purple-700 text-white font-medium"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          <span>Audit Logs</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            SECTION 8: INSTITUTION ASSETS MODULE
        ========================================= */}
        {isModuleAccessible("assets") && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => toggleGroup("assets-mod")}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group font-semibold cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Boxes className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span className="truncate">Assets</span>
                </div>
                {collapsed["assets-mod"] ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                )}
              </button>

              {!collapsed["assets-mod"] && (
                <div className="mt-1 pl-4 space-y-0.5 text-xs border-l border-slate-700/50 ml-3.5">
                  <Link
                    href="/assets"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/assets")
                        ? "bg-cyan-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span>Asset Register</span>
                  </Link>

                  <Link
                    href="/assets/categories"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/assets/categories")
                        ? "bg-cyan-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Rooms & Locations</span>
                  </Link>

                  <Link
                    href="/assets/maintenance"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/assets/maintenance")
                        ? "bg-cyan-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Maintenance</span>
                  </Link>

                  <Link
                    href="/assets/depreciation"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/assets/depreciation")
                        ? "bg-cyan-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                    <span>Depreciation</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Footer Status */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400 shrink-0 bg-slate-900">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-slate-400">System</span>
          <span className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
