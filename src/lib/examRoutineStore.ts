"use client";

import { getScopedStorageKey, getActiveTenantCode } from "./clientTenant";

export interface ExamRoutineItem {
  id: string;
  date: string; // YYYY-MM-DD
  day: string; // Sunday, Monday, etc.
  startTime: string; // e.g. "10:00 AM"
  endTime: string; // e.g. "01:00 PM"
  subjectCode: string; // e.g. "101"
  subjectName: string; // e.g. "Bangla 1st Paper"
  paperType: string; // e.g. "Theory (CQ + MCQ)", "Practical", "Viva", etc.
  group: string; // "ALL", "SCIENCE", "HUMANITIES", "BUSINESS_STUDIES", "GENERAL"
  shift: string; // "ALL", "DAY", "MORNING"
  roomNo: string; // e.g. "101, 102"
  invigilator?: string; // e.g. "Prof. Shamsuddin / Mr. Kabir"
  remarks?: string; // e.g. "Scientific calculator allowed"
}

export interface ExamRoutineConfig {
  id: string;
  session: string; // e.g. "2025-2026"
  classId: string;
  className: string;
  examId: string;
  examName: string;
  shift: string; // "ALL" | "DAY" | "MORNING"
  group: string; // "ALL" | "SCIENCE" | "HUMANITIES" | "BUSINESS_STUDIES" | "GENERAL"
  publishedDate: string;
  instructions: string[];
  controllerTitle: string;
  controllerName: string;
  headTitle: string;
  headName: string;
  items: ExamRoutineItem[];
  updatedAt: string;
}

export const ROUTINE_STORAGE_KEY = "nctb_exam_routines_v1";
export const ROUTINE_UPDATED_EVENT = "nctb_exam_routine_updated";

export const DEFAULT_EXAM_INSTRUCTIONS = [
  "Students must enter the examination hall at least 30 minutes before the scheduled start time.",
  "Original Admit Card and Student Identity Card are strictly mandatory for entry into the exam hall.",
  "Programmable calculators, digital smart watches, mobile phones and unauthorized electronic devices are strictly prohibited.",
  "Students must correctly write their Roll Number, Registration Number, and Subject Code on the OMR/Script cover page.",
  "No candidate will be allowed to leave the examination hall during the first 60 minutes of the examination.",
  "Candidates must remain seated until the invigilator collects all answer scripts after the final bell.",
];

