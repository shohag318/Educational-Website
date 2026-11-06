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
import { Iconify } from "@/components/iconify/iconify";

/** Fluent Color — https://icon-sets.iconify.design/fluent-color/ */
const FI = {
  superAdmin: "fluent-color:lock-shield-24",
  overview: "fluent-color:board-24",
  sessions: "fluent-color:calendar-24",
  classes: "fluent-color:building-24",
  subjects: "fluent-color:book-open-24",
  createSession: "fluent-color:add-circle-24",
  sessionManager: "fluent-color:calendar-checkmark-24",
  students: "fluent-color:people-community-24",
  enrollment: "fluent-color:people-24",
  subjectAlloc: "fluent-color:library-24",
  profiles: "fluent-color:contact-card-24",
  attendance: "fluent-color:calendar-clock-24",
  studentStatus: "fluent-color:person-warning-24",
  results: "fluent-color:trophy-24",
  grading: "fluent-color:options-24",
  examConfig: "fluent-color:calendar-edit-24",
  examRoutine: "fluent-color:calendar-data-bar-24",
  markEntry: "fluent-color:table-24",
  processReview: "fluent-color:checkmark-circle-24",
  publish: "fluent-color:shield-checkmark-24",
  tabulation: "fluent-color:document-text-24",
  glance: "fluent-color:chart-multiple-24",
  reportCards: "fluent-color:ribbon-star-24",
  failList: "fluent-color:warning-24",
  sms: "fluent-color:send-24",
  chat: "fluent-color:chat-24",
  fees: "fluent-color:receipt-24",
  feeSetup: "fluent-color:coin-multiple-24",
  waiver: "fluent-color:star-24",
  collection: "fluent-color:savings-24",
  cash: "fluent-color:coin-multiple-24",
  ledger: "fluent-color:document-folder-24",
  absentFine: "fluent-color:calendar-cancel-24",
  accounts: "fluent-color:building-government-24",
  accountsOverview: "fluent-color:data-bar-vertical-ascending-24",
  income: "fluent-color:data-trending-24",
  expense: "fluent-color:data-area-24",
  payroll: "fluent-color:people-team-24",
  trial: "fluent-color:clipboard-task-24",
  downloads: "fluent-color:arrow-square-down-24",
  banbeis: "fluent-color:table-24",
  admission: "fluent-color:form-24",
  academicCal: "fluent-color:calendar-24",
  register: "fluent-color:book-contacts-24",
  idCards: "fluent-color:scan-person-24",
  transcripts: "fluent-color:certificate-24",
  seatPlan: "fluent-color:apps-24",
  settings: "fluent-color:settings-24",
  institution: "fluent-color:building-home-24",
  staff: "fluent-color:person-available-24",
  signatures: "fluent-color:clipboard-text-edit-24",
  rolesGroup: "fluent-color:shield-checkmark-24",
  roles: "fluent-color:shield-24",
  userAccounts: "fluent-color:people-list-24",
  teacherAccess: "fluent-color:person-key-24",
  audit: "fluent-color:history-24",
  assets: "fluent-color:toolbox-24",
  assetRegister: "fluent-color:building-store-24",
  rooms: "fluent-color:building-multiple-24",
  maintenance: "fluent-color:wrench-24",
  depreciation: "fluent-color:data-pie-24",
  chevronRight: "lucide:chevron-right",
  chevronDown: "lucide:chevron-down",
} as const;

function NavIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  return <Iconify icon={icon} width={size} sx={{ flexShrink: 0, display: "block" }} />;
}

/** Top-level sidebar groups — only one stays open at a time (accordion). */
const TOP_LEVEL_GROUPS = [
  "session-mod",
  "student-info-mod",
  "result-mod",
  "sms-mod",
  "student-fee-mod",
  "manual-fee-mod",
  "accountant-mod",
  "download-mod",
  "setting-mod",
  "assets-mod",
] as const;

const PHASE_GROUPS = ["phase-1", "phase-2", "phase-3", "phase-4"] as const;

function allGroupsClosed(): Record<string, boolean> {
  return {
    "session-mod": true,
    "student-info-mod": true,
    "sms-mod": true,
    "student-fee-mod": true,
    "manual-fee-mod": true,
    "accountant-mod": true,
    "assets-mod": true,
    "user-role-mod": true,
    "download-mod": true,
    "setting-mod": true,
    "result-mod": true,
    "phase-1": true,
    "phase-2": true,
    "phase-3": true,
    "phase-4": true,
  };
}

