"use client";

import { SchoolBasicInfo, DEFAULT_SCHOOL_INFO, getStoredSchoolInfo } from "./settingsStore";
import { getScopedStorageKey, getActiveTenantCode } from "./clientTenant";

export type ActivityCategory = 
  | "HOLIDAY"         // Government, Religious, or National Holiday (Closed)
  | "VACATION"        // Extended vacation (Summer, Winter, Eid, Puja)
  | "EXAM"            // Term Examinations, Midterms, Class Tests, Board Pre-Tests
  | "ACADEMIC"        // Session Open, Syllabus Deadlines, Parents Meetings
  | "EVENT"           // Sports Day, Cultural Week, Science Fair, Milad
  | "ADMINISTRATIVE"; // Admission period, Form Fill-up, Result Publication

export interface AcademicActivity {
  id: string;
  session: string;             // e.g. "2026"
  title: string;               // e.g. "Independence Day"
  titleBn?: string;            // e.g. "মহান স্বাধীনতা ও জাতীয় দিবস"
  category: ActivityCategory;
  startDate: string;           // YYYY-MM-DD
  endDate: string;             // YYYY-MM-DD
  totalDays: number;           // e.g. 1 or 10
  isHoliday: boolean;          // true = school closed, false = working day event
  targetClasses?: string;      // e.g. "All Classes" or "Class 6 to 10"
  description?: string;        // Brief detail / guidelines
  colorBadge?: string;         // optional UI accent color
}

export interface AcademicCalendarConfig {
  session: string;             // e.g. "2026"
  yearTitle: string;           // e.g. "Academic Calendar 2026 (শিক্ষাবর্ষ ২০২৬)"
  approvedBy: string;          // e.g. "Ministry of Education & Board Approved"
  committeeHead: string;       // Convener Academic Calendar Committee
  principalName: string;
  totalWorkingDays: number;
  totalHolidays: number;
  totalExamDays: number;
  instructions: string[];
  activities: AcademicActivity[];
  updatedAt: string;
}

export const CALENDAR_STORAGE_KEY = "nctb_academic_calendar_v1";
export const CALENDAR_UPDATED_EVENT = "nctb_academic_calendar_updated";

export const CATEGORY_CONFIG: Record<ActivityCategory, {
  label: string;
  labelBn: string;
  badgeClass: string;
  textClass: string;
  bgLight: string;
  borderClass: string;
  dotColor: string;
}> = {
  HOLIDAY: {
    label: "National / Govt Holiday",
    labelBn: "সরকারি ছুটি",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    textClass: "text-rose-700",
    bgLight: "bg-rose-50/70",
    borderClass: "border-rose-200",
    dotColor: "bg-rose-500",
  },
  VACATION: {
    label: "Extended Vacation",
    labelBn: "দীর্ঘমেয়াদী অবকাশ",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    textClass: "text-amber-700",
    bgLight: "bg-amber-50/70",
    borderClass: "border-amber-200",
    dotColor: "bg-amber-500",
  },
  EXAM: {
    label: "Examination & Assessment",
    labelBn: "পরীক্ষা ও মূল্যায়ন",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    textClass: "text-purple-700",
    bgLight: "bg-purple-50/70",
    borderClass: "border-purple-200",
    dotColor: "bg-purple-600",
  },
  ACADEMIC: {
    label: "Academic Milestone",
    labelBn: "শিক্ষাক্রম কার্যক্রম",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    textClass: "text-blue-700",
    bgLight: "bg-blue-50/70",
    borderClass: "border-blue-200",
    dotColor: "bg-blue-600",
  },
  EVENT: {
    label: "Sports & Cultural Event",
    labelBn: "সহপাঠ্যক্রম ও দিবস",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    textClass: "text-emerald-700",
    bgLight: "bg-emerald-50/70",
    borderClass: "border-emerald-200",
    dotColor: "bg-emerald-600",
  },
  ADMINISTRATIVE: {
    label: "Administrative & Assembly",
    labelBn: "প্রশাসনিক ও সমাবেশ",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    textClass: "text-slate-700",
    bgLight: "bg-slate-50",
    borderClass: "border-slate-200",
    dotColor: "bg-slate-600",
  },
};

export const DEFAULT_CALENDAR_INSTRUCTIONS = [
  "All examinations must be conducted strictly according to the syllabus breakdown approved by the Academic Council.",
  "National Days (21st February, 26th March, 16th December) must be observed with flag hoisting and institutional cultural programs.",
  "Subject to sighting of the moon, religious holidays (Eid, Ramadan, Shab-e-Barat, Puja) may be adjusted per Government Gazette notifications.",
  "Parent-Teacher Assemblies must be conducted within 7 days of each term examination result publication.",
  "Remedial and extra care classes must be arranged for students struggling in English and General Mathematics.",
];

