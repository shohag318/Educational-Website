"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarRange,
  PlusCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Users,
  Award,
  Calendar,
  AlertCircle,
  Trash2,
  Pencil,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Search,
  Building2,
  BookmarkCheck,
  ChevronRight,
  HelpCircle,
  Archive,
  AlertTriangle,
} from "lucide-react";
import { SessionNavHeader } from "./SessionNavHeader";
import {
  getStoredSchoolInfo,
  saveStoredSchoolInfo,
} from "@/lib/settingsStore";

interface AcademicYearItem {
  id: string;
  institutionId: string;
  yearName: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  institution?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    enrollments: number;
    exams: number;
  };
}

function SessionControlContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");

  const [sessions, setSessions] = useState<AcademicYearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");

  // Active Sessions Policy & Concurrent Limit State
  const [allowMultipleActive, setAllowMultipleActive] = useState<boolean>(true);
  const [activeLimit, setActiveLimit] = useState<number>(0); // 0 = unlimited, 1 = single, 2, 3, etc.

  // Modal / Create Drawer State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [yearName, setYearName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [termStructure, setTermStructure] = useState("NCTB_3_TERMS");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit State
  const [editingSession, setEditingSession] = useState<AcademicYearItem | null>(null);
  const [editYearName, setEditYearName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editIsCurrent, setEditIsCurrent] = useState(false);

  // Delete / Permanent Delete Confirmation State
  const [permanentDeleteSession, setPermanentDeleteSession] = useState<AcademicYearItem | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/academic-years");
      const json = await res.json();
      if (json.success) {
        setSessions(json.data || []);
      } else {
        setErrorMessage(json.error || "Failed to fetch academic sessions");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    if (initialAction === "create") {
      setShowCreateModal(true);
    }

    // Load active session policy
    if (typeof window !== "undefined") {
      try {
        const storedPolicy = localStorage.getItem("nctb_multi_active_sessions_policy_v1");
        if (storedPolicy) {
          const parsed = JSON.parse(storedPolicy);
          if (typeof parsed.allowMultiple === "boolean") {
            setAllowMultipleActive(parsed.allowMultiple);
          }
          if (typeof parsed.limit === "number") {
            setActiveLimit(parsed.limit);
          }
        }
      } catch (e) {
        // default allowMultiple: true, limit: 0
      }
    }
  }, [initialAction]);

  const handleUpdatePolicy = (allowMultiple: boolean, limit: number) => {
    setAllowMultipleActive(allowMultiple);
    setActiveLimit(limit);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "nctb_multi_active_sessions_policy_v1",
          JSON.stringify({ allowMultiple, limit })
        );
      } catch (e) {
        console.error("Failed to save active session policy", e);
      }
    }
    if (allowMultiple) {
      setSuccessMessage(
        limit === 0
          ? "Multiple active sessions enabled (unlimited). Any number of sessions can now be active concurrently."
          : `Active sessions limit set to ${limit} sessions active at a time.`
      );
    } else {
      setSuccessMessage("Single active session mode selected. Only 1 session will be active at a time.");
    }
  };

  // Quick year suggestion generator
  const currentYearNum = new Date().getFullYear();
  const yearSuggestions = useMemo(() => {
    return [
      String(currentYearNum + 1),
      `${currentYearNum}-${currentYearNum + 1}`,
      `${currentYearNum + 1}-${currentYearNum + 2}`,
      String(currentYearNum + 2),
    ];
  }, [currentYearNum]);

  // Set default dates when yearName changes in create modal
  const handleSelectSuggestion = (suggested: string) => {
    setYearName(suggested);
    const startYear = suggested.split("-")[0] || String(currentYearNum + 1);
    const endYear = suggested.includes("-") ? suggested.split("-")[1] : startYear;
    setStartDate(`${startYear}-01-01`);
    setEndDate(`${endYear}-12-31`);
  };

  const handleOpenCreateModal = () => {
    setErrorMessage("");
    setSuccessMessage("");
    // Default to next year if not set
    const defaultNext = String(currentYearNum + 1);
    setYearName(defaultNext);
    setStartDate(`${defaultNext}-01-01`);
    setEndDate(`${defaultNext}-12-31`);
    setIsCurrent(false);
    setTermStructure("NCTB_3_TERMS");
    setNotes("");
    setShowCreateModal(true);
  };

  // Submit Create Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!yearName.trim()) {
      setErrorMessage("Please enter a valid session name (e.g. 2027 or 2026-2027).");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearName: yearName.trim(),
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          isCurrent,
          allowMultiple: allowMultipleActive,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(`Session "${yearName.trim()}" created successfully!`);
        setShowCreateModal(false);

        // If marked active, synchronize with client store & header
        if (isCurrent) {
          const stored = getStoredSchoolInfo();
          saveStoredSchoolInfo({
            ...stored,
            academicYear: yearName.trim(),
          });
        }

        fetchSessions();
      } else {
        setErrorMessage(json.error || "Failed to create session.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Set as Active Session Handler
  const handleSetActive = async (session: AcademicYearItem) => {
    // Check if limit is reached when in multi-active mode with a specific limit (> 0)
    if (allowMultipleActive && activeLimit > 0 && activeCount >= activeLimit && !session.isCurrent) {
      setErrorMessage(
        `Active session limit (${activeLimit}) reached. Please archive an active session or change the "Active at a time" setting to activate another.`
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/academic-years", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.id,
          isCurrent: true,
          allowMultiple: allowMultipleActive,
        }),
      });

      const json = await res.json();
      if (json.success) {
        if (allowMultipleActive) {
          setSuccessMessage(`Academic session "${session.yearName}" is now active alongside existing active sessions.`);
        } else {
          setSuccessMessage(`Academic session "${session.yearName}" is now active system-wide.`);
        }
        
        // Sync with global header & localStorage
        const stored = getStoredSchoolInfo();
        saveStoredSchoolInfo({
          ...stored,
          academicYear: session.yearName,
        });

        fetchSessions();
      } else {
        setErrorMessage(json.error || "Failed to activate session.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (session: AcademicYearItem) => {
    setEditingSession(session);
    setEditYearName(session.yearName);
    setEditStartDate(session.startDate ? session.startDate.split("T")[0] : "");
    setEditEndDate(session.endDate ? session.endDate.split("T")[0] : "");
    setEditIsCurrent(session.isCurrent);
    setErrorMessage("");
  };

  // Submit Edit Session
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/academic-years", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSession.id,
          yearName: editYearName.trim(),
          startDate: editStartDate ? new Date(editStartDate).toISOString() : undefined,
          endDate: editEndDate ? new Date(editEndDate).toISOString() : undefined,
          isCurrent: editIsCurrent,
          allowMultiple: allowMultipleActive,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(`Session "${editYearName.trim()}" updated successfully.`);
        setEditingSession(null);

        if (editIsCurrent) {
          const stored = getStoredSchoolInfo();
          saveStoredSchoolInfo({
            ...stored,
            academicYear: editYearName.trim(),
          });
        }

        fetchSessions();
      } else {
        setErrorMessage(json.error || "Failed to update session.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Archive Active Session Handler
  const handleArchiveSession = async (session: AcademicYearItem) => {
    try {
      setLoading(true);
      const res = await fetch("/api/academic-years", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.id,
          isCurrent: false,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMessage(`Session "${session.yearName}" moved to Archive.`);
        fetchSessions();
      } else {
        setErrorMessage(json.error || "Failed to archive session.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Permanent Delete Session
  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteSession) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/academic-years?id=${permanentDeleteSession.id}&permanent=true`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMessage(`Session "${permanentDeleteSession.yearName}" and all associated records permanently deleted.`);
        setPermanentDeleteSession(null);
        setDeleteConfirmInput("");
        fetchSessions();
      } else {
        setErrorMessage(json.error || "Failed to delete session.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Dynamic status counts
  const activeSessions = useMemo(() => sessions.filter((s) => s.isCurrent), [sessions]);
  const archivedSessions = useMemo(() => sessions.filter((s) => !s.isCurrent), [sessions]);
  const activeCount = activeSessions.length;
  const archivedCount = archivedSessions.length;

  // Primary active session
  const activeSession = useMemo(() => sessions.find((s) => s.isCurrent), [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchSearch =
        s.yearName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.institution?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === "ACTIVE") return s.isCurrent;
      if (statusFilter === "ARCHIVED") return !s.isCurrent;
      return true;
    });
  }, [sessions, searchTerm, statusFilter]);

  const totalEnrollmentsAcrossActive = useMemo(
    () => activeSessions.reduce((sum, s) => sum + (s._count?.enrollments || 0), 0),
    [activeSessions]
  );
  const totalExamsAcrossActive = useMemo(
    () => activeSessions.reduce((sum, s) => sum + (s._count?.exams || 0), 0),
    [activeSessions]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Session Navigation Header */}
      <SessionNavHeader />

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage("")}
            className="text-rose-700 hover:text-rose-900 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Banner: Active Session Status & Direct Action */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs text-slate-400 font-mono">
              EIIN: {activeSession?.institution?.code || "108254"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Academic Sessions</span>
          </h1>

          <p className="text-sm text-slate-300 max-w-2xl">
            Manage academic sessions, activate the current school year, and track enrolled students.
          </p>
        </div>

        {/* Big Create Session Action */}
        <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-2.5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-slate-950" />
            <span>Create New Session</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Session Card */}
        <div className="bg-white rounded-xl border border-emerald-200/90 p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 opacity-70"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {activeCount > 1 ? `Active Sessions (${activeCount})` : "Current Active Session"}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          {activeCount > 1 ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeSessions.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300"
                  >
                    <span>{s.yearName}</span>
                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-200/80 px-1 rounded">LIVE</span>
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-emerald-800 font-medium mt-1">
                {activeCount} sessions concurrently active
              </p>
            </div>
          ) : (
            <>
              <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>{activeSession?.yearName || "None Set"}</span>
                {activeSession && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {activeSession?.startDate
                    ? new Date(activeSession.startDate).toLocaleDateString("en-GB", {
                        month: "short",
                        year: "numeric",
                      })
                    : "Jan 2026"}{" "}
                  —{" "}
                  {activeSession?.endDate
                    ? new Date(activeSession.endDate).toLocaleDateString("en-GB", {
                        month: "short",
                        year: "numeric",
                      })
                    : "Dec 2026"}
                </span>
              </p>
            </>
          )}
        </div>

        {/* Total Sessions */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Sessions Registered
            </span>
            <CalendarRange className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {sessions.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Archived and future academic calendars
          </p>
        </div>

        {/* Active Enrollments */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Enrollments
            </span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalEnrollmentsAcrossActive}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeCount > 1
              ? `Students across ${activeCount} active sessions`
              : `Students enrolled in active session ${activeSession?.yearName || "None"}`}
          </p>
        </div>

        {/* Active Exams */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Scheduled Exams
            </span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalExamsAcrossActive}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeCount > 1
              ? `Evaluations across ${activeCount} active sessions`
              : "Evaluations linked to active session"}
          </p>
        </div>
      </div>

      {/* Main Content Card: Session Explorer & Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              <CalendarRange className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Academic Sessions & Control Registry
              </h2>
              <p className="text-xs text-slate-500">
                {allowMultipleActive
                  ? "Click \"Set Active\" to activate a session concurrently • Multi-session active is enabled"
                  : "Click \"Set Active\" to immediately switch the working academic year"}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Search Box */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search session..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>

            {/* Filter Pills */}
            <div className="inline-flex p-0.5 rounded-lg border border-slate-300 bg-white text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({sessions.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "ACTIVE"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ARCHIVED")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "ARCHIVED"
                    ? "bg-amber-600 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Archived ({archivedCount})
              </button>
            </div>

            {/* Create Session Button */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Session</span>
            </button>
          </div>
        </div>

        {/* Number of Sessions Active At a Time Control Banner */}
        <div className="mx-4 sm:mx-5 my-3.5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-slate-50 border border-emerald-200 text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">
                  Number of Sessions Active At a Time
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                  {allowMultipleActive
                    ? activeLimit === 0
                      ? "Multi-Session: Unlimited Enabled"
                      : `Multi-Session: Max ${activeLimit} Active`
                    : "Single Active Session Mode"}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  ({activeCount} {activeCount === 1 ? "Session" : "Sessions"} currently active)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Enable multiple academic sessions running concurrently for school, college, and upcoming admissions.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-700">Active at a time:</span>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleUpdatePolicy(false, 1)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  !allowMultipleActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Only 1 session active at a time (activating switches the active session)"
              >
                Single (1)
              </button>
              <button
                type="button"
                onClick={() => handleUpdatePolicy(true, 2)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  allowMultipleActive && activeLimit === 2
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Allow up to 2 active sessions simultaneously (e.g. School + College)"
              >
                2 Sessions
              </button>
              <button
                type="button"
                onClick={() => handleUpdatePolicy(true, 3)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  allowMultipleActive && activeLimit === 3
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Allow up to 3 active sessions simultaneously"
              >
                3 Sessions
              </button>
              <button
                type="button"
                onClick={() => handleUpdatePolicy(true, 0)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  allowMultipleActive && activeLimit === 0
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Allow any number of sessions to be active at the same time"
              >
                Multiple (Unlimited)
              </button>
            </div>
          </div>
        </div>

        {/* Archive Section Banner */}
        {statusFilter === "ARCHIVED" && (
          <div className="mx-4 sm:mx-5 my-3 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
                <Archive className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <span className="font-bold text-amber-950">Archived Academic Sessions</span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Older academic calendars stored in archive. Inactive sessions can be restored using "Set Active" or wiped completely using "Permanent Delete".
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold border border-amber-300 text-[11px]">
                {archivedCount} {archivedCount === 1 ? "Archived Session" : "Archived Sessions"}
              </span>
            </div>
          </div>
        )}

        {/* Sessions Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Session Name</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Calendar Period</th>
                <th className="px-4 py-3.5">Institution Code</th>
                <th className="px-4 py-3.5 text-center">Enrollments</th>
                <th className="px-4 py-3.5 text-center">Exams</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading academic sessions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <CalendarRange className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">
                      {statusFilter === "ARCHIVED"
                        ? "No archived academic sessions found"
                        : statusFilter === "ACTIVE"
                        ? "No active academic sessions found"
                        : "No academic sessions found"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {statusFilter === "ARCHIVED"
                        ? "Sessions that are no longer active will appear in this archive."
                        : statusFilter === "ACTIVE"
                        ? 'Click "Set Active" on an archived session below or create a new session.'
                        : 'Click the "Create New Session" button to add a new academic year.'}
                    </p>
                    {statusFilter !== "ARCHIVED" && (
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="mt-3 inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Create Session Now</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const isLive = session.isCurrent;
                  const startFormatted = session.startDate
                    ? new Date(session.startDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "01 Jan";
                  const endFormatted = session.endDate
                    ? new Date(session.endDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "31 Dec";

                  return (
                    <tr
                      key={session.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isLive ? "bg-emerald-50/40 font-medium" : ""
                      }`}
                    >
                      {/* Session Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                              isLive
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {session.yearName.slice(-2)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                              <span>Session {session.yearName}</span>
                              {isLive && (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>Active</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {session.institution?.name || "Institution Master"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {isLive ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Current Working</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Inactive / Archived
                          </span>
                        )}
                      </td>

                      {/* Calendar Period */}
                      <td className="px-4 py-4 text-slate-700">
                        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{startFormatted}</span>
                          <span className="text-slate-300">&rarr;</span>
                          <span>{endFormatted}</span>
                        </div>
                      </td>

                      {/* Institution Code */}
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200/60">
                          {session.institution?.code || "108254"}
                        </span>
                      </td>

                      {/* Enrollments */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200/60">
                          {session._count?.enrollments || 0}
                        </span>
                      </td>

                      {/* Exams */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                          {session._count?.exams || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {!isLive ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSetActive(session)}
                                className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                title="Set as the current active academic session"
                              >
                                Set Active
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(session)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit session details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setPermanentDeleteSession(session);
                                  setDeleteConfirmInput("");
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 rounded-lg transition-colors cursor-pointer"
                                title="Permanently delete this archived session and all associated records"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Permanent Delete</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleArchiveSession(session)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                title="Move this active session to Archive"
                              >
                                <Archive className="w-3.5 h-3.5 text-amber-700" />
                                <span>Archive</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(session)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit session details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Guidance */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {allowMultipleActive
                ? `Multi-Session Active Mode enabled: Active sessions (${activeCount}) run concurrently across marks, attendance, and fee rosters.`
                : "Tip: Switching the active session immediately adjusts the global student registry, marksheet generation, and tabulations."}
            </span>
          </div>
          <div className="font-medium text-slate-600 flex items-center gap-3">
            <span className="text-emerald-700 font-bold">Active: {activeCount}</span>
            <span className="text-amber-700 font-bold">Archived: {archivedCount}</span>
            <span>Total: {sessions.length}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CREATE SESSION MODAL / DIALOG
      ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CalendarRange className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Create Academic Session
                  </h3>
                  <p className="text-xs text-slate-500">
                    Establish a new academic calendar year for school operations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSession} className="space-y-4">
              {/* Session Name with Suggestions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session Name / Academic Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2027 or 2026-2027"
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold text-slate-800 bg-white"
                  required
                  autoFocus
                />

                {/* Quick Auto-fill Pills */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Suggestions:</span>
                  {yearSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className="px-2 py-0.5 text-xs rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 font-medium border border-slate-200 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date & End Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Academic Term Template */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Academic Term Structure Template
                </label>
                <select
                  value={termStructure}
                  onChange={(e) => setTermStructure(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="NCTB_3_TERMS">
                    NCTB Standard 3 Terms (1st Term, Half-Yearly, Annual Examination)
                  </option>
                  <option value="COLLEGE_SEMESTER">
                    Higher Secondary 2 Semesters (1st Year Annual, Pre-Test & Test Exam)
                  </option>
                  <option value="QUARTERLY">
                    4 Quarters Evaluation (Q1, Q2 Mid-Term, Q3, Q4 Final)
                  </option>
                  <option value="CUSTOM">
                    Single Annual Exam with Continuous Assessments (CA)
                  </option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can configure individual term dates and marks weighting under Term & Period Setup.
                </p>
              </div>

              {/* Description / Circular Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Memo / Circular Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Directorate of Secondary and Higher Education (DSHE) Circular 2027"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>

              {/* Set as Active Switch */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Set as Currently Active Session</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    {allowMultipleActive
                      ? "If checked, this session will become active concurrently alongside existing active sessions."
                      : "If checked, this session will immediately become the default active academic calendar across all modules."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Confirm & Create Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT SESSION MODAL
      ========================================================================= */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Session {editingSession.yearName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modify session calendar validity and activation status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session Name
                </label>
                <input
                  type="text"
                  value={editYearName}
                  onChange={(e) => setEditYearName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Set as Current Active Session
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {allowMultipleActive
                      ? "Enables this session as active concurrently with other active sessions"
                      : "Makes this session the active calendar across all modules"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsCurrent}
                  onChange={(e) => setEditIsCurrent(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          PERMANENT DELETE CONFIRMATION MODAL
      ========================================================================= */}
      {permanentDeleteSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-xs">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-wide">
                  <span>Irreversible Action</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Permanently Delete Session "{permanentDeleteSession.yearName}"?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This action will <strong className="text-rose-700">permanently purge</strong> this academic session and all its associated records from the database.
                </p>
              </div>
            </div>

            {/* Impact Details Box */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3">
              <span className="text-xs font-bold text-rose-900 block">
                Data to be permanently erased:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-rose-100 shadow-2xs">
                  <div className="text-[11px] text-slate-500 font-medium">Student Enrollments</div>
                  <div className="text-lg font-black text-rose-700">
                    {permanentDeleteSession._count?.enrollments || 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-rose-100 shadow-2xs">
                  <div className="text-[11px] text-slate-500 font-medium">Examinations & Rules</div>
                  <div className="text-lg font-black text-rose-700">
                    {permanentDeleteSession._count?.exams || 0}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-rose-800 leading-normal">
                Includes all student marks, exam configs, grade calculations, mark component entries, audit logs, and result sheets associated with Session {permanentDeleteSession.yearName}.
              </p>
            </div>

            {/* Confirmation Input Guard */}
            {(permanentDeleteSession._count?.enrollments || 0) > 0 || (permanentDeleteSession._count?.exams || 0) > 0 ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Please type <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{permanentDeleteSession.yearName}</span> to confirm permanent deletion:
                </label>
                <input
                  type="text"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder={`Type "${permanentDeleteSession.yearName}"`}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-semibold text-slate-800 bg-white"
                  autoFocus
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                This session currently has no linked student enrollments or exams. It is safe to permanently remove.
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setPermanentDeleteSession(null);
                  setDeleteConfirmInput("");
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                disabled={
                  deleteLoading ||
                  (((permanentDeleteSession._count?.enrollments || 0) > 0 || (permanentDeleteSession._count?.exams || 0) > 0) &&
                    deleteConfirmInput.trim() !== permanentDeleteSession.yearName)
                }
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Permanently Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Permanent Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionControlPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs">Loading Session Control Module...</span>
        </div>
      }
    >
      <SessionControlContent />
    </Suspense>
  );
}

