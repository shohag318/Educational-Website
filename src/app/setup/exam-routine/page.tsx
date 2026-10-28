"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarRange,
  Clock,
  Printer,
  Plus,
  Trash2,
  Pencil,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Sparkles,
  School,
  FileText,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Save,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  BookOpen,
  Timer,
  BookmarkPlus,
  EyeOff,
} from "lucide-react";
import { ResultNavHeader } from "@/app/results/ResultNavHeader";
import { SessionSelect } from "@/components/SessionSelect";
import {
  getStoredSchoolInfo,
  SchoolBasicInfo,
  DEFAULT_SCHOOL_INFO,
} from "@/lib/settingsStore";
import {
  ExamRoutineConfig,
  ExamRoutineItem,
  getStoredRoutines,
  saveRoutine,
  deleteRoutine,
  resetRoutinesToDefault,
  getDayNameFromDate,
  formatDateBnEn,
  DEFAULT_EXAM_INSTRUCTIONS,
  ROUTINE_UPDATED_EVENT,
  QuickTimePreset,
  DEFAULT_QUICK_TIME_PRESETS,
  getCustomTimePresets,
  saveCustomTimePreset,
  deleteCustomTimePreset,
  time24To12,
  time12To24,
  calculateEndTime,
} from "@/lib/examRoutineStore";

interface ClassOption {
  id: string;
  name: string;
  numericValue: number;
  shift: string;
}

interface ExamOption {
  id: string;
  name: string;
  classId: string;
  termCode?: string;
  academicYear?: {
    id: string;
    yearName: string;
  };
  subjectConfigs?: Array<{
    subject: {
      id: string;
      subjectCode: string;
      name: string;
    };
  }>;
}

interface SubjectOption {
  id: string;
  subjectCode: string;
  name: string;
}

