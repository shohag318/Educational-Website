"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Printer,
  RotateCcw,
  UserCheck,
  UserX,
  ArrowRightLeft,
  HeartCrack,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Check,
  Calendar,
  Layers,
  ChevronDown,
  Building,
  School,
  Edit3,
  FileText,
  Info,
  ShieldAlert,
} from "lucide-react";
import * as XLSX from "xlsx";
import { StudentNavHeader } from "@/app/student/StudentNavHeader";
import { SessionSelect } from "@/components/SessionSelect";
import { getStoredSchoolInfo } from "@/lib/settingsStore";

export type StudentStatusType = "ACTIVE" | "INACTIVE" | "DROPOUT" | "TRANSFER" | "DEATH";

interface StudentEnrollmentItem {
  id: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  groupType: string;
  classRoll: number;
  student: {
    id: string;
    studentIdNo: string;
    firstName: string;
    lastName: string;
    gender?: string;
    religion?: string;
    address?: string;
    guardianName: string;
    guardianPhone: string;
    customFields?: string;
    isActive: boolean;
  };
  class?: { id: string; name: string };
  section?: { id: string; name: string; shift?: string; groupType?: string };
  academicYear?: { id: string; yearName: string };
}

const STATUS_CONFIG: Record<
  StudentStatusType,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotBg: string;
    description: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    dotBg: "bg-emerald-500",
    description: "Regular enrolled student eligible for marks, exams & attendance",
  },
  INACTIVE: {
    label: "Inactive",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    badgeBorder: "border-slate-300",
    dotBg: "bg-slate-400",
    description: "Temporarily suspended, unverified, or on prolonged authorized leave",
  },
  DROPOUT: {
    label: "Dropout",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-300",
    dotBg: "bg-amber-500",
    description: "Discontinued studies or ceased attendance without official TC",
  },
  TRANSFER: {
    label: "Transfer",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-800",
    badgeBorder: "border-sky-300",
    dotBg: "bg-sky-500",
    description: "Transferred to another institution with formal Transfer Certificate",
  },
  DEATH: {
    label: "Deceased",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-800",
    badgeBorder: "border-rose-300",
    dotBg: "bg-rose-600",
    description: "Deceased student record permanently archived for institutional census",
  },
};

function parseStudentStatus(student: StudentEnrollmentItem["student"]) {
  let custom: Record<string, any> = {};
  if (student.customFields) {
    try {
      custom = typeof student.customFields === "string" ? JSON.parse(student.customFields) : student.customFields;
    } catch {}
  }
  const status: StudentStatusType =
    custom.studentStatus || (student.isActive === false ? "INACTIVE" : "ACTIVE");

  return {
    status,
    reason: custom.statusReason || "",
    date: custom.statusDate || "",
    tcNumber: custom.tcNumber || "",
    remarks: custom.statusRemarks || "",
  };
}

