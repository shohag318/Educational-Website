"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Award,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  Edit,
  ArrowRight,
  School,
  Users,
  ShieldCheck,
  Percent,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  HelpCircle,
  Download,
  Printer,
  ChevronDown,
  Sliders,
  DollarSign,
  Calendar,
  Layers,
  Info,
  Clock,
  ArrowUpRight,
  Tag,
  Zap,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { FeeNavHeader } from "../FeeNavHeader";
import {
  StudentWaiver,
  SCHOLARSHIP_PRESETS,
  ScholarshipPreset,
  PresetCategory,
  getStoredWaivers,
  saveStoredWaivers,
  calculateStudentWaiver,
} from "../waiverStore";
import { SessionSelect } from "@/components/SessionSelect";

// Validity Duration Options
const DURATION_OPTIONS = [
  { id: "full_year", label: "Full Academic Session (Jan – Dec)", value: "Full Academic Session (Jan – Dec)" },
  { id: "half_year_1", label: "First Half / Half-Yearly (Jan – Jun)", value: "First Half (Jan – Jun)" },
  { id: "half_year_2", label: "Second Half (Jul – Dec)", value: "Second Half (Jul – Dec)" },
  { id: "term_1", label: "First Term (Quarterly: 3 Months)", value: "First Term (3 Months)" },
  { id: "ongoing", label: "Ongoing / Until Further Notice", value: "Ongoing Until Revoked" },
];

