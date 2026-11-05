const fs = require("fs");
const path = "src/components/Sidebar.tsx";
let src = fs.readFileSync(path, "utf8");

const header = `"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  isInstitutionLoggedIn,
  AUTH_SESSION_EVENT,
  getAuthSession,
  AuthSession,
} from "@/lib/authSession";
import { Iconify } from "@/components/iconify/iconify";

/** Fluent Color — https://icon-sets.iconify.design/fluent-color/ */
const FI = {
  superAdmin: "fluent-color:lock-shield-24",
  overview: "fluent-color:board-24",
  sessions: "fluent-color:calendar-24",
  classes: "fluent-color:building-24",
  subjects: "fluent-color:book-open-24",
  createSession: "fluent-color:add-circle-24",
  sessionManager: "fluent-color:calendar-checkmark-24",
  students: "fluent-color:people-community-24",
  enrollment: "fluent-color:people-24",
  subjectAlloc: "fluent-color:library-24",
  profiles: "fluent-color:contact-card-24",
  attendance: "fluent-color:calendar-clock-24",
  studentStatus: "fluent-color:person-warning-24",
  results: "fluent-color:trophy-24",
  grading: "fluent-color:options-24",
  examConfig: "fluent-color:calendar-edit-24",
  examRoutine: "fluent-color:calendar-data-bar-24",
  markEntry: "fluent-color:table-24",
  processReview: "fluent-color:checkmark-circle-24",
  publish: "fluent-color:shield-checkmark-24",
  tabulation: "fluent-color:document-text-24",
  glance: "fluent-color:chart-multiple-24",
  reportCards: "fluent-color:ribbon-star-24",
  failList: "fluent-color:warning-24",
  sms: "fluent-color:send-24",
  chat: "fluent-color:chat-24",
  fees: "fluent-color:receipt-24",
  feeSetup: "fluent-color:coin-multiple-24",
  waiver: "fluent-color:star-24",
  collection: "fluent-color:hand-coins-24",
  cash: "fluent-color:savings-24",
  ledger: "fluent-color:document-folder-24",
  absentFine: "fluent-color:calendar-cancel-24",
  accounts: "fluent-color:building-government-24",
  accountsOverview: "fluent-color:data-bar-vertical-ascending-24",
  income: "fluent-color:data-trending-24",
  expense: "fluent-color:data-area-24",
  payroll: "fluent-color:people-team-24",
  trial: "fluent-color:clipboard-task-24",
  downloads: "fluent-color:arrow-square-down-24",
  banbeis: "fluent-color:table-24",
  admission: "fluent-color:form-24",
  academicCal: "fluent-color:calendar-32",
  register: "fluent-color:book-contacts-24",
  idCards: "fluent-color:scan-person-24",
  transcripts: "fluent-color:certificate-24",
  seatPlan: "fluent-color:apps-24",
  settings: "fluent-color:settings-24",
  institution: "fluent-color:building-home-24",
  staff: "fluent-color:person-available-24",
  signatures: "fluent-color:clipboard-text-edit-24",
  rolesGroup: "fluent-color:shield-checkmark-24",
  roles: "fluent-color:shield-24",
  userAccounts: "fluent-color:people-list-24",
  teacherAccess: "fluent-color:person-key-24",
  audit: "fluent-color:history-24",
  assets: "fluent-color:toolbox-24",
  assetRegister: "fluent-color:building-store-24",
  rooms: "fluent-color:building-multiple-24",
  maintenance: "fluent-color:wrench-24",
  depreciation: "fluent-color:data-pie-24",
  chevronRight: "lucide:chevron-right",
  chevronDown: "lucide:chevron-down",
} as const;

function NavIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  return <Iconify icon={icon} width={size} sx={{ flexShrink: 0, display: "block" }} />;
}

`;

// Fix icons that may not exist - hand-coins isn't in fluent-color list
header.replace(
  'collection: "fluent-color:hand-coins-24"',
  'collection: "fluent-color:savings-24"'
);
// Actually rewrite collection line properly in header string above
const fixedHeader = header
  .replace(
    'collection: "fluent-color:hand-coins-24",\n  cash: "fluent-color:savings-24",',
    'collection: "fluent-color:savings-24",\n  cash: "fluent-color:coin-multiple-24",'
  );