export const INITIAL_DEFAULT_ROUTINES: ExamRoutineConfig[] = [
  {
    id: "routine-c11-final-2026",
    session: "2025-2026",
    classId: "039125ee-c4cf-4f0a-9d9d-2e0f7b394c53", // Class 11
    className: "Class 11",
    examId: "b46e8e61-2356-48e6-980c-12db4998e7cb", // 1st Year Final 2026
    examName: "1st Year Final 2026",
    shift: "DAY",
    group: "ALL",
    publishedDate: "2026-10-15",
    instructions: DEFAULT_EXAM_INSTRUCTIONS,
    controllerTitle: "Controller of Examinations",
    controllerName: "Prof. Md. Rafiqul Islam",
    headTitle: "Principal",
    headName: "Prof. A. K. M. Shamsuddin",
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "item-1",
        date: "2026-11-15",
        day: "Sunday",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        subjectCode: "101",
        subjectName: "Bangla 1st Paper",
        paperType: "Theory (CQ 70 + MCQ 30)",
        group: "ALL",
        shift: "DAY",
        roomNo: "Room 101, 102, 201",
        invigilator: "Mr. Kabir Hossain / Ms. Farzana",
        remarks: "OMR sheet will be supplied at 09:50 AM",
      },
      {
        id: "item-2",
        date: "2026-11-17",
        day: "Tuesday",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        subjectCode: "102",
        subjectName: "Bangla 2nd Paper",
        paperType: "Theory (CQ 100)",
        group: "ALL",
        shift: "DAY",
        roomNo: "Room 101, 102, 201",
        invigilator: "Dr. Nazmul Huda / Ms. Shahana",
        remarks: "Standard NCTB descriptive pattern",
      },
      {
        id: "item-3",
        date: "2026-11-19",
        day: "Thursday",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        subjectCode: "107",
        subjectName: "English 1st Paper",
        paperType: "Theory (100 Marks)",
        group: "ALL",
        shift: "DAY",
        roomNo: "Room 101, 102, 201",
        invigilator: "Mr. Anisur Rahman / Mrs. Selina",
        remarks: "Reading & Writing Assessment",
      },
      {
        id: "item-4",
        date: "2026-11-22",
        day: "Sunday",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        subjectCode: "108",
        subjectName: "English 2nd Paper",
        paperType: "Theory (100 Marks)",
        group: "ALL",
        shift: "DAY",
        roomNo: "Room 101, 102, 201",
        invigilator: "Mr. Mahmudul Hasan / Mrs. Rina",
        remarks: "Grammar & Composition items",
      },
      {
        id: "item-5",
        date: "2026-11-24",
        day: "Tuesday",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        subjectCode: "275",
        subjectName: "Information and Communication Technology",
        paperType: "Theory (CQ 50 + MCQ 25)",
        group: "ALL",
        shift: "DAY",
        roomNo: "Computer Lab 1 & Room 202",
        invigilator: "Engr. Tanvir Ahmed",
        remarks: "Practical session scheduled separately",
      },
      {
        id: "item-6",
        date: "2026-11-26",
        day: "Thursday",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        subjectCode: "174",
        subjectName: "Physics 1st Paper / Economics 1st Paper",
        paperType: "Theory (CQ 50 + MCQ 25)",
        group: "SCIENCE",
        shift: "DAY",
        roomNo: "Room 201 (Science) / Room 202 (Arts)",
        invigilator: "Prof. A. K. M. Shamsuddin / Mrs. Nilufar",
        remarks: "Scientific non-programmable calculator allowed",
      },
      {
        id: "item-7",
        date: "2026-11-29",
        day: "Sunday",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        subjectCode: "176",
        subjectName: "Chemistry 1st Paper / Logic 1st Paper",
        paperType: "Theory (CQ 50 + MCQ 25)",
        group: "SCIENCE",
        shift: "DAY",
        roomNo: "Room 201 (Science) / Room 202 (Arts)",
        invigilator: "Dr. Habibur Rahman / Mr. Shaheed",
        remarks: "Periodic table permitted as printed in script",
      },
      {
        id: "item-8",
        date: "2026-12-01",
        day: "Tuesday",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        subjectCode: "265",
        subjectName: "Higher Mathematics 1st Paper / Biology 1st Paper",
        paperType: "Theory (CQ 50 + MCQ 25)",
        group: "SCIENCE",
        shift: "DAY",
        roomNo: "Room 101, 102, 201",
        invigilator: "Mr. Monirul Islam / Ms. Tahmina",
        remarks: "Geometry box and graph paper will be provided",
      },
    ],
  },
  {
    id: "routine-c11-test1-2026",
    session: "2025-2026",
    classId: "039125ee-c4cf-4f0a-9d9d-2e0f7b394c53", // Class 11
    examId: "46ad2164-56a6-446f-94e8-11723ae266c0", // Class Test -01
    className: "Class 11",
    examName: "Class Test -01",
    shift: "DAY",
    group: "ALL",
    publishedDate: "2026-10-18",
    instructions: [
      "Class Test duration is 1 hour per subject.",
      "Total marks: 25 (MCQ 10 + Short CQ 15).",
      "Regular class attendance will follow immediately after the test session.",
    ],
    controllerTitle: "Exam Coordinator",
    controllerName: "Mr. Anisur Rahman",
    headTitle: "Vice Principal",
    headName: "Dr. Nazmul Huda",
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "ct-1",
        date: "2026-10-25",
        day: "Sunday",
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        subjectCode: "101",
        subjectName: "Bangla 1st Paper",
        paperType: "Class Test (25 Marks)",
        group: "ALL",
        shift: "DAY",
        roomNo: "Section Classrooms",
        invigilator: "Respective Class Teachers",
      },
      {
        id: "ct-2",
        date: "2026-10-26",
        day: "Monday",
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        subjectCode: "107",
        subjectName: "English 1st Paper",
        paperType: "Class Test (25 Marks)",
        group: "ALL",
        shift: "DAY",
        roomNo: "Section Classrooms",
        invigilator: "Respective Class Teachers",
      },
      {
        id: "ct-3",
        date: "2026-10-27",
        day: "Tuesday",
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        subjectCode: "275",
        subjectName: "Information and Communication Technology",
        paperType: "Class Test (25 Marks)",
        group: "ALL",
        shift: "DAY",
        roomNo: "Section Classrooms",
        invigilator: "Respective Class Teachers",
      },
    ],
  },
];