export default function ScholarshipWaiverPage() {
  // Filter States
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [waiverFilter, setWaiverFilter] = useState<"ALL" | "WITH_WAIVER" | "FULL_FREE" | "PARTIAL" | "NO_WAIVER">("ALL");

  // Students & Loading
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Waiver Store
  const [waivers, setWaivers] = useState<Record<string, StudentWaiver>>({});

  // Selection for Batch Operations
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTargetStudent, setModalTargetStudent] = useState<any | null>(null);
  const [isBatchModal, setIsBatchModal] = useState(false);

  // Modal UI Tabs & Filter
  const [activeModalTab, setActiveModalTab] = useState<"PRESETS" | "CUSTOM">("PRESETS");
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<PresetCategory>("ALL");
  const [presetSearchQuery, setPresetSearchQuery] = useState("");

  // Modal Form State
  const [selectedPresetId, setSelectedPresetId] = useState<string>("preset_full_free");
  const [customTitle, setCustomTitle] = useState("100% Full Free Merit Scholarship");
  const [waiverType, setWaiverType] = useState<StudentWaiver["type"]>("FULL_FREE");
  const [waiverValue, setWaiverValue] = useState<number>(100);
  const [appliesTo, setAppliesTo] = useState<StudentWaiver["appliesTo"]>("TUITION_ONLY");
  const [effectiveFrom, setEffectiveFrom] = useState("Full Academic Session (Jan – Dec)");
  const [reason, setReason] = useState("");
  const [approvedBy, setApprovedBy] = useState("Headmaster & Governing Body");

  // Guidelines Collapsible
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to dynamically calculate student standard base tuition
  const getStudentBaseTuition = (enr: any) => {
    const className = enr?.class?.name || currentClass?.name || "";
    const num = enr?.class?.numericValue ?? parseInt(className.replace(/\D/g, "") || "0", 10);
    const isHigher = num === 11 || num === 12 || /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(className);
    return isHigher ? 2500 : 1800;
  };

  const baseAuxiliaryFees = 800; // Standard Exam + Lab fees

  // Load classes and stored waivers on mount
  useEffect(() => {
    setWaivers(getStoredWaivers());

    const handleSync = () => {
      setWaivers(getStoredWaivers());
    };
    window.addEventListener("nctb_waiver_store_updated", handleSync);
    window.addEventListener("storage", handleSync);

    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setClasses(data.data);
          setSelectedClassId(data.data[0].id);
        }
      })
      .catch((err) => console.error("Error fetching classes:", err));

    return () => {
      window.removeEventListener("nctb_waiver_store_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Fetch students when filters change
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

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStudents(data.data);
      } else {
        setStudents([]);
      }
    } catch (e) {
      console.error("Error fetching students:", e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSession, selectedClassId, selectedSectionId, selectedShift, selectedGroup, searchQuery]);

  // Derived sections & shifts
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

  // Filter students by waiver status & search
  const filteredStudents = useMemo(() => {
    return students.filter((enr) => {
      const sId = enr.student?.id || enr.id;
      const rollKey = `roll_${enr.classRoll}`;
      const assigned = waivers[sId] || waivers[enr.id] || (waivers[rollKey] && waivers[rollKey].status === "ACTIVE" ? waivers[rollKey] : undefined);
      const hasWaiver = Boolean(assigned);
      const isFullFree = assigned && (assigned.type === "FULL_FREE" || assigned.value === 100);
      const isPartial = hasWaiver && !isFullFree;

      if (waiverFilter === "WITH_WAIVER" && !hasWaiver) return false;
      if (waiverFilter === "FULL_FREE" && !isFullFree) return false;
      if (waiverFilter === "PARTIAL" && !isPartial) return false;
      if (waiverFilter === "NO_WAIVER" && hasWaiver) return false;

      // Text search inside student record & scholarship
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${enr.student?.firstName || ""} ${enr.student?.lastName || ""}`.toLowerCase();
        const idNo = (enr.student?.studentIdNo || "").toLowerCase();
        const rollStr = String(enr.classRoll);
        const schemeTitle = (assigned?.scholarshipTitle || "").toLowerCase();

        return fullName.includes(q) || idNo.includes(q) || rollStr === q || schemeTitle.includes(q);
      }

      return true;
    });
  }, [students, waivers, waiverFilter, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalStudents = students.length;
    let waiverCount = 0;
    let totalWaiverAmount = 0;
    let fullFreeCount = 0;
    let partialCount = 0;

    students.forEach((enr) => {
      const sId = enr.student?.id || enr.id;
      const rollKey = `roll_${enr.classRoll}`;
      const w = waivers[sId] || waivers[enr.id] || waivers[rollKey];
      const baseTuition = getStudentBaseTuition(enr);

      if (w && w.status === "ACTIVE") {
        waiverCount++;
        const calc = calculateStudentWaiver(w, baseTuition, baseAuxiliaryFees, enr.classRoll);
        totalWaiverAmount += calc.waiverAmount;
        if (w.type === "FULL_FREE" || calc.waiverPercentage === 100) {
          fullFreeCount++;
        } else {
          partialCount++;
        }
      }
    });

    return {
      totalStudents,
      waiverCount,
      totalWaiverAmount,
      fullFreeCount,
      partialCount,
      noWaiverCount: totalStudents - waiverCount,
    };
  }, [students, waivers, currentClass]);

  // Filtered scholarship presets for modal
  const filteredPresets = useMemo(() => {
    return SCHOLARSHIP_PRESETS.filter((p) => {
      if (presetCategoryFilter !== "ALL" && p.category !== presetCategoryFilter) {
        return false;
      }
      if (presetSearchQuery.trim()) {
        const q = presetSearchQuery.toLowerCase().trim();
        return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [presetCategoryFilter, presetSearchQuery]);

  // Handle Preset Selection inside Modal
  const applyPresetToForm = (preset: ScholarshipPreset) => {
    setSelectedPresetId(preset.id);
    setCustomTitle(preset.title);
    setWaiverType(preset.type);
    setWaiverValue(preset.value);
    setAppliesTo(preset.appliesTo);
  };

  // Open single student modal
  const handleOpenAssignModal = (enr: any) => {
    const sId = enr.student?.id || enr.id;
    const rollKey = `roll_${enr.classRoll}`;
    const existing = waivers[sId] || waivers[enr.id] || waivers[rollKey];

    setModalTargetStudent(enr);
    setIsBatchModal(false);
    setActiveModalTab("PRESETS");
    setPresetCategoryFilter("ALL");
    setPresetSearchQuery("");

    if (existing) {
      setSelectedPresetId("custom");
      setCustomTitle(existing.scholarshipTitle);
      setWaiverType(existing.type);
      setWaiverValue(existing.value);
      setAppliesTo(existing.appliesTo);
      setEffectiveFrom(existing.effectiveFrom || "Full Academic Session (Jan – Dec)");
      setReason(existing.reason || "");
      setApprovedBy(existing.approvedBy || "Headmaster & Governing Body");
    } else {
      setEffectiveFrom("Full Academic Session (Jan – Dec)");
      setApprovedBy("Headmaster & Governing Body");

      // Contextual recommendation based on academic merit
      if (enr.classRoll === 1) {
        applyPresetToForm(SCHOLARSHIP_PRESETS[0]);
        setReason("Academic 1st Position Merit Award");
      } else if (enr.classRoll <= 3) {
        applyPresetToForm(SCHOLARSHIP_PRESETS[1]);
        setReason("Top 3 Merit Concession");
      } else {
        applyPresetToForm(SCHOLARSHIP_PRESETS[3]); // Need-based default
        setReason("Financial Aid Grant");
      }
    }

    setIsModalOpen(true);
  };

  // Open batch modal
  const handleOpenBatchModal = () => {
    if (selectedStudentIds.length === 0) return;
    setIsBatchModal(true);
    setModalTargetStudent(null);
    setActiveModalTab("PRESETS");
    setPresetCategoryFilter("ALL");
    setPresetSearchQuery("");
    applyPresetToForm(SCHOLARSHIP_PRESETS[1]); // Default 50%
    setEffectiveFrom("Full Academic Session (Jan – Dec)");
    setReason("Batch Merit Scholarship Allocation");
    setApprovedBy("Headmaster & Governing Body");
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveWaiver = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = { ...waivers };
    const now = new Date().toISOString().split("T")[0];

    if (isBatchModal) {
      selectedStudentIds.forEach((id) => {
        const studentObj = students.find((s) => s.id === id || s.student?.id === id);
        if (studentObj) {
          const sId = studentObj.student?.id || studentObj.id;
          const s = studentObj.student || {};
          updated[sId] = {
            id: `waiver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            studentId: sId,
            studentName: `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Student",
            studentRoll: studentObj.classRoll,
            studentIdNo: s.studentIdNo,
            className: studentObj.class?.name || "Class",
            sectionName: studentObj.section?.name,
            groupType: studentObj.groupType,
            scholarshipTitle: customTitle.trim(),
            type: waiverType,
            value: Number(waiverValue),
            appliesTo,
            effectiveFrom: effectiveFrom.trim() || "Full Academic Session (Jan – Dec)",
            reason: reason.trim() || undefined,
            approvedBy: approvedBy.trim() || "Headmaster & Governing Body",
            status: "ACTIVE",
            updatedAt: now,
          };
        }
      });
      saveStoredWaivers(updated);
      setWaivers(updated);
      showToast(`Scholarship applied to ${selectedStudentIds.length} students! Auto-reflected in fee ledger.`);
      setSelectedStudentIds([]);
    } else if (modalTargetStudent) {
      const sId = modalTargetStudent.student?.id || modalTargetStudent.id;
      const s = modalTargetStudent.student || {};
      updated[sId] = {
        id: `waiver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: sId,
        studentName: `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Student",
        studentRoll: modalTargetStudent.classRoll,
        studentIdNo: s.studentIdNo,
        className: modalTargetStudent.class?.name || "Class",
        sectionName: modalTargetStudent.section?.name,
        groupType: modalTargetStudent.groupType,
        scholarshipTitle: customTitle.trim(),
        type: waiverType,
        value: Number(waiverValue),
        appliesTo,
        effectiveFrom: effectiveFrom.trim() || "Full Academic Session (Jan – Dec)",
        reason: reason.trim() || undefined,
        approvedBy: approvedBy.trim() || "Headmaster & Governing Body",
        status: "ACTIVE",
        updatedAt: now,
      };

      // Also set roll key for persistent matching
      const rollKey = `roll_${modalTargetStudent.classRoll}`;
      updated[rollKey] = { ...updated[sId] };

      saveStoredWaivers(updated);
      setWaivers(updated);
      showToast(`Scholarship "${customTitle}" assigned to Roll ${modalTargetStudent.classRoll}!`);
    }

    setIsModalOpen(false);
  };

  // Revoke / Delete single student waiver
  const handleRevokeWaiver = (enr: any) => {
    const sId = enr.student?.id || enr.id;
    const rollKey = `roll_${enr.classRoll}`;
    const studentName = `${enr.student?.firstName || ""} ${enr.student?.lastName || ""}`.trim();

    if (!confirm(`Are you sure you want to revoke scholarship for ${studentName || `Roll ${enr.classRoll}`}? Standard tuition will be restored.`)) {
      return;
    }

    const updated = { ...waivers };
    delete updated[sId];
    delete updated[enr.id];
    delete updated[rollKey];

    saveStoredWaivers(updated);
    setWaivers(updated);
    showToast(`Scholarship revoked for Roll ${enr.classRoll}. Tuition restored in fee ledger.`);
  };

  // Revoke inside modal
  const handleRevokeFromModal = () => {
    if (!modalTargetStudent) return;
    handleRevokeWaiver(modalTargetStudent);
    setIsModalOpen(false);
  };

  // Bulk Revoke Selected
  const handleBulkRevokeSelected = () => {
    if (selectedStudentIds.length === 0) return;
    if (!confirm(`Are you sure you want to revoke scholarships for ${selectedStudentIds.length} selected students?`)) {
      return;
    }

    const updated = { ...waivers };
    selectedStudentIds.forEach((id) => {
      const studentObj = students.find((s) => s.id === id || s.student?.id === id);
      if (studentObj) {
        const sId = studentObj.student?.id || studentObj.id;
        const rollKey = `roll_${studentObj.classRoll}`;
        delete updated[sId];
        delete updated[studentObj.id];
        delete updated[rollKey];
      }
    });

    saveStoredWaivers(updated);
    setWaivers(updated);
    showToast(`Revoked scholarships for ${selectedStudentIds.length} students.`);
    setSelectedStudentIds([]);
  };

  // Batch Toggle Selection
  const handleToggleStudentSelection = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((item) => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      showToast("No student records to export.");
      return;
    }

    const headers = [
      "Roll",
      "Student Name",
      "Student ID",
      "Class",
      "Section",
      "Shift",
      "Group",
      "Standard Base Tuition (BDT)",
      "Scholarship Scheme Title",
      "Scheme Type",
      "Configured Value",
      "Monthly Waiver (BDT)",
      "Net Monthly Tuition (BDT)",
      "Fee Scope",
      "Validity Duration",
      "Approval Authority",
      "Award Remarks / Reason",
      "Status",
    ];

    const rows = filteredStudents.map((enr) => {
      const sId = enr.student?.id || enr.id;
      const rollKey = `roll_${enr.classRoll}`;
      const assigned = waivers[sId] || waivers[enr.id] || waivers[rollKey];
      const baseTuition = getStudentBaseTuition(enr);
      const waiverCalc = calculateStudentWaiver(assigned, baseTuition, baseAuxiliaryFees, enr.classRoll);
      const netTuition = Math.max(0, baseTuition - waiverCalc.waiverAmount);

      return [
        enr.classRoll,
        `"${(enr.student?.firstName || "") + " " + (enr.student?.lastName || "")}"`,
        `"${enr.student?.studentIdNo || "N/A"}"`,
        `"${enr.class?.name || ""}"`,
        `"${enr.section?.name || ""}"`,
        `"${enr.section?.shift || ""}"`,
        `"${enr.groupType || "GENERAL"}"`,
        baseTuition,
        `"${assigned?.scholarshipTitle || (enr.classRoll <= 3 ? "Merit Top-3 Concession" : "Standard")}"`,
        `"${assigned?.type || (enr.classRoll <= 3 ? "MERIT_TOP_3" : "NONE")}"`,
        assigned ? assigned.value : enr.classRoll <= 3 ? 500 : 0,
        waiverCalc.waiverAmount,
        netTuition,
        `"${assigned?.appliesTo || "TUITION_ONLY"}"`,
        `"${assigned?.effectiveFrom || "Full Academic Session"}"`,
        `"${assigned?.approvedBy || "Governing Body"}"`,
        `"${assigned?.reason || ""}"`,
        assigned ? "ACTIVE" : enr.classRoll <= 3 ? "MERIT_STANDARD" : "REGULAR",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scholarship_waiver_roster_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Scholarship roster exported to CSV successfully!");
  };

  // Keyboard shortcut listener for Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === "Escape") {
        setIsModalOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSaveWaiver();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, customTitle, waiverType, waiverValue, appliesTo, effectiveFrom, reason, approvedBy]);

  // Modal target student & calculations
  const targetStudentBaseTuition = modalTargetStudent ? getStudentBaseTuition(modalTargetStudent) : 2500;
  const targetGrossFee = appliesTo === "TOTAL_PAYABLE" ? targetStudentBaseTuition + baseAuxiliaryFees : targetStudentBaseTuition;

  let calculatedModalWaiverAmount = 0;
  let calculatedModalPercentage = 0;

  if (waiverType === "FULL_FREE") {
    calculatedModalWaiverAmount = targetGrossFee;
    calculatedModalPercentage = 100;
  } else if (waiverType === "PERCENTAGE") {
    calculatedModalPercentage = Math.min(100, Math.max(0, waiverValue));
    calculatedModalWaiverAmount = Math.round((targetGrossFee * calculatedModalPercentage) / 100);
  } else if (waiverType === "FIXED_AMOUNT") {
    calculatedModalWaiverAmount = Math.min(waiverValue, targetGrossFee);
    calculatedModalPercentage = Math.round((calculatedModalWaiverAmount / (targetStudentBaseTuition || 1)) * 100);
  }

  const calculatedModalNetPayable = Math.max(0, targetGrossFee - calculatedModalWaiverAmount);
  const annualizedSavings = calculatedModalWaiverAmount * 12;

  // Existing waiver check for modal target
  const targetExistingWaiver = modalTargetStudent
    ? waivers[modalTargetStudent.student?.id || modalTargetStudent.id] ||
      waivers[modalTargetStudent.id] ||
      waivers[`roll_${modalTargetStudent.classRoll}`]
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Shared Module Nav Header */}
      <FeeNavHeader />

      {/* ========================================================
          PAGE HEADER & BREADCRUMBS
         ======================================================== */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/fees" className="hover:underline">Student Fee Module</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Scholarship & Waiver Section</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Special Scholarship & Waiver Section
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Assign institutional merit scholarships, financial hardship aid, quota grants, or government stipends. Granted concessions automatically reduce tuition fees and reflect dynamically in student billing, payment counters, and receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
              title="View Institutional Policy Guidelines"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{showGuidelines ? "Hide Guidelines" : "Fee Policy Guide"}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
              title="Export Current Filtered Roster to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
              title="Print Scholarship Awardees Roster"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Roster</span>
            </button>

            <Link
              href="/fees"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Fee Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================
          COLLAPSIBLE POLICY & AUDIT GUIDELINES BANNER
         ======================================================== */}
      {showGuidelines && (
        <div className="bg-gradient-to-r from-amber-50/90 via-sky-50/80 to-emerald-50/90 border border-amber-200 rounded-xl p-4 text-xs text-slate-700 space-y-3 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Institutional Scholarship & Waiver Policy Rules</span>
            </div>
            <button
              onClick={() => setShowGuidelines(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] leading-relaxed">
            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
              <span className="font-bold text-slate-900 block mb-1">1. Merit Top-3 Auto Concession</span>
              Rolls 1, 2, and 3 are pre-configured with merit concessions according to academic committee bylaws. Assigning a custom scholarship takes precedence over standard merit concessions.
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
              <span className="font-bold text-slate-900 block mb-1">2. Fee Scope Distinction</span>
              <strong className="text-amber-800">Tuition Fee Only</strong>: Applies discount solely to monthly teaching fees; auxiliary exam/lab fees remain due. <strong className="text-emerald-800">Entire Monthly Fee</strong>: Complete zero-bill waiver across all heads.
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
              <span className="font-bold text-slate-900 block mb-1">3. Immediate Ledger Reflection</span>
              All saved scholarships instantly reflect in the Fee Collection Counter, monthly student statements, payment slips, and audit ledger without requiring page reloads.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          METRICS CARDS
         ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalStudents}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Under selected class & filter</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Scholarship Holders</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats.waiverCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
            {stats.totalStudents > 0 ? ((stats.waiverCount / stats.totalStudents) * 100).toFixed(1) : 0}% of cohort receiving institutional aid
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Monthly Waiver Granted</span>
            <span className="text-xs font-bold text-emerald-700">৳</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ৳ {stats.totalWaiverAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Auto-deducted across monthly student ledgers
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800">100% Full Free Recipients</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.fullFreeCount}</div>
          <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
            {stats.partialCount} students on partial concession
          </div>
        </div>
      </div>

      {/* ========================================================
          STUDENT FILTER BAR
         ======================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Filter Enrolled Students:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedSession("ALL");
                setSelectedShift("");
                setSelectedGroup("ALL");
                setSelectedSectionId("");
                setSearchQuery("");
                setWaiverFilter("ALL");
                if (classes.length > 0) setSelectedClassId(classes[0].id);
              }}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Session Select */}
          <div>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session"
              labelClassName="block text-[11px] font-semibold text-slate-600 mb-1"
              selectClassName="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            />
          </div>

          {/* Class Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedClassId(newId);
                setSelectedSectionId("");
                const c = classes.find((cl: any) => cl.id === newId);
                const num = c?.numericValue ?? parseInt(c?.name?.replace(/\D/g, "") || "0", 10);
                if (c && (num === 11 || num === 12 || /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(c.name || ""))) {
                  if (selectedGroup === "GENERAL") setSelectedGroup("ALL");
                }
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            >
              <option value="">All Sections</option>
              {availableSections.map((sec: any) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} {sec.shift ? `(${sec.shift})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            >
              <option value="">All Shifts</option>
              <option value="MORNING">Morning</option>
              <option value="DAY">Day</option>
              {availableShifts.map((sh) => (
                <option key={sh} value={sh}>
                  {sh}
                </option>
              ))}
            </select>
          </div>

          {/* Group Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Group</label>
            <select
              value={isClass11Or12 && selectedGroup === "GENERAL" ? "ALL" : selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            >
              <option value="ALL">All Groups</option>
              {!isClass11Or12 && <option value="GENERAL">General</option>}
              <option value="SCIENCE">Science</option>
              <option value="HUMANITIES">Humanities</option>
              <option value="BUSINESS_STUDIES">Business Studies</option>
            </select>
          </div>

          {/* Quick Waiver Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Scholarship Status</label>
            <select
              value={waiverFilter}
              onChange={(e) => setWaiverFilter(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            >
              <option value="ALL">All Enrolled</option>
              <option value="WITH_WAIVER">Active Awardees Only</option>
              <option value="FULL_FREE">100% Full Free Only</option>
              <option value="PARTIAL">Partial Concession Only</option>
              <option value="NO_WAIVER">Standard / No Waiver</option>
            </select>
          </div>

          {/* Quick Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Student</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, Roll, ID, Scheme..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          BATCH ACTIONS BAR
         ======================================================== */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
              {selectedStudentIds.length}
            </span>
            <span className="font-bold text-amber-900">
              Students selected
            </span>
            <span className="text-amber-700 hidden sm:inline">
              for bulk scholarship assignment or revocation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenBatchModal}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Scheme to Selected</span>
            </button>

            <button
              onClick={handleBulkRevokeSelected}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Bulk Revoke</span>
            </button>

            <button
              onClick={() => setSelectedStudentIds([])}
              className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STUDENTS SCHOLARSHIP LEDGER TABLE
         ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Controls & Quick Filter Tabs */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 mr-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Scholarship Roster
              </h3>
            </div>

            {/* Quick Segmented Tabs */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setWaiverFilter("ALL")}
                className={`px-2.5 py-1 rounded-md transition ${
                  waiverFilter === "ALL" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setWaiverFilter("WITH_WAIVER")}
                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                  waiverFilter === "WITH_WAIVER" ? "bg-white text-amber-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Award className="w-3 h-3 text-amber-500" />
                Awardees ({stats.waiverCount})
              </button>
              <button
                type="button"
                onClick={() => setWaiverFilter("FULL_FREE")}
                className={`px-2.5 py-1 rounded-md transition ${
                  waiverFilter === "FULL_FREE" ? "bg-white text-indigo-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                100% Free ({stats.fullFreeCount})
              </button>
              <button
                type="button"
                onClick={() => setWaiverFilter("PARTIAL")}
                className={`px-2.5 py-1 rounded-md transition ${
                  waiverFilter === "PARTIAL" ? "bg-white text-emerald-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Partial ({stats.partialCount})
              </button>
              <button
                type="button"
                onClick={() => setWaiverFilter("NO_WAIVER")}
                className={`px-2.5 py-1 rounded-md transition ${
                  waiverFilter === "NO_WAIVER" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Standard ({stats.noWaiverCount})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-[11px]">
              Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of {students.length} students
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading enrolled cohort and calculating scholarship ledger...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No student records match the active criteria. Try broadening your filter or resetting.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAllStudents}
                      className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 text-center w-14">Roll</th>
                  <th className="py-3 px-4">Student Name & ID</th>
                  <th className="py-3 px-3">Class & Section</th>
                  <th className="py-3 px-3 text-right">Base Tuition</th>
                  <th className="py-3 px-3">Scholarship Scheme</th>
                  <th className="py-3 px-3 text-right">Waiver Applied</th>
                  <th className="py-3 px-3 text-right">Net Tuition</th>
                  <th className="py-3 px-3 text-center">Ledger Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((enr) => {
                  const sId = enr.student?.id || enr.id;
                  const rollKey = `roll_${enr.classRoll}`;
                  const assignedWaiver = waivers[sId] || waivers[enr.id] || (waivers[rollKey] && waivers[rollKey].status === "ACTIVE" ? waivers[rollKey] : undefined);
                  const baseTuition = getStudentBaseTuition(enr);
                  const waiverCalc = calculateStudentWaiver(assignedWaiver, baseTuition, baseAuxiliaryFees, enr.classRoll);
                  const netTuition = Math.max(0, baseTuition - waiverCalc.waiverAmount);
                  const isSelected = selectedStudentIds.includes(enr.id);

                  return (
                    <tr
                      key={enr.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleStudentSelection(enr.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-900">
                        {enr.classRoll}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {enr.student?.firstName} {enr.student?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: {enr.student?.studentIdNo || "N/A"}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{enr.class?.name}</span>
                        <div className="text-[11px] text-slate-500">
                          {enr.section?.name} • {enr.groupType}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-600">
                        ৳ {baseTuition.toLocaleString()}
                      </td>

                      <td className="py-3 px-3">
                        {waiverCalc.isSpecialScholarship ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate max-w-[170px]">{waiverCalc.waiverTitle}</span>
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <span className="text-slate-400">Scope:</span>
                              <span className="font-medium text-slate-700">
                                {assignedWaiver?.appliesTo === "TOTAL_PAYABLE" ? "All Fee Heads" : "Tuition Only"}
                              </span>
                            </div>
                            {assignedWaiver?.effectiveFrom && (
                              <p className="text-[10px] text-indigo-600 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{assignedWaiver.effectiveFrom}</span>
                              </p>
                            )}
                          </div>
                        ) : enr.classRoll <= 3 ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Award className="w-3 h-3 text-indigo-600" />
                              Merit Top-3 Standard
                            </span>
                            <p className="text-[10px] text-slate-400">৳500 Concession</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard (No Scheme)</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                        {waiverCalc.waiverAmount > 0 ? (
                          <div>
                            <span>-৳ {waiverCalc.waiverAmount.toLocaleString()}</span>
                            <div className="text-[10px] text-rose-500 font-semibold font-sans">
                              ({waiverCalc.waiverPercentage}% Off)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">৳ 0</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        ৳ {netTuition.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {waiverCalc.waiverAmount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active Waiver
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Standard
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(enr)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                            title="Assign or Edit Scholarship"
                          >
                            <Edit className="w-3 h-3" />
                            <span>{assignedWaiver ? "Edit" : "Assign"}</span>
                          </button>

                          {assignedWaiver && (
                            <button
                              type="button"
                              onClick={() => handleRevokeWaiver(enr)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Revoke Scholarship & Restore Tuition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          ASSIGN / EDIT SCHOLARSHIP MODAL
         ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
            {/* STICKY MODAL HEADER */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {isBatchModal
                      ? `Batch Assign Scholarship (${selectedStudentIds.length} Students)`
                      : targetExistingWaiver
                      ? `Edit Scholarship / Waiver: ${modalTargetStudent?.student?.firstName || "Student"}`
                      : `Assign Scholarship / Waiver: ${modalTargetStudent?.student?.firstName || "Student"}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isBatchModal
                      ? "Configure scholarship scheme to be applied across all selected students"
                      : "Fine-tune concession percentage, scope, authority, and duration"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                  Esc to close • Ctrl+Enter to save
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE MODAL BODY */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              <form id="scholarship-form" onSubmit={handleSaveWaiver}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* ========================================================
                      LEFT COLUMN (7 cols): SCHEME SELECTION & CONFIGURATION
                     ======================================================== */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Mode Navigation Tabs */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveModalTab("PRESETS")}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                            activeModalTab === "PRESETS"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Scheme Presets</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeModalTab === "PRESETS" ? "bg-amber-600 text-amber-100" : "bg-slate-200 text-slate-700"}`}>
                            {SCHOLARSHIP_PRESETS.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveModalTab("CUSTOM");
                            setSelectedPresetId("custom");
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                            activeModalTab === "CUSTOM"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Custom Configurator</span>
                        </button>
                      </div>

                      {activeModalTab === "PRESETS" && (
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          Click scheme to apply
                        </span>
                      )}
                    </div>

                    {/* TAB 1: PRESET SCHEMES BROWSER */}
                    {activeModalTab === "PRESETS" && (
                      <div className="space-y-3">
                        {/* Category Filter Pills & Search */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                            {(["ALL", "MERIT", "NEED", "QUOTA", "SPECIAL"] as PresetCategory[]).map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setPresetCategoryFilter(cat)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase transition ${
                                  presetCategoryFilter === cat
                                    ? "bg-slate-800 text-white"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}
                              >
                                {cat === "ALL" ? "All" : cat}
                              </button>
                            ))}
                          </div>

                          <div className="relative w-full sm:w-44">
                            <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                            <input
                              type="text"
                              value={presetSearchQuery}
                              onChange={(e) => setPresetSearchQuery(e.target.value)}
                              placeholder="Search schemes..."
                              className="w-full pl-6 pr-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 text-slate-800"
                            />
                          </div>
                        </div>

                        {/* Presets Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                          {filteredPresets.map((p) => {
                            const isSelected = selectedPresetId === p.id;
                            return (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => applyPresetToForm(p)}
                                className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/40 shadow-xs"
                                    : "bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-bold text-slate-900 text-xs truncate">
                                    {p.title}
                                  </div>
                                  <span
                                    className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      isSelected
                                        ? "bg-amber-500 text-white"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}
                                  >
                                    {p.type === "FULL_FREE"
                                      ? "100% Free"
                                      : p.type === "PERCENTAGE"
                                      ? `${p.value}% Off`
                                      : `৳${p.value} Off`}
                                  </span>
                                </div>

                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                  {p.description}
                                </p>

                                <div className="mt-2 flex items-center justify-between text-[9px]">
                                  <span className="text-slate-400">
                                    Scope:{" "}
                                    <strong className="text-slate-600">
                                      {p.appliesTo === "TOTAL_PAYABLE" ? "All Fee Heads" : "Tuition Only"}
                                    </strong>
                                  </span>
                                  {isSelected && (
                                    <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                                      <Check className="w-3 h-3" />
                                      Selected
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SCHOLARSHIP DETAILS & FINE-TUNING */}
                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3.5">
                      {/* Scholarship Title Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-slate-700 block">
                            Scholarship / Waiver Scheme Title *
                          </label>
                          {selectedPresetId !== "custom" && (
                            <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-medium">
                              Linked to Preset
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          value={customTitle}
                          onChange={(e) => {
                            setCustomTitle(e.target.value);
                            setSelectedPresetId("custom");
                          }}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                          placeholder="e.g. 100% Full Free Merit Scholarship, Board Topper Aid, Sibling Concession"
                        />
                      </div>

                      {/* Calculation Type Toggle */}
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1.5">
                          Concession Calculation Mode
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setWaiverType("FULL_FREE");
                              setWaiverValue(100);
                              setSelectedPresetId("custom");
                            }}
                            className={`py-2 px-2.5 rounded-lg border font-bold text-xs text-center transition cursor-pointer ${
                              waiverType === "FULL_FREE"
                                ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            100% Full Free
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setWaiverType("PERCENTAGE");
                              if (waiverValue > 100) setWaiverValue(50);
                              setSelectedPresetId("custom");
                            }}
                            className={`py-2 px-2.5 rounded-lg border font-bold text-xs text-center transition cursor-pointer ${
                              waiverType === "PERCENTAGE"
                                ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Percentage (%)
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setWaiverType("FIXED_AMOUNT");
                              if (waiverValue <= 100) setWaiverValue(1000);
                              setSelectedPresetId("custom");
                            }}
                            className={`py-2 px-2.5 rounded-lg border font-bold text-xs text-center transition cursor-pointer ${
                              waiverType === "FIXED_AMOUNT"
                                ? "bg-sky-600 text-white border-sky-700 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Fixed Amount (৳)
                          </button>
                        </div>
                      </div>

                      {/* Value Input with Quick Chips & Interactive Slider */}
                      {waiverType === "PERCENTAGE" && (
                        <div className="space-y-2 pt-1 border-t border-slate-200/60">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700">Quick Percentage Presets:</span>
                            <span className="font-mono font-bold text-amber-700 text-sm">
                              {waiverValue}% Concession
                            </span>
                          </div>

                          {/* Quick % Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {[10, 25, 50, 75, 100].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => {
                                  setWaiverValue(pct);
                                  setSelectedPresetId("custom");
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                  waiverValue === pct
                                    ? "bg-amber-500 text-white"
                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {pct === 100 ? "100% (Full)" : `${pct}%`}
                              </button>
                            ))}
                          </div>

                          {/* Percentage Range Slider & Input */}
                          <div className="flex items-center gap-3 pt-1">
                            <input
                              type="range"
                              min={1}
                              max={100}
                              value={waiverValue}
                              onChange={(e) => {
                                setWaiverValue(Number(e.target.value));
                                setSelectedPresetId("custom");
                              }}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="w-20 shrink-0 relative">
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={waiverValue}
                                onChange={(e) => {
                                  setWaiverValue(Math.min(100, Math.max(0, Number(e.target.value))));
                                  setSelectedPresetId("custom");
                                }}
                                className="w-full p-1.5 border border-slate-300 rounded-lg text-center font-mono font-bold text-slate-900 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {waiverType === "FIXED_AMOUNT" && (
                        <div className="space-y-2 pt-1 border-t border-slate-200/60">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700">Quick Monthly Amount Presets:</span>
                            <span className="font-mono font-bold text-sky-700 text-sm">
                              ৳ {waiverValue.toLocaleString()} / mo
                            </span>
                          </div>

                          {/* Quick ৳ Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {[300, 500, 1000, 1500, 2000, targetStudentBaseTuition].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => {
                                  setWaiverValue(amt);
                                  setSelectedPresetId("custom");
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                  waiverValue === amt
                                    ? "bg-sky-600 text-white"
                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {amt === targetStudentBaseTuition ? `Full (৳${amt})` : `৳${amt}`}
                              </button>
                            ))}
                          </div>

                          <div className="pt-1">
                            <input
                              type="number"
                              min={1}
                              max={50000}
                              value={waiverValue}
                              onChange={(e) => {
                                setWaiverValue(Number(e.target.value));
                                setSelectedPresetId("custom");
                              }}
                              className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-sky-500"
                              placeholder="Enter monthly waiver discount in Taka (৳)"
                            />
                          </div>
                        </div>
                      )}

                      {/* FEE SCOPE SELECTOR */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                        <label className="font-semibold text-slate-700 block">
                          Applies To Fee Scope
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAppliesTo("TUITION_ONLY")}
                            className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                              appliesTo === "TUITION_ONLY"
                                ? "bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-400"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="font-bold text-xs flex items-center justify-between">
                              <span>Tuition Fee Only</span>
                              {appliesTo === "TUITION_ONLY" && <Check className="w-3.5 h-3.5 text-amber-600" />}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Standard. Exam & lab fees billed normally.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAppliesTo("TOTAL_PAYABLE")}
                            className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                              appliesTo === "TOTAL_PAYABLE"
                                ? "bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-400"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="font-bold text-xs flex items-center justify-between">
                              <span>Entire Monthly Bill</span>
                              {appliesTo === "TOTAL_PAYABLE" && <Check className="w-3.5 h-3.5 text-purple-600" />}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Exempts tuition + exam + lab charges.
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* VALIDITY DURATION */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                        <label className="font-semibold text-slate-700 block">
                          Waiver Validity Duration
                        </label>
                        <select
                          value={effectiveFrom}
                          onChange={(e) => setEffectiveFrom(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                        >
                          {DURATION_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================
                      RIGHT COLUMN (5 cols): STUDENT DETAILS + REAL-TIME IMPACT PREVIEW
                     ======================================================== */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Target Student Header Details */}
                    {!isBatchModal && modalTargetStudent ? (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            Student Recipient
                          </span>
                          <span className="font-bold font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px]">
                            Roll: {modalTargetStudent.classRoll}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {modalTargetStudent.student?.firstName} {modalTargetStudent.student?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {modalTargetStudent.class?.name} • {modalTargetStudent.section?.name} • ID: {modalTargetStudent.student?.studentIdNo || "N/A"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                          <span className="text-[11px] text-slate-500">Standard Base Tuition:</span>
                          <span className="font-mono font-bold text-slate-800">
                            ৳ {targetStudentBaseTuition.toLocaleString()}/mo
                          </span>
                        </div>
                      </div>
                    ) : isBatchModal ? (
                      <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900">
                            Batch Cohort Selected
                          </span>
                          <span className="font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[11px]">
                            {selectedStudentIds.length} Students
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          This scholarship will be assigned simultaneously to all {selectedStudentIds.length} selected students. Each recipient's fee ledger will be automatically adjusted.
                        </p>
                      </div>
                    ) : null}

                    {/* REAL-TIME LEDGER IMPACT PREVIEW BOX */}
                    <div className="p-4 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-emerald-50/80 border-2 border-amber-300/80 rounded-xl text-xs space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>Real-time Ledger Impact</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800 font-bold text-[10px]">
                          {calculatedModalPercentage}% Discount
                        </span>
                      </div>

                      {/* Visual Fee Meter Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span className="text-rose-600">Waived: {calculatedModalPercentage}%</span>
                          <span className="text-emerald-700">Payable: {100 - calculatedModalPercentage}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${calculatedModalPercentage}%` }}
                            className="bg-rose-500 transition-all duration-300"
                            title={`Waived: ${calculatedModalPercentage}%`}
                          />
                          <div
                            style={{ width: `${100 - calculatedModalPercentage}%` }}
                            className="bg-emerald-500 transition-all duration-300"
                            title={`Payable: ${100 - calculatedModalPercentage}%`}
                          />
                        </div>
                      </div>

                      {/* Financial Breakdown Table */}
                      <div className="space-y-1.5 pt-1 text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Standard Base Tuition:</span>
                          <span className="font-mono font-medium">৳ {targetStudentBaseTuition.toLocaleString()}</span>
                        </div>

                        {appliesTo === "TOTAL_PAYABLE" && (
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Exam & Lab Auxiliary Fees:</span>
                            <span className="font-mono">+ ৳ {baseAuxiliaryFees}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-rose-600 font-bold border-t border-amber-200/50 pt-1.5">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-rose-500" />
                            <span>Calculated Waiver:</span>
                          </span>
                          <span className="font-mono text-sm">
                            - ৳ {calculatedModalWaiverAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between border-t-2 border-amber-300/80 pt-2 text-emerald-800 font-extrabold text-sm">
                          <span>Net Student Monthly Bill:</span>
                          <span className="font-mono text-base">
                            ৳ {calculatedModalNetPayable.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Projected Annual Savings */}
                      <div className="p-2 bg-white/70 rounded-lg border border-amber-200 text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Projected Annual Savings:</span>
                        <span className="font-mono font-bold text-amber-700">
                          ৳ {annualizedSavings.toLocaleString()} / year
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 italic flex items-center gap-1">
                        <Info className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Receipt reflects: "{customTitle} (-৳{calculatedModalWaiverAmount.toLocaleString()})"</span>
                      </div>
                    </div>

                    {/* GOVERNANCE & REMARKS */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Approval Authority
                        </label>
                        <input
                          type="text"
                          value={approvedBy}
                          onChange={(e) => setApprovedBy(e.target.value)}
                          placeholder="e.g. Headmaster & SMC, Academic Committee"
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Award Remarks / Justification (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. Board Top-10 Merit rank, Sibling discount, Single parent financial hardship application ref #104"
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* STICKY MODAL FOOTER */}
            <div className="px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2">
                {!isBatchModal && targetExistingWaiver && (
                  <button
                    type="button"
                    onClick={handleRevokeFromModal}
                    className="px-3 py-2 text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Revoke Scholarship</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    applyPresetToForm(SCHOLARSHIP_PRESETS[0]);
                    setEffectiveFrom("Full Academic Session (Jan – Dec)");
                  }}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg font-semibold text-xs transition cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold text-slate-700 text-xs cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveWaiver()}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save & Apply to Ledger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
