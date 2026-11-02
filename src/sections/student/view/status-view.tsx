"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { StudentAdminPageShell } from "@/sections/student/component/admin-page-shell";
import { SessionSelect } from "@/components/SessionSelect";
import { AppButton } from "@/components/button/app-button";
import { DatePicker } from "@/components/date-picker/date-picker";
import { AppCard } from "@/components/card/app-card";
import { AppSelect } from "@/components/select/app-select";
import { AppTextField } from "@/components/text-field/app-text-field";
import { StudentPageHeader } from "@/sections/student/component/student-page-header";
import { EmptyContent } from "@/components/empty-content/empty-content";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { Label } from "@/components/label/label";
import { Scrollbar } from "@/components/scrollbar/scrollbar";
import {
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
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
    color: "success" | "secondary" | "warning" | "info" | "error";
  }
> = {
  ACTIVE: {
    label: "Active",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    dotBg: "bg-emerald-500",
    description: "Regular enrolled student eligible for marks, exams & attendance",
    color: "success",
  },
  INACTIVE: {
    label: "Inactive",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    badgeBorder: "border-slate-300",
    dotBg: "bg-slate-400",
    description: "Temporarily suspended, unverified, or on prolonged authorized leave",
    color: "secondary",
  },
  DROPOUT: {
    label: "Dropout",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-300",
    dotBg: "bg-amber-500",
    description: "Discontinued studies or ceased attendance without official TC",
    color: "warning",
  },
  TRANSFER: {
    label: "Transfer",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-800",
    badgeBorder: "border-sky-300",
    dotBg: "bg-sky-500",
    description: "Transferred to another institution with formal Transfer Certificate",
    color: "info",
  },
  DEATH: {
    label: "Deceased",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-800",
    badgeBorder: "border-rose-300",
    dotBg: "bg-rose-600",
    description: "Deceased student record permanently archived for institutional census",
    color: "error",
  },
};

const STATUS_REASONS: Record<StudentStatusType, string[]> = {
  ACTIVE: ["Regular verified enrollment", "Resumed studies / readmitted", "Cleared disciplinary suspension"],
  INACTIVE: ["Extended medical leave", "Temporary family absence", "Administrative suspension"],
  DROPOUT: ["Financial hardship", "Relocated without notice", "Early workforce employment", "Family relocation abroad"],
  TRANSFER: [
    "Transfer to Cadet College",
    "Transfer due to guardian job relocation",
    "Admitted to another district school",
  ],
  DEATH: ["Fatal illness", "Tragic road accident", "Natural demise"],
};