export function getStoredRoutines(instCode?: string): ExamRoutineConfig[] {
  const code = instCode || getActiveTenantCode();
  const defaultList = code === "108254" ? INITIAL_DEFAULT_ROUTINES : [];
  if (typeof window === "undefined") {
    return defaultList;
  }

  try {
    const key = getScopedStorageKey(ROUTINE_STORAGE_KEY, code);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (code === "108254") {
        const legacy = localStorage.getItem(ROUTINE_STORAGE_KEY);
        if (legacy) {
          localStorage.setItem(key, legacy);
          return JSON.parse(legacy);
        }
      }
      localStorage.setItem(key, JSON.stringify(defaultList));
      return defaultList;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return defaultList;
  } catch (err) {
    console.error("Error reading exam routines from localStorage:", err);
    return defaultList;
  }
}

export function saveRoutine(routine: ExamRoutineConfig, instCode?: string): void {
  if (typeof window === "undefined") return;
  const code = instCode || getActiveTenantCode();

  try {
    const key = getScopedStorageKey(ROUTINE_STORAGE_KEY, code);
    const list = getStoredRoutines(code);
    const index = list.findIndex((r) => r.id === routine.id);
    let updated: ExamRoutineConfig[];

    const withTimestamp = {
      ...routine,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      updated = [...list];
      updated[index] = withTimestamp;
    } else {
      updated = [withTimestamp, ...list];
    }

    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event(ROUTINE_UPDATED_EVENT));
  } catch (err) {
    console.error("Error saving exam routine to localStorage:", err);
  }
}

export function deleteRoutine(routineId: string, instCode?: string): void {
  if (typeof window === "undefined") return;
  const code = instCode || getActiveTenantCode();

  try {
    const key = getScopedStorageKey(ROUTINE_STORAGE_KEY, code);
    const list = getStoredRoutines(code);
    const filtered = list.filter((r) => r.id !== routineId);
    localStorage.setItem(key, JSON.stringify(filtered));
    window.dispatchEvent(new Event(ROUTINE_UPDATED_EVENT));
  } catch (err) {
    console.error("Error deleting exam routine:", err);
  }
}

export function resetRoutinesToDefault(instCode?: string): void {
  if (typeof window === "undefined") return;
  const code = instCode || getActiveTenantCode();
  const defaultList = code === "108254" ? INITIAL_DEFAULT_ROUTINES : [];
  try {
    const key = getScopedStorageKey(ROUTINE_STORAGE_KEY, code);
    localStorage.setItem(key, JSON.stringify(defaultList));
    window.dispatchEvent(new Event(ROUTINE_UPDATED_EVENT));
  } catch (err) {
    console.error("Error resetting exam routines:", err);
  }
}

export function getDayNameFromDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return "";
    const dateObj = new Date(year, month - 1, day);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dayNames[dateObj.getDay()] || "";
  } catch {
    return "";
  }
}

