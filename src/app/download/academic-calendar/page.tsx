"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarRange,
  Printer,
  Plus,
  Trash2,
  Pencil,
  Filter,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  School,
  FileText,
  Search,
  Download,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Clock,
  Eye,
  X,
  Save,
  Check,
  AlertCircle,
  Copy,
  ChevronDown,
  Info,
  CalendarDays,
  Building2,
  Bookmark,
  Share2,
} from "lucide-react";
import { DownloadNavHeader } from "../DownloadNavHeader";
import { getStoredSchoolInfo, SchoolBasicInfo } from "@/lib/settingsStore";
import {
  AcademicActivity,
  AcademicCalendarConfig,
  ActivityCategory,
  CATEGORY_CONFIG,
  getStoredCalendarConfig,
  saveCalendarConfig,
  resetCalendarToDefault,
  calculateDateDiffDays,
  formatFriendlyDate,
} from "@/lib/academicCalendarStore";

const MONTHS_LIST = [
  { num: 0, label: "Jan", full: "January", bn: "জানুয়ারি" },
  { num: 1, label: "Feb", full: "February", bn: "ফেব্রুয়ারি" },
  { num: 2, label: "Mar", full: "March", bn: "মার্চ" },
  { num: 3, label: "Apr", full: "April", bn: "এপ্রিল" },
  { num: 4, label: "May", full: "May", bn: "মে" },
  { num: 5, label: "Jun", full: "June", bn: "জুন" },
  { num: 6, label: "Jul", full: "July", bn: "জুলাই" },
  { num: 7, label: "Aug", full: "August", bn: "আগস্ট" },
  { num: 8, label: "Sep", full: "September", bn: "সেপ্টেম্বর" },
  { num: 9, label: "Oct", full: "October", bn: "অক্টোবর" },
  { num: 10, label: "Nov", full: "November", bn: "নভেম্বর" },
  { num: 11, label: "Dec", full: "December", bn: "ডিসেম্বর" },
];