function resolveOpenGroups(path: string | null): Record<string, boolean> {
  const next = allGroupsClosed();
  if (!path || path === "/") return next;

  const open = (key: string) => {
    next[key] = false;
  };

  if (
    path.startsWith("/setup/classes") ||
    path.startsWith("/setup/subject-mapping") ||
    path.startsWith("/session/")
  ) {
    open("session-mod");
  } else if (
    path.startsWith("/setup/students") ||
    path.startsWith("/academic/subject-mapping") ||
    path.startsWith("/student/profile") ||
    path.startsWith("/student/attendance") ||
    path.startsWith("/student/status")
  ) {
    open("student-info-mod");
  } else if (
    path.startsWith("/academic/rules") ||
    path.startsWith("/setup/exams") ||
    path.startsWith("/setup/exam-routine") ||
    path.startsWith("/marks/") ||
    path.startsWith("/results/") ||
    path.startsWith("/reports/")
  ) {
    open("result-mod");
    if (path.startsWith("/academic/rules")) open("phase-1");
    else if (path.startsWith("/setup/exams") || path.startsWith("/setup/exam-routine")) open("phase-2");
    else if (path.startsWith("/marks/") || path.startsWith("/results/review")) open("phase-3");
    else open("phase-4");
  } else if (path.startsWith("/notifications/sms") || path.startsWith("/sms/")) {
    open("sms-mod");
  } else if (path === "/fees" || path.startsWith("/fees/waiver")) {
    open("student-fee-mod");
  } else if (path.startsWith("/fees/collection") || path.startsWith("/fees/absent-fine")) {
    open("manual-fee-mod");
  } else if (path.startsWith("/accountant")) {
    open("accountant-mod");
  } else if (
    path.startsWith("/download/") ||
    path.startsWith("/setup/student-info") ||
    path.startsWith("/student/id-cards") ||
    path.startsWith("/student/transcript") ||
    path.startsWith("/student/seat-plan")
  ) {
    open("download-mod");
  } else if (path.startsWith("/settings") || path.startsWith("/user-role")) {
    open("setting-mod");
    if (path.startsWith("/user-role")) open("user-role-mod");
  } else if (path.startsWith("/assets")) {
    open("assets-mod");
  }

  return next;
}

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

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(allGroupsClosed);

  // Keep the active route's submenu open; close the rest.
  useEffect(() => {
    setCollapsed(resolveOpenGroups(pathname));
  }, [pathname]);

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const isCurrentlyClosed = prev[key] !== false;
      const next = { ...prev };

      if ((TOP_LEVEL_GROUPS as readonly string[]).includes(key)) {
        if (isCurrentlyClosed) {
          for (const group of TOP_LEVEL_GROUPS) next[group] = true;
          next[key] = false;
        } else {
          next[key] = true;
        }
        return next;
      }

      if ((PHASE_GROUPS as readonly string[]).includes(key)) {
        if (isCurrentlyClosed) {
          for (const group of PHASE_GROUPS) next[group] = true;
          next[key] = false;
        } else {
          next[key] = true;
        }
        return next;
      }

      next[key] = !prev[key];
      return next;
    });
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
                ? "bg-gradient-to-r from-indigo-400/30 via-purple-400/10 to-transparent text-white border-indigo-300/40 shadow-[inset_3px_0_0_0_#a5b4fc]"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-indigo-500/50"
            }`}
            title="Super Admin Dashboard: Manage institutions, assign credentials, portal links"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <NavIcon icon={FI.superAdmin} size={18} />
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
                  ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-semibold shadow-[inset_3px_0_0_0_#6ee7b7]"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <NavIcon icon={FI.overview} size={18} />
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
                    <NavIcon icon={FI.sessions} size={18} />
                      <span>Sessions</span>
                  </div>
                  {collapsed["session-mod"] ? (
                    <NavIcon icon={FI.chevronRight} size={14} />
                  ) : (
                    <NavIcon icon={FI.chevronDown} size={14} />
                  )}
                </button>

                {/* Indented Sub-items with tree guide */}
                {!collapsed["session-mod"] && (
                  <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                    <Link
                      href="/setup/classes"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/setup/classes")
                          ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavIcon icon={FI.classes} size={15} />
                      <span>Classes & Sections</span>
                    </Link>

                    <Link
                      href="/setup/subject-mapping"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/setup/subject-mapping")
                          ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavIcon icon={FI.subjects} size={15} />
                      <span>Subject Mapping</span>
                    </Link>

                    <Link
                      href="/session/create"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/session/create")
                          ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavIcon icon={FI.createSession} size={15} />
                      <span>Create Session</span>
                    </Link>

                    <Link
                      href="/session/manager"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/session/manager") || isLinkActive("/session")
                          ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavIcon icon={FI.sessionManager} size={15} />
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
                    <NavIcon icon={FI.students} size={18} />
                      <span>Students</span>
                  </div>
                  {collapsed["student-info-mod"] ? (
                    <NavIcon icon={FI.chevronRight} size={14} />
                  ) : (
                    <NavIcon icon={FI.chevronDown} size={14} />
                  )}
                </button>

                {/* Indented Sub-items with tree guide */}
                {!collapsed["student-info-mod"] && (
                  <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                    <Link
                      href="/setup/students"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/setup/students")
                          ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavIcon icon={FI.enrollment} size={15} />
                      <span>Enrollment</span>
                    </Link>

                    <Link
                      href="/academic/subject-mapping"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/academic/subject-mapping")
                          ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavIcon icon={FI.subjectAlloc} size={15} />
                      <span>Subject Allocation</span>
                    </Link>

                    <Link
                      href="/student/profile"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/student/profile")
                          ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavIcon icon={FI.profiles} size={15} />
                      <span>Student Profiles</span>
                    </Link>

                    <Link
                      href="/student/attendance"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/student/attendance")
                          ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavIcon icon={FI.attendance} size={15} />
                      <span>Attendance</span>
                    </Link>

                    <Link
                      href="/student/status"
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                        isLinkActive("/student/status")
                          ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <NavIcon icon={FI.studentStatus} size={15} />
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
              <NavIcon icon={FI.results} size={18} />
                      <span>Results & Exams</span>
            </div>
            {collapsed["result-mod"] ? (
              <NavIcon icon={FI.chevronRight} size={14} />
            ) : (
              <NavIcon icon={FI.chevronDown} size={14} />
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
                  <NavIcon icon={FI.chevronRight} size={12} />
                ) : (
                  <NavIcon icon={FI.chevronDown} size={12} />
                )}
              </button>

              {!collapsed["phase-1"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/academic/rules"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/academic/rules")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.grading} size={15} />
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
                  <NavIcon icon={FI.chevronRight} size={12} />
                ) : (
                  <NavIcon icon={FI.chevronDown} size={12} />
                )}
              </button>

              {!collapsed["phase-2"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/setup/exams"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/setup/exams")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.examConfig} size={15} />
                      <span>Exam Configuration</span>
                  </Link>

                  <Link
                    href="/setup/exam-routine"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/setup/exam-routine")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.examRoutine} size={15} />
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
                  <NavIcon icon={FI.chevronRight} size={12} />
                ) : (
                  <NavIcon icon={FI.chevronDown} size={12} />
                )}
              </button>

              {!collapsed["phase-3"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/marks/entry"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/marks/entry")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.markEntry} size={15} />
                      <span>Mark Entry</span>
                  </Link>

                  <Link
                    href="/results/review"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/results/review")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.processReview} size={15} />
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
                  <NavIcon icon={FI.chevronRight} size={12} />
                ) : (
                  <NavIcon icon={FI.chevronDown} size={12} />
                )}
              </button>

              {!collapsed["phase-4"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/results/publish"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/results/publish")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.publish} size={15} />
                      <span>Publish Results</span>
                  </Link>

                  <Link
                    href="/reports/tabulation"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/reports/tabulation")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.tabulation} size={15} />
                      <span>Tabulation Sheet</span>
                  </Link>

                  <Link
                    href="/reports/at-a-glance"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/reports/at-a-glance")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.glance} size={15} />
                      <span>At a Glance</span>
                  </Link>

                  <Link
                    href="/reports/marksheet"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/reports/marksheet")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.reportCards} size={15} />
                      <span>Report Cards</span>
                  </Link>

                  <Link
                    href="/reports/fail-list"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/reports/fail-list")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.failList} size={15} />
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
                  <NavIcon icon={FI.sms} size={18} />
                      <span>SMS & Notices</span>
                </div>
                {collapsed["sms-mod"] ? (
                  <NavIcon icon={FI.chevronRight} size={14} />
                ) : (
                  <NavIcon icon={FI.chevronDown} size={14} />
                )}
              </button>

              {/* Indented Sub-items */}
              {!collapsed["sms-mod"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/notifications/sms"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/notifications/sms") || isLinkActive("/sms/result")
                        ? "bg-gradient-to-r from-violet-400/30 via-violet-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#c4b5fd]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.sms} size={15} />
                      <span>Result SMS</span>
                  </Link>

                  <Link
                    href="/sms/custom"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/sms/custom")
                        ? "bg-gradient-to-r from-violet-400/30 via-violet-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#c4b5fd]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.chat} size={15} />
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
                  <NavIcon icon={FI.fees} size={18} />
                      <span>Student Fees</span>
                </div>
                {collapsed["student-fee-mod"] ? (
                  <NavIcon icon={FI.chevronRight} size={14} />
                ) : (
                  <NavIcon icon={FI.chevronDown} size={14} />
                )}
              </button>

              {/* Indented Sub-items */}
              {!collapsed["student-fee-mod"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/fees"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/fees")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.feeSetup} size={15} />
                      <span>Fee Setup</span>
                  </Link>

                  <Link
                    href="/fees/waiver"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/fees/waiver")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.waiver} size={15} />
                      <span>Waivers & Scholarships</span>
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
                  <NavIcon icon={FI.collection} size={18} />
                      <span>Fee Collection</span>
                </div>
                {collapsed["manual-fee-mod"] ? (
                  <NavIcon icon={FI.chevronRight} size={14} />
                ) : (
                  <NavIcon icon={FI.chevronDown} size={14} />
                )}
              </button>

              {/* Indented Sub-items */}
              {!collapsed["manual-fee-mod"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/fees/collection"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/fees/collection")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.cash} size={15} />
                      <span>Cash Counter</span>
                  </Link>

                  <Link
                    href="/fees/collection/history"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/fees/collection/history")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.ledger} size={15} />
                      <span>Receipts & Ledger</span>
                  </Link>

                  <Link
                    href="/fees/absent-fine"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/fees/absent-fine")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.absentFine} size={15} />
                      <span>Absent Fines</span>
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
                  <NavIcon icon={FI.accounts} size={18} />
                      <span>Accounts & Finance</span>
                </div>
                {collapsed["accountant-mod"] ? (
                  <NavIcon icon={FI.chevronRight} size={14} />
                ) : (
                  <NavIcon icon={FI.chevronDown} size={14} />
                )}
              </button>

              {/* Indented Sub-items */}
              {!collapsed["accountant-mod"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/accountant"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/accountant")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.accountsOverview} size={15} />
                      <span>Overview & Ledger</span>
                  </Link>

                  <Link
                    href="/accountant/income"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/accountant/income")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.income} size={15} />
                      <span>Income</span>
                  </Link>

                  <Link
                    href="/accountant/expense"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/accountant/expense")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.expense} size={15} />
                      <span>Expenses</span>
                  </Link>

                  <Link
                    href="/accountant/payroll"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/accountant/payroll")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.payroll} size={15} />
                      <span>Payroll</span>
                  </Link>

                  <Link
                    href="/accountant/audit"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/accountant/audit")
                        ? "bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#6ee7b7]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.trial} size={15} />
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
                  <NavIcon icon={FI.downloads} size={18} />
                      <span>Downloads</span>
                </div>
                {collapsed["download-mod"] ? (
                  <NavIcon icon={FI.chevronRight} size={14} />
                ) : (
                  <NavIcon icon={FI.chevronDown} size={14} />
                )}
              </button>

              {/* Indented Sub-items */}
              {!collapsed["download-mod"] && (
                <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                  <Link
                    href="/download/banbeis"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/download/banbeis")
                        ? "bg-gradient-to-r from-amber-400/30 via-amber-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#fcd34d]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.banbeis} size={15} />
                      <span>BANBEIS Census</span>
                  </Link>

                  <Link
                    href="/download/admission-form"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/download/admission-form")
                        ? "bg-gradient-to-r from-amber-400/30 via-amber-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#fcd34d]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.admission} size={15} />
                      <span>Admission Form</span>
                  </Link>

                  <Link
                    href="/download/academic-calendar"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/download/academic-calendar")
                        ? "bg-gradient-to-r from-amber-400/30 via-amber-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#fcd34d]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.academicCal} size={15} />
                      <span>Academic Calendar</span>
                  </Link>

                  <Link
                    href="/setup/student-info"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/setup/student-info")
                        ? "bg-gradient-to-r from-amber-400/30 via-amber-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#fcd34d]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.register} size={15} />
                      <span>Student Register</span>
                  </Link>

                  <Link
                    href="/student/id-cards"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/student/id-cards")
                        ? "bg-gradient-to-r from-amber-400/30 via-amber-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#fcd34d]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.idCards} size={15} />
                      <span>ID Cards</span>
                  </Link>

                  <Link
                    href="/student/transcript"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/student/transcript")
                        ? "bg-gradient-to-r from-amber-400/30 via-amber-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#fcd34d]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.transcripts} size={15} />
                      <span>Transcripts</span>
                  </Link>

                  <Link
                    href="/student/seat-plan"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/student/seat-plan")
                        ? "bg-gradient-to-r from-amber-400/30 via-amber-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#fcd34d]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.seatPlan} size={15} />
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
                <NavIcon icon={FI.settings} size={18} />
                      <span>Settings</span>
              </div>
              {collapsed["setting-mod"] ? (
                <NavIcon icon={FI.chevronRight} size={14} />
              ) : (
                <NavIcon icon={FI.chevronDown} size={14} />
              )}
            </button>

            {/* Indented Sub-items */}
            {!collapsed["setting-mod"] && (
              <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                <Link
                  href="/settings"
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                    isLinkActive("/settings")
                      ? "bg-gradient-to-r from-cyan-400/25 via-cyan-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#67e8f9]"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <NavIcon icon={FI.institution} size={15} />
                      <span>Institution Profile</span>
                </Link>

                <Link
                  href="/settings/staff"
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                    isLinkActive("/settings/staff") || isLinkActive("/settings/teachers")
                      ? "bg-gradient-to-r from-cyan-400/25 via-cyan-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#67e8f9]"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <NavIcon icon={FI.staff} size={15} />
                      <span>Teachers & Staff</span>
                </Link>

                <Link
                  href="/settings/signatures"
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                    isLinkActive("/settings/signatures")
                      ? "bg-gradient-to-r from-cyan-400/25 via-cyan-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#67e8f9]"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <NavIcon icon={FI.signatures} size={15} />
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
                        <NavIcon icon={FI.rolesGroup} size={15} />
                      <span>User Roles</span>
                      </div>
                      {collapsed["user-role-mod"] ? (
                        <NavIcon icon={FI.chevronRight} size={14} />
                      ) : (
                        <NavIcon icon={FI.chevronDown} size={14} />
                      )}
                    </button>

                    {!collapsed["user-role-mod"] && (
                      <div className="ml-4 pl-2.5 border-l border-dashed border-slate-700/80 my-1 space-y-0.5">
                        <Link
                          href="/user-role/roles"
                          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                            isLinkActive("/user-role/roles")
                              ? "bg-gradient-to-r from-purple-400/30 via-fuchsia-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#e9d5ff]"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <NavIcon icon={FI.roles} size={15} />
                      <span>Roles & Permissions</span>
                        </Link>

                        <Link
                          href="/user-role"
                          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                            isLinkActive("/user-role")
                              ? "bg-gradient-to-r from-purple-400/30 via-fuchsia-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#e9d5ff]"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <NavIcon icon={FI.userAccounts} size={15} />
                      <span>User Accounts</span>
                        </Link>

                        <Link
                          href="/user-role/delegation"
                          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                            isLinkActive("/user-role/delegation")
                              ? "bg-gradient-to-r from-purple-400/30 via-fuchsia-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#e9d5ff]"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <NavIcon icon={FI.teacherAccess} size={15} />
                      <span>Teacher Access</span>
                        </Link>

                        <Link
                          href="/user-role/audit-logs"
                          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                            isLinkActive("/user-role/audit-logs")
                              ? "bg-gradient-to-r from-purple-400/30 via-fuchsia-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#e9d5ff]"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <NavIcon icon={FI.audit} size={15} />
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
                  <NavIcon icon={FI.assets} size={18} />
                      <span>Assets</span>
                </div>
                {collapsed["assets-mod"] ? (
                  <NavIcon icon={FI.chevronRight} size={14} />
                ) : (
                  <NavIcon icon={FI.chevronDown} size={14} />
                )}
              </button>

              {!collapsed["assets-mod"] && (
                <div className="mt-1 pl-4 space-y-0.5 text-xs border-l border-slate-700/50 ml-3.5">
                  <Link
                    href="/assets"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/assets")
                        ? "bg-gradient-to-r from-sky-400/25 via-cyan-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#7dd3fc]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.assetRegister} size={15} />
                      <span>Asset Register</span>
                  </Link>

                  <Link
                    href="/assets/categories"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/assets/categories")
                        ? "bg-gradient-to-r from-sky-400/25 via-cyan-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#7dd3fc]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.rooms} size={15} />
                      <span>Rooms & Locations</span>
                  </Link>

                  <Link
                    href="/assets/maintenance"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/assets/maintenance")
                        ? "bg-gradient-to-r from-sky-400/25 via-cyan-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#7dd3fc]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.maintenance} size={15} />
                      <span>Maintenance</span>
                  </Link>

                  <Link
                    href="/assets/depreciation"
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isLinkActive("/assets/depreciation")
                        ? "bg-gradient-to-r from-sky-400/25 via-cyan-400/10 to-transparent text-white font-medium shadow-[inset_3px_0_0_0_#7dd3fc]"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <NavIcon icon={FI.depreciation} size={15} />
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
