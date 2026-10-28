// src/lib/institutionModules.ts
// Definition of all operational modules that can be granted to or restricted from an Institution

export interface InstitutionModuleItem {
  key: string;
  name: string;
  desc: string;
  badge: string;
}

export const INSTITUTION_MODULES: InstitutionModuleItem[] = [
  {
    key: "session",
    name: "Session Control & Class Setup",
    desc: "Academic Sessions, Class & Section Config, Class & Group Subject Mapping",
    badge: "Session",
  },
  {
    key: "student_info",
    name: "Student Information & Attendance",
    desc: "Student Registry, Bio-Data, Attendance Register, ID Cards & Profiles",
    badge: "Student",
  },
  {
    key: "results",
    name: "Result & Examination Engine",
    desc: "Grade Rules, Marks Entry Matrix, NCTB Evaluation, Tabulation & Marksheets",
    badge: "Exam",
  },
  {
    key: "fees",
    name: "Student Fee & Billing Ledger",
    desc: "Tuition Fees, Collection Vouchers, Scholarships/Waivers & Due Reports",
    badge: "Billing",
  },
  {
    key: "accountant",
    name: "Accountant Standpoint Module",
    desc: "Institutional Income, Operating Expenses, Staff Payroll & Audit Balance",
    badge: "Finance",
  },
  {
    key: "user_roles",
    name: "User & Role Access Control",
    desc: "Staff Accounts, RBAC Permission Matrix, Teacher Delegations & Audit Trail",
    badge: "Security",
  },
  {
    key: "sms_notice",
    name: "SMS Gateway & Broadcast Notices",
    desc: "Parent SMS Alerts, Result Dispatch & Custom Announcements",
    badge: "SMS",
  },
  {
    key: "downloads",
    name: "Download Center & BANBEIS",
    desc: "BANBEIS Census, Academic Calendar, Seat Plans, Transcripts & Forms",
    badge: "Download",
  },
  {
    key: "assets",
    name: "Institution Assets Module",
    desc: "Fixed Asset Registry, Campus Room Allocations, Maintenance Logs & Depreciation",
    badge: "Assets",
  },
];

export const ALL_INSTITUTION_MODULE_KEYS = INSTITUTION_MODULES.map((m) => m.key);

export function parseAccessibleModules(notes: string | null | undefined): string[] {
  if (!notes) return ALL_INSTITUTION_MODULE_KEYS;
  try {
    const parsed = JSON.parse(notes);
    if (Array.isArray(parsed.accessibleModules) && parsed.accessibleModules.length > 0) {
      return parsed.accessibleModules;
    }
  } catch {
    // If notes contains comma-separated keys or plain text
    if (typeof notes === "string" && notes.includes(",")) {
      const split = notes.split(",").map((s) => s.trim()).filter((k) => ALL_INSTITUTION_MODULE_KEYS.includes(k));
      if (split.length > 0) return split;
    }
  }
  return ALL_INSTITUTION_MODULE_KEYS;
}

export function serializeAccessibleModules(modules: string[], existingNotes?: string | null): string {
  let existingObj: Record<string, any> = {};
  if (existingNotes) {
    try {
      existingObj = JSON.parse(existingNotes);
    } catch {
      existingObj = { text: existingNotes };
    }
  }
  return JSON.stringify({
    ...existingObj,
    accessibleModules: modules,
    updatedAt: new Date().toISOString(),
  });
}