const SERIOUS_STATUSES: StudentStatusType[] = ["DROPOUT", "TRANSFER", "DEATH"];

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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

  const hasExtraFilters = Boolean(
    searchQuery.trim() ||
      (selectedShift && selectedShift !== "ALL") ||
      (selectedGroup && selectedGroup !== "ALL") ||
      selectedSectionId ||
      statusFilter !== "ALL"
  );

  const resetListFilters = () => {
    setSearchQuery("");
    setSelectedShift("");
    setSelectedGroup("ALL");
    setSelectedSectionId("");
    setStatusFilter("ALL");
  };

  // Direct 1-Click Status Dropdown in Table Row
  const handleQuickStatusChange = async (enr: StudentEnrollmentItem, nextStatus: StudentStatusType) => {
    if (nextStatus === parseStudentStatus(enr.student).status) return;

    if (SERIOUS_STATUSES.includes(nextStatus)) {
      const parsed = parseStudentStatus(enr.student);
      setTargetStudent(enr);
      setModalMode("single");
      setNewStatus(nextStatus);
      setStatusReason(parsed.reason);
      setStatusDate(parsed.date || new Date().toISOString().slice(0, 10));
      setTcNumber(parsed.tcNumber);
      setStatusRemarks(parsed.remarks);
      setModalOpen(true);
      return;
    }

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

  const kpiItems = [
    { key: "ALL", label: "Total Enrolled", value: statusStats.TOTAL, hint: "All lifecycle states", icon: <PeopleIcon color="action" fontSize="small" />, color: "secondary" as const },
    { key: "ACTIVE", label: "Active", value: statusStats.ACTIVE, hint: statusStats.TOTAL > 0 ? `${Math.round((statusStats.ACTIVE / statusStats.TOTAL) * 100)}% of total` : "0%", icon: <CheckCircleIcon color="success" fontSize="small" />, color: "success" as const },
    { key: "INACTIVE", label: "Inactive", value: statusStats.INACTIVE, hint: "Suspended / on leave", icon: <ScheduleIcon color="action" fontSize="small" />, color: "secondary" as const },
    { key: "DROPOUT", label: "Dropout", value: statusStats.DROPOUT, hint: "Discontinued studies", icon: <WarningAmberIcon color="warning" fontSize="small" />, color: "warning" as const },
    { key: "TRANSFER", label: "Transfer", value: statusStats.TRANSFER, hint: "TC issued out", icon: <SwapHorizIcon color="info" fontSize="small" />, color: "info" as const },
    { key: "DEATH", label: "Deceased", value: statusStats.DEATH, hint: "Census archived", icon: <FavoriteBorderIcon color="error" fontSize="small" />, color: "error" as const },
  ];

  const renderStatusSelect = (enr: StudentEnrollmentItem) => {
    const parsed = parseStudentStatus(enr.student);
    const conf = STATUS_CONFIG[parsed.status] || STATUS_CONFIG.ACTIVE;
    return (
      <Select
        size="small"
        fullWidth
        value={parsed.status}
        onChange={(e) => handleQuickStatusChange(enr, e.target.value as StudentStatusType)}
        sx={{
          minWidth: 118,
          fontWeight: 700,
          fontSize: 12,
          bgcolor: `${conf.color}.lighter`,
          color: `${conf.color}.dark`,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: `${conf.color}.light` },
          "& .MuiSelect-select": { py: 0.85, pr: 3.5 },
        }}
      >
        {(Object.keys(STATUS_CONFIG) as StudentStatusType[]).map((key) => (
          <MenuItem key={key} value={key}>
            {STATUS_CONFIG[key].label}
          </MenuItem>
        ))}
      </Select>
    );
  };

  const renderStudentCard = (enr: StudentEnrollmentItem) => {
    const isChecked = selectedIds.has(enr.studentId);
    const parsed = parseStudentStatus(enr.student);
    const conf = STATUS_CONFIG[parsed.status] || STATUS_CONFIG.ACTIVE;
    const className = enr.class?.name || classes.find((c) => c.id === selectedClassId)?.name || "—";

    return (
      <Box
        key={enr.id}
        sx={{
          p: 1.5,
          border: 1,
          borderColor: isChecked ? "primary.main" : "divider",
          borderRadius: 2,
          bgcolor: isChecked ? "action.selected" : "background.paper",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <Checkbox
            size="small"
            checked={isChecked}
            onChange={() => toggleSelectStudent(enr.studentId)}
            sx={{ mt: -0.5, ml: -0.75 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {enr.student.firstName} {enr.student.lastName || ""}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                  Roll #{enr.classRoll} · {enr.student.studentIdNo}
                </Typography>
              </Box>
              <Label color={conf.color === "secondary" ? "default" : conf.color} variant="soft">
                {conf.label}
              </Label>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              {className}
              {enr.section?.name ? ` · Sec ${enr.section.name}` : ""}
              {enr.section?.shift ? ` · ${enr.section.shift}` : ""}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {enr.student.guardianName || "No guardian"} · {enr.student.guardianPhone || "No phone"}
            </Typography>
            {parsed.reason && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }} noWrap>
                {parsed.reason}
                {parsed.date ? ` · ${parsed.date}` : ""}
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1.25, alignItems: "center" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>{renderStatusSelect(enr)}</Box>
              <AppButton size="small" variant="outlined" onClick={() => openSingleModal(enr)} startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}>
                Edit
              </AppButton>
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  };

  const batchActions = selectedIds.size > 0 && (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      sx={{
        flexWrap: "wrap",
        alignItems: "center",
        p: 1.25,
        borderRadius: 2,
        bgcolor: "primary.lighter",
        position: { xs: "fixed", md: "static" },
        bottom: { xs: 16, md: "auto" },
        left: { xs: 12, md: "auto" },
        right: { xs: 12, md: "auto" },
        zIndex: 30,
        boxShadow: { xs: 8, md: "none" },
      }}
      className="no-print"
    >
      <Typography variant="caption" sx={{ fontWeight: 700, mr: 0.5 }}>
        {selectedIds.size} selected
      </Typography>
      <AppButton size="small" variant="contained" color="success" onClick={() => openBatchModal("ACTIVE")}>
        Active
      </AppButton>
      <AppButton size="small" variant="outlined" onClick={() => openBatchModal("INACTIVE")}>
        Inactive
      </AppButton>
      <AppButton size="small" variant="outlined" color="warning" onClick={() => openBatchModal("DROPOUT")}>
        Dropout
      </AppButton>
      <AppButton size="small" variant="outlined" color="info" onClick={() => openBatchModal("TRANSFER")}>
        Transfer
      </AppButton>
      <AppButton size="small" variant="outlined" color="error" onClick={() => openBatchModal("DEATH")}>
        Deceased
      </AppButton>
      <IconButton size="small" onClick={() => setSelectedIds(new Set())} aria-label="Clear selection">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Stack>
  );

  return (
    <StudentAdminPageShell>
      <StudentPageHeader
        heading="Student Status"
        current="Status"
        action={
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            useFlexGap
            sx={{ width: { xs: 1, sm: "auto" }, "& .MuiButton-root": { width: { xs: 1, sm: "auto" } } }}
            className="no-print"
          >
            <AppButton variant="contained" color="success" onClick={handleExportExcel} startIcon={<FileDownloadOutlinedIcon />}>
              Export Excel
            </AppButton>
            <AppButton variant="outlined" onClick={() => window.print()} startIcon={<PrintOutlinedIcon />}>
              Print Sheet
            </AppButton>
          </Stack>
        }
      />

      <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mb: 2.5 }} className="no-print">
        {kpiItems.map((kpi) => {
          const active = statusFilter === kpi.key;
          return (
            <Grid size={{ xs: 6, sm: 4, md: 4, lg: 2 }} key={kpi.key}>
              <AppCard
                onClick={() => setStatusFilter((prev) => (kpi.key === "ALL" ? "ALL" : prev === kpi.key ? "ALL" : kpi.key))}
                sx={{
                  height: 1,
                  cursor: "pointer",
                  borderColor: active ? `${kpi.color}.main` : "divider",
                  bgcolor: active ? `${kpi.color}.lighter` : "background.paper",
                  transition: "border-color 0.15s ease, background-color 0.15s ease",
                  "& .MuiCardContent-root": { p: { xs: 1.25, sm: 1.75 }, "&:last-child": { pb: { xs: 1.25, sm: 1.75 } } },
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {kpi.label}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.25, fontSize: { xs: 18, sm: 22 } }}>
                      {kpi.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" }, lineHeight: 1.3 }}>
                      {kpi.hint}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: { xs: 28, sm: 32 },
                      height: { xs: 28, sm: 32 },
                      borderRadius: 1.5,
                      bgcolor: "background.neutral",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {kpi.icon}
                  </Box>
                </Stack>
              </AppCard>
            </Grid>
          );
        })}
      </Grid>

      <AppCard sx={{ mb: 2.5 }} className="no-print">
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="subtitle2">Find students</Typography>
            {hasExtraFilters && (
              <AppButton size="small" variant="outlined" onClick={resetListFilters} startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}>
                Reset
              </AppButton>
            )}
          </Stack>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <SessionSelect
                value={selectedSession}
                onChange={(val) => setSelectedSession(val)}
                label="Session"
                includeAll={true}
                allLabel="All Sessions"
                activeOnly={false}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <AppSelect
                label="Class"
                value={selectedClassId}
                onChange={handleClassChange}
                options={[
                  { value: "ALL", label: "All Classes" },
                  ...classes.map((c) => ({ value: c.id, label: c.name })),
                  ...(classes.length === 0 ? [{ value: "", label: "Loading classes..." }] : []),
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <AppSelect
                label="Shift"
                value={selectedShift}
                onChange={handleShiftChange}
                options={[
                  { value: "", label: "All Shifts" },
                  { value: "MORNING", label: "Morning" },
                  { value: "DAY", label: "Day" },
                  ...availableShifts.map((sh) => ({
                    value: sh,
                    label: sh.charAt(0) + sh.slice(1).toLowerCase(),
                  })),
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <AppSelect
                label="Group"
                value={selectedGroup}
                onChange={handleGroupChange}
                options={[
                  ...standardGroups.map((grp) => ({ value: grp.value, label: grp.label })),
                  ...customGroups.map((cg) => ({ value: cg, label: cg.replace(/_/g, " ") })),
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <AppSelect
                label="Section"
                value={selectedSectionId}
                onChange={setSelectedSectionId}
                options={[
                  { value: "", label: "All Sections" },
                  ...filteredSections.map((sec: any) => ({
                    value: sec.id,
                    label: `${sec.name} ${sec.shift ? `(${sec.shift})` : ""} ${sec.groupType ? `[${sec.groupType}]` : ""}`.trim(),
                  })),
                ]}
              />
            </Grid>
          </Grid>
        </Stack>
      </AppCard>

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

      <AppCard>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
            className="no-print"
          >
            <Box sx={{ width: { xs: 1, md: 360 }, minWidth: 0 }}>
              <AppTextField
                placeholder="Search name, roll, ID, or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<SearchIcon fontSize="small" />}
                endIcon={
                  searchQuery ? (
                    <IconButton size="small" onClick={() => setSearchQuery("")} aria-label="Clear search">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  ) : undefined
                }
              />
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">
                Showing {filteredStudents.length} of {students.length} students
              </Typography>
              {filteredStudents.length > 0 && (
                <AppButton size="small" variant="outlined" onClick={toggleSelectAll}>
                  {allFilteredSelected ? "Unselect all" : "Select all"}
                </AppButton>
              )}
            </Stack>
          </Stack>

          {!isMobile && batchActions}

          {loading ? (
            <LoadingScreen label="Loading student records..." />
          ) : filteredStudents.length === 0 ? (
            <EmptyContent
              title={hasExtraFilters ? "No matching students" : "No student records found"}
              description={
                hasExtraFilters
                  ? "Try another name, or reset filters to see the full class list."
                  : "Choose a class or session to load enrollment records."
              }
              action={
                hasExtraFilters ? (
                  <AppButton variant="outlined" onClick={resetListFilters}>
                    Reset filters
                  </AppButton>
                ) : undefined
              }
            />
          ) : isMobile ? (
            <Stack spacing={1.25} className="no-print">
              {filteredStudents.map(renderStudentCard)}
            </Stack>
          ) : (
            <Box sx={{ minWidth: 0, "@media print": { display: "block" } }}>
                <Scrollbar sx={{ width: 1, overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 920 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" className="no-print">
                          <Checkbox size="small" checked={allFilteredSelected} onChange={toggleSelectAll} />
                        </TableCell>
                        <TableCell align="center">Roll</TableCell>
                        <TableCell>Student ID</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>Class / Section</TableCell>
                        <TableCell>Guardian</TableCell>
                        <TableCell sx={{ minWidth: 140 }}>Status</TableCell>
                        <TableCell>Reason / Details</TableCell>
                        <TableCell align="right" className="no-print">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStudents.map((enr) => {
                        const isChecked = selectedIds.has(enr.studentId);
                        const parsed = parseStudentStatus(enr.student);
                        return (
                          <TableRow key={enr.id} hover selected={isChecked}>
                            <TableCell padding="checkbox" className="no-print">
                              <Checkbox size="small" checked={isChecked} onChange={() => toggleSelectStudent(enr.studentId)} />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                #{enr.classRoll}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                                {enr.student.studentIdNo}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {enr.student.firstName} {enr.student.lastName || ""}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                                {enr.student.gender?.toLowerCase() || "Not specified"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {enr.class?.name || classes.find((c) => c.id === selectedClassId)?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {enr.section?.name ? `Sec ${enr.section.name}` : "General"}
                                {enr.section?.shift ? ` · ${enr.section.shift}` : ""}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{enr.student.guardianName || "—"}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                {enr.student.guardianPhone || "—"}
                              </Typography>
                            </TableCell>
                            <TableCell>{renderStatusSelect(enr)}</TableCell>
                            <TableCell>
                              {parsed.reason ? (
                                <Typography variant="body2" noWrap title={parsed.reason} sx={{ maxWidth: 180 }}>
                                  {parsed.reason}
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  No notes
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                {parsed.date ? `Eff. ${parsed.date}` : ""}
                                {parsed.tcNumber ? ` · TC ${parsed.tcNumber}` : ""}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" className="no-print">
                              <AppButton
                                size="small"
                                variant="outlined"
                                onClick={() => openSingleModal(enr)}
                                startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
                              >
                                Edit
                              </AppButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </Box>
          )}
        </Stack>
      </AppCard>

      {isMobile && batchActions}

      <div className="hidden print:grid grid-cols-3 gap-8 pt-16 text-center text-xs text-slate-800">
        <div className="border-t border-slate-400 pt-2 font-semibold">Class Teacher Signature</div>
        <div className="border-t border-slate-400 pt-2 font-semibold">Academic Section In-Charge</div>
        <div className="border-t border-slate-400 pt-2 font-semibold">Headmaster / Principal Signature</div>
      </div>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        disablePortal={false}
        sx={{ zIndex: 2000 }}
      >
        <Box component="form" onSubmit={handleModalSubmit} sx={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
          <DialogTitle sx={{ pr: 6, position: "relative" }}>
            {modalMode === "single"
              ? `Update ${targetStudent?.student.firstName || "student"}`
              : `Update ${selectedIds.size} students`}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
              {modalMode === "single"
                ? `Roll #${targetStudent?.classRoll} · ${targetStudent?.student.studentIdNo} · ${targetStudent?.class?.name || ""}`
                : "The same status, reason, and date will apply to every selected student."}
            </Typography>
            <IconButton
              onClick={() => setModalOpen(false)}
              aria-label="Close"
              sx={{ position: "absolute", right: 12, top: 12 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2.25} sx={{ mt: 0.5 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
                  New status
                </Typography>
                <Grid container spacing={1}>
                  {(Object.keys(STATUS_CONFIG) as StudentStatusType[]).map((st) => {
                    const conf = STATUS_CONFIG[st];
                    const selected = newStatus === st;
                    return (
                      <Grid size={{ xs: 6, sm: 4 }} key={st}>
                        <AppButton
                          type="button"
                          size="small"
                          fullWidth
                          variant={selected ? "contained" : "outlined"}
                          color={conf.color === "secondary" ? "inherit" : conf.color}
                          onClick={() => setNewStatus(st)}
                        >
                          {conf.label}
                        </AppButton>
                      </Grid>
                    );
                  })}
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {STATUS_CONFIG[newStatus].description}
                </Typography>
              </Box>

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker label="Effective date" value={statusDate} onChange={setStatusDate} required />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppSelect
                    label="Quick reason"
                    value={STATUS_REASONS[newStatus].includes(statusReason) ? statusReason : ""}
                    onChange={setStatusReason}
                    options={[
                      { value: "", label: "Choose a preset (optional)" },
                      ...STATUS_REASONS[newStatus].map((reason) => ({ value: reason, label: reason })),
                    ]}
                  />
                </Grid>
              </Grid>

              <AppTextField
                label="Reason / cause"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="e.g. Relocated to Chittagong with parents"
              />

              {newStatus === "TRANSFER" && (
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "info.lighter", border: 1, borderColor: "info.light" }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                    <DescriptionOutlinedIcon fontSize="small" color="info" />
                    <Typography variant="subtitle2">Transfer certificate</Typography>
                  </Stack>
                  <AppTextField
                    label="TC serial number"
                    value={tcNumber}
                    onChange={(e) => setTcNumber(e.target.value)}
                    placeholder="e.g. TC-2026/894"
                  />
                </Box>
              )}

              <AppTextField
                label="Institutional remarks"
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder="Optional note for census and result records"
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: "wrap" }}>
            <AppButton type="button" variant="outlined" color="error" onClick={() => setModalOpen(false)} sx={{ ml: { xs: 0, sm: "auto" } }}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="contained" color="success" loading={isSubmitting}>
              {modalMode === "single" ? `Save ${STATUS_CONFIG[newStatus].label}` : `Apply to ${selectedIds.size} students`}
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: isMobile ? "center" : "right" }}
      />
    </StudentAdminPageShell>
  );
}
