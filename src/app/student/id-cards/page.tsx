"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  Printer,
  Search,
  Filter,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  UserCheck,
  Check,
  QrCode,
  Phone,
  Droplet,
  Layers,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Camera,
  Upload,
  X,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { SessionSelect } from "@/components/SessionSelect";
import { DownloadNavHeader } from "@/app/download/DownloadNavHeader";

type CardTheme = "emerald" | "navy" | "maroon" | "slate";
type CardOrientation = "portrait" | "landscape";

export default function StudentIdCardsPage() {
  // Filter States (matching user specification)
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Data & Selection States
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Card Design Controls
  const [orientation, setOrientation] = useState<CardOrientation>("portrait");
  const [cardTheme, setCardTheme] = useState<CardTheme>("emerald");
  const [showGuardianPhone, setShowGuardianPhone] = useState(true);
  const [showBloodGroup, setShowBloodGroup] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showSignature, setShowSignature] = useState(true);

  // Photo Edit / Manual Add State
  const [photoModalStudent, setPhotoModalStudent] = useState<any | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch classes on mount
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
        // By default, select all filtered students for convenient printing
        setSelectedIds(data.data.map((s: any) => s.id));
      } else {
        setStudents([]);
        setSelectedIds([]);
      }
    } catch (e) {
      console.error("Error fetching students:", e);
      setStudents([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSession, selectedClassId, selectedSectionId, selectedShift, selectedGroup, searchQuery, selectedStatus]);

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
    if (classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
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

  // Select / Deselect Students
  const toggleSelectStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === students.length && students.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s.id));
    }
  };

  // Extract Blood group helper
  const getBloodGroup = (student: any) => {
    if (student.customFields) {
      try {
        const parsed = typeof student.customFields === "string" ? JSON.parse(student.customFields) : student.customFields;
        if (parsed.bloodGroup) return parsed.bloodGroup;
      } catch (e) {
        // ignore
      }
    }
    const bloodTypes = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-"];
    const hash = (student.studentIdNo || student.firstName || "A").charCodeAt(0) % bloodTypes.length;
    return bloodTypes[hash];
  };

  // Extract Student Photo helper from customFields
  const getStudentPhoto = (student: any) => {
    if (student.customFields) {
      try {
        const parsed = typeof student.customFields === "string" ? JSON.parse(student.customFields) : student.customFields;
        for (const key of Object.keys(parsed)) {
          const v = parsed[key];
          if (typeof v === "string" && (v.startsWith("data:image/") || v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/"))) {
            return v;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  };

  // Open Photo Edit Modal
  const handleOpenPhotoModal = (enr: any) => {
    const student = enr.student || {};
    const existingPhoto = getStudentPhoto(student) || "";
    setPhotoModalStudent(enr);
    setNewPhotoPreview(existingPhoto);
    setUrlInput(existingPhoto.startsWith("http") ? existingPhoto : "");
  };

  // Save / Update Student Photo
  const handleSavePhoto = async () => {
    if (!photoModalStudent || !photoModalStudent.student?.id) return;
    setSavingPhoto(true);
    try {
      const student = photoModalStudent.student;
      let existingCustom: Record<string, any> = {};
      if (student.customFields) {
        try {
          existingCustom =
            typeof student.customFields === "string"
              ? JSON.parse(student.customFields)
              : student.customFields;
        } catch (e) {}
      }

      const updatedCustom: Record<string, any> = {
        ...existingCustom,
        photo: newPhotoPreview || undefined,
      };
      if (!newPhotoPreview) {
        delete updatedCustom.photo;
        delete updatedCustom.studentPhoto;
      }

      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          customFields: updatedCustom,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local student in state immediately
        setStudents((prev) =>
          prev.map((item) => {
            if (item.id === photoModalStudent.id) {
              return {
                ...item,
                student: {
                  ...item.student,
                  customFields: JSON.stringify(updatedCustom),
                },
              };
            }
            return item;
          })
        );
        setToastMessage({
          text: `Photo updated successfully for ${student.firstName || "Student"}!`,
          type: "success",
        });
        setTimeout(() => setToastMessage(null), 3500);
        setPhotoModalStudent(null);
      } else {
        alert("Failed to update photo: " + data.error);
      }
    } catch (e: any) {
      alert("Error updating photo: " + e.message);
    } finally {
      setSavingPhoto(false);
    }
  };

  // Color Theme definitions
  const themeStyles = {
    emerald: {
      headerBg: "bg-gradient-to-r from-emerald-800 to-teal-900 text-white",
      badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
      accentText: "text-emerald-700",
      border: "border-emerald-200",
      avatarBg: "bg-emerald-700 text-white",
      footerBg: "bg-emerald-950 text-emerald-200",
    },
    navy: {
      headerBg: "bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white",
      badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-300",
      accentText: "text-indigo-700",
      border: "border-indigo-200",
      avatarBg: "bg-indigo-700 text-white",
      footerBg: "bg-slate-950 text-indigo-200",
    },
    maroon: {
      headerBg: "bg-gradient-to-r from-rose-950 via-rose-900 to-red-900 text-white",
      badgeBg: "bg-rose-100 text-rose-800 border-rose-300",
      accentText: "text-rose-700",
      border: "border-rose-200",
      avatarBg: "bg-rose-700 text-white",
      footerBg: "bg-neutral-950 text-rose-200",
    },
    slate: {
      headerBg: "bg-gradient-to-r from-slate-800 to-slate-950 text-white",
      badgeBg: "bg-slate-200 text-slate-800 border-slate-300",
      accentText: "text-slate-800",
      border: "border-slate-300",
      avatarBg: "bg-slate-800 text-white",
      footerBg: "bg-black text-slate-300",
    },
  };

  const currentTheme = themeStyles[cardTheme];

  // Students to render on ID Cards
  const displayedStudents = students.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <DownloadNavHeader />
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            font-size: 11px;
            color: black !important;
          }
          .id-cards-print-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
            page-break-inside: avoid;
          }
          .print-card-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span>Students</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Student ID Cards</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>Student ID Cards</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate, customize, and batch-print photo ID cards for enrolled students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/setup/student-info"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Student Info</span>
          </Link>
          <button
            onClick={() => window.print()}
            disabled={displayedStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print {displayedStudents.length} ID Card{displayedStudents.length === 1 ? "" : "s"}</span>
          </button>
        </div>
      </div>

      {/* Feature Notification / Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 no-print">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <p className="font-semibold text-emerald-950 mb-0.5">Official Student ID Cards Generator • NCTB Bangladesh Standard</p>
          Configure classes and sections using the live filter below. Cards are generated with student barcodes, QR codes, emergency guardian contact details, and institutional credentials.
        </div>
      </div>

      {/* ========================================================
          FILTER BAR (Exact format matching user specification image)
         ======================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Filter:
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
          {/* 1. Session Filter */}
          <div>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session:"
              labelClassName="font-semibold text-slate-600 block mb-1"
              selectClassName="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            />
          </div>

          {/* 2. Class Filter */}
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

          {/* 2. Shift Filter */}
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

          {/* 3. Group Filter */}
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

          {/* 4. Section Filter */}
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

          {/* 5. Status Filter */}
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

          {/* 6. Live Search Student */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Search Student:</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, Roll, ID..."
                className="w-full p-2 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ID Card Customization & Feature Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Card Template & Customization Controls
            </h2>
          </div>

          {/* Selection Actions */}
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 font-medium cursor-pointer"
            >
              {selectedIds.length === students.length && students.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({students.length})</span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {displayedStudents.length} of {students.length} cards selected
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Card Orientation */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Layout Orientation:</label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as CardOrientation)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-medium"
            >
              <option value="portrait">Standard Portrait (Vertical)</option>
              <option value="landscape">Horizontal Smart Card (Landscape)</option>
            </select>
          </div>

          {/* Color Theme */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Card Color Theme:</label>
            <select
              value={cardTheme}
              onChange={(e) => setCardTheme(e.target.value as CardTheme)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-medium"
            >
              <option value="emerald">Emerald Green (Standard)</option>
              <option value="navy">Royal Navy Blue</option>
              <option value="maroon">Maroon Crimson</option>
              <option value="slate">Dark Slate Onyx</option>
            </select>
          </div>

          {/* Optional Card Elements Checkboxes */}
          <div className="sm:col-span-2 flex flex-wrap items-center gap-x-5 gap-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showGuardianPhone}
                onChange={(e) => setShowGuardianPhone(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Guardian Phone</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showBloodGroup}
                onChange={(e) => setShowBloodGroup(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Blood Group</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showQrCode}
                onChange={(e) => setShowQrCode(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>QR Code & Barcode</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showSignature}
                onChange={(e) => setShowSignature(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Principal Seal</span>
            </label>
          </div>
        </div>
      </div>

      {/* ========================================================
          GENERATED ID CARDS GRID / PRINT VIEW
         ======================================================== */}
      <div>
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold">Loading students matching filter criteria...</p>
          </div>
        ) : displayedStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 shadow-sm space-y-2">
            <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Student ID Cards Selected</p>
            <p className="text-xs text-slate-500">
              {students.length === 0
                ? "No students found matching the selected class, section, or filters."
                : "Check the student checkboxes above or click 'Select All' to display cards."}
            </p>
          </div>
        ) : (
          <div
            className={`id-cards-print-grid grid gap-6 ${
              orientation === "portrait"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {displayedStudents.map((enr) => {
              const student = enr.student || {};
              const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student";
              const roll = enr.classRoll ?? "-";
              const className = enr.class?.name || "Class";
              const sectionName = enr.section?.name || "A";
              const shift = enr.section?.shift || "Day";
              const group = enr.groupType || "General";
              const studentId = student.studentIdNo || `ST-${enr.id.slice(0, 8)}`;
              const bloodGroup = getBloodGroup(student);
              const photoUrl = getStudentPhoto(student);
              const isSelected = selectedIds.includes(enr.id);

              if (orientation === "portrait") {
                // ==========================================
                // VERTICAL / PORTRAIT ID CARD
                // ==========================================
                return (
                  <div
                    key={enr.id}
                    className={`print-card-break relative bg-white rounded-2xl border ${currentTheme.border} shadow-md overflow-hidden flex flex-col justify-between transition hover:shadow-lg`}
                    style={{ minHeight: "410px" }}
                  >
                    {/* Header Strip */}
                    <div className={`${currentTheme.headerBg} p-3.5 text-center relative border-b border-white/20`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90">
                          NCTB Standard ID
                        </span>
                        <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded">
                          EIIN: 108254
                        </span>
                      </div>
                      <h3 className="font-bold text-xs leading-tight tracking-wide">
                        Dhaka Ideal Model High School
                      </h3>
                      <p className="text-[9px] opacity-80 mt-0.5">ESTD: 1994 • Session 2026</p>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col items-center flex-1">
                      {/* Avatar / Photo with Edit Button */}
                      <div className="relative group/avatar mb-3 shrink-0">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={fullName}
                            className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md shrink-0 cursor-pointer hover:opacity-95 transition"
                            onClick={() => handleOpenPhotoModal(enr)}
                            title="Click to edit / add photo"
                          />
                        ) : (
                          <div
                            onClick={() => handleOpenPhotoModal(enr)}
                            className={`w-20 h-20 rounded-full ${currentTheme.avatarBg} border-2 border-white shadow-md flex items-center justify-center text-xl font-bold shrink-0 cursor-pointer hover:opacity-95 transition`}
                            title="Click to add photo"
                          >
                            {student.firstName?.[0] || "S"}
                            {student.lastName?.[0] || ""}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoModal(enr)}
                          className="no-print absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-900/85 hover:bg-emerald-600 text-white shadow border border-white transition-all transform hover:scale-110 cursor-pointer"
                          title="Edit / Add Photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Name & Academic Tag */}
                      <h4 className="font-bold text-sm text-slate-900 text-center leading-tight">
                        {fullName}
                      </h4>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap justify-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${currentTheme.badgeBg}`}>
                          {className} • Sec: {sectionName}
                        </span>
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {shift}
                        </span>
                      </div>

                      {/* Key-Value Details Table */}
                      <div className="w-full mt-3 bg-slate-50 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Roll No:</span>
                          <span className="font-bold font-mono text-slate-900">{roll}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Student ID:</span>
                          <span className="font-bold font-mono text-slate-900">{studentId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Group:</span>
                          <span className="font-medium text-slate-700 capitalize">{group.toLowerCase().replace(/_/g, " ")}</span>
                        </div>
                        {showBloodGroup && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Droplet className="w-3 h-3 text-rose-500" />
                              Blood Group:
                            </span>
                            <span className="font-bold text-rose-600">{bloodGroup}</span>
                          </div>
                        )}
                        {showGuardianPhone && student.guardianPhone && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              Emergency:
                            </span>
                            <span className="font-mono text-slate-800 font-semibold">{student.guardianPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* Barcode / QR Simulation */}
                      {showQrCode && (
                        <div className="w-full mt-3 flex items-center justify-between pt-2 border-t border-slate-100 px-1">
                          <div className="flex items-center gap-1.5">
                            <QrCode className="w-7 h-7 text-slate-700 shrink-0" />
                            <div className="text-[8px] text-slate-400 font-mono leading-none">
                              SCAN TO<br />VERIFY
                            </div>
                          </div>
                          {showSignature && (
                            <div className="text-right">
                              <div className="font-serif italic text-[11px] text-slate-700 -mb-1">
                                M. Rahman
                              </div>
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider">
                                Headmaster
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Bar */}
                    <div className={`${currentTheme.footerBg} py-1.5 px-3 text-center text-[9px] font-medium border-t border-white/10 flex items-center justify-between`}>
                      <span>Valid: 2026-2027</span>
                      <span className="uppercase tracking-widest text-[8px] opacity-80">Official Student ID</span>
                    </div>

                    {/* Checkbox selector on hover / no-print */}
                    <div className="no-print absolute top-2 right-2">
                      <button
                        onClick={() => toggleSelectStudent(enr.id)}
                        className="bg-white/90 hover:bg-white p-1 rounded-md shadow-sm border border-slate-300 text-slate-700 transition cursor-pointer"
                        title={isSelected ? "Deselect Card" : "Select Card"}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              } else {
                // ==========================================
                // HORIZONTAL / LANDSCAPE ID CARD
                // ==========================================
                return (
                  <div
                    key={enr.id}
                    className={`print-card-break relative bg-white rounded-2xl border ${currentTheme.border} shadow-md overflow-hidden flex flex-col justify-between transition hover:shadow-lg`}
                    style={{ minHeight: "260px" }}
                  >
                    {/* Header */}
                    <div className={`${currentTheme.headerBg} px-4 py-2.5 flex items-center justify-between border-b border-white/20`}>
                      <div>
                        <h3 className="font-bold text-xs tracking-wide">
                          Dhaka Ideal Model High School & College
                        </h3>
                        <p className="text-[9px] opacity-80">EIIN: 108254 • Bangladesh National Curriculum</p>
                      </div>
                      <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded">
                        ID: {studentId}
                      </span>
                    </div>

                    {/* Body Horizontal Split */}
                    <div className="p-3.5 flex items-center gap-4 flex-1">
                      {/* Left Side: Avatar & QR with Edit button */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="relative group/avatar mb-2 shrink-0">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={fullName}
                              className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md shrink-0 cursor-pointer hover:opacity-95 transition"
                              onClick={() => handleOpenPhotoModal(enr)}
                              title="Click to edit / add photo"
                            />
                          ) : (
                            <div
                              onClick={() => handleOpenPhotoModal(enr)}
                              className={`w-16 h-16 rounded-xl ${currentTheme.avatarBg} border-2 border-white shadow-md flex items-center justify-center text-lg font-bold shrink-0 cursor-pointer hover:opacity-95 transition`}
                              title="Click to add photo"
                            >
                              {student.firstName?.[0] || "S"}
                              {student.lastName?.[0] || ""}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoModal(enr)}
                            className="no-print absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900/85 hover:bg-emerald-600 text-white shadow border border-white transition-all transform hover:scale-110 cursor-pointer"
                            title="Edit / Add Photo"
                          >
                            <Camera className="w-3 h-3" />
                          </button>
                        </div>
                        {showQrCode && (
                          <div className="flex items-center gap-1">
                            <QrCode className="w-5 h-5 text-slate-700" />
                            <span className="text-[8px] font-mono text-slate-500">VERIFIED</span>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Information Table */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900 leading-tight">
                            {fullName}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentTheme.badgeBg}`}>
                            Roll: {roll}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-slate-400">Class: </span>
                            <strong className="text-slate-800">{className}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Section: </span>
                            <strong className="text-slate-800">{sectionName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Shift: </span>
                            <span className="text-slate-700">{shift}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Group: </span>
                            <span className="text-slate-700 capitalize">{group.toLowerCase().replace(/_/g, " ")}</span>
                          </div>
                          {showBloodGroup && (
                            <div>
                              <span className="text-slate-400">Blood: </span>
                              <strong className="text-rose-600 font-bold">{bloodGroup}</strong>
                            </div>
                          )}
                          {showGuardianPhone && student.guardianPhone && (
                            <div className="truncate">
                              <span className="text-slate-400">Phone: </span>
                              <span className="font-mono text-slate-800 font-semibold">{student.guardianPhone}</span>
                            </div>
                          )}
                        </div>

                        {showSignature && (
                          <div className="flex items-center justify-end text-right pt-1">
                            <div>
                              <span className="font-serif italic text-xs text-slate-700 block -mb-1">
                                M. Rahman
                              </span>
                              <span className="text-[8px] text-slate-400 uppercase">Principal Signature</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className={`${currentTheme.footerBg} py-1 px-4 text-center text-[9px] font-medium flex items-center justify-between`}>
                      <span>Emergency: {student.guardianPhone || "School Hotline: 01700-000000"}</span>
                      <span>Session 2026</span>
                    </div>

                    {/* Checkbox selector */}
                    <div className="no-print absolute top-2 right-2">
                      <button
                        onClick={() => toggleSelectStudent(enr.id)}
                        className="bg-white/90 hover:bg-white p-1 rounded-md shadow-sm border border-slate-300 text-slate-700 transition cursor-pointer"
                        title={isSelected ? "Deselect Card" : "Select Card"}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-lg flex items-center space-x-3 text-xs font-semibold no-print ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20"
              : "bg-rose-600 text-white border-rose-500 shadow-rose-900/20"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Edit / Manually Add Photo Modal */}
      {photoModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Edit / Manually Add Student Photo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModalStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Student Identification Banner */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {photoModalStudent.student?.firstName} {photoModalStudent.student?.lastName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ID: <span className="font-mono font-medium text-slate-700">{photoModalStudent.student?.studentIdNo}</span> • Roll: <span className="font-bold text-slate-900">#{photoModalStudent.classRoll}</span>
                  </p>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  {photoModalStudent.class?.name} ({photoModalStudent.section?.name})
                </span>
              </div>

              {/* Photo Preview & Upload Box */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="relative">
                  {newPhotoPreview ? (
                    <img
                      src={newPhotoPreview}
                      alt="Student Photo Preview"
                      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-emerald-500/50"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-slate-200 border-4 border-white shadow-md flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-medium">No Photo</span>
                    </div>
                  )}

                  {newPhotoPreview && (
                    <button
                      type="button"
                      onClick={() => setNewPhotoPreview("")}
                      className="absolute top-0 right-0 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload File Input */}
                <div className="w-full flex flex-col items-center space-y-2">
                  <label className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-white border border-dashed border-emerald-400 hover:border-emerald-600 rounded-xl cursor-pointer hover:bg-emerald-50/50 transition text-emerald-800 font-semibold shadow-xs">
                    <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Choose Photo From Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Please select an image smaller than 2MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setNewPhotoPreview(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 text-center">
                    JPG, PNG, or WebP (Passport size recommended, max 2MB)
                  </p>
                </div>
              </div>

              {/* Or Paste Web Image URL */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block text-[11px]">
                  Or Paste Photo Web URL:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    placeholder="https://example.com/student-photo.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (urlInput.trim()) {
                        setNewPhotoPreview(urlInput.trim());
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs border border-slate-300 transition cursor-pointer"
                  >
                    Load URL
                  </button>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPhotoModalStudent(null)}
                  disabled={savingPhoto}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={savingPhoto}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  {savingPhoto ? (
                    <span>Saving Photo...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Photo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