export function formatDateBnEn(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export interface QuickTimePreset {
  id: string;
  label: string;
  start: string; // e.g. "10:00 AM"
  end: string; // e.g. "01:00 PM"
  isCustom?: boolean;
}

export const DEFAULT_QUICK_TIME_PRESETS: QuickTimePreset[] = [
  { id: "p1", label: "Morning 3h", start: "10:00 AM", end: "01:00 PM", isCustom: false },
  { id: "p2", label: "Afternoon 3h", start: "02:00 PM", end: "05:00 PM", isCustom: false },
  { id: "p3", label: "Class Test 1.5h", start: "10:00 AM", end: "11:30 AM", isCustom: false },
  { id: "p4", label: "Practical 2h", start: "10:00 AM", end: "12:00 PM", isCustom: false },
  { id: "p5", label: "Short Test 1h", start: "10:00 AM", end: "11:00 AM", isCustom: false },
];

export const CUSTOM_PRESETS_STORAGE_KEY = "nctb_custom_time_presets_v1";

export function getCustomTimePresets(instCode?: string): QuickTimePreset[] {
  if (typeof window === "undefined") return [];
  const code = instCode || getActiveTenantCode();
  try {
    const key = getScopedStorageKey(CUSTOM_PRESETS_STORAGE_KEY, code);
    const raw = localStorage.getItem(key) || (code === "108254" ? localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY) : null);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomTimePreset(preset: Omit<QuickTimePreset, "id" | "isCustom">, instCode?: string): QuickTimePreset {
  const code = instCode || getActiveTenantCode();
  const newPreset: QuickTimePreset = {
    id: `custom-time-${Date.now()}`,
    label: preset.label || `${preset.start} - ${preset.end}`,
    start: preset.start,
    end: preset.end,
    isCustom: true,
  };
  if (typeof window !== "undefined") {
    const key = getScopedStorageKey(CUSTOM_PRESETS_STORAGE_KEY, code);
    const current = getCustomTimePresets(code);
    const updated = [...current, newPreset];
    localStorage.setItem(key, JSON.stringify(updated));
  }
  return newPreset;
}

export function deleteCustomTimePreset(id: string, instCode?: string): void {
  if (typeof window !== "undefined") {
    const code = instCode || getActiveTenantCode();
    const key = getScopedStorageKey(CUSTOM_PRESETS_STORAGE_KEY, code);
    const current = getCustomTimePresets(code);
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
  }
}

// Convert 24h format "14:30" to 12h format "02:30 PM"
export function time24To12(time24: string): string {
  if (!time24) return "";
  const parts = time24.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);
  if (isNaN(hours)) return time24;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const hPadded = hours < 10 ? `0${hours}` : `${hours}`;
  const mPadded = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hPadded}:${mPadded} ${ampm}`;
}

// Convert 12h format "02:30 PM" to 24h format "14:30"
export function time12To24(time12: string): string {
  if (!time12) return "";
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = (match[3] || "AM").toUpperCase();

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  const hPadded = hours < 10 ? `0${hours}` : `${hours}`;
  const mPadded = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hPadded}:${mPadded}`;
}

// Add duration in minutes to a 12h start time, returns 12h end time
export function calculateEndTime(startTime12: string, durationMinutes: number): string {
  const time24 = time12To24(startTime12);
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  const startTotalMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
  const endTotalMinutes = (startTotalMinutes + durationMinutes) % (24 * 60);

  const endHours24 = Math.floor(endTotalMinutes / 60);
  const endMinutes = endTotalMinutes % 60;

  const hPadded = endHours24 < 10 ? `0${endHours24}` : `${endHours24}`;
  const mPadded = endMinutes < 10 ? `0${endMinutes}` : `${endMinutes}`;
  return time24To12(`${hPadded}:${mPadded}`);
}
