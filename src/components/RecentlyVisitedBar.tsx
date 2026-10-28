"use client";

import React, { useEffect, useState, useRef, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, X, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface RecentPageItem {
  path: string;
  title: string;
  module: string;
  color?: string;
  visitedAt: number;
}

const ROUTE_DIRECTORY: Record<
  string,
  { title: string; module: string; color: string }
> = {
  "/": { title: "Overview", module: "Core", color: "emerald" },
  "/academic/rules": { title: "Grading Rules", module: "Results", color: "indigo" },
  "/academic/subject-mapping": { title: "Subject Allocation", module: "Students", color: "emerald" },
  "/accountant": { title: "Accounts Overview", module: "Accounts", color: "emerald" },
  "/accountant/income": { title: "Income", module: "Accounts", color: "emerald" },
  "/accountant/expense": { title: "Expenses", module: "Accounts", color: "emerald" },
  "/accountant/payroll": { title: "Payroll", module: "Accounts", color: "emerald" },
  "/accountant/audit": { title: "Trial Balance", module: "Accounts", color: "emerald" },
  "/assets": { title: "Asset Register", module: "Assets", color: "cyan" },
  "/assets/categories": { title: "Campus Locations", module: "Assets", color: "cyan" },
  "/assets/maintenance": { title: "Maintenance", module: "Assets", color: "amber" },
  "/assets/depreciation": { title: "Depreciation", module: "Assets", color: "violet" },
  "/download": { title: "Download Center", module: "Downloads", color: "amber" },
  "/download/banbeis": { title: "BANBEIS Census", module: "Downloads", color: "amber" },
  "/download/admission-form": { title: "Admission Form", module: "Downloads", color: "amber" },
  "/download/academic-calendar": { title: "Academic Calendar", module: "Downloads", color: "amber" },
  "/fees": { title: "Fee Setup", module: "Fees", color: "emerald" },
  "/fees/waiver": { title: "Waivers & Scholarships", module: "Fees", color: "emerald" },
  "/fees/collection": { title: "Cash Counter", module: "Fees", color: "emerald" },
  "/fees/collection/history": { title: "Receipts & Ledger", module: "Fees", color: "emerald" },
  "/fees/absent-fine": { title: "Absent Fines", module: "Fees", color: "emerald" },
  "/marks/entry": { title: "Mark Entry", module: "Results", color: "indigo" },
  "/marks/audit": { title: "Mark Audit", module: "Results", color: "indigo" },
  "/notifications/sms": { title: "Result SMS", module: "SMS", color: "violet" },
  "/reports/at-a-glance": { title: "At a Glance", module: "Results", color: "indigo" },
  "/reports/fail-list": { title: "Failed Students", module: "Results", color: "indigo" },
  "/reports/marksheet": { title: "Report Cards", module: "Results", color: "indigo" },
  "/reports/tabulation": { title: "Tabulation Sheet", module: "Results", color: "indigo" },
  "/results/publish": { title: "Publish Results", module: "Results", color: "indigo" },
  "/results/review": { title: "Process & Review", module: "Results", color: "indigo" },
  "/session": { title: "Session Manager", module: "Sessions", color: "emerald" },
  "/session/create": { title: "Create Session", module: "Sessions", color: "emerald" },
  "/settings": { title: "Institution Profile", module: "Settings", color: "cyan" },
  "/settings/staff": { title: "Teachers & Staff", module: "Settings", color: "cyan" },
  "/setup/classes": { title: "Classes & Sections", module: "Sessions", color: "emerald" },
  "/setup/exam-routine": { title: "Exam Routine", module: "Results", color: "indigo" },
  "/setup/exams": { title: "Exam Configuration", module: "Results", color: "indigo" },
  "/setup/student-info": { title: "Student Register", module: "Downloads", color: "amber" },
  "/setup/students": { title: "Enrollment", module: "Students", color: "emerald" },
  "/setup/subject-mapping": { title: "Subject Mapping", module: "Sessions", color: "emerald" },
  "/sms/custom": { title: "Custom SMS", module: "SMS", color: "violet" },
  "/student/attendance": { title: "Attendance", module: "Students", color: "emerald" },
  "/student/status": { title: "Student Status", module: "Students", color: "emerald" },
  "/student/id-cards": { title: "ID Cards", module: "Downloads", color: "amber" },
  "/student/profile": { title: "Student Profile", module: "Students", color: "emerald" },
  "/student/seat-plan": { title: "Seat Plan", module: "Downloads", color: "amber" },
  "/student/transcript": { title: "Transcripts", module: "Downloads", color: "amber" },
  "/user-role": { title: "User Accounts", module: "User Roles", color: "purple" },
  "/user-role/roles": { title: "Roles & Permissions", module: "User Roles", color: "purple" },
  "/user-role/delegation": { title: "Teacher Access", module: "User Roles", color: "purple" },
  "/user-role/audit-logs": { title: "Audit Logs", module: "User Roles", color: "purple" },
};

const STORAGE_KEY = "nctb_recently_visited_pages_v1";
const MAX_RECENT_PAGES = 10;

function resolvePageDetails(path: string): { title: string; module: string; color: string } {
  if (ROUTE_DIRECTORY[path]) {
    return ROUTE_DIRECTORY[path];
  }
  // Try matching prefix if dynamic subroutes exist
  for (const [key, val] of Object.entries(ROUTE_DIRECTORY)) {
    if (key !== "/" && path.startsWith(key)) {
      return val;
    }
  }
  // Fallback to title-casing the last segment
  const segment = path.split("?")[0].split("/").filter(Boolean).pop() || "Home";
  const title = segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { title, module: "App", color: "slate" };
}

export function RecentlyVisitedBar() {
  const pathname = usePathname();
  const [recentPages, setRecentPages] = useState<RecentPageItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  // Load initial history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentPages(parsed);
        }
      }
    } catch {
      // ignore JSON error
    }
    setMounted(true);
  }, []);

  // Track page visits
  useEffect(() => {
    if (!pathname || pathname.startsWith("/api/")) return;

    const details = resolvePageDetails(pathname);
    const newItem: RecentPageItem = {
      path: pathname,
      title: details.title,
      module: details.module,
      color: details.color,
      visitedAt: Date.now(),
    };

    setRecentPages((prev) => {
      // Remove existing occurrence of this path
      const filtered = prev.filter((item) => item.path !== pathname);
      // Append the new one at the end (or maintain MRU)
      const updated = [...filtered, newItem].slice(-MAX_RECENT_PAGES);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage error
      }
      return updated;
    });
  }, [pathname]);

  // Auto-scroll active item into view
  useEffect(() => {
    if (!trackRef.current) return;
    const activeEl = trackRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [pathname, recentPages]);

  const handleRemove = (e: React.MouseEvent, pathToRemove: string) => {
    e.preventDefault();
    e.stopPropagation();

    setRecentPages((prev) => {
      const updated = prev.filter((item) => item.path !== pathToRemove);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    setRecentPages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  if (!mounted) {
    return (
      <div className="h-9.5 bg-slate-100/70 border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between no-print sticky top-0 z-20" />
    );
  }

  return (
    <div className="h-9.5 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-2 text-xs no-print sticky top-0 z-20 shadow-2xs select-none">
      {/* Left Label */}
      <div className="flex items-center gap-1.5 shrink-0 text-slate-500 font-medium">
        <span className="p-1 rounded bg-slate-100 text-slate-600 flex items-center justify-center">
          <History className="w-3.5 h-3.5" />
        </span>
        <span className="hidden md:inline text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
          Recently Visited
        </span>
      </div>

      {/* Scrollable Recent Items */}
      <div className="flex-1 flex items-center gap-1 min-w-0 relative">
        <button
          onClick={scrollLeft}
          title="Scroll Left"
          className="hidden sm:flex items-center justify-center w-5 h-5 rounded hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 shrink-0 transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div
          ref={trackRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
        >
          {recentPages.length === 0 ? (
            <span className="text-[11px] text-slate-400 italic px-2">
              Pages you visit will appear here for quick access
            </span>
          ) : (
            recentPages.map((page) => {
              const isActive = pathname === page.path;

              return (
                <div
                  key={page.path}
                  data-active={isActive ? "true" : "false"}
                  className="group shrink-0 relative flex items-center"
                >
                  <Link
                    href={page.path}
                    scroll={false}
                    title={`${page.title} (${page.module})`}
                    className={`flex items-center gap-1.5 pl-2.5 pr-6 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ease-out border ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    {/* Small color dot indicating module */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive
                          ? "bg-emerald-400"
                          : page.color === "emerald"
                          ? "bg-emerald-500"
                          : page.color === "amber"
                          ? "bg-amber-500"
                          : page.color === "indigo"
                          ? "bg-indigo-500"
                          : page.color === "purple"
                          ? "bg-purple-500"
                          : page.color === "violet"
                          ? "bg-violet-500"
                          : page.color === "cyan"
                          ? "bg-cyan-500"
                          : "bg-slate-400"
                      }`}
                    />
                    <span className="max-w-[130px] sm:max-w-[160px] truncate leading-tight">
                      {page.title}
                    </span>
                  </Link>

                  {/* Close 'x' button inside pill */}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, page.path)}
                    title={`Remove ${page.title} from history`}
                    className={`absolute right-1.5 p-0.5 rounded-full transition-opacity ${
                      isActive
                        ? "text-slate-400 hover:text-white hover:bg-slate-800"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={scrollRight}
          title="Scroll Right"
          className="hidden sm:flex items-center justify-center w-5 h-5 rounded hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 shrink-0 transition"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Clear All Action */}
      {recentPages.length > 0 && (
        <button
          onClick={handleClearAll}
          title="Clear all recently visited pages"
          className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden lg:inline text-[10px]">Clear</span>
        </button>
      )}
    </div>
  );
}
