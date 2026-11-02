"use client";

import { getScopedStorageKey, getActiveTenantCode } from "@/lib/clientTenant";

export interface StudentWaiver {
  id: string;
  studentId: string; // Student ID or Enrollment ID
  studentName: string;
  studentRoll: number;
  studentIdNo?: string;
  className: string;
  sectionName?: string;
  groupType?: string;
  scholarshipTitle: string; // e.g., "Full Free Merit Scholarship", "50% Half Free Concession", "Financial Aid Waiver"
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FULL_FREE";
  value: number; // 100 for full free, or 50, 25 for percentage, or 500, 1000 for fixed amount
  appliesTo: "TUITION_ONLY" | "TOTAL_PAYABLE";
  reason?: string;
  approvedBy?: string;
  effectiveFrom?: string;
  status: "ACTIVE" | "INACTIVE";
  updatedAt: string;
}

export type PresetCategory = "ALL" | "MERIT" | "NEED" | "QUOTA" | "SPECIAL";

export interface ScholarshipPreset {
  id: string;
  title: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FULL_FREE";
  value: number;
  appliesTo: "TUITION_ONLY" | "TOTAL_PAYABLE";
  description: string;
  badgeColor: string;
  category?: PresetCategory;
}

export const SCHOLARSHIP_PRESETS: ScholarshipPreset[] = [
  {
    id: "preset_full_free",
    title: "100% Full Free Merit Scholarship",
    type: "FULL_FREE",
    value: 100,
    appliesTo: "TUITION_ONLY",
    description: "100% academic tuition fee waiver for top meritorious students (Roll 1 / Board GPA 5.0).",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    category: "MERIT",
  },
  {
    id: "preset_half_free",
    title: "50% Half Free Merit Scholarship",
    type: "PERCENTAGE",
    value: 50,
    appliesTo: "TUITION_ONLY",
    description: "50% academic tuition fee waiver for outstanding students (Roll 2-3 / High CGPA).",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    category: "MERIT",
  },
  {
    id: "preset_quarter_merit",
    title: "25% Academic Excellence Merit Grant",
    type: "PERCENTAGE",
    value: 25,
    appliesTo: "TUITION_ONLY",
    description: "25% tuition fee waiver for top 10% academic rankers and talent pool students.",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    category: "MERIT",
  },
  {
    id: "preset_financial_aid",
    title: "Need-Based Financial Aid Waiver",
    type: "FIXED_AMOUNT",
    value: 1000,
    appliesTo: "TUITION_ONLY",
    description: "Flat ৳1,000 monthly discount for economically disadvantaged meritorious students.",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    category: "NEED",
  },
  {
    id: "preset_sibling",
    title: "Sibling & Family Concession",
    type: "PERCENTAGE",
    value: 25,
    appliesTo: "TUITION_ONLY",
    description: "25% tuition fee waiver for students with younger or elder siblings enrolled in the school.",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    category: "SPECIAL",
  },
  {
    id: "preset_freedom_fighter",
    title: "Freedom Fighter Quota Special Grant",
    type: "FULL_FREE",
    value: 100,
    appliesTo: "TOTAL_PAYABLE",
    description: "100% complete waiver on all tuition, lab, and institutional fee heads for freedom fighter wards.",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    category: "QUOTA",
  },
  {
    id: "preset_chairman_aid",
    title: "Chairman Discretionary Grant",
    type: "FIXED_AMOUNT",
    value: 500,
    appliesTo: "TUITION_ONLY",
    description: "Flat ৳500 assistance approved by School Managing Committee (SMC) & Governing Body.",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    category: "SPECIAL",
  },
  {
    id: "preset_stipend",
    title: "Government Stipend (উপবৃত্তি)",
    type: "FULL_FREE",
    value: 100,
    appliesTo: "TUITION_ONLY",
    description: "Official government education stipend scheme with 100% tuition fee waiver for eligible students.",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    category: "QUOTA",
  },
];

export const WAIVER_STORAGE_KEY = "nctb_scholarships_waivers_v2";