export default function AcademicCalendarPage() {
  const [session, setSession] = useState("2026");
  const [config, setConfig] = useState<AcademicCalendarConfig | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolBasicInfo | null>(null);
  const [viewMode, setViewMode] = useState<"TABLE" | "MATRIX" | "PRINT">("TABLE");

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<number | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formTitleBn, setFormTitleBn] = useState("");
  const [formCategory, setFormCategory] = useState<ActivityCategory>("ACADEMIC");
  const [formStartDate, setFormStartDate] = useState("2026-01-01");
  const [formEndDate, setFormEndDate] = useState("2026-01-01");
  const [formIsHoliday, setFormIsHoliday] = useState(false);
  const [formTargetClasses, setFormTargetClasses] = useState("All Classes");
  const [formDescription, setFormDescription] = useState("");

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    setSchoolInfo(getStoredSchoolInfo());
    const initialConfig = getStoredCalendarConfig(session);
    setConfig(initialConfig);
  }, [session]);

  const activities = useMemo(() => config?.activities || [], [config]);

  // Statistics
  const stats = useMemo(() => {
    const totalActs = activities.length;
    const holidays = activities
      .filter((a) => a.isHoliday)
      .reduce((acc, a) => acc + (a.totalDays || 1), 0);
    const examDays = activities
      .filter((a) => a.category === "EXAM")
      .reduce((acc, a) => acc + (a.totalDays || 1), 0);
    const eventCount = activities.filter((a) => a.category === "EVENT").length;
    const workingDays = Math.max(0, 365 - holidays);

    return { totalActs, holidays, examDays, eventCount, workingDays };
  }, [activities]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Month Filter (checks if start or end date falls in month)
      if (selectedMonth !== "ALL") {
        const startM = new Date(act.startDate).getMonth();
        const endM = new Date(act.endDate).getMonth();
        if (startM !== selectedMonth && endM !== selectedMonth) return false;
      }

      // Category Filter
      if (selectedCategory !== "ALL" && act.category !== selectedCategory) {
        return false;
      }

      // Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const titleMatch = (act.title || "").toLowerCase().includes(q);
        const titleBnMatch = (act.titleBn || "").toLowerCase().includes(q);
        const descMatch = (act.description || "").toLowerCase().includes(q);
        const classMatch = (act.targetClasses || "").toLowerCase().includes(q);
        if (!titleMatch && !titleBnMatch && !descMatch && !classMatch) return false;
      }

      return true;
    });
  }, [activities, selectedMonth, selectedCategory, searchTerm]);

  // Open Modal for Add
  const handleOpenAddModal = (monthNum?: number) => {
    setEditingActivityId(null);
    setFormTitle("");
    setFormTitleBn("");
    setFormCategory("ACADEMIC");
    const mStr = monthNum !== undefined ? String(monthNum + 1).padStart(2, "0") : "01";
    setFormStartDate(`${session}-${mStr}-01`);
    setFormEndDate(`${session}-${mStr}-01`);
    setFormIsHoliday(false);
    setFormTargetClasses("All Classes");
    setFormDescription("");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (act: AcademicActivity) => {
    setEditingActivityId(act.id);
    setFormTitle(act.title);
    setFormTitleBn(act.titleBn || "");
    setFormCategory(act.category);
    setFormStartDate(act.startDate);
    setFormEndDate(act.endDate);
    setFormIsHoliday(act.isHoliday);
    setFormTargetClasses(act.targetClasses || "All Classes");
    setFormDescription(act.description || "");
    setIsModalOpen(true);
  };

  // Save Activity (Add / Update)
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    if (!formTitle.trim()) {
      alert("Please provide an activity title.");
      return;
    }

    const totalDays = calculateDateDiffDays(formStartDate, formEndDate);

    const activityData: AcademicActivity = {
      id: editingActivityId || `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      session,
      title: formTitle.trim(),
      titleBn: formTitleBn.trim() || undefined,
      category: formCategory,
      startDate: formStartDate,
      endDate: formEndDate,
      totalDays,
      isHoliday: formIsHoliday,
      targetClasses: formTargetClasses,
      description: formDescription.trim() || undefined,
    };

    let updatedActivities: AcademicActivity[];
    if (editingActivityId) {
      updatedActivities = config.activities.map((a) =>
        a.id === editingActivityId ? activityData : a
      );
    } else {
      updatedActivities = [...config.activities, activityData];
    }

    // Sort chronologically by start date
    updatedActivities.sort((a, b) => a.startDate.localeCompare(b.startDate));

    const updatedConfig: AcademicCalendarConfig = {
      ...config,
      activities: updatedActivities,
    };

    setConfig(updatedConfig);
    saveCalendarConfig(updatedConfig);
    setIsModalOpen(false);
    showToast(editingActivityId ? "Academic activity updated successfully!" : "New academic activity added!");
  };

  // Delete Activity
  const handleDeleteActivity = (id: string, title: string) => {
    if (!config) return;
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    const updatedActivities = config.activities.filter((a) => a.id !== id);
    const updatedConfig: AcademicCalendarConfig = {
      ...config,
      activities: updatedActivities,
    };
    setConfig(updatedConfig);
    saveCalendarConfig(updatedConfig);
    showToast(`"${title}" removed from academic calendar.`);
  };

  // Duplicate Activity
  const handleDuplicateActivity = (act: AcademicActivity) => {
    if (!config) return;
    const duplicated: AcademicActivity = {
      ...act,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${act.title} (Copy)`,
    };
    const updatedActivities = [...config.activities, duplicated].sort((a, b) =>
      a.startDate.localeCompare(b.startDate)
    );
    const updatedConfig: AcademicCalendarConfig = {
      ...config,
      activities: updatedActivities,
    };
    setConfig(updatedConfig);
    saveCalendarConfig(updatedConfig);
    showToast(`Duplicated "${act.title}".`);
  };

  // Reset to National Ministry Default
  const handleResetToDefault = () => {
    if (
      !window.confirm(
        `Reset ${session} Academic Calendar to National NCTB / Ministry of Education default schedule? This will restore all standard holidays and exam terms.`
      )
    )
      return;

    const fresh = resetCalendarToDefault(session);
    setConfig(fresh);
    showToast("Academic calendar restored to standard Ministry of Education template!");
  };

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (!config || activities.length === 0) {
      alert("No activities to export.");
      return;
    }

    const headers = [
      "ID",
      "Session",
      "Title (English)",
      "Title (Bangla)",
      "Category",
      "Start Date",
      "End Date",
      "Total Days",
      "Is Holiday (School Closed)",
      "Target Classes",
      "Description",
    ];

    const rows = activities.map((a) => [
      a.id,
      a.session,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${(a.titleBn || "").replace(/"/g, '""')}"`,
      CATEGORY_CONFIG[a.category]?.label || a.category,
      a.startDate,
      a.endDate,
      a.totalDays,
      a.isHoliday ? "Yes (Closed)" : "No (Working Day)",
      `"${(a.targetClasses || "All Classes").replace(/"/g, '""')}"`,
      `"${(a.description || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Academic_Calendar_${session}_${schoolInfo?.eiin || "School"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Academic Calendar CSV downloaded successfully!");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans print:p-0 print:m-0 print:max-w-none">
      {/* Non-printable Module Navigation Header */}
      <div className="print:hidden">
        <DownloadNavHeader />
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner (Hidden in Print View) */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 print:hidden">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-md border border-amber-700/60 flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5" />
              Download Module &bull; Academic Calendar
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono">
              EIIN: {schoolInfo?.eiin || "108254"}
            </span>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
              Ministry & Board Standard
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Academic Calendar Setup & Annual Activity Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Configure, manage and print the full-year institutional schedule. Record national holidays, extended term
            vacations, examination windows, and co-curricular sports and cultural festivities for Session {session}.
          </p>
        </div>

        {/* View Mode Switches */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("TABLE")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              viewMode === "TABLE"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-slate-800/90 hover:bg-slate-800 text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("MATRIX")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              viewMode === "MATRIX"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-slate-800/90 hover:bg-slate-800 text-slate-200"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>12-Month Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("PRINT")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              viewMode === "PRINT"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printable Calendar</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar (Print:hidden) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Academic / Teaching Days
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-700">{stats.workingDays}</span>
            <span className="text-xs text-slate-400">/ 365 Days</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Active class & practical days</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Holidays & Vacation
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-600">{stats.holidays}</span>
            <span className="text-xs text-slate-400">Days</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Govt, religious & vacation days</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Examination Windows
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-bold font-mono text-purple-700">{stats.examDays}</span>
            <span className="text-xs text-slate-400">Days</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Half-yearly, Test & Annual exams</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Co-curricular & Sports
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-600">{stats.eventCount}</span>
            <span className="text-xs text-slate-400">Events</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Sports, Science Fair, Cultural</span>
        </div>
      </div>

      {/* Control Toolbar (Print:hidden) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Session Switcher & Add Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-700">Academic Session:</label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="2025">Session 2025</option>
                <option value="2026">Session 2026</option>
                <option value="2027">Session 2027</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Academic Activity</span>
            </button>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs cursor-pointer"
              title="Download entire year calendar as CSV / Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("PRINT");
                setTimeout(() => window.print(), 200);
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs cursor-pointer"
              title="Print official institutional calendar"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print A4</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-2 py-1.5 text-slate-500 hover:text-slate-800 text-xs flex items-center space-x-1 underline cursor-pointer"
              title="Reset to official Ministry of Education template"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Default</span>
            </button>
          </div>
        </div>

        {/* Filter Row: Months Tabs & Search */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Months Pills */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Month:
            </span>
            <button
              type="button"
              onClick={() => setSelectedMonth("ALL")}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                selectedMonth === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Year ({activities.length})
            </button>
            {MONTHS_LIST.map((m) => {
              const count = activities.filter((a) => {
                const sM = new Date(a.startDate).getMonth();
                const eM = new Date(a.endDate).getMonth();
                return sM === m.num || eM === m.num;
              }).length;

              return (
                <button
                  key={m.num}
                  type="button"
                  onClick={() => setSelectedMonth(m.num)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    selectedMonth === m.num
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m.label} {count > 0 && <span className="text-[9px] opacity-75">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Category Dropdown & Search Input */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="HOLIDAY">National / Govt Holiday</option>
              <option value="VACATION">Extended Vacation</option>
              <option value="EXAM">Examinations</option>
              <option value="ACADEMIC">Academic Milestones</option>
              <option value="EVENT">Sports & Cultural</option>
              <option value="ADMINISTRATIVE">Administrative & Meetings</option>
            </select>

            <div className="relative">
              <input
                type="text"
                placeholder="Search event / holiday..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-44 p-1.5 pl-6 border border-slate-300 rounded-lg text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === "TABLE" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden print:hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-800">
                Annual Academic Schedule & Activity Register ({filteredActivities.length} Events)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Showing {filteredActivities.length} of {activities.length} total activities
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 whitespace-nowrap">Date & Duration</th>
                  <th className="p-3">Academic Activity / Holiday Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Target Classes</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.map((act, idx) => {
                  const catCfg = CATEGORY_CONFIG[act.category] || CATEGORY_CONFIG.ACADEMIC;
                  return (
                    <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center font-mono text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* Date Range */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 font-mono">
                          {formatFriendlyDate(act.startDate)}
                        </div>
                        {act.startDate !== act.endDate && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            to {formatFriendlyDate(act.endDate)}
                          </div>
                        )}
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                          {act.totalDays} {act.totalDays > 1 ? "Days" : "Day"}
                        </span>
                      </td>

                      {/* Activity Name */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{act.title}</div>
                        {act.titleBn && (
                          <div className="text-xs text-slate-500 font-serif mt-0.5">
                            {act.titleBn}
                          </div>
                        )}
                        {act.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 max-w-md line-clamp-2">
                            {act.description}
                          </p>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${catCfg.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${catCfg.dotColor}`}></span>
                          <span>{catCfg.label}</span>
                        </span>
                      </td>

                      {/* Holiday or Working Day */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {act.isHoliday ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            School Closed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Working Day
                          </span>
                        )}
                      </td>

                      {/* Classes */}
                      <td className="p-3 whitespace-nowrap text-slate-600 font-medium">
                        {act.targetClasses || "All Classes"}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(act)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition"
                            title="Edit Activity"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateActivity(act)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                            title="Duplicate Activity"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.id, act.title)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                            title="Delete Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredActivities.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      No academic activities found for the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: 12-MONTH MATRIX WALL PLANNER VIEW */}
      {viewMode === "MATRIX" && (
        <div className="space-y-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MONTHS_LIST.map((m) => {
              const monthActivities = activities.filter((a) => {
                const sM = new Date(a.startDate).getMonth();
                const eM = new Date(a.endDate).getMonth();
                return sM === m.num || eM === m.num;
              });

              const holidayDaysInMonth = monthActivities
                .filter((a) => a.isHoliday)
                .reduce((acc, a) => acc + (a.totalDays || 1), 0);

              return (
                <div
                  key={m.num}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{m.full}</span>
                        <span className="text-xs font-serif text-slate-500">({m.bn})</span>
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">{session}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {holidayDaysInMonth > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          {holidayDaysInMonth}d Off
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(m.num)}
                        className="p-1 rounded bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 shadow-2xs"
                        title={`Add Activity in ${m.full}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 space-y-2 flex-1 max-h-64 overflow-y-auto text-xs">
                    {monthActivities.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px] py-4 text-center">
                        Regular classes scheduled
                      </p>
                    ) : (
                      monthActivities.map((act) => {
                        const catCfg = CATEGORY_CONFIG[act.category] || CATEGORY_CONFIG.ACADEMIC;
                        return (
                          <div
                            key={act.id}
                            onClick={() => handleOpenEditModal(act)}
                            className={`p-2 rounded-lg border ${catCfg.bgLight} ${catCfg.borderClass} cursor-pointer hover:shadow-xs transition group`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-slate-900 text-xs group-hover:text-emerald-800">
                                {act.title}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-600 shrink-0 bg-white/80 px-1 py-0.2 rounded">
                                {new Date(act.startDate).getDate()}{" "}
                                {act.startDate !== act.endDate && `– ${new Date(act.endDate).getDate()}`}
                              </span>
                            </div>
                            {act.titleBn && (
                              <div className="text-[10px] text-slate-600 font-serif mt-0.5 truncate">
                                {act.titleBn}
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-1 mt-1 text-[9px]">
                              <span className={`font-semibold ${catCfg.textClass}`}>
                                {catCfg.label}
                              </span>
                              {act.isHoliday ? (
                                <span className="text-rose-600 font-bold">Closed</span>
                              ) : (
                                <span className="text-emerald-700 font-medium">Open</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: OFFICIAL PRINTABLE CALENDAR (A4 Format) */}
      {(viewMode === "PRINT" || true) && (
        <div
          className={`${
            viewMode !== "PRINT" ? "hidden" : "block"
          } print:block bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6 text-slate-900`}
        >
          {/* Action Bar for Print View */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Official Printable Academic Calendar</h3>
                <p className="text-xs text-slate-500">
                  Ready for A4 page printing or direct PDF export. Press Ctrl+P or click Print.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Calendar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Close Print View
              </button>
            </div>
          </div>

          {/* OFFICIAL INSTITUTIONAL PRINT HEADER */}
          <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
              {schoolInfo?.name || "Dhaka Ideal Model High School & College"}
            </h1>
            {schoolInfo?.nameBn && (
              <h2 className="text-base sm:text-lg font-bold font-serif text-slate-800">
                {schoolInfo.nameBn}
              </h2>
            )}
            <p className="text-xs text-slate-600 font-medium">
              EIIN: <span className="font-mono font-bold">{schoolInfo?.eiin || "108254"}</span>
              {" "}&bull; Center Code: <span className="font-mono">{schoolInfo?.centerCode || "304"}</span>
              {" "}&bull; Education Board: <span className="font-semibold">{schoolInfo?.board || "Dhaka"}</span>
            </p>
            <p className="text-[11px] text-slate-500">
              {schoolInfo?.address || "Road 4, Block D, Mirpur-10, Dhaka-1216"} &bull; Phone: {schoolInfo?.phone || "+880 2-9001234"}
            </p>

            <div className="pt-2">
              <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
                Annual Academic Calendar & Holiday Schedule &bull; Session {session}
              </span>
            </div>
          </div>

          {/* Statistics Summary Cards in Print */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 border border-slate-300 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Days</span>
              <span className="text-sm font-bold font-mono">365</span>
            </div>
            <div className="p-2 border border-slate-300 rounded-lg bg-emerald-50/50">
              <span className="text-[10px] text-emerald-800 block uppercase font-bold">Teaching Days</span>
              <span className="text-sm font-bold font-mono text-emerald-800">{stats.workingDays}</span>
            </div>
            <div className="p-2 border border-slate-300 rounded-lg bg-rose-50/50">
              <span className="text-[10px] text-rose-800 block uppercase font-bold">Holidays & Vacations</span>
              <span className="text-sm font-bold font-mono text-rose-700">{stats.holidays}</span>
            </div>
            <div className="p-2 border border-slate-300 rounded-lg bg-purple-50/50">
              <span className="text-[10px] text-purple-800 block uppercase font-bold">Exam Windows</span>
              <span className="text-sm font-bold font-mono text-purple-800">{stats.examDays}</span>
            </div>
          </div>

          {/* Official Printable Table */}
          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase text-[10px]">
              <tr>
                <th className="p-2 border-r border-slate-300 text-center w-10">SL</th>
                <th className="p-2 border-r border-slate-300 w-36">Date Range</th>
                <th className="p-2 border-r border-slate-300">Name of Holiday / Academic Activity</th>
                <th className="p-2 border-r border-slate-300 w-28">Category</th>
                <th className="p-2 border-r border-slate-300 text-center w-16">Days</th>
                <th className="p-2 border-r border-slate-300 text-center w-24">School Status</th>
                <th className="p-2">Target Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activities.map((act, idx) => (
                <tr key={act.id} className={act.isHoliday ? "bg-rose-50/30" : ""}>
                  <td className="p-1.5 border-r border-slate-200 text-center font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 font-mono whitespace-nowrap text-[11px]">
                    {formatFriendlyDate(act.startDate)}
                    {act.startDate !== act.endDate && (
                      <span className="block text-[10px] text-slate-500">
                        to {formatFriendlyDate(act.endDate)}
                      </span>
                    )}
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <span className="font-bold text-slate-900 block">{act.title}</span>
                    {act.titleBn && (
                      <span className="text-[11px] font-serif text-slate-700 block">
                        {act.titleBn}
                      </span>
                    )}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-[10px] uppercase font-semibold">
                    {act.category}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-mono font-bold">
                    {act.totalDays}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center text-[10px] font-bold">
                    {act.isHoliday ? (
                      <span className="text-rose-700">CLOSED</span>
                    ) : (
                      <span className="text-emerald-700">OPEN</span>
                    )}
                  </td>
                  <td className="p-1.5 text-[10px]">{act.targetClasses || "All Classes"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Guidelines & Directives */}
          <div className="border border-slate-200 rounded-lg p-3 text-[11px] space-y-1.5 bg-slate-50/50">
            <span className="font-bold uppercase tracking-wider text-slate-700 text-[10px] block">
              Directives & General Instructions (নির্দেশনাবলী):
            </span>
            <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
              <li>
                Religious festivals (Eid, Shab-e-Barat, Ramadan) are strictly subject to national moon sighting and Government Gazette orders.
              </li>
              <li>
                National Days (21st Feb, 26th March, 16th December) must be observed in campus with mandatory teacher-student participation.
              </li>
              <li>
                Terminal and Annual Examinations must strictly adhere to NCTB continuous assessment and CQ/MCQ grade slabs.
              </li>
              <li>
                In case of unforeseen natural disruptions or emergency shutdowns, compensatory classes must be organized on weekends.
              </li>
            </ol>
          </div>

          {/* Official Signatures */}
          <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-900">
                Convener
              </div>
              <div className="text-[10px] text-slate-500">
                Academic Routine & Calendar Committee
              </div>
            </div>

            <div>
              <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-900">
                {schoolInfo?.controllerName || "Mohammad Jahangir Hossain"}
              </div>
              <div className="text-[10px] text-slate-500">
                Exam Controller & Vice Principal
              </div>
            </div>

            <div>
              <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-900">
                {schoolInfo?.headName || "Prof. A. K. M. Shamsuddin"}
              </div>
              <div className="text-[10px] text-slate-500">
                {schoolInfo?.headTitle || "Principal"} &bull; Head of Institution
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ACADEMIC ACTIVITY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingActivityId ? "Edit Academic Activity" : "Add New Academic Activity"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Activity / Event Title (English) <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Independence Day, Annual Sports, 1st Term Exam"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Title in Bengali (বাংলা নাম):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. মহান স্বাধীনতা ও জাতীয় দিবস, বার্ষিক ক্রীড়া প্রতিযোগিতা"
                    value={formTitleBn}
                    onChange={(e) => setFormTitleBn(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-serif"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="HOLIDAY">National / Govt Holiday</option>
                    <option value="VACATION">Extended Vacation</option>
                    <option value="EXAM">Examination & Assessment</option>
                    <option value="ACADEMIC">Academic Milestone</option>
                    <option value="EVENT">Sports & Cultural Event</option>
                    <option value="ADMINISTRATIVE">Administrative & Meetings</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Classes:</label>
                  <input
                    type="text"
                    placeholder="All Classes, Class 6 to 10, etc."
                    value={formTargetClasses}
                    onChange={(e) => setFormTargetClasses(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date:</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => {
                      setFormStartDate(e.target.value);
                      if (e.target.value > formEndDate) {
                        setFormEndDate(e.target.value);
                      }
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date:</label>
                  <input
                    type="date"
                    required
                    min={formStartDate}
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Holiday Toggle */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    School Closed (Holiday / Vacation)?
                  </span>
                  <span className="text-[11px] text-slate-500">
                    If checked, this date will be counted as non-teaching holiday.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsHoliday}
                    onChange={(e) => setFormIsHoliday(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Event Guidelines:
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional details, program timing, or dress code guidelines..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingActivityId ? "Update Activity" : "Save Activity"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
