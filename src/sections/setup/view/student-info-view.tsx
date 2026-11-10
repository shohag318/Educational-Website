"use client";

import { useEffect, useState, useMemo } from "react";
import { AppTable, Label, type AppTableColumn, AppCard, TableFilterBar } from "@/components";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
} from "@/components/iconify/lucide";
import { SessionSelect } from "@/components/SessionSelect";
import { AppButton } from "@/components/button/app-button";
import {
  DownloadPageShell,
  DownloadHero,
  DownloadEyebrow,
  DownloadMetaChip,
} from "@/sections/download/component/download-page-ui";

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

  const studentInfoColumns = useMemo(() => {
    if (activeColumns.length === 0) {
      return [
        {
          id: "empty",
          label: "Columns",
          sortable: false,
          render: () => (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
              No columns selected. Please select at least one column from the customizer above.
            </Typography>
          ),
        },
      ] as AppTableColumn<any>[];
    }

    const cols: AppTableColumn<any>[] = [
      {
        id: "index",
        label: "#",
        align: "center",
        width: 56,
        sortable: false,
        render: (_st, index) => (
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
            {index + 1}
          </Typography>
        ),
      },
      ...activeColumns.map((col) => ({
        id: col.key,
        label: col.label,
        sortable: col.key === "roll" || col.key === "fullName" || col.key === "studentIdNo",
        render: (st: any) => {
          const val = col.getValue(st);
          if (col.key === "shift") {
            return (
              <Label color={val === "Morning" ? "warning" : val === "Day" ? "info" : "default"} variant="soft">
                {val}
              </Label>
            );
          }
          if (col.key === "status") {
            const isActive = Boolean(st.student?.isActive);
            return (
              <AppButton
                type="button"
                size="small"
                variant="soft"
                color={isActive ? "success" : "error"}
                disabled={statusUpdating}
                onClick={() => handleToggleSingleStatus(st.student?.id, isActive)}
                title="Click to toggle Active / Inactive"
              >
                {isActive ? "Active" : "Inactive"}
              </AppButton>
            );
          }
          if (col.key === "studentCategory") {
            const isMilitary = String(val).toLowerCase() === "military";
            return (
              <Label color={isMilitary ? "warning" : "info"} variant="soft">
                {val}
              </Label>
            );
          }
          if (col.key === "service") {
            const srvList = String(val).split(",").map((s) => s.trim()).filter(Boolean);
            const isNone = srvList.length === 0 || val === "None" || val === "-";
            if (isNone) return <Typography variant="caption" color="text.secondary">—</Typography>;
            return (
              <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                {srvList.map((s, i) => (
                  <Label key={i} variant="soft" color={s === "Bus" ? "info" : s === "Hostel" ? "secondary" : "default"}>
                    {s}
                  </Label>
                ))}
              </Stack>
            );
          }
          if (col.key === "roll") {
            return (
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                #{val}
              </Typography>
            );
          }
          if (col.key === "studentIdNo" || col.key === "guardianPhone") {
            return (
              <Typography variant="body2" sx={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>
                {val}
              </Typography>
            );
          }
          if (col.key === "fullName") {
            return (
              <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                {val}
              </Typography>
            );
          }
          return (
            <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
              {val || "-"}
            </Typography>
          );
        },
      })),
      {
        id: "actions",
        label: "Actions",
        align: "center",
        sortable: false,
        render: (st) => (
          <Stack direction="row" spacing={0.75} sx={{ justifyContent: "center" }} className="no-print">
            <AppButton
              type="button"
              size="small"
              variant="soft"
              onClick={() => openPromoteModal([st])}
              title="Promote this student to next class"
              startIcon={<GraduationCap className="w-3 h-3" />}
            >
              Promote
            </AppButton>
            <IconButton
              size="small"
              color="error"
              disabled={deleting}
              onClick={() => handleDeleteSingleStudent(st)}
              title="Permanently delete this student"
            >
              <Trash2 className="w-3 h-3" />
            </IconButton>
          </Stack>
        ),
      },
    ];
    return cols;
  }, [activeColumns, statusUpdating, deleting]);


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
    <DownloadPageShell>
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

      <DownloadHero
        eyebrow={
          <DownloadEyebrow icon={<Contact className="w-3.5 h-3.5" />}>
            Downloads • Student Register
          </DownloadEyebrow>
        }
        meta={
          <DownloadMetaChip tone="warn">
            {students.length} student{students.length === 1 ? "" : "s"} filtered
          </DownloadMetaChip>
        }
        title="Student Information & Custom Column Export"
        description="Filter student records, customize visible columns, and export CSV/Excel or print rosters."
        actions={
          <>
          <AppButton
            onClick={handleCopyToClipboard}
            disabled={students.length === 0 || activeColumns.length === 0}
            variant="outline"
            title="Copy table to clipboard to paste directly into Google Sheets or Excel"
            startIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? "Copied!" : "Copy Table"}
          </AppButton>

          <AppButton
            onClick={handleDownloadCSV}
            disabled={students.length === 0 || activeColumns.length === 0}
            variant="contained"
            color="warning"
            title="Download CSV containing only the selected columns for the filtered students"
            startIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download ({activeColumns.length})
          </AppButton>

          <AppButton
            onClick={() => {
              const targets = selectedEnrollmentIds.length > 0
                ? students.filter((s) => selectedEnrollmentIds.includes(s.id))
                : students;
              openPromoteModal(targets);
            }}
            disabled={students.length === 0}
            variant="contained"
            color="secondary"
            title="Promote selected or all filtered students to next class"
            startIcon={<GraduationCap className="w-3.5 h-3.5" />}
          >
            Promote {selectedEnrollmentIds.length > 0 ? `(${selectedEnrollmentIds.length})` : ""}
          </AppButton>

          <AppButton
            onClick={() => window.print()}
            variant="contained"
            color="secondary"
            startIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Roster
          </AppButton>
          </>
        }
      />

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
            <AppButton
              onClick={handleResetFilters}
              variant="link"
              size="small"
              startIcon={<RotateCcw className="w-3 h-3" />}
            >
              Reset Filters
            </AppButton>
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
            <AppButton
              type="button"
              size="small"
              variant="contained"
              color="success"
              disabled={statusUpdating}
              onClick={() => handleBulkStatusChange(true)}
              title="Set selected students as Active"
              startIcon={<UserCheck className="w-3.5 h-3.5" />}
            >
              Set Active
            </AppButton>

            <AppButton
              type="button"
              size="small"
              variant="contained"
              color="error"
              disabled={statusUpdating}
              onClick={() => handleBulkStatusChange(false)}
              title="Set selected students as Inactive"
              startIcon={<UserX className="w-3.5 h-3.5" />}
            >
              Set Inactive
            </AppButton>

            <AppButton
              type="button"
              size="small"
              variant="contained"
              disabled={deleting}
              onClick={() => {
                const selected = students.filter((s) => selectedEnrollmentIds.includes(s.id));
                openPromoteModal(selected);
              }}
              title="Promote selected students to next class"
              startIcon={<GraduationCap className="w-3.5 h-3.5" />}
            >
              Promote ({selectedEnrollmentIds.length})
            </AppButton>

            <AppButton
              type="button"
              size="small"
              variant="contained"
              color="error"
              disabled={statusUpdating || deleting}
              loading={deleting}
              onClick={handleBulkDelete}
              title="Permanently delete selected students"
              startIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete ({selectedEnrollmentIds.length})
            </AppButton>

            <AppButton
              type="button"
              size="small"
              variant="ghost"
              color="inherit"
              onClick={() => setSelectedEnrollmentIds([])}
            >
              Deselect All
            </AppButton>
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
            <AppButton size="small" variant="outline" onClick={() => applyPreset("ALL")}>
              Select All
            </AppButton>
            <AppButton size="small" variant="outline" onClick={() => applyPreset("BASIC")}>
              Basic Info
            </AppButton>
            <AppButton size="small" variant="outline" onClick={() => applyPreset("CONTACT")}>
              Contact List
            </AppButton>
            <AppButton size="small" variant="outline" onClick={() => applyPreset("ACADEMIC")}>
              Academic
            </AppButton>
            <AppButton size="small" variant="outline" color="error" onClick={() => applyPreset("NONE")}>
              Clear All
            </AppButton>
            <AppButton
              size="small"
              variant="outline"
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              startIcon={showColumnPicker ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            >
              {showColumnPicker ? "Collapse" : "Expand"}
            </AppButton>
          </div>
        </div>

        {/* Checkbox Chips Grid */}
        {showColumnPicker && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
            {ALL_COLUMNS.map((col) => {
              const isSelected = selectedColumnKeys.includes(col.key);
              return (
                <AppButton
                  key={col.key}
                  size="small"
                  variant="soft"
                  color={isSelected ? "primary" : "inherit"}
                  onClick={() => toggleColumn(col.key)}
                >
                  {col.label}
                </AppButton>
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

      {activeColumns.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 italic text-xs">
          No columns selected. Please select at least one column from the customizer above.
        </div>
      ) : (
        <AppCard>
        <TableFilterBar showSearch={false}>
          <AppTable<any>
        embedded
          rows={students}
          rowKey={(row) => row.id}
          loading={loading}
          defaultOrderBy="roll"
          minWidth={Math.max(800, activeColumns.length * 110 + 220)}
          showCheckbox
          selected={selectedEnrollmentIds}
          onSelectRow={handleToggleSelect}
          onSelectAllRows={(checked) => {
            if (checked) setSelectedEnrollmentIds(students.map((s) => s.id));
            else setSelectedEnrollmentIds([]);
          }}
          columns={studentInfoColumns}
        />
        </TableFilterBar>
      </AppCard>
      )}

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
              <AppButton
                type="button"
                variant="ghost"
                color="inherit"
                onClick={() => setShowPromoteModal(false)}
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                variant="contained"
                disabled={!targetClassId || !targetSectionId}
                loading={promoting}
                onClick={handleConfirmPromotion}
                startIcon={<GraduationCap className="w-4 h-4" />}
              >
                Confirm & Promote ({promoteEnrollments.length})
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </DownloadPageShell>
  );
}
