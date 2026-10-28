"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Contact,
  Filter,
  RotateCcw,
  Download,
  Copy,
  Printer,
  Check,
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  Users,
  Eye,
  EyeOff,
  GraduationCap,
  UserCheck,
  UserX,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { DownloadNavHeader } from "@/app/download/DownloadNavHeader";
import { SessionSelect } from "@/components/SessionSelect";

interface ColumnDef {
  key: string;
  label: string;
  category: "Identity" | "Academic" | "Personal" | "Contact";
  getValue: (enr: any) => string;
}

const ALL_COLUMNS: ColumnDef[] = [
  {
    key: "roll",
    label: "Roll No",
    category: "Academic",
    getValue: (enr) => String(enr.classRoll ?? ""),
  },
  {
    key: "studentIdNo",
    label: "Student ID / Reg",
    category: "Identity",
    getValue: (enr) => enr.student?.studentIdNo ?? "",
  },
  {
    key: "fullName",
    label: "Full Name",
    category: "Identity",
    getValue: (enr) => `${enr.student?.firstName ?? ""} ${enr.student?.lastName ?? ""}`.trim(),
  },
  {
    key: "firstName",
    label: "First Name",
    category: "Identity",
    getValue: (enr) => enr.student?.firstName ?? "",
  },
  {
    key: "lastName",
    label: "Last Name",
    category: "Identity",
    getValue: (enr) => enr.student?.lastName ?? "",
  },
  {
    key: "class",
    label: "Class",
    category: "Academic",
    getValue: (enr) => enr.class?.name ?? "",
  },
  {
    key: "section",
    label: "Section",
    category: "Academic",
    getValue: (enr) => enr.section?.name ?? "",
  },
  {
    key: "shift",
    label: "Shift",
    category: "Academic",
    getValue: (enr) => (enr.section?.shift === "MORNING" ? "Morning" : enr.section?.shift === "DAY" ? "Day" : (enr.section?.shift ?? "")),
  },
  {
    key: "group",
    label: "Group",
    category: "Academic",
    getValue: (enr) => enr.groupType ?? "GENERAL",
  },
  {
    key: "gender",
    label: "Gender",
    category: "Personal",
    getValue: (enr) => enr.student?.gender ?? "",
  },
  {
    key: "religion",
    label: "Religion",
    category: "Personal",
    getValue: (enr) => enr.student?.religion ?? "",
  },
  {
    key: "guardianName",
    label: "Guardian Name",
    category: "Contact",
    getValue: (enr) => enr.student?.guardianName ?? "",
  },
  {
    key: "guardianPhone",
    label: "Guardian Phone (SMS)",
    category: "Contact",
    getValue: (enr) => enr.student?.guardianPhone ?? "",
  },
  {
    key: "address",
    label: "Address",
    category: "Contact",
    getValue: (enr) => enr.student?.address ?? "",
  },
  {
    key: "academicYear",
    label: "Academic Year",
    category: "Academic",
    getValue: (enr) => enr.academicYear?.yearName ?? "2026",
  },
  {
    key: "fourthSubject",
    label: "4th Subject",
    category: "Academic",
    getValue: (enr) => {
      const fourth = enr.allocations?.find((a: any) => a.allocationType === "OPTIONAL_4TH");
      return fourth?.subject ? `${fourth.subject.name} (${fourth.subject.subjectCode})` : "-";
    },
  },
  {
    key: "status",
    label: "Enrollment Status",
    category: "Personal",
    getValue: (enr) => (enr.student?.isActive ? "Active" : "Inactive"),
  },
  {
    key: "studentCategory",
    label: "Student Category",
    category: "Identity",
    getValue: (enr) => {
      let custom: any = {};
      try {
        if (enr.student?.customFields) {
          custom =
            typeof enr.student.customFields === "string"
              ? JSON.parse(enr.student.customFields)
              : enr.student.customFields;
        }
      } catch (e) {}
      return custom.studentCategory || custom.studentCatagory || custom.category || "General";
    },
  },
  {
    key: "service",
    label: "Service",
    category: "Personal",
    getValue: (enr) => {
      let custom: any = {};
      try {
        if (enr.student?.customFields) {
          custom =
            typeof enr.student.customFields === "string"
              ? JSON.parse(enr.student.customFields)
              : enr.student.customFields;
        }
      } catch (e) {}
      return custom.service || custom.services || "None";
    },
  },
];