const exportIdx = src.indexOf("export function Sidebar()");
if (exportIdx < 0) throw new Error("export not found");
src = fixedHeader + src.slice(exportIdx);

/** Replace icon immediately before a label span text */
function replaceBeforeLabel(label, iconExpr, size) {
  const sizeAttr = size ? ` size={${size}}` : "";
  const re = new RegExp(
    `<(?:ShieldAlert|LayoutDashboard|CalendarRange|School|BookOpen|PlusCircle|Calendar|GraduationCap|Users|UserCheck|CalendarCheck|UserX|Award|Sliders|TableProperties|CheckCircle|ShieldCheck|FileSpreadsheet|FileBarChart|AlertTriangle|Send|MessageSquare|Receipt|CreditCard|Sparkles|HandCoins|Banknote|FileText|CalendarX2|Landmark|BarChart3|TrendingUp|TrendingDown|Download|Contact|LayoutGrid|Settings|Building2|FileSignature|Boxes|Wrench|ChevronRight|ChevronDown)[^>]*\\/>\\s*\\n\\s*<span[^>]*>${label.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}<\\/span>`,
    "m"
  );
  const next = src.replace(re, `<NavIcon icon={${iconExpr}}${sizeAttr} />\n                      <span>$LABEL</span>`.replace("$LABEL", label));
  if (next === src) {
    // try without capturing exact whitespace for span classes
    const re2 = new RegExp(
      `<(?:ShieldAlert|LayoutDashboard|CalendarRange|School|BookOpen|PlusCircle|Calendar|GraduationCap|Users|UserCheck|CalendarCheck|UserX|Award|Sliders|TableProperties|CheckCircle|ShieldCheck|FileSpreadsheet|FileBarChart|AlertTriangle|Send|MessageSquare|Receipt|CreditCard|Sparkles|HandCoins|Banknote|FileText|CalendarX2|Landmark|BarChart3|TrendingUp|TrendingDown|Download|Contact|LayoutGrid|Settings|Building2|FileSignature|Boxes|Wrench)[^>]*\\/>\\s*(<span[^>]*>${label.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}<\\/span>)`
    );
    const next2 = src.replace(re2, `<NavIcon icon={${iconExpr}}${sizeAttr} />\n                      $1`);
    if (next2 === src) {
      console.warn("MISS:", label);
      return false;
    }
    src = next2;
    return true;
  }
  src = next;
  return true;
}

