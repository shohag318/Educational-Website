"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  History,
  X,
  ChevronLeft,
  ChevronRight,
} from "@/components/iconify/lucide";

interface RecentPageItem {
  path: string;
  title: string;
  module: string;
  color?: string;
  visitedAt: number;
}

const ROUTE_DIRECTORY: Record<string, { title: string; module: string; color: string }> = {
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
  "/session/manager": { title: "Session Manager", module: "Sessions", color: "emerald" },
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

const DOT_COLOR: Record<string, string> = {
  emerald: "#10B981",
  amber: "#F59E0B",
  indigo: "#6366F1",
  purple: "#A855F7",
  violet: "#8B5CF6",
  cyan: "#06B6D4",
  slate: "#94A3B8",
};

function resolvePageDetails(path: string): { title: string; module: string; color: string } {
  if (ROUTE_DIRECTORY[path]) return ROUTE_DIRECTORY[path];
  for (const [key, val] of Object.entries(ROUTE_DIRECTORY)) {
    if (key !== "/" && path.startsWith(key)) return val;
  }
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecentPages(parsed);
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

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
      const filtered = prev.filter((item) => item.path !== pathname);
      const updated = [...filtered, newItem].slice(-MAX_RECENT_PAGES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, [pathname]);

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

  const handleClearAll = () => {
    setRecentPages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const scrollLeft = () => trackRef.current?.scrollBy({ left: -220, behavior: "smooth" });
  const scrollRight = () => trackRef.current?.scrollBy({ left: 220, behavior: "smooth" });

  if (!mounted) {
    return (
      <Box
        className="no-print"
        sx={{
          height: 48,
          bgcolor: "grey.100",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      />
    );
  }

  return (
    <Box
      className="no-print"
      sx={{
        bgcolor: "grey.100",
        borderBottom: "1px solid",
        borderColor: "divider",
        px: { xs: 1.25, sm: 2, md: 2.5 },
        py: 0.75,
        zIndex: 19,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          minHeight: 40,
          px: 1,
          py: 0.5,
          borderRadius: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        }}
      >
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
            flexShrink: 0,
            pl: 0.5,
            pr: 0.75,
            borderRight: "1px solid",
            borderColor: "divider",
            mr: 0.25,
            minHeight: 28,
          }}
        >
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: 1.25,
              display: "grid",
              placeItems: "center",
              bgcolor: "grey.100",
              color: "text.secondary",
            }}
          >
            <History className="w-3.5 h-3.5" />
          </Box>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "text.secondary",
                lineHeight: 1.2,
              }}
            >
              Recent
            </Typography>
          </Box>
        </Stack>

        <IconButton
          size="small"
          onClick={scrollLeft}
          aria-label="Scroll recent pages left"
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            width: 28,
            height: 28,
            borderRadius: 1.25,
            color: "text.secondary",
            "&:hover": { bgcolor: "grey.100" },
          }}
        >
          <ChevronLeft className="w-4 h-4" />
        </IconButton>

        <Box
          ref={trackRef}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            overflowX: "auto",
            scrollBehavior: "smooth",
            py: 0.25,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {recentPages.length === 0 ? (
            <Typography variant="caption" color="text.disabled" sx={{ px: 1, fontStyle: "italic" }}>
              Pages you visit will appear here for quick access
            </Typography>
          ) : (
            recentPages.map((page) => {
              const isActive = pathname === page.path;
              const dot = DOT_COLOR[page.color || "slate"] || DOT_COLOR.slate;

              return (
                <Box
                  key={page.path}
                  data-active={isActive ? "true" : "false"}
                  sx={{
                    position: "relative",
                    flexShrink: 0,
                    "&:hover .recent-close": { opacity: 1 },
                  }}
                >
                  <Chip
                    component={Link}
                    href={page.path}
                    clickable
                    size="small"
                    title={`${page.title} · ${page.module}`}
                    label={
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", maxWidth: { xs: 120, sm: 160 } }}>
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            bgcolor: isActive ? "success.light" : dot,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          component="span"
                          noWrap
                          sx={{
                            fontSize: 12,
                            fontWeight: 600,
                            lineHeight: 1.2,
                            color: "inherit",
                          }}
                        >
                          {page.title}
                        </Typography>
                      </Stack>
                    }
                    sx={{
                      height: 30,
                      borderRadius: 1.5,
                      pr: 2.75,
                      fontWeight: 600,
                      border: "1px solid",
                      ...(isActive
                        ? {
                            bgcolor: "grey.900",
                            color: "common.white",
                            borderColor: "grey.900",
                            "&:hover": { bgcolor: "grey.800" },
                          }
                        : {
                            bgcolor: "grey.50",
                            color: "text.primary",
                            borderColor: "divider",
                            "&:hover": { bgcolor: "grey.100", borderColor: "grey.300" },
                          }),
                      "& .MuiChip-label": { px: 1.25 },
                    }}
                  />
                  <IconButton
                    className="recent-close"
                    size="small"
                    onClick={(e) => handleRemove(e, page.path)}
                    aria-label={`Remove ${page.title}`}
                    sx={{
                      position: "absolute",
                      right: 2,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 18,
                      height: 18,
                      opacity: isActive ? 0.85 : 0,
                      color: isActive ? "grey.400" : "text.disabled",
                      "&:hover": {
                        bgcolor: isActive ? "grey.800" : "grey.200",
                        color: isActive ? "common.white" : "text.primary",
                      },
                    }}
                  >
                    <X className="w-2.5 h-2.5" />
                  </IconButton>
                </Box>
              );
            })
          )}
        </Box>

        <IconButton
          size="small"
          onClick={scrollRight}
          aria-label="Scroll recent pages right"
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            width: 28,
            height: 28,
            borderRadius: 1.25,
            color: "text.secondary",
            "&:hover": { bgcolor: "grey.100" },
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </IconButton>

        {recentPages.length > 0 ? (
          <Tooltip title="Clear recent history">
            <Chip
              size="small"
              clickable
              onClick={handleClearAll}
              icon={<X className="w-3 h-3" />}
              label="Clear"
              sx={{
                height: 28,
                borderRadius: 1.5,
                flexShrink: 0,
                fontWeight: 700,
                fontSize: 11,
                bgcolor: "error.lighter",
                color: "error.dark",
                border: "1px solid",
                borderColor: "error.light",
                "& .MuiChip-icon": { color: "error.main", ml: 0.75 },
                "&:hover": { bgcolor: "error.light", color: "error.darker" },
              }}
            />
          </Tooltip>
        ) : null}
      </Stack>
    </Box>
  );
}