const DEFAULT_COLUMNS = [
  "roll",
  "studentIdNo",
  "fullName",
  "class",
  "section",
  "shift",
  "group",
  "studentCategory",
  "service",
  "status",
  "guardianName",
  "guardianPhone",
];

export default function StudentInfoPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(DEFAULT_COLUMNS);
  const [showColumnPicker, setShowColumnPicker] = useState(true);
  const [copied, setCopied] = useState(false);

  // Active / Inactive selection & messaging
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Promotion Modal State
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteEnrollments, setPromoteEnrollments] = useState<any[]>([]);
  const [targetClassId, setTargetClassId] = useState("");
  const [targetSectionId, setTargetSectionId] = useState("");
  const [targetAcademicYearId, setTargetAcademicYearId] = useState("");
  const [targetGroupType, setTargetGroupType] = useState("SAME");
  const [rollAssignment, setRollAssignment] = useState<"KEEP_SAME" | "RESEQUENCE">("KEEP_SAME");
  const [startingRoll, setStartingRoll] = useState("1");
  const [allocateSubjects, setAllocateSubjects] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Fetch classes and academic years on mount
  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setClasses(data.data);
          if (data.data.length > 0) {
            setSelectedClassId(data.data[0].id);
          }
        }
      })
      .catch((err) => console.error("Error fetching classes:", err));

    fetch("/api/academic-years")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAcademicYears(data.data);
          const current = data.data.find((y: any) => y.isCurrent) || data.data[0];
          if (current) setTargetAcademicYearId(current.id);
        }
      })
      .catch((err) => console.error("Error fetching academic years:", err));
  }, []);

  // Fetch students matching filters
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSession && selectedSession !== "ALL") params.set("session", selectedSession);
      if (selectedClassId) params.set("classId", selectedClassId);
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
      if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStudents(data.data);
      } else {
        setStudents([]);
      }
    } catch (e) {
      console.error(e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSession, selectedClassId, selectedSectionId, selectedShift, selectedGroup, searchQuery, selectedStatus]);

  // Derived sections and shifts for active class
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const classNum = currentClass?.numericValue ?? parseInt(currentClass?.name?.replace(/\D/g, "") || "0", 10);
  const isClass11Or12 = Boolean(
    currentClass && (
      classNum === 11 ||
      classNum === 12 ||
      /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(currentClass.name || "")
    )
  );

  const rawSections = currentClass
    ? currentClass.sections || []
    : classes.flatMap((c) => c.sections || []);

  const availableSections = rawSections.filter((s: any) => {
    if (selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
    if (selectedShift && selectedShift !== "ALL" && s.shift?.toUpperCase() !== selectedShift.toUpperCase()) return false;
    return true;
  });

  const availableShifts = Array.from(
    new Set(
      rawSections
        .map((s: any) => s.shift?.toUpperCase())
        .filter((sh: any) => Boolean(sh) && sh !== "MORNING" && sh !== "DAY")
    )
  ) as string[];

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSectionId("");
    const chosenClass = classes.find((c) => c.id === classId);
    const chosenNum = chosenClass?.numericValue ?? parseInt(chosenClass?.name?.replace(/\D/g, "") || "0", 10);
    if (chosenClass && (chosenNum === 11 || chosenNum === 12 || /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(chosenClass.name || ""))) {
      if (selectedGroup === "GENERAL") setSelectedGroup("ALL");
    }
  };

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    const matching = rawSections.filter((s: any) => {
      if (selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
      if (newShift && newShift !== "ALL" && s.shift?.toUpperCase() !== newShift.toUpperCase()) return false;
      return true;
    });
    if (selectedSectionId) {
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) {
        setSelectedSectionId(matching.length > 0 ? matching[0].id : "");
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedSession("ALL");
    setSelectedShift("");
    setSelectedGroup("ALL");
    setSelectedSectionId("");
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedEnrollmentIds([]);
  };

  const hasActiveFilters = Boolean(
    (selectedSession && selectedSession !== "ALL") ||
    selectedShift ||
    (selectedGroup && selectedGroup !== "ALL") ||
    selectedSectionId ||
    searchQuery ||
    selectedStatus !== "ALL"
  );

  const activeCount = useMemo(() => students.filter((s) => s.student?.isActive).length, [students]);
  const inactiveCount = useMemo(() => students.filter((s) => !s.student?.isActive).length, [students]);

  // Selection handlers
  const handleToggleSelect = (enrId: string) => {
    setSelectedEnrollmentIds((prev) =>
      prev.includes(enrId) ? prev.filter((id) => id !== enrId) : [...prev, enrId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEnrollmentIds.length === students.length && students.length > 0) {
      setSelectedEnrollmentIds([]);
    } else {
      setSelectedEnrollmentIds(students.map((s) => s.id));
    }
  };

  // Toggle single student active/inactive
  const handleToggleSingleStatus = async (studentId: string, currentActive: boolean) => {
    setStatusUpdating(true);
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          isActive: !currentActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          text: `Student marked as ${!currentActive ? "Active" : "Inactive"}.`,
          type: "success",
        });
        setTimeout(() => setStatusMessage(null), 4000);
        await fetchStudents();
      } else {
        alert("Failed to update status: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Bulk active/inactive update
  const handleBulkStatusChange = async (makeActive: boolean) => {
    if (selectedEnrollmentIds.length === 0) return;
    const studentIds = students
      .filter((s) => selectedEnrollmentIds.includes(s.id))
      .map((s) => s.student?.id)
      .filter(Boolean);

    setStatusUpdating(true);
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds,
          isActive: makeActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          text: `Marked ${studentIds.length} student(s) as ${makeActive ? "Active" : "Inactive"}.`,
          type: "success",
        });
        setTimeout(() => setStatusMessage(null), 4000);
        setSelectedEnrollmentIds([]);
        await fetchStudents();
      } else {
        alert("Failed to update: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to update: " + e.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Bulk delete selected students
  const handleBulkDelete = async () => {
    if (selectedEnrollmentIds.length === 0) return;
    const selectedCount = selectedEnrollmentIds.length;
    const confirmMessage = `Are you sure you want to PERMANENTLY DELETE ${selectedCount} selected student(s)?\n\nThis will remove their profile, enrollment records, allocated subjects, and any recorded marks.\n\nThis action cannot be undone!`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const studentIds = students
      .filter((s) => selectedEnrollmentIds.includes(s.id))
      .map((s) => s.student?.id)
      .filter(Boolean);

    setDeleting(true);
    try {
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds,
          enrollmentIds: selectedEnrollmentIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          text: `Successfully deleted ${selectedCount} student(s).`,
          type: "success",
        });
        setTimeout(() => setStatusMessage(null), 4000);
        setSelectedEnrollmentIds([]);
        await fetchStudents();
      } else {
        alert("Failed to delete students: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to delete students: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  // Delete single student row
  const handleDeleteSingleStudent = async (student: any) => {
    const studentName = `${student.student?.firstName || ""} ${student.student?.lastName || ""}`.trim() || "Student";
    const roll = student.classRoll ? ` (Roll: ${student.classRoll})` : "";
    const confirmMessage = `Are you sure you want to permanently delete "${studentName}"${roll}?\n\nThis will remove their enrollment records, subject allocations, and recorded marks. This action cannot be undone!`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.student?.id,
          enrollmentId: student.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          text: `Successfully deleted student "${studentName}".`,
          type: "success",
        });
        setTimeout(() => setStatusMessage(null), 4000);
        setSelectedEnrollmentIds((prev) => prev.filter((id) => id !== student.id));
        await fetchStudents();
      } else {
        alert("Failed to delete student: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to delete student: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  // Promotion Modal opener
  const openPromoteModal = (enrollmentsToPromote: any[]) => {
    if (enrollmentsToPromote.length === 0) return;
    setPromoteEnrollments(enrollmentsToPromote);

    const currClass = classes.find((c) => c.id === selectedClassId);
    // Auto-detect next class by numericValue or next class in list
    const nextClass =
      classes.find((c) => c.numericValue === (currClass?.numericValue || 0) + 1) ||
      classes.find((c) => c.id !== currClass?.id);

    const destClassId = nextClass?.id || (classes.length > 1 ? classes[1].id : selectedClassId);
    setTargetClassId(destClassId);

    const destClass = classes.find((c) => c.id === destClassId);
    const firstSec = destClass?.sections?.[0]?.id || "";
    setTargetSectionId(firstSec);

    setShowPromoteModal(true);
  };

  const handleTargetClassChange = (newClassId: string) => {
    setTargetClassId(newClassId);
    const dest = classes.find((c) => c.id === newClassId);
    setTargetSectionId(dest?.sections?.[0]?.id || "");
  };

  const handleConfirmPromotion = async () => {
    if (!targetClassId || !targetSectionId) {
      alert("Please select target Class and Section.");
      return;
    }
    setPromoting(true);
    try {
      const res = await fetch("/api/students/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentIds: promoteEnrollments.map((e) => e.id),
          targetClassId,
          targetSectionId,
          targetAcademicYearId: targetAcademicYearId || undefined,
          targetGroupType,
          rollAssignment,
          startingRoll: parseInt(startingRoll, 10) || 1,
          allocateSubjects,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPromoteModal(false);
        setSelectedEnrollmentIds([]);
        setStatusMessage({
          text: data.message || `Promoted ${promoteEnrollments.length} student(s) successfully!`,
          type: "success",
        });
        setTimeout(() => setStatusMessage(null), 6000);
        await fetchStudents();
      } else {
        alert("Promotion failed: " + data.error);
      }
    } catch (e: any) {
      alert("Promotion failed: " + e.message);
    } finally {
      setPromoting(false);
    }
  };

  // Column toggle handler
  const toggleColumn = (key: string) => {
    setSelectedColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Quick preset selections
  const applyPreset = (preset: "ALL" | "NONE" | "BASIC" | "CONTACT" | "ACADEMIC") => {
    switch (preset) {
      case "ALL":
        setSelectedColumnKeys(ALL_COLUMNS.map((c) => c.key));
        break;
      case "NONE":
        setSelectedColumnKeys([]);
        break;
      case "BASIC":
        setSelectedColumnKeys(["roll", "studentIdNo", "fullName", "class", "section", "shift"]);
        break;
      case "CONTACT":
        setSelectedColumnKeys(["roll", "fullName", "class", "section", "guardianName", "guardianPhone", "address"]);
        break;
      case "ACADEMIC":
        setSelectedColumnKeys(["roll", "studentIdNo", "fullName", "class", "section", "shift", "group", "academicYear", "fourthSubject"]);
        break;
    }
  };

  // Active columns in defined order
  const activeColumns = useMemo(() => {
    return ALL_COLUMNS.filter((col) => selectedColumnKeys.includes(col.key));
  }, [selectedColumnKeys]);

  // CSV Export Handler
  const handleDownloadCSV = () => {
    if (students.length === 0 || activeColumns.length === 0) {
      alert("No data or no columns selected to export.");
      return;
    }

    const headers = activeColumns.map((col) => `"${col.label.replace(/"/g, '""')}"`);
    const rows = students.map((st) => {
      return activeColumns
        .map((col) => {
          const val = col.getValue(st);
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const classObj = classes.find((c) => c.id === selectedClassId);
    const className = classObj?.name?.replace(/\s+/g, "_") || "All_Classes";
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `Student_Info_${className}_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy to Clipboard (TSV format for Excel/Google Sheets)
  const handleCopyToClipboard = async () => {
    if (students.length === 0 || activeColumns.length === 0) {
      alert("No data or no columns selected to copy.");
      return;
    }

    const headers = activeColumns.map((col) => col.label).join("\t");
    const rows = students.map((st) => {
      return activeColumns.map((col) => col.getValue(st)).join("\t");
    });

    const tsvContent = [headers, ...rows].join("\n");
    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Print Page Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            font-size: 10px;
          }
        }
      `}</style>

      {/* Top Module Sub-Navigation Bar */}
      <DownloadNavHeader />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Contact className="w-5 h-5 text-emerald-600" />
            <span>Phase 1: Student Information & Custom Column Export</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filter student records, customize visible and downloadable columns as you wish, and export custom spreadsheets (CSV, Excel) or print rosters.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyToClipboard}
            disabled={students.length === 0 || activeColumns.length === 0}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            title="Copy table to clipboard to paste directly into Google Sheets or Excel"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copied ? "Copied to Clipboard!" : "Copy Table"}</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={students.length === 0 || activeColumns.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center space-x-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            title="Download CSV containing only the selected columns for the filtered students"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Selected Columns ({activeColumns.length})</span>
          </button>

          <button
            onClick={() => {
              const targets = selectedEnrollmentIds.length > 0
                ? students.filter((s) => selectedEnrollmentIds.includes(s.id))
                : students;
              openPromoteModal(targets);
            }}
            disabled={students.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            title="Promote selected or all filtered students to next class"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Promote {selectedEnrollmentIds.length > 0 ? `(${selectedEnrollmentIds.length})` : "Students"}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Roster</span>
          </button>
        </div>
      </div>

      {/* Status Notification Toast Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold no-print shadow-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Bar: Class, Shift, Group, Section, Status, Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Student Information Filters
            </span>
            {hasActiveFilters && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                Active Filter
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {/* Session Filter */}
          <div>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session:"
              labelClassName="font-semibold text-slate-600 block mb-1"
              selectClassName="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            />
          </div>

          {/* Class Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Shift:</label>
            <select
              value={selectedShift}
              onChange={(e) => handleShiftChange(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="">All Shifts</option>
              <option value="MORNING">Morning</option>
              <option value="DAY">Day</option>
              {availableShifts.map((sh: any) => (
                <option key={sh} value={sh}>
                  {sh.charAt(0) + sh.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Group:</label>
            <select
              value={isClass11Or12 && selectedGroup === "GENERAL" ? "ALL" : selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Groups</option>
              {!isClass11Or12 && <option value="GENERAL">General</option>}
              <option value="SCIENCE">Science</option>
              <option value="HUMANITIES">Humanities</option>
              <option value="BUSINESS_STUDIES">Business Studies</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Section:</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="">All Sections</option>
              {availableSections.map((sec: any) => {
                const shiftLabel = sec.shift === "MORNING" ? "Morning" : sec.shift === "DAY" ? "Day" : sec.shift;
                return (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} {sec.groupType ? `(${sec.groupType})` : ""}{(!selectedShift && shiftLabel) ? ` • ${shiftLabel}` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Statuses ({students.length})</option>
              <option value="ACTIVE">Active Only ({activeCount})</option>
              <option value="INACTIVE">Inactive Only ({inactiveCount})</option>
            </select>
          </div>

          {/* Live Search */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Search Student:</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, Roll, ID..."
                className="w-full p-2 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Selection Action Toolbar */}
      {selectedEnrollmentIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3 no-print animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-3">
            <span className="bg-emerald-500 text-slate-950 font-bold px-2.5 py-0.5 rounded-full text-xs">
              {selectedEnrollmentIds.length} Selected
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Bulk actions for selected students:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={statusUpdating}
              onClick={() => handleBulkStatusChange(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              title="Set selected students as Active"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Set Active</span>
            </button>

            <button
              type="button"
              disabled={statusUpdating}
              onClick={() => handleBulkStatusChange(false)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              title="Set selected students as Inactive"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Set Inactive</span>
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                const selected = students.filter((s) => selectedEnrollmentIds.includes(s.id));
                openPromoteModal(selected);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title="Promote selected students to next class"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Promote ({selectedEnrollmentIds.length})</span>
            </button>

            <button
              type="button"
              disabled={statusUpdating || deleting}
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              title="Permanently delete selected students"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? "Deleting..." : `Delete (${selectedEnrollmentIds.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEnrollmentIds([])}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold hover:bg-white/10 rounded-lg transition"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Column Customizer Panel (Where user selects specific columns to view & download) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Customize Download Columns ({activeColumns.length} of {ALL_COLUMNS.length} Selected)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Presets:</span>
            <button
              onClick={() => applyPreset("ALL")}
              className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
            >
              Select All
            </button>
            <button
              onClick={() => applyPreset("BASIC")}
              className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
            >
              Basic Info
            </button>
            <button
              onClick={() => applyPreset("CONTACT")}
              className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
            >
              Contact List
            </button>
            <button
              onClick={() => applyPreset("ACADEMIC")}
              className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
            >
              Academic
            </button>
            <button
              onClick={() => applyPreset("NONE")}
              className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-red-600"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-500 ml-1 flex items-center space-x-1"
            >
              {showColumnPicker ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showColumnPicker ? "Collapse" : "Expand"}</span>
            </button>
          </div>
        </div>

        {/* Checkbox Chips Grid */}
        {showColumnPicker && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
            {ALL_COLUMNS.map((col) => {
              const isSelected = selectedColumnKeys.includes(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                  <span>{col.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Institutional Printable Header (For Print view only) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
          Dhaka Ideal Model High School & College
        </h1>
        <p className="text-xs text-slate-600">
          Mirpur, Dhaka, Bangladesh • EIIN: 108254
        </p>
        <div className="mt-2 inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
          Student Information Roster
        </div>
        <div className="text-xs text-slate-600 mt-1 font-medium">
          Class: {classes.find((c) => c.id === selectedClassId)?.name || "All"}
          {selectedShift ? ` • Shift: ${selectedShift === "MORNING" ? "Morning" : selectedShift === "DAY" ? "Day" : selectedShift}` : ""}
          {selectedSectionId ? ` • Section: ${availableSections.find((s: any) => s.id === selectedSectionId)?.name}` : ""}
          {selectedGroup && selectedGroup !== "ALL" ? ` • Group: ${selectedGroup}` : ""}
          {" • Total Students: "}{students.length}
        </div>
      </div>

      {/* Student Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 no-print">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Student Records ({students.length} found)
            </h2>
            <div className="flex items-center space-x-1.5 ml-2">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {activeCount} Active
              </span>
              {inactiveCount > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {inactiveCount} Inactive
                </span>
              )}
            </div>
          </div>

          {/* Quick Filter Buttons: Active & Inactive */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "ACTIVE" ? "ALL" : "ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                selectedStatus === "ACTIVE"
                  ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
              title={selectedStatus === "ACTIVE" ? "Showing Active students. Click to show all." : "Filter: Show Active students"}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Active</span>
              {selectedStatus === "ACTIVE" && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "INACTIVE" ? "ALL" : "INACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                selectedStatus === "INACTIVE"
                  ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/20"
                  : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
              }`}
              title={selectedStatus === "INACTIVE" ? "Showing Inactive students. Click to show all." : "Filter: Show Inactive students"}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Inactive</span>
              {selectedStatus === "INACTIVE" && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {selectedStatus !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedStatus("ALL")}
                className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-100 rounded transition cursor-pointer"
                title="Reset status filter to show all students"
              >
                Show All
              </button>
            )}
          </div>

          <span className="text-xs text-slate-500">
            Exporting will include only the {activeColumns.length} selected columns shown below.
          </span>
        </div>

        {activeColumns.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic text-xs">
            No columns selected. Please select at least one column from the customizer above.
          </div>
        ) : (
          <div className="table-scroll-container overflow-x-auto overflow-y-auto scroll-smooth border-b border-slate-200 print:max-h-none print:overflow-visible">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] sticky top-0 z-10 shadow-xs">
                <tr className="h-10">
                  <th className="p-2.5 border-r border-slate-200 w-10 text-center no-print bg-slate-50">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedEnrollmentIds.length === students.length}
                      onChange={handleSelectAll}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="Select / Deselect All"
                    />
                  </th>
                  <th className="p-2.5 border-r border-slate-200 w-12 text-center bg-slate-50">#</th>
                  {activeColumns.map((col) => (
                    <th key={col.key} className="p-2.5 border-r border-slate-200 whitespace-nowrap bg-slate-50">
                      {col.label}
                    </th>
                  ))}
                  <th className="p-2.5 border-r border-slate-200 text-center no-print w-32 bg-slate-50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.map((st, index) => {
                  const isSelected = selectedEnrollmentIds.includes(st.id);
                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-slate-50 transition-colors h-10 ${
                        isSelected ? "bg-indigo-50/50" : ""
                      }`}
                    >
                      <td className="p-2.5 border-r border-slate-100 text-center no-print">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(st.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-2.5 border-r border-slate-100 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>
                      {activeColumns.map((col) => {
                        const val = col.getValue(st);

                        // Badges for shift and status
                        if (col.key === "shift") {
                          return (
                            <td key={col.key} className="p-2.5 border-r border-slate-100 font-medium">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  val === "Morning"
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : val === "Day"
                                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                                    : "text-slate-700"
                                }`}
                              >
                                {val}
                              </span>
                            </td>
                          );
                        }

                        if (col.key === "status") {
                          const isActive = Boolean(st.student?.isActive);
                          return (
                            <td key={col.key} className="p-2.5 border-r border-slate-100">
                              <button
                                type="button"
                                disabled={statusUpdating}
                                onClick={() => handleToggleSingleStatus(st.student?.id, isActive)}
                                title="Click to toggle Active / Inactive"
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 cursor-pointer transition-all hover:scale-105 ${
                                  isActive
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                    : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                                <span>{isActive ? "Active" : "Inactive"}</span>
                              </button>
                            </td>
                          );
                        }

                        if (col.key === "studentCategory") {
                          const isMilitary = String(val).toLowerCase() === "military";
                          return (
                            <td key={col.key} className="p-2.5 border-r border-slate-100 font-medium">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isMilitary
                                    ? "bg-amber-50 text-amber-800 border border-amber-300"
                                    : "bg-sky-50 text-sky-800 border border-sky-200"
                                }`}
                              >
                                {val}
                              </span>
                            </td>
                          );
                        }

                        if (col.key === "service") {
                          const srvList = String(val).split(",").map((s) => s.trim()).filter(Boolean);
                          const isNone = srvList.length === 0 || val === "None" || val === "-";
                          return (
                            <td key={col.key} className="p-2.5 border-r border-slate-100 font-medium">
                              {isNone ? (
                                <span className="text-slate-400 text-[11px]">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {srvList.map((s, i) => (
                                    <span
                                      key={i}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        s === "Bus"
                                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                                          : s === "Hostel"
                                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                          : s === "Extra Coaching"
                                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                                          : "bg-slate-100 text-slate-700 border border-slate-200"
                                      }`}
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        }

                        if (col.key === "roll") {
                          return (
                            <td key={col.key} className="p-2.5 border-r border-slate-100 font-mono font-bold text-slate-900">
                              #{val}
                            </td>
                          );
                        }

                        if (col.key === "studentIdNo") {
                          return (
                            <td key={col.key} className="p-2.5 border-r border-slate-100 font-mono text-slate-700">
                              {val}
                            </td>
                          );
                        }

                        if (col.key === "fullName") {
                          return (
                            <td key={col.key} className="p-2.5 border-r border-slate-100 font-semibold text-slate-900 whitespace-nowrap">
                              {val}
                            </td>
                          );
                        }

                        if (col.key === "guardianPhone") {
                          return (
                            <td key={col.key} className="p-2.5 border-r border-slate-100 font-mono text-slate-700 whitespace-nowrap">
                              {val}
                            </td>
                          );
                        }

                        return (
                          <td key={col.key} className="p-2.5 border-r border-slate-100 text-slate-700 whitespace-nowrap">
                            {val || "-"}
                          </td>
                        );
                      })}
                      <td className="p-2.5 border-r border-slate-100 text-center no-print">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => openPromoteModal([st])}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold inline-flex items-center space-x-1 transition-colors cursor-pointer"
                            title="Promote this student to next class"
                          >
                            <GraduationCap className="w-3 h-3 text-indigo-600" />
                            <span>Promote</span>
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => handleDeleteSingleStudent(st)}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold inline-flex items-center transition-colors cursor-pointer disabled:opacity-50"
                            title="Permanently delete this student"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {students.length === 0 && (
                  <tr>
                    <td colSpan={activeColumns.length + 3} className="p-12 text-center text-slate-400 italic text-xs">
                      {loading ? "Loading student records..." : "No student records match the active filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 no-print">
          <div className="flex items-center space-x-2">
            <span>
              Total: <strong className="text-slate-800">{students.length}</strong> students enrolled
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Showing 15 rows view (scroll right for all columns, scroll down for all records)
            </span>
          </div>
          <span>
            Columns: <strong className="text-slate-800">{activeColumns.length}</strong> visible
          </span>
        </div>
      </div>

      {/* Signature blocks for print */}
      <div className="hidden print:grid grid-cols-3 gap-6 text-center text-xs font-semibold text-slate-700 pt-16">
        <div className="border-t border-slate-400 pt-2">Class Teacher&apos;s Signature</div>
        <div className="border-t border-slate-400 pt-2">Section In-Charge</div>
        <div className="border-t border-slate-400 pt-2">Principal / Headmaster</div>
      </div>

      {/* Student Promotion Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Promote Student(s)</h3>
                  <p className="text-xs text-indigo-200">
                    Moving {promoteEnrollments.length} student{promoteEnrollments.length > 1 ? "s" : ""} to next class / session
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Source info notice */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-indigo-900">
                <p className="font-semibold">
                  Source Class: <span className="font-bold">{currentClass?.name || "Selected Students"}</span>
                </p>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Previous class records and marks remain preserved.
                </p>
              </div>

              {/* Target Academic Year */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Academic Year:</label>
                <select
                  value={targetAcademicYearId}
                  onChange={(e) => setTargetAcademicYearId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800 text-xs"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.year} {ay.isCurrent ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Class */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Class:</label>
                <select
                  value={targetClassId}
                  onChange={(e) => handleTargetClassChange(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-slate-800 text-xs"
                >
                  <option value="">-- Select Target Class --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Section */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Section:</label>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="">-- Select Section --</option>
                  {classes
                    .find((c) => c.id === targetClassId)
                    ?.sections?.map((sec: any) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} {sec.groupType ? `(${sec.groupType})` : ""} {sec.shift ? `• ${sec.shift}` : ""}
                      </option>
                    ))}
                </select>
              </div>

              {/* Target Group */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Group:</label>
                <select
                  value={targetGroupType}
                  onChange={(e) => setTargetGroupType(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800 text-xs"
                >
                  <option value="SAME">Keep Current Group</option>
                  <option value="GENERAL">General</option>
                  <option value="SCIENCE">Science</option>
                  <option value="HUMANITIES">Humanities</option>
                  <option value="BUSINESS_STUDIES">Business Studies</option>
                </select>
              </div>

              {/* Roll Assignment Strategy */}
              <div className="space-y-2 border-t pt-3">
                <label className="font-semibold text-slate-700 block">Class Roll Assignment:</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      rollAssignment === "KEEP_SAME"
                        ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rollAssignment"
                      value="KEEP_SAME"
                      checked={rollAssignment === "KEEP_SAME"}
                      onChange={() => setRollAssignment("KEEP_SAME")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs">Keep Existing Roll</span>
                  </label>

                  <label
                    className={`flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      rollAssignment === "RESEQUENCE"
                        ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rollAssignment"
                      value="RESEQUENCE"
                      checked={rollAssignment === "RESEQUENCE"}
                      onChange={() => setRollAssignment("RESEQUENCE")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs">Re-sequence From</span>
                  </label>
                </div>

                {rollAssignment === "RESEQUENCE" && (
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-slate-500 text-xs">Start roll numbering from:</span>
                    <input
                      type="number"
                      min="1"
                      value={startingRoll}
                      onChange={(e) => setStartingRoll(e.target.value)}
                      className="w-20 p-1.5 border border-slate-200 rounded text-center font-mono font-bold text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Auto Allocate Subjects */}
              <div className="border-t pt-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allocateSubjects}
                    onChange={(e) => setAllocateSubjects(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-800 text-xs">
                    Auto-assign target class subjects
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 ml-5 mt-0.5">
                  Automatically enrolls promoted students in the target class&apos;s configured subject mappings.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPromoteModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={promoting || !targetClassId || !targetSectionId}
                onClick={handleConfirmPromotion}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 transition flex items-center space-x-1.5 cursor-pointer"
              >
                {promoting ? (
                  <span>Promoting...</span>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    <span>Confirm & Promote ({promoteEnrollments.length})</span>
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