export default function StudentStatusPage() {
  const [students, setStudents] = useState<StudentEnrollmentItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected row checkboxes for batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"single" | "batch">("single");
  const [targetStudent, setTargetStudent] = useState<StudentEnrollmentItem | null>(null);

  // Modal form inputs
  const [newStatus, setNewStatus] = useState<StudentStatusType>("ACTIVE");
  const [statusReason, setStatusReason] = useState("");
  const [statusDate, setStatusDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tcNumber, setTcNumber] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setSchoolInfo(getStoredSchoolInfo());
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Classes
      const cRes = await fetch("/api/classes");
      const cData = await cRes.json();
      const classList = Array.isArray(cData.data)
        ? cData.data
        : Array.isArray(cData.classes)
        ? cData.classes
        : [];

      if (classList.length > 0) {
        setClasses(classList);
        setSelectedClassId(classList[0].id);
      }

      // Academic Sessions
      const aRes = await fetch("/api/academic-years");
      const aData = await aRes.json();
      if (aData.data) {
        setSessions(aData.data);
      }
    } catch (err) {
      console.error("Failed to load classes/sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId);
  }, [classes, selectedClassId]);

  const classNum = selectedClass ? parseInt(selectedClass.name?.replace(/\D/g, "") || "0", 10) : 0;
  const isClass11Or12 =
    classNum === 11 ||
    classNum === 12 ||
    /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(selectedClass?.name || "");

  const standardGroups = [
    { value: "ALL", label: "All Groups" },
    { value: "SCIENCE", label: "Science" },
    { value: "HUMANITIES", label: "Humanities" },
    { value: "BUSINESS_STUDIES", label: "Business Studies" },
    ...(!isClass11Or12 ? [{ value: "GENERAL", label: "General" }] : []),
  ];

  const customGroups = Array.from(
    new Set(
      (selectedClass?.sections || [])
        .map((s: any) => s.groupType?.toUpperCase())
        .filter((g: any) => Boolean(g) && !standardGroups.some((sg) => sg.value === g))
    )
  ) as string[];

  const availableShifts = Array.from(
    new Set(
      selectedClass?.sections
        ?.map((s: any) => s.shift?.toUpperCase())
        .filter((sh: any) => Boolean(sh) && sh !== "MORNING" && sh !== "DAY") || []
    )
  ) as string[];

  const filteredSections = useMemo(() => {
    return (selectedClass?.sections || []).filter((s: any) => {
      if (selectedShift && selectedShift !== "ALL" && s.shift?.toUpperCase() !== selectedShift.toUpperCase()) return false;
      if (selectedGroup && selectedGroup !== "ALL" && s.groupType?.toUpperCase() !== selectedGroup.toUpperCase()) return false;
      return true;
    });
  }, [selectedClass, selectedShift, selectedGroup]);

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setSelectedGroup("ALL");
    setSelectedShift("");
    setSelectedSectionId("");
  };

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    if (!selectedClass) return;
    if (selectedSectionId) {
      const matching = (selectedClass.sections || []).filter((s: any) => {
        if (newShift && newShift !== "ALL" && s.shift?.toUpperCase() !== newShift.toUpperCase()) return false;
        if (selectedGroup && selectedGroup !== "ALL" && s.groupType?.toUpperCase() !== selectedGroup.toUpperCase()) return false;
        return true;
      });
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) setSelectedSectionId("");
    }
  };

  const handleGroupChange = (newGroup: string) => {
    setSelectedGroup(newGroup);
    if (!selectedClass) return;
    if (selectedSectionId) {
      const matching = (selectedClass.sections || []).filter((s: any) => {
        if (selectedShift && selectedShift !== "ALL" && s.shift?.toUpperCase() !== selectedShift.toUpperCase()) return false;
        if (newGroup && newGroup !== "ALL" && s.groupType?.toUpperCase() !== newGroup.toUpperCase()) return false;
        return true;
      });
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) setSelectedSectionId("");
    }
  };

  // Fetch students whenever class, session, shift, group, or section filter changes
  useEffect(() => {
    fetchStudents();
  }, [selectedClassId, selectedSession, selectedShift, selectedGroup, selectedSectionId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/api/students?limit=1000`;
      if (selectedClassId && selectedClassId !== "ALL") {
        url += `&classId=${encodeURIComponent(selectedClassId)}`;
      }
      if (selectedSession && selectedSession !== "ALL") {
        url += `&session=${encodeURIComponent(selectedSession)}`;
      }
      if (selectedShift && selectedShift !== "ALL") {
        url += `&shift=${encodeURIComponent(selectedShift)}`;
      }
      if (selectedGroup && selectedGroup !== "ALL") {
        url += `&groupType=${encodeURIComponent(selectedGroup)}`;
      }
      if (selectedSectionId) {
        url += `&sectionId=${encodeURIComponent(selectedSectionId)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStudents(data.data);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((enr) => {
      // Class filter
      if (selectedClassId && selectedClassId !== "ALL" && enr.classId !== selectedClassId) {
        return false;
      }

      // Shift filter
      if (selectedShift && selectedShift !== "ALL") {
        const enrShift = (enr.section?.shift || "").toUpperCase();
        if (enrShift && enrShift !== selectedShift.toUpperCase()) return false;
      }

      // Group filter
      if (selectedGroup && selectedGroup !== "ALL") {
        const enrGroup = (enr.groupType || enr.section?.groupType || "").toUpperCase();
        if (enrGroup && enrGroup !== selectedGroup.toUpperCase()) return false;
      }

      // Section filter
      if (selectedSectionId && enr.sectionId !== selectedSectionId) return false;

      const { status } = parseStudentStatus(enr.student);
      // Status filter
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${enr.student.firstName} ${enr.student.lastName || ""}`.toLowerCase();
        const roll = String(enr.classRoll);
        const idNo = (enr.student.studentIdNo || "").toLowerCase();
        const phone = (enr.student.guardianPhone || "").toLowerCase();
        const guardian = (enr.student.guardianName || "").toLowerCase();

        if (
          !fullName.includes(q) &&
          !roll.includes(q) &&
          !idNo.includes(q) &&
          !phone.includes(q) &&
          !guardian.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [students, selectedClassId, selectedShift, selectedGroup, selectedSectionId, statusFilter, searchQuery]);

  // Overall Status Statistics
  const statusStats = useMemo(() => {
    const stats = {
      TOTAL: students.length,
      ACTIVE: 0,
      INACTIVE: 0,
      DROPOUT: 0,
      TRANSFER: 0,
      DEATH: 0,
    };
    for (const enr of students) {
      const { status } = parseStudentStatus(enr.student);
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    }
    return stats;
  }, [students]);

  // Checkbox Selection
  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((enr) => selectedIds.has(enr.studentId));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<string>();
      filteredStudents.forEach((enr) => next.add(enr.studentId));
      setSelectedIds(next);
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  // Open modal for single student
  const openSingleModal = (enr: StudentEnrollmentItem) => {
    const parsed = parseStudentStatus(enr.student);
    setTargetStudent(enr);
    setModalMode("single");
    setNewStatus(parsed.status);
    setStatusReason(parsed.reason);
    setStatusDate(parsed.date || new Date().toISOString().slice(0, 10));
    setTcNumber(parsed.tcNumber);
    setStatusRemarks(parsed.remarks);
    setModalOpen(true);
  };

  // Open modal for batch change
  const openBatchModal = (preselectedStatus?: StudentStatusType) => {
    if (selectedIds.size === 0) {
      alert("Please select at least one student using the row checkboxes.");
      return;
    }
    setModalMode("batch");
    setTargetStudent(null);
    if (preselectedStatus) setNewStatus(preselectedStatus);
    setStatusReason("");
    setStatusDate(new Date().toISOString().slice(0, 10));
    setTcNumber("");
    setStatusRemarks("");
    setModalOpen(true);
  };

  // Direct 1-Click Status Dropdown in Table Row
  const handleQuickStatusChange = async (enr: StudentEnrollmentItem, nextStatus: StudentStatusType) => {
    const isAct = nextStatus === "ACTIVE";
    const dateToday = new Date().toISOString().slice(0, 10);

    // Optimistic UI update
    setStudents((prev) =>
      prev.map((item) => {
        if (item.id === enr.id) {
          let custom: Record<string, any> = {};
          if (item.student.customFields) {
            try {
              custom =
                typeof item.student.customFields === "string"
                  ? JSON.parse(item.student.customFields)
                  : item.student.customFields;
            } catch {}
          }
          const updatedCustom = {
            ...custom,
            studentStatus: nextStatus,
            statusDate: dateToday,
          };
          return {
            ...item,
            student: {
              ...item.student,
              isActive: isAct,
              customFields: JSON.stringify(updatedCustom),
            },
          };
        }
        return item;
      })
    );

    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: enr.id,
          isActive: isAct,
          customFields: {
            studentStatus: nextStatus,
            statusDate: dateToday,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          `Roll #${enr.classRoll} (${enr.student.firstName}) status changed to ${STATUS_CONFIG[nextStatus].label}`
        );
        window.dispatchEvent(new Event("nctb_student_status_updated"));
      } else {
        alert("Failed to update status: " + data.error);
        fetchStudents();
      }
    } catch (err: any) {
      alert("Error updating status: " + err.message);
      fetchStudents();
    }
  };

  // Submit Modal (Single or Batch)
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isAct = newStatus === "ACTIVE";
    const statusPayload = {
      studentStatus: newStatus,
      statusReason: statusReason.trim(),
      statusDate: statusDate,
      tcNumber: newStatus === "TRANSFER" ? tcNumber.trim() : "",
      statusRemarks: statusRemarks.trim(),
    };

    try {
      if (modalMode === "single" && targetStudent) {
        const res = await fetch("/api/students", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollmentId: targetStudent.id,
            isActive: isAct,
            customFields: statusPayload,
          }),
        });

        const data = await res.json();
        if (data.success) {
          showToast(
            `Roll #${targetStudent.classRoll} (${targetStudent.student.firstName}) updated to ${STATUS_CONFIG[newStatus].label}`
          );
          setModalOpen(false);
          fetchStudents();
          window.dispatchEvent(new Event("nctb_student_status_updated"));
        } else {
          alert("Failed to update: " + data.error);
        }
      } else if (modalMode === "batch") {
        const studentIdsArray = Array.from(selectedIds);
        const res = await fetch("/api/students", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentIds: studentIdsArray,
            isActive: isAct,
            ...statusPayload,
          }),
        });

        const data = await res.json();
        if (data.success) {
          showToast(`Successfully updated ${studentIdsArray.length} student(s) to ${STATUS_CONFIG[newStatus].label}`);
          setSelectedIds(new Set());
          setModalOpen(false);
          fetchStudents();
          window.dispatchEvent(new Event("nctb_student_status_updated"));
        } else {
          alert("Batch update failed: " + data.error);
        }
      }
    } catch (err: any) {
      alert("Error submitting status update: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      alert("No student records available to export.");
      return;
    }

    const headers = [
      "Roll No",
      "Student ID",
      "Student Name",
      "Gender",
      "Class",
      "Section",
      "Guardian Name",
      "Guardian Phone",
      "Current Status",
      "Status Effective Date",
      "Reason / Cause",
      "TC Number",
      "Remarks",
    ];

    const currentClassName = classes.find((c) => c.id === selectedClassId)?.name || "All_Classes";

    const rows = filteredStudents.map((enr) => {
      const parsed = parseStudentStatus(enr.student);
      return [
        enr.classRoll,
        enr.student.studentIdNo,
        `${enr.student.firstName} ${enr.student.lastName || ""}`.trim(),
        enr.student.gender || "—",
        enr.class?.name || currentClassName,
        enr.section?.name || "—",
        enr.student.guardianName || "—",
        enr.student.guardianPhone || "—",
        STATUS_CONFIG[parsed.status]?.label || parsed.status,
        parsed.date || "—",
        parsed.reason || "—",
        parsed.tcNumber || "—",
        parsed.remarks || "—",
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [
      { wch: 10 },
      { wch: 15 },
      { wch: 25 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 25 },
      { wch: 15 },
      { wch: 25 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student_Status");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Student_Status_Register_${currentClassName}_${dateStr}.xlsx`);
    showToast("Excel status roster downloaded successfully!");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* Module Navigation Header */}
      <StudentNavHeader />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 border border-slate-700 animate-in fade-in slide-in-from-top-4 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header (No Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link href="/setup/students" className="hover:underline">Students</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Student Status</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            Student Status
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Manage student states: Active, Inactive, Dropout, Transfer, and Deceased.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards (Clickable quick filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        {/* All Students */}
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Total Enrolled</span>
            <Users className={`w-3.5 h-3.5 ${statusFilter === "ALL" ? "text-slate-300" : "text-slate-400"}`} />
          </div>
          <div className="text-xl font-bold mt-1 font-mono">{statusStats.TOTAL}</div>
          <div className={`text-[10px] mt-0.5 ${statusFilter === "ALL" ? "text-slate-300" : "text-slate-500"}`}>
            All lifecycle states
          </div>
        </button>

        {/* Active */}
        <button
          onClick={() => setStatusFilter("ACTIVE")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === "ACTIVE"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-600/20"
              : "bg-white text-slate-800 border-slate-200 hover:border-emerald-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={statusFilter === "ACTIVE" ? "text-white" : "text-emerald-700"}>Active</span>
            <CheckCircle2 className={`w-3.5 h-3.5 ${statusFilter === "ACTIVE" ? "text-white" : "text-emerald-500"}`} />
          </div>
          <div className={`text-xl font-bold mt-1 font-mono ${statusFilter === "ACTIVE" ? "text-white" : "text-emerald-600"}`}>
            {statusStats.ACTIVE}
          </div>
          <div className={`text-[10px] mt-0.5 ${statusFilter === "ACTIVE" ? "text-emerald-100" : "text-emerald-600"}`}>
            {statusStats.TOTAL > 0 ? `${Math.round((statusStats.ACTIVE / statusStats.TOTAL) * 100)}% of total` : "0%"}
          </div>
        </button>

        {/* Inactive */}
        <button
          onClick={() => setStatusFilter("INACTIVE")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === "INACTIVE"
              ? "bg-slate-700 text-white border-slate-700 shadow-sm ring-2 ring-slate-700/20"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-400 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={statusFilter === "INACTIVE" ? "text-white" : "text-slate-600"}>Inactive</span>
            <Clock className={`w-3.5 h-3.5 ${statusFilter === "INACTIVE" ? "text-white" : "text-slate-400"}`} />
          </div>
          <div className={`text-xl font-bold mt-1 font-mono ${statusFilter === "INACTIVE" ? "text-white" : "text-slate-700"}`}>
            {statusStats.INACTIVE}
          </div>
          <div className={`text-[10px] mt-0.5 ${statusFilter === "INACTIVE" ? "text-slate-300" : "text-slate-500"}`}>
            Suspended / on leave
          </div>
        </button>

        {/* Dropout */}
        <button
          onClick={() => setStatusFilter("DROPOUT")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === "DROPOUT"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-600/20"
              : "bg-white text-slate-800 border-slate-200 hover:border-amber-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={statusFilter === "DROPOUT" ? "text-white" : "text-amber-800"}>Dropout</span>
            <AlertCircle className={`w-3.5 h-3.5 ${statusFilter === "DROPOUT" ? "text-white" : "text-amber-500"}`} />
          </div>
          <div className={`text-xl font-bold mt-1 font-mono ${statusFilter === "DROPOUT" ? "text-white" : "text-amber-600"}`}>
            {statusStats.DROPOUT}
          </div>
          <div className={`text-[10px] mt-0.5 ${statusFilter === "DROPOUT" ? "text-amber-100" : "text-amber-600"}`}>
            Discontinued studies
          </div>
        </button>

        {/* Transfer */}
        <button
          onClick={() => setStatusFilter("TRANSFER")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === "TRANSFER"
              ? "bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-600/20"
              : "bg-white text-slate-800 border-slate-200 hover:border-sky-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={statusFilter === "TRANSFER" ? "text-white" : "text-sky-800"}>Transfer</span>
            <ArrowRightLeft className={`w-3.5 h-3.5 ${statusFilter === "TRANSFER" ? "text-white" : "text-sky-500"}`} />
          </div>
          <div className={`text-xl font-bold mt-1 font-mono ${statusFilter === "TRANSFER" ? "text-white" : "text-sky-600"}`}>
            {statusStats.TRANSFER}
          </div>
          <div className={`text-[10px] mt-0.5 ${statusFilter === "TRANSFER" ? "text-sky-100" : "text-sky-600"}`}>
            TC Issued out
          </div>
        </button>

        {/* Death */}
        <button
          onClick={() => setStatusFilter("DEATH")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === "DEATH"
              ? "bg-rose-700 text-white border-rose-700 shadow-sm ring-2 ring-rose-700/20"
              : "bg-white text-slate-800 border-slate-200 hover:border-rose-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={statusFilter === "DEATH" ? "text-white" : "text-rose-800"}>Deceased</span>
            <HeartCrack className={`w-3.5 h-3.5 ${statusFilter === "DEATH" ? "text-white" : "text-rose-500"}`} />
          </div>
          <div className={`text-xl font-bold mt-1 font-mono ${statusFilter === "DEATH" ? "text-white" : "text-rose-600"}`}>
            {statusStats.DEATH}
          </div>
          <div className={`text-[10px] mt-0.5 ${statusFilter === "DEATH" ? "text-rose-100" : "text-rose-500"}`}>
            Census archived
          </div>
        </button>
      </div>

      {/* Session, Class, Shift, Group & Section Filter Bar (No Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs shadow-sm no-print">
        <SessionSelect
          value={selectedSession}
          onChange={(val) => setSelectedSession(val)}
          label="Filter Session:"
          includeAll={true}
          allLabel="All Sessions"
          activeOnly={false}
          selectClassName="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
        />

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Filter Class:</label>
          <select
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
          >
            <option value="ALL">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            {classes.length === 0 && <option value="">Loading classes...</option>}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Filter Shift:</label>
          <select
            value={selectedShift}
            onChange={(e) => handleShiftChange(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
          >
            <option value="">All Shifts</option>
            <option value="MORNING">Morning</option>
            <option value="DAY">Day</option>
            {availableShifts.map((sh) => (
              <option key={sh} value={sh}>
                {sh.charAt(0) + sh.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Filter Group:</label>
          <select
            value={selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
          >
            {standardGroups.map((grp) => (
              <option key={grp.value} value={grp.value}>
                {grp.label}
              </option>
            ))}
            {customGroups.map((cg) => (
              <option key={cg} value={cg}>
                {cg.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Filter Section:</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
          >
            <option value="">All Sections</option>
            {filteredSections.map((sec: any) => (
              <option key={sec.id} value={sec.id}>
                {sec.name} {sec.shift ? `(${sec.shift})` : ""} {sec.groupType ? `[${sec.groupType}]` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search & Batch Action Bar (No Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll, reg ID, phone..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <span className="text-slate-500 whitespace-nowrap">
            Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of{" "}
            <strong>{students.length}</strong> students
          </span>
        </div>

        {/* Batch Action Bar if rows selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-in fade-in shadow-2xs">
            <span className="text-xs font-bold text-emerald-800">
              {selectedIds.size} student(s) selected:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openBatchModal("ACTIVE")}
                className="px-2 py-0.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition cursor-pointer"
              >
                Set Active
              </button>
              <button
                type="button"
                onClick={() => openBatchModal("INACTIVE")}
                className="px-2 py-0.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded transition cursor-pointer"
              >
                Set Inactive
              </button>
              <button
                type="button"
                onClick={() => openBatchModal("DROPOUT")}
                className="px-2 py-0.5 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 hover:bg-amber-200 rounded transition cursor-pointer"
              >
                Dropout
              </button>
              <button
                type="button"
                onClick={() => openBatchModal("TRANSFER")}
                className="px-2 py-0.5 text-[11px] font-bold text-sky-800 bg-sky-100 border border-sky-300 hover:bg-sky-200 rounded transition cursor-pointer"
              >
                Transfer
              </button>
              <button
                type="button"
                onClick={() => openBatchModal("DEATH")}
                className="px-2 py-0.5 text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 hover:bg-rose-200 rounded transition cursor-pointer"
              >
                Deceased
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-400 hover:text-slate-600 text-xs ml-1"
                title="Deselect all"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Official Print Header (Only visible in Print Mode) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">
          {schoolInfo?.name || "Dhaka Ideal Model High School & College"}
        </h2>
        <p className="text-xs text-slate-600">
          EIIN: {schoolInfo?.eiin || "108254"} • {schoolInfo?.address || "Dhaka, Bangladesh"}
        </p>
        <h3 className="text-sm font-bold mt-2 uppercase tracking-wider text-slate-800 underline">
          Official Student Status Register & Lifecycle Audit Sheet
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Class: {classes.find((c) => c.id === selectedClassId)?.name || "All Classes"} • Generated on:{" "}
          {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Main Student Status Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading student enrollment lifecycle records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No student records found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No students match the selected class, section, or lifecycle status filter. Try clearing filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center no-print">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="py-3 px-3 w-16 text-center">Roll</th>
                  <th className="py-3 px-3 w-28">Student ID</th>
                  <th className="py-3 px-4">Student Name & Gender</th>
                  <th className="py-3 px-3">Class / Section</th>
                  <th className="py-3 px-3">Guardian Contact</th>
                  <th className="py-3 px-3 w-36">Current Status</th>
                  <th className="py-3 px-3">Reason / Details</th>
                  <th className="py-3 px-3 text-right w-24 no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((enr) => {
                  const isChecked = selectedIds.has(enr.studentId);
                  const parsed = parseStudentStatus(enr.student);
                  const conf = STATUS_CONFIG[parsed.status] || STATUS_CONFIG.ACTIVE;

                  return (
                    <tr
                      key={enr.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center no-print">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectStudent(enr.studentId)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Roll Number */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                        #{enr.classRoll}
                      </td>

                      {/* Student ID */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {enr.student.studentIdNo}
                      </td>

                      {/* Student Name */}
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900">
                          {enr.student.firstName} {enr.student.lastName || ""}
                        </div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {enr.student.gender?.toLowerCase() || "Not specified"}
                        </div>
                      </td>

                      {/* Class & Section */}
                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="font-medium text-slate-800">
                          {enr.class?.name || classes.find((c) => c.id === selectedClassId)?.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {enr.section?.name ? `Sec: ${enr.section.name}` : "General"}
                          {enr.section?.shift ? ` • ${enr.section.shift}` : ""}
                        </div>
                      </td>

                      {/* Guardian Contact */}
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 font-medium">{enr.student.guardianName || "—"}</div>
                        <div className="text-[11px] font-mono text-slate-500">{enr.student.guardianPhone || "—"}</div>
                      </td>

                      {/* Status Dropdown / Badge */}
                      <td className="py-2.5 px-3">
                        <div className="relative inline-block w-full">
                          <select
                            value={parsed.status}
                            onChange={(e) =>
                              handleQuickStatusChange(enr, e.target.value as StudentStatusType)
                            }
                            className={`w-full appearance-none pl-2.5 pr-7 py-1 rounded-md text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}
                            title={`Status: ${conf.label}. Click to quickly change.`}
                          >
                            <option value="ACTIVE">● Active</option>
                            <option value="INACTIVE">● Inactive</option>
                            <option value="DROPOUT">● Dropout</option>
                            <option value="TRANSFER">● Transfer</option>
                            <option value="DEATH">● Deceased</option>
                          </select>
                          <ChevronDown
                            className={`w-3 h-3 absolute right-2 top-2.5 pointer-events-none ${conf.badgeText} opacity-70`}
                          />
                        </div>
                      </td>

                      {/* Status Details / Reason */}
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-[200px]">
                        {parsed.reason ? (
                          <div className="font-medium text-slate-800 truncate" title={parsed.reason}>
                            {parsed.reason}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No notes</span>
                        )}

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {parsed.date && <span>Eff: {parsed.date}</span>}
                          {parsed.tcNumber && (
                            <span className="font-mono text-sky-700 font-bold bg-sky-50 px-1 rounded">
                              TC: {parsed.tcNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right no-print">
                        <button
                          type="button"
                          onClick={() => openSingleModal(enr)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md shadow-2xs transition cursor-pointer"
                          title="Open complete status details modal"
                        >
                          <Edit3 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Signatures Box for Printout */}
      <div className="hidden print:grid grid-cols-3 gap-8 pt-16 text-center text-xs text-slate-800">
        <div className="border-t border-slate-400 pt-2 font-semibold">
          Class Teacher Signature
        </div>
        <div className="border-t border-slate-400 pt-2 font-semibold">
          Academic Section In-Charge
        </div>
        <div className="border-t border-slate-400 pt-2 font-semibold">
          Headmaster / Principal Signature
        </div>
      </div>

      {/* Modal: Change Status (Single or Batch) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <UserCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {modalMode === "single"
                      ? `Update Status: ${targetStudent?.student.firstName} (Roll #${targetStudent?.classRoll})`
                      : `Batch Update Status (${selectedIds.size} Students)`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalMode === "single"
                      ? `Student ID: ${targetStudent?.student.studentIdNo} • Class: ${targetStudent?.class?.name}`
                      : "Apply uniform status and audit documentation across selected students"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Status Picker Buttons */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select New Lifecycle Status:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(["ACTIVE", "INACTIVE", "DROPOUT", "TRANSFER", "DEATH"] as StudentStatusType[]).map(
                    (st) => {
                      const c = STATUS_CONFIG[st];
                      const isSelected = newStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`p-2 rounded-lg border text-left flex items-center space-x-2 transition cursor-pointer ${
                            isSelected
                              ? `${c.badgeBg} ${c.badgeBorder} ring-2 ring-emerald-500/30 ${c.badgeText}`
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${c.dotBg} shrink-0`} />
                          <span className="text-xs font-bold">{c.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  {STATUS_CONFIG[newStatus].description}
                </p>
              </div>

              {/* Effective Date & Reason Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Effective Date:
                  </label>
                  <input
                    type="date"
                    required
                    value={statusDate}
                    onChange={(e) => setStatusDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Preset Reason:
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setStatusReason(e.target.value);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose Quick Reason --</option>
                    {newStatus === "ACTIVE" && (
                      <>
                        <option value="Regular verified enrollment">Regular verified enrollment</option>
                        <option value="Resumed studies / readmitted">Resumed studies / readmitted</option>
                        <option value="Cleared disciplinary suspension">Cleared disciplinary suspension</option>
                      </>
                    )}
                    {newStatus === "INACTIVE" && (
                      <>
                        <option value="Extended medical leave">Extended medical leave</option>
                        <option value="Temporary family absence">Temporary family absence</option>
                        <option value="Administrative suspension">Administrative suspension</option>
                      </>
                    )}
                    {newStatus === "DROPOUT" && (
                      <>
                        <option value="Financial hardship">Financial hardship</option>
                        <option value="Relocated without notice">Relocated without notice</option>
                        <option value="Early workforce employment">Early workforce employment</option>
                        <option value="Family relocation abroad">Family relocation abroad</option>
                      </>
                    )}
                    {newStatus === "TRANSFER" && (
                      <>
                        <option value="Transfer to Cadet College">Transfer to Cadet College</option>
                        <option value="Transfer due to guardian job relocation">
                          Transfer due to guardian job relocation
                        </option>
                        <option value="Admitted to another district school">
                          Admitted to another district school
                        </option>
                      </>
                    )}
                    {newStatus === "DEATH" && (
                      <>
                        <option value="Fatal illness">Fatal illness</option>
                        <option value="Tragic road accident">Tragic road accident</option>
                        <option value="Natural demise">Natural demise</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Custom Reason Text */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason / Cause Description:
                </label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Relocated to Chittagong with parents"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Conditional TC Number (Shown for Transfer) */}
              {newStatus === "TRANSFER" && (
                <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-sky-900">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>Transfer Certificate (TC) Credentials</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      TC Serial Number:
                    </label>
                    <input
                      type="text"
                      value={tcNumber}
                      onChange={(e) => setTcNumber(e.target.value)}
                      placeholder="e.g. TC-2026/894"
                      className="w-full p-2 border border-sky-300 rounded-lg text-xs font-mono font-medium bg-white text-slate-800 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* Institutional Remarks */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Institutional Remarks / Headmaster Note:
                </label>
                <textarea
                  rows={2}
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="Additional archival remarks for BANBEIS census and result records..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        {modalMode === "single"
                          ? `Commit Status: ${STATUS_CONFIG[newStatus].label}`
                          : `Apply to ${selectedIds.size} Students`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