export const INITIAL_2026_ACTIVITIES: AcademicActivity[] = [
  {
    id: "act-1",
    session: "2026",
    title: "Book Distribution Festival & Academic Session Start",
    titleBn: "বই বিতরণ উৎসব ও নতুন শিক্ষাবর্ষের ক্লাস শুরু",
    category: "ACADEMIC",
    startDate: "2026-01-01",
    endDate: "2026-01-01",
    totalDays: 1,
    isHoliday: false,
    targetClasses: "All Classes",
    description: "New free textbook distribution and introductory orientation for all students.",
  },
  {
    id: "act-2",
    session: "2026",
    title: "New Student Admission Finalization & Section Allotment",
    titleBn: "নতুন শিক্ষার্থী ভর্তি চূড়ান্তকরণ ও শাখা বণ্টন",
    category: "ADMINISTRATIVE",
    startDate: "2026-01-05",
    endDate: "2026-01-15",
    totalDays: 11,
    isHoliday: false,
    targetClasses: "Class 6, 9 & 11",
    description: "Document verification, student ID card creation, and section allocation.",
  },
  {
    id: "act-3",
    session: "2026",
    title: "International Mother Language Day & Shaheed Day",
    titleBn: "আন্তর্জাতিক মাতৃভাষা দিবস ও শহীদ দিবস",
    category: "HOLIDAY",
    startDate: "2026-02-21",
    endDate: "2026-02-21",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Morning Prabhat Pheri, floral wreath at Shaheed Minar, and art & speech contest.",
  },
  {
    id: "act-4",
    session: "2026",
    title: "Holy Shab-e-Barat",
    titleBn: "পবিত্র শবে বরাত*",
    category: "HOLIDAY",
    startDate: "2026-02-26",
    endDate: "2026-02-26",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Government holiday subject to moon sighting.",
  },
  {
    id: "act-5",
    session: "2026",
    title: "National Children's Day & Bangabandhu's Birthday",
    titleBn: "জাতীয় শিশু দিবস ও জাতির পিতার জন্মবার্ষিকী",
    category: "EVENT",
    startDate: "2026-03-17",
    endDate: "2026-03-17",
    totalDays: 1,
    isHoliday: false,
    targetClasses: "All Classes",
    description: "Children's gathering, drawing competition, and discussion on moral leadership.",
  },
  {
    id: "act-6",
    session: "2026",
    title: "Independence & National Day",
    titleBn: "মহান স্বাধীনতা ও জাতীয় দিবস",
    category: "HOLIDAY",
    startDate: "2026-03-26",
    endDate: "2026-03-26",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "National flag hoisting, parade, and institutional celebration.",
  },
  {
    id: "act-7",
    session: "2026",
    title: "Ramadan, Shab-e-Qadr, Eid-ul-Fitr & Summer Vacation",
    titleBn: "পবিত্র রমজান, শবে কদর, ঈদুল ফিতর ও গ্রীষ্মকালীন অবকাশ",
    category: "VACATION",
    startDate: "2026-03-27",
    endDate: "2026-04-12",
    totalDays: 17,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Holy Ramadan, Shab-e-Qadr, Eid-ul-Fitr, and summer vacation combined.",
  },
  {
    id: "act-8",
    session: "2026",
    title: "Pahela Baishakh (Bengali New Year 1433)",
    titleBn: "পহেলা বৈশাখ (বাংলা নববর্ষ ১৪৩৩)",
    category: "HOLIDAY",
    startDate: "2026-04-14",
    endDate: "2026-04-14",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Traditional Mangal Shobhajatra and cultural festival in campus.",
  },
  {
    id: "act-9",
    session: "2026",
    title: "International Workers' Day (May Day)",
    titleBn: "মহান মে দিবস",
    category: "HOLIDAY",
    startDate: "2026-05-01",
    endDate: "2026-05-01",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Official government public holiday.",
  },
  {
    id: "act-10",
    session: "2026",
    title: "Buddha Purnima (Vesak Day)",
    titleBn: "শুভ বুদ্ধ পূর্ণিমা (বৈশাখী পূর্ণিমা)",
    category: "HOLIDAY",
    startDate: "2026-05-11",
    endDate: "2026-05-11",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Government public holiday.",
  },
  {
    id: "act-11",
    session: "2026",
    title: "Half-Yearly Examination / 1st Term Evaluation",
    titleBn: "অর্ধ-বার্ষিক পরীক্ষা ও প্রাক-নির্বাচনী মূল্যায়ন",
    category: "EXAM",
    startDate: "2026-05-20",
    endDate: "2026-06-04",
    totalDays: 16,
    isHoliday: false,
    targetClasses: "Class 6 to 10",
    description: "Written theory, MCQ, and practical examinations across all registered subjects.",
  },
  {
    id: "act-12",
    session: "2026",
    title: "Holy Eid-ul-Adha Vacation",
    titleBn: "পবিত্র ঈদুল আজহা অবকাশ",
    category: "VACATION",
    startDate: "2026-06-05",
    endDate: "2026-06-15",
    totalDays: 11,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Qurbani Eid institutional recess.",
  },
  {
    id: "act-13",
    session: "2026",
    title: "Half-Yearly Result Publication & Parent-Teacher Assembly",
    titleBn: "অর্ধ-বার্ষিক পরীক্ষার ফলাফল প্রকাশ ও অভিভাবক সমাবেশ",
    category: "ADMINISTRATIVE",
    startDate: "2026-06-25",
    endDate: "2026-06-25",
    totalDays: 1,
    isHoliday: false,
    targetClasses: "Class 6 to 10",
    description: "Progress report card distribution and teacher-guardian academic consultation.",
  },
  {
    id: "act-14",
    session: "2026",
    title: "Holy Ashura (10th Muharram)",
    titleBn: "পবিত্র আশুরা*",
    category: "HOLIDAY",
    startDate: "2026-07-16",
    endDate: "2026-07-16",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Government religious public holiday.",
  },
  {
    id: "act-15",
    session: "2026",
    title: "National Mourning Day",
    titleBn: "জাতীয় শোক দিবস",
    category: "HOLIDAY",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Half-mast national flag, remembrance assembly, and prayer.",
  },
  {
    id: "act-16",
    session: "2026",
    title: "Shuvo Janmashtami",
    titleBn: "শুভ জন্মাষ্টমী",
    category: "HOLIDAY",
    startDate: "2026-08-26",
    endDate: "2026-08-26",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Government public holiday.",
  },
  {
    id: "act-17",
    session: "2026",
    title: "Holy Eid-e-Miladunnabi (PBUH)",
    titleBn: "পবিত্র ঈদে মিলাদুন্নবী (সা.)*",
    category: "HOLIDAY",
    startDate: "2026-09-05",
    endDate: "2026-09-05",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Government public holiday & Seerat-un-Nabi discussion.",
  },
  {
    id: "act-18",
    session: "2026",
    title: "Annual Sports Week & Science Fair Competition",
    titleBn: "বার্ষিক ক্রীড়া সপ্তাহ ও বিজ্ঞান মেলা প্রতিযোগিতা",
    category: "EVENT",
    startDate: "2026-09-15",
    endDate: "2026-09-22",
    totalDays: 8,
    isHoliday: false,
    targetClasses: "All Classes",
    description: "Track and field athletics, scientific project displays, debate, and prize distribution.",
  },
  {
    id: "act-19",
    session: "2026",
    title: "Durga Puja, Fateha-e-Yazdaham & Prabarana Purnima Vacation",
    titleBn: "শারদীয় দুর্গাপূজা, ফাতেহা-ই-ইয়াজদাহম ও প্রবারণা পূর্ণিমা অবকাশ",
    category: "VACATION",
    startDate: "2026-10-01",
    endDate: "2026-10-10",
    totalDays: 10,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Autumn festival vacation as per Ministry of Education gazette.",
  },
  {
    id: "act-20",
    session: "2026",
    title: "SSC & HSC Test Examination (নির্বাচনী পরীক্ষা)",
    titleBn: "এসএসসি ও এইচএসসি নির্বাচনী পরীক্ষা",
    category: "EXAM",
    startDate: "2026-10-18",
    endDate: "2026-11-04",
    totalDays: 18,
    isHoliday: false,
    targetClasses: "Class 10 & 12",
    description: "Mandatory qualification exam for Board Exam registration.",
  },
  {
    id: "act-21",
    session: "2026",
    title: "Academic Syllabus Completion & Revision Week",
    titleBn: "বার্ষিক পাঠ্যক্রম সমাপ্তি ও পুনরাবৃত্তি সপ্তাহ",
    category: "ACADEMIC",
    startDate: "2026-11-10",
    endDate: "2026-11-18",
    totalDays: 9,
    isHoliday: false,
    targetClasses: "All Classes",
    description: "Completion of remaining competencies and preparatory mock tests.",
  },
  {
    id: "act-22",
    session: "2026",
    title: "Annual Examination 2026 (বার্ষিক পরীক্ষা ২০২৬)",
    titleBn: "বার্ষিক পরীক্ষা ২০২৬",
    category: "EXAM",
    startDate: "2026-11-25",
    endDate: "2026-12-10",
    totalDays: 16,
    isHoliday: false,
    targetClasses: "Class 6 to 9",
    description: "Final comprehensive evaluation, CQ, MCQ and continuous assessment calculation.",
  },
  {
    id: "act-23",
    session: "2026",
    title: "Great Victory Day (মহান বিজয় দিবস)",
    titleBn: "মহান বিজয় দিবস",
    category: "HOLIDAY",
    startDate: "2026-12-16",
    endDate: "2026-12-16",
    totalDays: 1,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "National Victory Day celebration, flag ceremony, and march past.",
  },
  {
    id: "act-24",
    session: "2026",
    title: "Winter Vacation & Christmas (শীতকালীন অবকাশ ও যিশু খ্রিস্টের জন্মদিন)",
    titleBn: "শীতকালীন অবকাশ ও যিশু খ্রিস্টের জন্মদিন (বড়দিন)",
    category: "VACATION",
    startDate: "2026-12-18",
    endDate: "2026-12-31",
    totalDays: 14,
    isHoliday: true,
    targetClasses: "All Classes",
    description: "Year-end institutional winter recess.",
  },
  {
    id: "act-25",
    session: "2026",
    title: "Annual Result Publication & Merit Award Ceremony",
    titleBn: "বার্ষিক পরীক্ষার ফলাফল প্রকাশ ও মেধা পুরস্কার প্রদান",
    category: "ADMINISTRATIVE",
    startDate: "2026-12-30",
    endDate: "2026-12-30",
    totalDays: 1,
    isHoliday: false,
    targetClasses: "All Classes",
    description: "Official publication of final marksheets, GPA, promotion list, and merit awards.",
  },
];