export default function ExamRoutinePage() {
  // Navigation / View State
  const [activeTab, setActiveTab] = useState<"setup" | "print">("setup");
  const [showRoomInPrint, setShowRoomInPrint] = useState(true);

  // Filters State
  const [selectedSession, setSelectedSession] = useState("2025-2026");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedShift, setSelectedShift] = useState("ALL");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
  const [routines, setRoutines] = useState<ExamRoutineConfig[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolBasicInfo>(DEFAULT_SCHOOL_INFO);

  // Toast / Notification
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Modal State for Adding / Editing Routine Item
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<Omit<ExamRoutineItem, "id">>({
    date: "",
    day: "",
    startTime: "10:00 AM",
    endTime: "01:00 PM",
    subjectCode: "101",
    subjectName: "",
    paperType: "Theory (CQ + MCQ)",
    group: "ALL",
    shift: "DAY",
    roomNo: "Room 101, 102",
    invigilator: "",
    remarks: "",
  });

  // Subject Dropdown State & Multi-Select
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [selectedSubjectsList, setSelectedSubjectsList] = useState<Array<{ code: string; name: string }>>([]);

  // Field Hide/Unhide States for Optional Fields
  const [isRoomHidden, setIsRoomHidden] = useState(false);
  const [isInvigilatorHidden, setIsInvigilatorHidden] = useState(false);
  const [isRemarksHidden, setIsRemarksHidden] = useState(false);

  // Quick Time Presets State & Custom Time Setup
  const [isCustomTimeOpen, setIsCustomTimeOpen] = useState(false);
  const [customStart24, setCustomStart24] = useState("10:00");
  const [customEnd24, setCustomEnd24] = useState("13:00");
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number>(180);
  const [savedCustomPresets, setSavedCustomPresets] = useState<QuickTimePreset[]>([]);
  const [customPresetLabel, setCustomPresetLabel] = useState("");

  // Instruction editing modal or inline
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [customInstructions, setCustomInstructions] = useState<string[]>(DEFAULT_EXAM_INSTRUCTIONS);
  const [newInstructionText, setNewInstructionText] = useState("");

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load School Info & Database Classes/Exams
  useEffect(() => {
    setSchoolInfo(getStoredSchoolInfo());
    const initialRoutines = getStoredRoutines();
    setRoutines(initialRoutines);
    setSavedCustomPresets(getCustomTimePresets());

    const handleUpdate = () => {
      setRoutines(getStoredRoutines());
      setSchoolInfo(getStoredSchoolInfo());
      setSavedCustomPresets(getCustomTimePresets());
    };
    window.addEventListener(ROUTINE_UPDATED_EVENT, handleUpdate);

    // Fetch classes and exams from server
    fetch("/api/exam-routine")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (json.data.classes) {
            setClasses(json.data.classes);
            if (!selectedClassId && json.data.classes.length > 0) {
              setSelectedClassId(json.data.classes[0].id);
            }
          }
          if (json.data.exams) {
            setExams(json.data.exams);
            if (!selectedExamId && json.data.exams.length > 0) {
              setSelectedExamId(json.data.exams[0].id);
            }
          }
          if (json.data.allSubjects) {
            setAllSubjects(json.data.allSubjects);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load initial data for routine:", err);
      });

    return () => {
      window.removeEventListener(ROUTINE_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  // Filtered exams for selected class
  const availableExamsForClass = useMemo(() => {
    if (!selectedClassId) return exams;
    return exams.filter((e) => e.classId === selectedClassId);
  }, [exams, selectedClassId]);

  // Sync selected exam when class changes
  useEffect(() => {
    if (availableExamsForClass.length > 0) {
      const exists = availableExamsForClass.some((e) => e.id === selectedExamId);
      if (!exists) {
        setSelectedExamId(availableExamsForClass[0].id);
      }
    } else {
      setSelectedExamId("");
    }
  }, [selectedClassId, availableExamsForClass]);

  // Selected Class and Exam Objects
  const selectedClassObj = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  const selectedExamObj = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId) || null;
  }, [exams, selectedExamId]);

  // Current Routine Config (Matched or Created in-memory)
  const currentRoutine = useMemo<ExamRoutineConfig>(() => {
    const found = routines.find(
      (r) =>
        (r.examId === selectedExamId && selectedExamId) ||
        (r.classId === selectedClassId && !selectedExamId)
    );

    if (found) {
      return found;
    }

    // Default fallback routine config
    return {
      id: `routine-${selectedClassId || "default"}-${selectedExamId || "exam"}`,
      session: selectedSession,
      classId: selectedClassId || "",
      className: selectedClassObj?.name || "Class 11",
      examId: selectedExamId || "",
      examName: selectedExamObj?.name || "Term Final Examination",
      shift: selectedShift === "ALL" ? "DAY" : selectedShift,
      group: selectedGroup,
      publishedDate: new Date().toISOString().split("T")[0],
      instructions: customInstructions,
      controllerTitle: schoolInfo.controllerTitle || "Controller of Examinations",
      controllerName: schoolInfo.controllerName || "Prof. Md. Rafiqul Islam",
      headTitle: schoolInfo.headTitle || "Principal",
      headName: schoolInfo.headName || "Prof. A. K. M. Shamsuddin",
      items: [],
      updatedAt: new Date().toISOString(),
    };
  }, [
    routines,
    selectedClassId,
    selectedExamId,
    selectedSession,
    selectedClassObj,
    selectedExamObj,
    selectedShift,
    selectedGroup,
    customInstructions,
    schoolInfo,
  ]);

  // Items filtered by Shift, Group, Search Query
  const filteredRoutineItems = useMemo(() => {
    let items = currentRoutine.items || [];

    if (selectedShift !== "ALL") {
      items = items.filter((item) => item.shift === "ALL" || item.shift === selectedShift);
    }

    if (selectedGroup !== "ALL") {
      items = items.filter((item) => item.group === "ALL" || item.group === selectedGroup);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.subjectName.toLowerCase().includes(q) ||
          (item.subjectCode || "").toLowerCase().includes(q) ||
          item.roomNo.toLowerCase().includes(q) ||
          item.day.toLowerCase().includes(q) ||
          item.date.includes(q)
      );
    }

    return items;
  }, [currentRoutine.items, selectedShift, selectedGroup, searchQuery]);

  // Mandatory / configured subjects for the selected class/exam
  const mandatorySubjects = useMemo(() => {
    const list: Array<{ code: string; name: string }> = [];
    const seen = new Set<string>();

    // 1. From selected exam's subject configs
    if (selectedExamObj?.subjectConfigs && selectedExamObj.subjectConfigs.length > 0) {
      selectedExamObj.subjectConfigs.forEach((cfg) => {
        const code = cfg.subject.subjectCode || "";
        const name = cfg.subject.name || "";
        const key = `${code}-${name.toLowerCase()}`;
        if (name && !seen.has(key)) {
          seen.add(key);
          list.push({ code, name });
        }
      });
    }

    // 2. From all subjects in the system
    if (allSubjects && allSubjects.length > 0) {
      allSubjects.forEach((sub) => {
        const key = `${sub.subjectCode || ""}-${sub.name.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ code: sub.subjectCode || "", name: sub.name });
        }
      });
    }

    // 3. Fallback standard curriculum subjects if empty
    if (list.length === 0) {
      const defaults = [
        { code: "101", name: "Bangla 1st Paper" },
        { code: "102", name: "Bangla 2nd Paper" },
        { code: "107", name: "English 1st Paper" },
        { code: "108", name: "English 2nd Paper" },
        { code: "109", name: "Mathematics" },
        { code: "275", name: "Information and Communication Technology" },
        { code: "174", name: "Physics 1st Paper" },
        { code: "175", name: "Physics 2nd Paper" },
        { code: "176", name: "Chemistry 1st Paper" },
        { code: "177", name: "Chemistry 2nd Paper" },
        { code: "178", name: "Biology 1st Paper" },
        { code: "179", name: "Biology 2nd Paper" },
        { code: "265", name: "Higher Mathematics 1st Paper" },
        { code: "266", name: "Higher Mathematics 2nd Paper" },
        { code: "109", name: "Economics 1st Paper" },
        { code: "110", name: "Economics 2nd Paper" },
        { code: "121", name: "Logic 1st Paper" },
        { code: "122", name: "Logic 2nd Paper" },
        { code: "277", name: "Business Organization & Management 1st Paper" },
        { code: "278", name: "Business Organization & Management 2nd Paper" },
        { code: "292", name: "Finance, Banking & Insurance 1st Paper" },
        { code: "293", name: "Finance, Banking & Insurance 2nd Paper" },
      ];
      defaults.forEach((sub) => {
        const key = `${sub.code}-${sub.name.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(sub);
        }
      });
    }

    return list;
  }, [selectedExamObj, allSubjects]);

  // Filter out already selected / scheduled subjects
  const availableSubjectsForModal = useMemo(() => {
    const scheduledItems = currentRoutine.items || [];
    // Exclude the current item being edited from the "already scheduled" check
    const otherScheduledItems = editingItemId
      ? scheduledItems.filter((it) => it.id !== editingItemId)
      : scheduledItems;

    const scheduledCodes = new Set<string>();
    const scheduledNames = new Set<string>();

    otherScheduledItems.forEach((it) => {
      if (it.subjectCode) {
        it.subjectCode.split(/[\/,]/).forEach((c) => {
          const trimmed = c.trim();
          if (trimmed) scheduledCodes.add(trimmed);
        });
      }
      if (it.subjectName) {
        it.subjectName.split(/[\/,]/).forEach((n) => {
          const trimmed = n.trim().toLowerCase();
          if (trimmed) scheduledNames.add(trimmed);
        });
      }
    });

    return mandatorySubjects.filter((sub) => {
      const codeMatch = sub.code && scheduledCodes.has(sub.code.trim());
      const nameMatch = sub.name && scheduledNames.has(sub.name.trim().toLowerCase());
      return !codeMatch && !nameMatch;
    });
  }, [mandatorySubjects, currentRoutine.items, editingItemId]);

  // Check if filters are dirty
  const hasActiveFilters =
    selectedShift !== "ALL" || selectedGroup !== "ALL" || searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedShift("ALL");
    setSelectedGroup("ALL");
    setSearchQuery("");
  };

  // Custom Time Setup Handlers
  const handleToggleCustomTime = () => {
    if (!isCustomTimeOpen) {
      const s24 = time12To24(itemForm.startTime) || "10:00";
      const e24 = time12To24(itemForm.endTime) || "13:00";
      setCustomStart24(s24);
      setCustomEnd24(e24);
    }
    setIsCustomTimeOpen(!isCustomTimeOpen);
  };

  const handleCustomStartChange = (newStart24: string) => {
    setCustomStart24(newStart24);
    if (customDurationMinutes > 0) {
      const start12 = time24To12(newStart24);
      const calculatedEnd12 = calculateEndTime(start12, customDurationMinutes);
      setCustomEnd24(time12To24(calculatedEnd12));
    }
  };

  const handleSelectDuration = (minutes: number) => {
    setCustomDurationMinutes(minutes);
    const start12 = time24To12(customStart24 || "10:00");
    const calculatedEnd12 = calculateEndTime(start12, minutes);
    setCustomEnd24(time12To24(calculatedEnd12));
  };

  const handleCustomEndChange = (newEnd24: string) => {
    setCustomEnd24(newEnd24);
    setCustomDurationMinutes(0);
  };

  const handleApplyCustomTime = () => {
    const s12 = time24To12(customStart24);
    const e12 = time24To12(customEnd24);
    if (!s12 || !e12) {
      showToast("Please enter valid start and end times.", "error");
      return;
    }
    setItemForm((prev) => ({
      ...prev,
      startTime: s12,
      endTime: e12,
    }));
    showToast(`Time set to ${s12} — ${e12}`);
    setIsCustomTimeOpen(false);
  };

  // Save custom time as reusable quick preset
  const handleSaveCustomTimePreset = (applyImmediately: boolean = true) => {
    const s12 = time24To12(customStart24);
    const e12 = time24To12(customEnd24);
    if (!s12 || !e12) {
      showToast("Please enter valid start and end times.", "error");
      return;
    }
    const labelToUse = customPresetLabel.trim() || `${s12} — ${e12}`;
    saveCustomTimePreset({
      label: labelToUse,
      start: s12,
      end: e12,
    });
    setSavedCustomPresets(getCustomTimePresets());
    setCustomPresetLabel("");
    showToast(`Custom time "${labelToUse}" saved to Quick Times!`);

    if (applyImmediately) {
      setItemForm((prev) => ({
        ...prev,
        startTime: s12,
        endTime: e12,
      }));
      setIsCustomTimeOpen(false);
    }
  };

  const handleDeleteSavedPreset = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    deleteCustomTimePreset(presetId);
    setSavedCustomPresets(getCustomTimePresets());
    showToast("Custom time preset removed.");
  };

  const handleApplySavedPreset = (preset: QuickTimePreset) => {
    setItemForm((prev) => ({
      ...prev,
      startTime: preset.start,
      endTime: preset.end,
    }));
    showToast(`Time set to ${preset.start} — ${preset.end}`);
  };

  // Open modal for adding a new item
  const handleOpenAddItem = () => {
    setEditingItemId(null);
    setIsCustomTimeOpen(false);
    setCustomPresetLabel("");
    setIsSubjectDropdownOpen(false);
    setSubjectSearch("");
    setIsRoomHidden(false);
    setIsInvigilatorHidden(false);
    setIsRemarksHidden(false);
    setSelectedSubjectsList([]);
    setItemForm({
      date: new Date().toISOString().split("T")[0],
      day: getDayNameFromDate(new Date().toISOString().split("T")[0]),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      subjectCode: "",
      subjectName: "",
      paperType: "Theory (CQ + MCQ)",
      group: selectedGroup === "ALL" ? "ALL" : selectedGroup,
      shift: selectedShift === "ALL" ? "DAY" : selectedShift,
      roomNo: "Room 101, 102",
      invigilator: "",
      remarks: "",
    });
    setIsItemModalOpen(true);
  };

  // Open modal for editing an existing item
  const handleOpenEditItem = (item: ExamRoutineItem) => {
    setEditingItemId(item.id);
    setIsCustomTimeOpen(false);
    setCustomPresetLabel("");
    setIsSubjectDropdownOpen(false);
    setSubjectSearch("");
    setIsRoomHidden(!item.roomNo);
    setIsInvigilatorHidden(!item.invigilator);
    setIsRemarksHidden(!item.remarks);

    // Parse existing subjects from subjectName and subjectCode
    const parsedSubjects: Array<{ code: string; name: string }> = [];
    if (item.subjectName) {
      const names = item.subjectName.split(/\s*[\/]\s*/);
      const codes = (item.subjectCode || "").split(/\s*[\/]\s*/);
      names.forEach((nm, idx) => {
        const trimmed = nm.trim();
        if (trimmed) {
          parsedSubjects.push({
            code: codes[idx]?.trim() || "",
            name: trimmed,
          });
        }
      });
    }
    setSelectedSubjectsList(parsedSubjects);

    setItemForm({
      date: item.date,
      day: item.day || getDayNameFromDate(item.date),
      startTime: item.startTime,
      endTime: item.endTime,
      subjectCode: item.subjectCode,
      subjectName: item.subjectName,
      paperType: item.paperType,
      group: item.group,
      shift: item.shift,
      roomNo: item.roomNo,
      invigilator: item.invigilator || "",
      remarks: item.remarks || "",
    });
    setIsItemModalOpen(true);
  };

  // Toggle subject selection (allows selecting two or more subjects at a time)
  const handleToggleSubject = (sub: { code: string; name: string }) => {
    const isAlreadySelected = selectedSubjectsList.some(
      (s) => s.name.toLowerCase() === sub.name.toLowerCase() || (s.code && s.code === sub.code)
    );

    let updatedList: Array<{ code: string; name: string }>;
    if (isAlreadySelected) {
      updatedList = selectedSubjectsList.filter(
        (s) => s.name.toLowerCase() !== sub.name.toLowerCase() && (!s.code || s.code !== sub.code)
      );
    } else {
      updatedList = [...selectedSubjectsList, sub];
    }

    setSelectedSubjectsList(updatedList);

    // Update itemForm.subjectName and itemForm.subjectCode automatically
    const combinedNames = updatedList.map((s) => s.name).join(" / ");
    const combinedCodes = updatedList.map((s) => s.code).filter(Boolean).join(" / ");

    setItemForm((prev) => ({
      ...prev,
      subjectName: combinedNames,
      subjectCode: combinedCodes,
    }));
  };

  // Remove single selected subject
  const handleRemoveSelectedSubject = (sub: { code: string; name: string }) => {
    const updatedList = selectedSubjectsList.filter(
      (s) => s.name.toLowerCase() !== sub.name.toLowerCase() && (!s.code || s.code !== sub.code)
    );
    setSelectedSubjectsList(updatedList);

    const combinedNames = updatedList.map((s) => s.name).join(" / ");
    const combinedCodes = updatedList.map((s) => s.code).filter(Boolean).join(" / ");

    setItemForm((prev) => ({
      ...prev,
      subjectName: combinedNames,
      subjectCode: combinedCodes,
    }));
  };

  // Save Modal Item (Add or Edit)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.subjectName.trim()) {
      showToast("Please enter a subject name.", "error");
      return;
    }

    const computedDay = itemForm.day || getDayNameFromDate(itemForm.date);
    const finalRoomNo = isRoomHidden ? "" : itemForm.roomNo;
    const finalInvigilator = isInvigilatorHidden ? "" : itemForm.invigilator;
    const finalRemarks = isRemarksHidden ? "" : itemForm.remarks;

    let updatedItems: ExamRoutineItem[];

    if (editingItemId) {
      updatedItems = currentRoutine.items.map((it) =>
        it.id === editingItemId
          ? {
              ...it,
              ...itemForm,
              roomNo: finalRoomNo,
              invigilator: finalInvigilator,
              remarks: finalRemarks,
              day: computedDay,
            }
          : it
      );
    } else {
      const newItem: ExamRoutineItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...itemForm,
        roomNo: finalRoomNo,
        invigilator: finalInvigilator,
        remarks: finalRemarks,
        day: computedDay,
      };
      updatedItems = [...currentRoutine.items, newItem];
    }

    const updatedRoutine: ExamRoutineConfig = {
      ...currentRoutine,
      session: selectedSession,
      classId: selectedClassId,
      className: selectedClassObj?.name || currentRoutine.className,
      examId: selectedExamId,
      examName: selectedExamObj?.name || currentRoutine.examName,
      items: updatedItems,
      instructions: customInstructions,
    };

    saveRoutine(updatedRoutine);
    setIsItemModalOpen(false);
    showToast(editingItemId ? "Routine item updated." : "New routine item added successfully.");
  };

  // Delete Routine Item
  const handleDeleteItem = (itemId: string) => {
    if (!window.confirm("Are you sure you want to remove this examination slot from the routine?")) {
      return;
    }

    const updatedItems = currentRoutine.items.filter((it) => it.id !== itemId);
    const updatedRoutine: ExamRoutineConfig = {
      ...currentRoutine,
      items: updatedItems,
    };

    saveRoutine(updatedRoutine);
    showToast("Exam item removed from routine.", "info");
  };

  // Move Item Up/Down in sequence
  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const items = [...currentRoutine.items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    const updatedRoutine: ExamRoutineConfig = {
      ...currentRoutine,
      items,
    };
    saveRoutine(updatedRoutine);
  };

  // Sort Routine by Date
  const handleSortByDate = () => {
    const sorted = [...currentRoutine.items].sort((a, b) => a.date.localeCompare(b.date));
    const updatedRoutine: ExamRoutineConfig = {
      ...currentRoutine,
      items: sorted,
    };
    saveRoutine(updatedRoutine);
    showToast("Routine sorted by examination dates.");
  };

  // Auto-generate Routine from Assigned Exam Subjects
  const handleAutoPopulateSubjects = () => {
    if (!selectedExamObj || !selectedExamObj.subjectConfigs || selectedExamObj.subjectConfigs.length === 0) {
      // Fallback: Populate standard NCTB subjects for this class
      const defaultSubjects = [
        { code: "101", name: "Bangla 1st Paper", type: "Theory (CQ 70 + MCQ 30)" },
        { code: "102", name: "Bangla 2nd Paper", type: "Theory (100 Marks)" },
        { code: "107", name: "English 1st Paper", type: "Theory (100 Marks)" },
        { code: "108", name: "English 2nd Paper", type: "Theory (100 Marks)" },
        { code: "275", name: "Information & Communication Technology", type: "Theory (CQ 50 + MCQ 25)" },
        { code: "174", name: "Physics 1st Paper / Economics 1st Paper", type: "Theory (CQ 50 + MCQ 25)" },
        { code: "176", name: "Chemistry 1st Paper / Logic 1st Paper", type: "Theory (CQ 50 + MCQ 25)" },
        { code: "265", name: "Higher Mathematics / Biology 1st Paper", type: "Theory (CQ 50 + MCQ 25)" },
      ];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // 1 week ahead

      const generatedItems: ExamRoutineItem[] = defaultSubjects.map((sub, idx) => {
        const itemDate = new Date(startDate);
        // Add 2 days between exams, skip Friday (day 5)
        itemDate.setDate(startDate.getDate() + idx * 2);
        if (itemDate.getDay() === 5) {
          itemDate.setDate(itemDate.getDate() + 1); // move from Friday to Saturday
        }

        const dateStr = itemDate.toISOString().split("T")[0];
        return {
          id: `auto-${Date.now()}-${idx}`,
          date: dateStr,
          day: getDayNameFromDate(dateStr),
          startTime: "10:00 AM",
          endTime: "01:00 PM",
          subjectCode: sub.code,
          subjectName: sub.name,
          paperType: sub.type,
          group: "ALL",
          shift: selectedShift === "ALL" ? "DAY" : selectedShift,
          roomNo: "Room 101, 102, 201",
          invigilator: "Assigned Invigilators",
          remarks: "Exam Hall opens at 09:30 AM",
        };
      });

      const updatedRoutine: ExamRoutineConfig = {
        ...currentRoutine,
        session: selectedSession,
        classId: selectedClassId,
        className: selectedClassObj?.name || currentRoutine.className,
        examId: selectedExamId,
        examName: selectedExamObj?.name || currentRoutine.examName,
        items: generatedItems,
      };
      saveRoutine(updatedRoutine);
      showToast("Auto-generated routine from curriculum subjects.");
      return;
    }

    const configs = selectedExamObj.subjectConfigs;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);

    const generatedItems: ExamRoutineItem[] = configs.map((cfg, idx) => {
      const itemDate = new Date(startDate);
      itemDate.setDate(startDate.getDate() + idx * 2);
      if (itemDate.getDay() === 5) {
        itemDate.setDate(itemDate.getDate() + 1);
      }
      const dateStr = itemDate.toISOString().split("T")[0];

      return {
        id: `auto-${Date.now()}-${idx}`,
        date: dateStr,
        day: getDayNameFromDate(dateStr),
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        subjectCode: cfg.subject.subjectCode,
        subjectName: cfg.subject.name,
        paperType: "Theory (Standard NCTB)",
        group: "ALL",
        shift: selectedShift === "ALL" ? "DAY" : selectedShift,
        roomNo: "Room 101, 102",
        invigilator: "Duty Invigilator",
        remarks: "Report 30 mins before start",
      };
    });

    const updatedRoutine: ExamRoutineConfig = {
      ...currentRoutine,
      session: selectedSession,
      classId: selectedClassId,
      className: selectedClassObj?.name || currentRoutine.className,
      examId: selectedExamId,
      examName: selectedExamObj?.name || currentRoutine.examName,
      items: generatedItems,
    };
    saveRoutine(updatedRoutine);
    showToast(`Generated routine with ${generatedItems.length} exam papers.`);
  };

  // Add general rule
  const handleAddInstruction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstructionText.trim()) return;
    const updated = [...customInstructions, newInstructionText.trim()];
    setCustomInstructions(updated);
    setNewInstructionText("");

    const updatedRoutine: ExamRoutineConfig = {
      ...currentRoutine,
      instructions: updated,
    };
    saveRoutine(updatedRoutine);
    showToast("Instruction added.");
  };

  // Remove instruction
  const handleRemoveInstruction = (index: number) => {
    const updated = customInstructions.filter((_, i) => i !== index);
    setCustomInstructions(updated);
    const updatedRoutine: ExamRoutineConfig = {
      ...currentRoutine,
      instructions: updated,
    };
    saveRoutine(updatedRoutine);
  };

  // Reset all routines to defaults
  const handleResetToDefaults = () => {
    if (window.confirm("Reset all exam routines to initial sample presets?")) {
      resetRoutinesToDefault();
      setRoutines(getStoredRoutines());
      showToast("Routines restored to default templates.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Result Module Navigation Bar */}
      <ResultNavHeader />

      {/* Global Print Stylesheet for Official NCTB Routine Sheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print,
          nav,
          header,
          aside,
          .module-menu-bar {
            display: none !important;
          }
          .print-sheet-container {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th,
          td {
            border: 1px solid #334155 !important;
            color: #0f172a !important;
          }
        }
      `}</style>

      {/* Floating Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center space-x-2 transition-all duration-200 no-print ${
            notification.type === "success"
              ? "bg-emerald-700 text-white"
              : notification.type === "error"
              ? "bg-rose-700 text-white"
              : "bg-slate-800 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link href="/setup/exams" className="hover:underline">
                Exams
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Exam Routine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarRange className="w-6 h-6 text-emerald-600" />
              Exam Routine
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Set examination dates, times, rooms, and print official routines.
            </p>
          </div>

          {/* Tab Navigation & Fast Print Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("setup")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "setup"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>Routine Setup</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("print")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "print"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Print Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
              title="Print official routine document"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Routine</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: FILTER SECTION (Session, Class, Exam, Shift, Group, Search)
      ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                Routine Selection & Filtering
              </h2>
              <p className="text-[11px] text-slate-500">
                Filter examination schedules by Academic Session, Class, Examination Term, Shift and Group
              </p>
            </div>
            {hasActiveFilters && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                Filters Applied
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center space-x-1 underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. Academic Session Filter */}
          <div>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session:"
              labelClassName="font-bold text-slate-700 block mb-1"
              selectClassName="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800 shadow-2xs"
            />
          </div>

          {/* 2. Class Filter */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Academic Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800 shadow-2xs"
            >
              {classes.length === 0 && <option value="">No classes found</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Examination Filter */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Examination Term:</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800 shadow-2xs"
            >
              {availableExamsForClass.length === 0 ? (
                <option value="">No exam configured for this class</option>
              ) : (
                availableExamsForClass.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} {ex.termCode ? `(${ex.termCode})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 4. Shift Filter */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Shift:</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800 shadow-2xs"
            >
              <option value="ALL">All Shifts (Day / Morning)</option>
              <option value="DAY">Day Shift</option>
              <option value="MORNING">Morning Shift</option>
            </select>
          </div>

          {/* 5. Group Filter */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Academic Group:</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800 shadow-2xs"
            >
              <option value="ALL">All Groups</option>
              <option value="GENERAL">General</option>
              <option value="SCIENCE">Science</option>
              <option value="HUMANITIES">Humanities</option>
              <option value="BUSINESS_STUDIES">Business Studies</option>
            </select>
          </div>
        </div>

        {/* Live Search and Quick Metric Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by subject, code, room or day..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Routine Status Summary Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto justify-start sm:justify-end">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/80">
              Class: <span className="font-bold text-slate-900">{selectedClassObj?.name || "All"}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80">
              Exam: <span className="font-bold">{selectedExamObj?.name || "Term Final"}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200/80">
              Scheduled Papers: <span className="font-bold">{filteredRoutineItems.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: TAB CONTENT (Setup Mode vs Print Preview Mode)
      ========================================================================= */}

      {activeTab === "setup" ? (
        /* ================= SETUP & EDIT VIEW ================= */
        <div className="space-y-6 no-print">
          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenAddItem}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Exam Slot</span>
              </button>

              <button
                type="button"
                onClick={handleAutoPopulateSubjects}
                className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                title="Automatically generate timetable slots from configured exam subjects"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Auto-Generate from Subjects</span>
              </button>

              <button
                type="button"
                onClick={handleSortByDate}
                className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                title="Sort all examination slots chronologically"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Sort by Date</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsEditingInstructions(!isEditingInstructions)}
                className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                  isEditingInstructions
                    ? "bg-amber-100 border-amber-300 text-amber-900"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Examinee Instructions ({customInstructions.length})</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefaults}
                className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs px-2.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                title="Reset to default example schedule"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Presets</span>
              </button>
            </div>
          </div>

          {/* Collapsible Examinee Instructions Editor */}
          {isEditingInstructions && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" />
                  Examination Hall Rules & Guidelines for Examinees
                </h3>
                <span className="text-[11px] text-amber-700">
                  These rules will be printed at the bottom of the official routine sheet.
                </span>
              </div>

              {/* Add instruction form */}
              <form onSubmit={handleAddInstruction} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type an examination rule or guideline..."
                  value={newInstructionText}
                  onChange={(e) => setNewInstructionText(e.target.value)}
                  className="flex-1 text-xs p-2 border border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0 cursor-pointer"
                >
                  Add Guideline
                </button>
              </form>

              {/* Instructions list */}
              <div className="space-y-1.5 pt-1">
                {customInstructions.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-amber-200 text-xs text-slate-800"
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <span className="font-bold text-amber-800 shrink-0">{idx + 1}.</span>
                      <span className="truncate">{rule}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(idx)}
                      className="text-rose-500 hover:text-rose-700 shrink-0 p-1"
                      title="Remove this rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Routine Timetable Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Scheduled Papers & Time Slots
                </h3>
                <p className="text-xs text-slate-500">
                  Total {filteredRoutineItems.length} papers configured for {selectedClassObj?.name || "Class"} • {selectedExamObj?.name || "Exam"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("print")}
                  className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Print Sheet</span>
                </button>
              </div>
            </div>

            {filteredRoutineItems.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <CalendarRange className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Exam Slots Scheduled Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You can click &quot;Auto-Generate from Subjects&quot; to quickly map all subjects, or click &quot;Add Exam Slot&quot; to build the timetable manually.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAutoPopulateSubjects}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Auto-Generate Now
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddItem}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Add Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-3">Date & Day</th>
                      <th className="py-3 px-3">Time Slot</th>
                      <th className="py-3 px-3">Subject Code & Title</th>
                      <th className="py-3 px-3">Paper / Format</th>
                      <th className="py-3 px-3">Group / Shift</th>
                      <th className="py-3 px-3">Room & Invigilator</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRoutineItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/90 transition-colors group"
                      >
                        {/* Index and Reordering */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                          <div className="flex flex-col items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleMoveItem(index, "up")}
                              disabled={index === 0}
                              className="text-slate-300 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <span className="text-slate-700 text-[11px]">{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleMoveItem(index, "down")}
                              disabled={index === filteredRoutineItems.length - 1}
                              className="text-slate-300 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Date & Day */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">
                            {formatDateBnEn(item.date)}
                          </div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.day || getDayNameFromDate(item.date)}
                          </span>
                        </td>

                        {/* Time Slot */}
                        <td className="py-3 px-3 whitespace-nowrap font-medium">
                          <div className="flex items-center space-x-1.5 text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {item.startTime} — {item.endTime}
                            </span>
                          </div>
                        </td>

                        {/* Subject Code & Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2">
                            {item.subjectCode && (
                              <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                                {item.subjectCode}
                              </span>
                            )}
                            <span className="font-bold text-slate-900">{item.subjectName}</span>
                          </div>
                          {item.remarks && (
                            <p className="text-[10px] text-slate-500 mt-0.5 italic">
                              {item.remarks}
                            </p>
                          )}
                        </td>

                        {/* Paper Format */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {item.paperType}
                          </span>
                        </td>

                        {/* Group / Shift */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{item.group}</div>
                          <div className="text-[10px] text-slate-500">{item.shift} Shift</div>
                        </td>

                        {/* Room & Invigilator */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 flex items-center space-x-1">
                            <School className="w-3 h-3 text-slate-400" />
                            <span>{item.roomNo || "Main Hall"}</span>
                          </div>
                          {item.invigilator && (
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">
                              {item.invigilator}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditItem(item)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Slot"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= OFFICIAL PRINT VIEW ================= */
        <div className="space-y-4">
          {/* Print Toolbar (Controls on screen only) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-bold text-slate-700">Print Options:</span>
              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={showRoomInPrint}
                  onChange={(e) => setShowRoomInPrint(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Include Room & Hall Column</span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab("setup")}
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Return to Setup</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>

          {/* ================= OFFICIAL INSTITUTIONAL PRINT SHEET ================= */}
          <div className="print-sheet-container bg-white p-8 sm:p-12 rounded-2xl border-2 border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6 text-slate-900">
            {/* Institution Header */}
            <div className="text-center space-y-1.5 border-b-2 border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900">
                {schoolInfo.name || "Dhaka Ideal Model High School & College"}
              </h1>
              {schoolInfo.nameBn && (
                <h2 className="text-sm font-semibold text-slate-700">
                  {schoolInfo.nameBn}
                </h2>
              )}
              <p className="text-xs text-slate-600">
                {schoolInfo.address || "Mirpur, Dhaka, Bangladesh"}
                {schoolInfo.eiin && ` • EIIN: ${schoolInfo.eiin}`}
                {schoolInfo.centerCode && ` • Center Code: ${schoolInfo.centerCode}`}
              </p>

              {/* Document Banner */}
              <div className="pt-2">
                <span className="inline-block bg-slate-900 text-white text-xs font-extrabold px-4 py-1 rounded tracking-wider uppercase">
                  EXAMINATION ROUTINE / পরীক্ষার সময়সূচি
                </span>
              </div>
            </div>

            {/* Exam & Class Metadata Details Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-3 bg-slate-50 border border-slate-300 rounded text-xs font-medium">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Examination:</span>
                <strong className="text-slate-900">{selectedExamObj?.name || currentRoutine.examName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Class & Group:</span>
                <strong className="text-slate-900">
                  {selectedClassObj?.name || currentRoutine.className} ({selectedGroup})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Academic Session:</span>
                <strong className="text-slate-900">{selectedSession}</strong>
              </div>
              <div className="text-right sm:text-left">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Shift & Time:</span>
                <strong className="text-slate-900">
                  {selectedShift === "ALL" ? "Day" : selectedShift} (Standard 10:00 AM)
                </strong>
              </div>
            </div>

            {/* Routine Official Tabular Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs border border-slate-800">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800 font-bold text-slate-900">
                    <th className="py-2.5 px-3 border-r border-slate-800 text-center w-12">SL</th>
                    <th className="py-2.5 px-3 border-r border-slate-800 whitespace-nowrap">Date & Day</th>
                    <th className="py-2.5 px-3 border-r border-slate-800 text-center w-20">Code</th>
                    <th className="py-2.5 px-3 border-r border-slate-800">Subject / Paper Title</th>
                    <th className="py-2.5 px-3 border-r border-slate-800 whitespace-nowrap">Examination Time</th>
                    <th className="py-2.5 px-3 border-r border-slate-800">Paper Format</th>
                    {showRoomInPrint && (
                      <th className="py-2.5 px-3">Room / Hall</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-900">
                  {filteredRoutineItems.length === 0 ? (
                    <tr>
                      <td colSpan={showRoomInPrint ? 7 : 6} className="text-center py-8 text-slate-500">
                        No examination slots have been scheduled for this filter selection.
                      </td>
                    </tr>
                  ) : (
                    filteredRoutineItems.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-300">
                        <td className="py-2 px-3 border-r border-slate-800 text-center font-mono font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800 whitespace-nowrap">
                          <div className="font-bold">{formatDateBnEn(item.date)}</div>
                          <div className="text-[10px] text-slate-600 font-medium">
                            {item.day || getDayNameFromDate(item.date)}
                          </div>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800 text-center font-mono font-bold">
                          {item.subjectCode || "—"}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800">
                          <div className="font-bold text-slate-900">{item.subjectName}</div>
                          {item.remarks && (
                            <div className="text-[10px] text-slate-600 italic">{item.remarks}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800 whitespace-nowrap font-medium">
                          {item.startTime} — {item.endTime}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800">
                          {item.paperType}
                        </td>
                        {showRoomInPrint && (
                          <td className="py-2 px-3">
                            <span className="font-semibold">{item.roomNo || "All Halls"}</span>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Special Instructions for Examinees */}
            {customInstructions.length > 0 && (
              <div className="pt-2 space-y-1.5 print-break-inside-avoid">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 underline">
                  Special Instructions for Examinees (পরীক্ষার্থীদের জন্য বিশেষ নির্দেশাবলি):
                </h4>
                <ol className="list-decimal list-inside text-[11px] text-slate-800 space-y-1 leading-relaxed pl-1">
                  {customInstructions.map((rule, idx) => (
                    <li key={idx}>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Authority Signatures Block */}
            <div className="pt-16 grid grid-cols-3 gap-6 text-center text-xs print-break-inside-avoid">
              <div className="space-y-1">
                <div className="border-t border-slate-800 pt-1.5 font-bold text-slate-900">
                  Routine Committee
                </div>
                <div className="text-[10px] text-slate-500">In-Charge & Verification</div>
              </div>

              <div className="space-y-1">
                <div className="border-t border-slate-800 pt-1.5 font-bold text-slate-900">
                  {schoolInfo.controllerTitle || "Controller of Examinations"}
                </div>
                <div className="text-[10px] text-slate-600 font-semibold">
                  {schoolInfo.controllerName || "Prof. Md. Rafiqul Islam"}
                </div>
              </div>

              <div className="space-y-1">
                <div className="border-t border-slate-800 pt-1.5 font-bold text-slate-900">
                  {schoolInfo.headTitle || "Principal"}
                </div>
                <div className="text-[10px] text-slate-600 font-semibold">
                  {schoolInfo.headName || "Prof. A. K. M. Shamsuddin"}
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-4 border-t border-slate-200 text-center text-[9px] text-slate-400 print:text-slate-500 flex items-center justify-between">
              <span>NCTB Curriculum Compliant Examination Timetable</span>
              <span>Published on: {formatDateBnEn(new Date().toISOString().split("T")[0])}</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: ADD / EDIT ROUTINE ITEM MODAL
      ========================================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-emerald-600" />
                <span>{editingItemId ? "Edit Examination Slot" : "Add New Examination Slot"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              {/* Date & Weekday */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Exam Date *</label>
                  <input
                    type="date"
                    value={itemForm.date}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItemForm({
                        ...itemForm,
                        date: val,
                        day: getDayNameFromDate(val),
                      });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Weekday (Auto)</label>
                  <input
                    type="text"
                    value={itemForm.day}
                    readOnly
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Start Time *</label>
                    <span className="text-[10px] text-slate-400 font-mono">12-Hour</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM"
                      value={itemForm.startTime}
                      onChange={(e) => setItemForm({ ...itemForm, startTime: e.target.value })}
                      className="w-full p-2 pr-8 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                      required
                    />
                    <div className="absolute right-2 top-2">
                      <input
                        type="time"
                        value={time12To24(itemForm.startTime) || "10:00"}
                        onChange={(e) => {
                          const formatted = time24To12(e.target.value);
                          if (formatted) setItemForm({ ...itemForm, startTime: formatted });
                        }}
                        className="opacity-0 absolute inset-0 w-5 h-5 cursor-pointer"
                        title="Click to pick Start Time"
                      />
                      <Clock className="w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">End Time *</label>
                    <span className="text-[10px] text-slate-400 font-mono">12-Hour</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 01:00 PM"
                      value={itemForm.endTime}
                      onChange={(e) => setItemForm({ ...itemForm, endTime: e.target.value })}
                      className="w-full p-2 pr-8 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                      required
                    />
                    <div className="absolute right-2 top-2">
                      <input
                        type="time"
                        value={time12To24(itemForm.endTime) || "13:00"}
                        onChange={(e) => {
                          const formatted = time24To12(e.target.value);
                          if (formatted) setItemForm({ ...itemForm, endTime: formatted });
                        }}
                        className="opacity-0 absolute inset-0 w-5 h-5 cursor-pointer"
                        title="Click to pick End Time"
                      />
                      <Clock className="w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Time preset chips & Custom Time Setup */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Times:</span>
                  {/* Custom Time Setup Option */}
                  <button
                    type="button"
                    onClick={handleToggleCustomTime}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      isCustomTimeOpen
                        ? "bg-emerald-100 border-emerald-400 text-emerald-900 shadow-2xs"
                        : "bg-white border-dashed border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Custom Time Setup</span>
                  </button>

                  {/* Saved Custom Times */}
                  {savedCustomPresets.map((preset) => {
                    const isSelected =
                      itemForm.startTime === preset.start && itemForm.endTime === preset.end;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleApplySavedPreset(preset)}
                        className={`group inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold"
                            : "bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold"
                        }`}
                        title={`Click to set ${preset.start} — ${preset.end}`}
                      >
                        <Clock className={`w-3 h-3 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                        <span>{preset.label || `${preset.start} — ${preset.end}`}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedPreset(e, preset.id)}
                          className={`p-0.5 rounded cursor-pointer ml-0.5 transition-colors ${
                            isSelected
                              ? "text-emerald-200 hover:text-white"
                              : "text-slate-400 hover:text-rose-600"
                          }`}
                          title="Delete saved time preset"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Time Setup Drawer / Interactive Configurator */}
                {isCustomTimeOpen && (
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                      <div className="flex items-center space-x-1.5">
                        <Timer className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-slate-800">
                          Custom Time & Duration Setup
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomTimeOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Start Time & End Time Pickers */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Start Time:
                        </label>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="time"
                            value={customStart24}
                            onChange={(e) => handleCustomStartChange(e.target.value)}
                            className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                          <span className="text-[11px] font-bold text-emerald-800 shrink-0 min-w-[65px]">
                            {time24To12(customStart24)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          End Time:
                        </label>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="time"
                            value={customEnd24}
                            onChange={(e) => handleCustomEndChange(e.target.value)}
                            className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                          <span className="text-[11px] font-bold text-emerald-800 shrink-0 min-w-[65px]">
                            {time24To12(customEnd24)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Duration Auto-Calculator */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-600">
                          Auto-Calculate End Time by Duration:
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { min: 30, label: "30m" },
                          { min: 45, label: "45m" },
                          { min: 60, label: "1 hour" },
                          { min: 90, label: "1.5 hours" },
                          { min: 120, label: "2 hours" },
                          { min: 150, label: "2.5 hours" },
                          { min: 180, label: "3 hours" },
                          { min: 210, label: "3.5 hours" },
                          { min: 240, label: "4 hours" },
                        ].map((dur) => (
                          <button
                            key={dur.min}
                            type="button"
                            onClick={() => handleSelectDuration(dur.min)}
                            className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                              customDurationMinutes === dur.min
                                ? "bg-emerald-700 text-white shadow-2xs font-bold"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {dur.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Option to Save Custom Time */}
                    <div className="pt-2 border-t border-emerald-200/60">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Save as Custom Quick Time:
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Adds preset to Quick Times row
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Custom label (e.g. Morning 3h, or leave blank)"
                          value={customPresetLabel}
                          onChange={(e) => setCustomPresetLabel(e.target.value)}
                          className="flex-1 p-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCustomTimePreset(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center space-x-1 shrink-0 cursor-pointer transition-colors shadow-2xs"
                          title="Save this custom time to Quick Times"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Save Preset</span>
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-200/80">
                      <button
                        type="button"
                        onClick={() => setIsCustomTimeOpen(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApplyCustomTime}
                          className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-bold cursor-pointer transition-colors"
                          title="Apply this custom time to slot only"
                        >
                          Apply Only
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveCustomTimePreset(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 shadow-2xs cursor-pointer transition-colors"
                          title="Save custom time preset and apply to current slot"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save & Apply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject Code and Name with Mandatory Subjects Dropdown & Checkboxes */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject Code</label>
                  <input
                    type="text"
                    placeholder="101"
                    value={itemForm.subjectCode}
                    onChange={(e) => setItemForm({ ...itemForm, subjectCode: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
                <div className="col-span-2 relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <label className="font-bold text-slate-700">Subject Title *</label>
                      {selectedSubjectsList.length > 1 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                          {selectedSubjectsList.length} subjects combined
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {availableSubjectsForModal.length} unscheduled available
                    </span>
                  </div>

                  {/* Input with Dropdown Trigger */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Select subjects from dropdown or type custom"
                      value={itemForm.subjectName}
                      onChange={(e) => setItemForm({ ...itemForm, subjectName: e.target.value })}
                      onFocus={() => setIsSubjectDropdownOpen(true)}
                      title={itemForm.subjectName}
                      className="w-full p-2 pr-9 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-emerald-700 p-0.5 rounded cursor-pointer"
                      title="Toggle Mandatory Subject List Dropdown"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isSubjectDropdownOpen ? "rotate-180 text-emerald-600" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mandatory Subjects Dropdown Menu */}
                  {isSubjectDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-xl border border-slate-200 shadow-xl p-2.5 space-y-2 max-h-64 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[11px]">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                          Mandatory Subject List (Select 1 or more)
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsSubjectDropdownOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dropdown Search Filter */}
                      <div className="relative text-xs">
                        <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Search available subjects..."
                          value={subjectSearch}
                          onChange={(e) => setSubjectSearch(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Subject List with Checkbox */}
                      <div className="overflow-y-auto space-y-1 flex-1 pr-0.5 divide-y divide-slate-50">
                        {availableSubjectsForModal
                          .filter(
                            (s) =>
                              s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
                              s.code.includes(subjectSearch)
                          )
                          .map((sub) => {
                            const isChecked = selectedSubjectsList.some(
                              (s) =>
                                s.name.toLowerCase() === sub.name.toLowerCase() ||
                                (s.code && s.code === sub.code)
                            );
                            return (
                              <div
                                key={`${sub.code}-${sub.name}`}
                                onClick={() => handleToggleSubject(sub)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                  isChecked
                                    ? "bg-emerald-50 text-emerald-900 font-semibold"
                                    : "hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}} // handled by parent onClick
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5 shrink-0"
                                  />
                                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                    {sub.code || "—"}
                                  </span>
                                  <span className="truncate">{sub.name}</span>
                                </div>
                                {isChecked && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                                )}
                              </div>
                            );
                          })}

                        {availableSubjectsForModal.length === 0 && (
                          <div className="text-center py-4 text-xs text-slate-500">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                            All mandatory subjects for this exam have been scheduled!
                          </div>
                        )}
                      </div>

                      {/* Dropdown Footer with multi-select counter & Done button */}
                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                        <span className="font-medium">
                          {selectedSubjectsList.length} subject{selectedSubjectsList.length !== 1 ? "s" : ""} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsSubjectDropdownOpen(false)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md font-bold cursor-pointer text-[10px] transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Paper Format & Group */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paper Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Theory (CQ + MCQ)"
                    value={itemForm.paperType}
                    onChange={(e) => setItemForm({ ...itemForm, paperType: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Academic Group</label>
                  <select
                    value={itemForm.group}
                    onChange={(e) => setItemForm({ ...itemForm, group: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="ALL">All Groups</option>
                    <option value="SCIENCE">Science</option>
                    <option value="HUMANITIES">Humanities</option>
                    <option value="BUSINESS_STUDIES">Business Studies</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
              </div>

              {/* Room and Invigilator with Hide/Unhide options */}
              <div className="grid grid-cols-2 gap-3">
                {/* Examination Hall / Room */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Examination Hall / Room</label>
                    <button
                      type="button"
                      onClick={() => setIsRoomHidden(!isRoomHidden)}
                      className="inline-flex items-center space-x-1 text-[10px] font-semibold text-slate-500 hover:text-emerald-700 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title={isRoomHidden ? "Unhide Examination Hall / Room" : "Hide Examination Hall / Room"}
                    >
                      {isRoomHidden ? (
                        <>
                          <EyeOff className="w-3 h-3 text-slate-400" />
                          <span>Unhide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Hide</span>
                        </>
                      )}
                    </button>
                  </div>
                  {isRoomHidden ? (
                    <div
                      onClick={() => setIsRoomHidden(false)}
                      className="p-2 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-[11px] text-slate-400 text-center cursor-pointer hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <EyeOff className="w-3 h-3 text-slate-400" />
                      <span>Room Hidden • Click to Unhide</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Room 101, 102"
                      value={itemForm.roomNo}
                      onChange={(e) => setItemForm({ ...itemForm, roomNo: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  )}
                </div>

                {/* Duty Invigilator (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Duty Invigilator (Optional)</label>
                    <button
                      type="button"
                      onClick={() => setIsInvigilatorHidden(!isInvigilatorHidden)}
                      className="inline-flex items-center space-x-1 text-[10px] font-semibold text-slate-500 hover:text-emerald-700 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title={isInvigilatorHidden ? "Unhide Duty Invigilator" : "Hide Duty Invigilator"}
                    >
                      {isInvigilatorHidden ? (
                        <>
                          <EyeOff className="w-3 h-3 text-slate-400" />
                          <span>Unhide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Hide</span>
                        </>
                      )}
                    </button>
                  </div>
                  {isInvigilatorHidden ? (
                    <div
                      onClick={() => setIsInvigilatorHidden(false)}
                      className="p-2 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-[11px] text-slate-400 text-center cursor-pointer hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <EyeOff className="w-3 h-3 text-slate-400" />
                      <span>Invigilator Hidden • Click to Unhide</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Teacher name or initial"
                      value={itemForm.invigilator}
                      onChange={(e) => setItemForm({ ...itemForm, invigilator: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  )}
                </div>
              </div>

              {/* Special Remarks / Note with Hide/Unhide */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Special Remarks / Note</label>
                  <button
                    type="button"
                    onClick={() => setIsRemarksHidden(!isRemarksHidden)}
                    className="inline-flex items-center space-x-1 text-[10px] font-semibold text-slate-500 hover:text-emerald-700 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    title={isRemarksHidden ? "Unhide Special Remarks" : "Hide Special Remarks"}
                  >
                    {isRemarksHidden ? (
                      <>
                        <EyeOff className="w-3 h-3 text-slate-400" />
                        <span>Unhide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 text-emerald-600" />
                        <span>Hide</span>
                      </>
                    )}
                  </button>
                </div>
                {isRemarksHidden ? (
                  <div
                    onClick={() => setIsRemarksHidden(false)}
                    className="p-2 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-[11px] text-slate-400 text-center cursor-pointer hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <EyeOff className="w-3 h-3 text-slate-400" />
                    <span>Remarks Hidden • Click to Unhide</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Non-programmable calculator allowed"
                    value={itemForm.remarks}
                    onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-xs"
                >
                  {editingItemId ? "Save Changes" : "Add to Routine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