const labelMap = [
  ["Super Admin", null], // special - inside nested div
  ["Overview", "FI.overview", 18],
  ["Sessions", "FI.sessions", 18],
  ["Classes & Sections", "FI.classes", 15],
  ["Subject Mapping", "FI.subjects", 15],
  ["Create Session", "FI.createSession", 15],
  ["Session Manager", "FI.sessionManager", 15],
  ["Students", "FI.students", 18],
  ["Enrollment", "FI.enrollment", 15],
  ["Subject Allocation", "FI.subjectAlloc", 15],
  ["Student Profiles", "FI.profiles", 15],
  ["Attendance", "FI.attendance", 15],
  ["Student Status", "FI.studentStatus", 15],
  ["Results & Exams", "FI.results", 18],
  ["Grading Rules", "FI.grading", 15],
  ["Exam Configuration", "FI.examConfig", 15],
  ["Exam Routine", "FI.examRoutine", 15],
  ["Mark Entry", "FI.markEntry", 15],
  ["Process & Review", "FI.processReview", 15],
  ["Publish Results", "FI.publish", 15],
  ["Tabulation Sheet", "FI.tabulation", 15],
  ["At a Glance", "FI.glance", 15],
  ["Report Cards", "FI.reportCards", 15],
  ["Failed Students", "FI.failList", 15],
  ["SMS & Notices", "FI.sms", 18],
  ["Result SMS", "FI.sms", 15],
  ["Custom SMS", "FI.chat", 15],
  ["Student Fees", "FI.fees", 18],
  ["Fee Setup", "FI.feeSetup", 15],
  ["Waivers & Scholarships", "FI.waiver", 15],
  ["Fee Collection", "FI.collection", 18],
  ["Cash Counter", "FI.cash", 15],
  ["Receipts & Ledger", "FI.ledger", 15],
  ["Absent Fines", "FI.absentFine", 15],
  ["Accounts & Finance", "FI.accounts", 18],
  ["Overview & Ledger", "FI.accountsOverview", 15],
  ["Income", "FI.income", 15],
  ["Expenses", "FI.expense", 15],
  ["Payroll", "FI.payroll", 15],
  ["Trial Balance", "FI.trial", 15],
  ["Downloads", "FI.downloads", 18],
  ["BANBEIS Census", "FI.banbeis", 15],
  ["Admission Form", "FI.admission", 15],
  ["Academic Calendar", "FI.academicCal", 15],
  ["Student Register", "FI.register", 15],
  ["ID Cards", "FI.idCards", 15],
  ["Transcripts", "FI.transcripts", 15],
  ["Seat Plan", "FI.seatPlan", 15],
  ["Settings", "FI.settings", 18], // first Settings group - careful
  ["Institution Profile", "FI.institution", 15],
  ["Teachers & Staff", "FI.staff", 15],
  ["Signatures", "FI.signatures", 15],
  ["User Roles", "FI.rolesGroup", 15],
  ["Roles & Permissions", "FI.roles", 15],
  ["User Accounts", "FI.userAccounts", 15],
  ["Teacher Access", "FI.teacherAccess", 15],
  ["Audit Logs", "FI.audit", 15],
  ["Assets", "FI.assets", 18],
  ["Asset Register", "FI.assetRegister", 15],
  ["Rooms & Locations", "FI.rooms", 15],
  ["Maintenance", "FI.maintenance", 15],
  ["Depreciation", "FI.depreciation", 15],
];

// Super admin icon (alone in a box, not next to span with that exact structure for icon)
src = src.replace(
  /<ShieldAlert className="w-3\.5 h-3\.5" \/>/,
  `<NavIcon icon={FI.superAdmin} size={18} />`
);

for (const [label, icon, size] of labelMap) {
  if (!icon) continue;
  replaceBeforeLabel(label, icon, size);
}

// Settings appears twice - sidebar Settings group and maybe footer link "Settings"
// After first pass, leftover Settings icon for footer Super Admin HQ Settings link
src = src.replace(
  /<Settings className="[^"]*" \/>\s*<span>Settings<\/span>/,
  `<NavIcon icon={FI.settings} />\n                <span>Settings</span>`
);

// Chevrons
src = src.replace(
  /<ChevronRight className="w-3\.5 h-3\.5 text-slate-400 group-hover:text-white shrink-0" \/>/g,
  `<NavIcon icon={FI.chevronRight} size={14} />`
);
src = src.replace(
  /<ChevronDown className="w-3\.5 h-3\.5 text-slate-400 group-hover:text-white shrink-0" \/>/g,
  `<NavIcon icon={FI.chevronDown} size={14} />`
);
src = src.replace(
  /<ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" \/>/g,
  `<NavIcon icon={FI.chevronRight} size={12} />`
);
src = src.replace(
  /<ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" \/>/g,
  `<NavIcon icon={FI.chevronDown} size={12} />`
);

const leftovers = src.match(
  /<(ShieldAlert|LayoutDashboard|CalendarRange|School|BookOpen|PlusCircle|Calendar|GraduationCap|Users|UserCheck|CalendarCheck|UserX|Award|Sliders|TableProperties|CheckCircle|ShieldCheck|FileSpreadsheet|FileBarChart|AlertTriangle|Send|MessageSquare|Receipt|CreditCard|Sparkles|HandCoins|Banknote|FileText|CalendarX2|Landmark|BarChart3|TrendingUp|TrendingDown|Download|Contact|LayoutGrid|Settings|Building2|FileSignature|Boxes|Wrench|ChevronRight|ChevronDown)\b[^>]*\/>/g
);
console.log("leftovers:", leftovers || "none");

fs.writeFileSync(path, src);
console.log("Wrote", path);