export function calculateDateDiffDays(startDate: string, endDate: string): number {
  if (!startDate) return 1;
  if (!endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
}

export function getStoredCalendarConfig(session = "2026", instCode?: string): AcademicCalendarConfig {
  const code = instCode || getActiveTenantCode();
  if (typeof window === "undefined") {
    return createDefaultCalendarConfig(session);
  }
  try {
    const scopedKey = `${CALENDAR_STORAGE_KEY}_${code}_${session}`;
    const legacyKey = `${CALENDAR_STORAGE_KEY}_${session}`;
    const raw = localStorage.getItem(scopedKey) || (code === "108254" ? localStorage.getItem(legacyKey) : null);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.activities)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load stored academic calendar", e);
  }

  const fresh = createDefaultCalendarConfig(session);
  saveCalendarConfig(fresh, code);
  return fresh;
}

export function createDefaultCalendarConfig(session = "2026"): AcademicCalendarConfig {
  const school = getStoredSchoolInfo();
  const activities = INITIAL_2026_ACTIVITIES.map((act) => ({
    ...act,
    session,
  }));

  const holidaysCount = activities
    .filter((a) => a.isHoliday)
    .reduce((sum, a) => sum + (a.totalDays || 1), 0);

  const examDaysCount = activities
    .filter((a) => a.category === "EXAM")
    .reduce((sum, a) => sum + (a.totalDays || 1), 0);

  const workingDays = Math.max(0, 365 - holidaysCount);

  return {
    session,
    yearTitle: `Academic Calendar ${session} (শিক্ষাবর্ষ ${session})`,
    approvedBy: "Ministry of Education & Board Circular Compliant",
    committeeHead: "Convener, Academic Calendar & Routine Committee",
    principalName: school?.headName || "Prof. A. K. M. Shamsuddin",
    totalWorkingDays: workingDays,
    totalHolidays: holidaysCount,
    totalExamDays: examDaysCount,
    instructions: DEFAULT_CALENDAR_INSTRUCTIONS,
    activities,
    updatedAt: new Date().toISOString(),
  };
}