// Initial standard demo waivers for top students so UI is populated on first load
export const INITIAL_DEMO_WAIVERS: Record<string, StudentWaiver> = {
  roll_1_demo: {
    id: "waiver_demo_1",
    studentId: "roll_1",
    studentName: "Md. Tanvir Hasan",
    studentRoll: 1,
    studentIdNo: "STU-2026-001",
    className: "Class 10",
    sectionName: "A",
    groupType: "SCIENCE",
    scholarshipTitle: "100% Full Free Merit Scholarship",
    type: "FULL_FREE",
    value: 100,
    appliesTo: "TUITION_ONLY",
    reason: "First position in final academic evaluation & SSC scholarship candidate.",
    approvedBy: "Headmaster & Governing Body",
    effectiveFrom: "All Academic Months",
    status: "ACTIVE",
    updatedAt: "2026-10-01",
  },
  roll_2_demo: {
    id: "waiver_demo_2",
    studentId: "roll_2",
    studentName: "Farzana Akter",
    studentRoll: 2,
    studentIdNo: "STU-2026-002",
    className: "Class 10",
    sectionName: "A",
    groupType: "SCIENCE",
    scholarshipTitle: "50% Half Free Merit Scholarship",
    type: "PERCENTAGE",
    value: 50,
    appliesTo: "TUITION_ONLY",
    reason: "Rank 2 merit excellence in annual evaluation.",
    approvedBy: "Academic Committee",
    effectiveFrom: "All Academic Months",
    status: "ACTIVE",
    updatedAt: "2026-10-01",
  },
};

export function getStoredWaivers(instCode?: string): Record<string, StudentWaiver> {
  const code = instCode || getActiveTenantCode();
  const defaultList = code === "108254" ? INITIAL_DEMO_WAIVERS : {};
  if (typeof window === "undefined") return defaultList;
  try {
    const key = getScopedStorageKey(WAIVER_STORAGE_KEY, code);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const legacy = localStorage.getItem(WAIVER_STORAGE_KEY);
      if (code === "108254" && legacy) {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      }
      localStorage.setItem(key, JSON.stringify(defaultList));
      return defaultList;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse stored waivers", e);
    return defaultList;
  }
}

export function saveStoredWaivers(waivers: Record<string, StudentWaiver>, instCode?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getScopedStorageKey(WAIVER_STORAGE_KEY, instCode);
    localStorage.setItem(key, JSON.stringify(waivers));
    window.dispatchEvent(new CustomEvent("nctb_waiver_store_updated"));
  } catch (e) {
    console.error("Failed to save waivers", e);
  }
}

export function calculateStudentWaiver(
  waiver: StudentWaiver | undefined,
  baseTuition: number,
  otherFees: number,
  classRoll?: number
): {
  waiverAmount: number;
  waiverTitle: string;
  waiverPercentage: number;
  isSpecialScholarship: boolean;
  waiverScheme?: StudentWaiver;
} {
  if (waiver && waiver.status === "ACTIVE") {
    let amount = 0;
    if (waiver.type === "FULL_FREE") {
      amount = waiver.appliesTo === "TOTAL_PAYABLE" ? baseTuition + otherFees : baseTuition;
    } else if (waiver.type === "PERCENTAGE") {
      const targetBase = waiver.appliesTo === "TOTAL_PAYABLE" ? baseTuition + otherFees : baseTuition;
      amount = Math.round((targetBase * Math.min(100, Math.max(0, waiver.value))) / 100);
    } else if (waiver.type === "FIXED_AMOUNT") {
      const maxApplicable = waiver.appliesTo === "TOTAL_PAYABLE" ? baseTuition + otherFees : baseTuition;
      amount = Math.min(waiver.value, maxApplicable);
    }

    const pct =
      waiver.type === "FULL_FREE"
        ? 100
        : waiver.type === "PERCENTAGE"
        ? waiver.value
        : Math.round((amount / (baseTuition || 1)) * 100);

    return {
      waiverAmount: Math.max(0, amount),
      waiverTitle: waiver.scholarshipTitle,
      waiverPercentage: pct,
      isSpecialScholarship: true,
      waiverScheme: waiver,
    };
  }

  // Fallback merit waiver for top rolls (Roll 1-3 receive standard ৳500 merit waiver)
  if (classRoll && classRoll <= 3) {
    return {
      waiverAmount: 500,
      waiverTitle: "Merit Top-3 Concession",
      waiverPercentage: Math.round((500 / (baseTuition || 2500)) * 100),
      isSpecialScholarship: false,
    };
  }

  return {
    waiverAmount: 0,
    waiverTitle: "No Waiver",
    waiverPercentage: 0,
    isSpecialScholarship: false,
  };
}