export function saveCalendarConfig(config: AcademicCalendarConfig, instCode?: string): void {
  if (typeof window === "undefined") return;
  const code = instCode || getActiveTenantCode();
  try {
    // Recompute statistics
    const holidaysCount = config.activities
      .filter((a) => a.isHoliday)
      .reduce((sum, a) => sum + (a.totalDays || 1), 0);

    const examDaysCount = config.activities
      .filter((a) => a.category === "EXAM")
      .reduce((sum, a) => sum + (a.totalDays || 1), 0);

    const workingDays = Math.max(0, 365 - holidaysCount);

    const updatedConfig: AcademicCalendarConfig = {
      ...config,
      totalHolidays: holidaysCount,
      totalExamDays: examDaysCount,
      totalWorkingDays: workingDays,
      updatedAt: new Date().toISOString(),
    };

    const scopedKey = `${CALENDAR_STORAGE_KEY}_${code}_${config.session}`;
    localStorage.setItem(scopedKey, JSON.stringify(updatedConfig));
    window.dispatchEvent(new Event(CALENDAR_UPDATED_EVENT));
  } catch (e) {
    console.error("Failed to save academic calendar config", e);
  }
}

export function resetCalendarToDefault(session = "2026", instCode?: string): AcademicCalendarConfig {
  const code = instCode || getActiveTenantCode();
  const fresh = createDefaultCalendarConfig(session);
  saveCalendarConfig(fresh, code);
  return fresh;
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
