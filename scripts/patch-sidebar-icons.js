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

/** Fluent Color icons — https://icon-sets.iconify.design/fluent-color/ */
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
  attendance: "fluent-color:calendar-checkmark-24",
  studentStatus: "fluent-color:person-warning-24",
  results: "fluent-color:trophy-24",
  setup: "fluent-color:options-24",
  exams: "fluent-color:calendar-edit-24",
  routine: "fluent-color:calendar-clock-24",
  marks: "fluent-color:table-24",
  marksCheck: "fluent-color:checkmark-circle-24",
  publish: "fluent-color:shield-checkmark-24",
  spreadsheet: "fluent-color:document-text-24",
  chart: "fluent-color:chart-multiple-24",
  award: "fluent-color:ribbon-star-24",
  fail: "fluent-color:warning-24",
  sms: "fluent-color:send-24",
  chat: "fluent-color:chat-24",
  fees: "fluent-color:receipt-24",
  feeSetup: "fluent-color:coin-multiple-24",
  waiver: "fluent-color:star-24",
  collection: "fluent-color:savings-24",
  cash: "fluent-color:coin-multiple-24",
  ledger: "fluent-color:document-folder-24",
  absentFine: "fluent-color:calendar-cancel-24",
  accounts: "fluent-color:building-government-24",
  overviewChart: "fluent-color:data-bar-vertical-ascending-24",
  income: "fluent-color:data-trending-24",
  expense: "fluent-color:data-area-24",
  payroll: "fluent-color:people-team-24",
  trial: "fluent-color:clipboard-task-24",
  downloads: "fluent-color:arrow-square-down-24",
  banbeis: "fluent-color:table-24",
  admission: "fluent-color:form-24",
  academicCal: "fluent-color:calendar-data-bar-24",
  register: "fluent-color:book-contacts-24",
  idCards: "fluent-color:scan-person-24",
  transcripts: "fluent-color:certificate-24",
  seatPlan: "fluent-color:apps-24",
  settings: "fluent-color:settings-24",
  institution: "fluent-color:building-home-24",
  staff: "fluent-color:person-available-24",
  signatures: "fluent-color:clipboard-text-edit-24",
  roles: "fluent-color:shield-checkmark-24",
  permissions: "fluent-color:shield-24",
  users: "fluent-color:people-list-24",
  teacherAccess: "fluent-color:person-key-24",
  audit: "fluent-color:history-24",
  assets: "fluent-color:toolbox-24",
  assetRegister: "fluent-color:box-multiple-24",
  rooms: "fluent-color:building-multiple-24",
  maintenance: "fluent-color:wrench-24",
  depreciation: "fluent-color:data-pie-24",
  chevronRight: "lucide:chevron-right",
  chevronDown: "lucide:chevron-down",
} as const;

function NavIcon({
  icon,
  size = 18,
}: {
  icon: string;
  size?: number;
}) {
  return (
    <Iconify
      icon={icon}
      width={size}
      sx={{ flexShrink: 0, display: "block" }}
    />
  );
}

`;

// Replace from start through lucide import block ending
const importEnd = src.indexOf("export function Sidebar()");
if (importEnd < 0) throw new Error("Sidebar export not found");
src = header + src.slice(importEnd);

const replacements = [
  // Super admin
  [
    `<ShieldAlert className="w-3.5 h-3.5" />`,
    `<NavIcon icon={FI.superAdmin} size={18} />`,
  ],
  // Overview
  [
    `<LayoutDashboard className="w-4 h-4 shrink-0 text-emerald-400" />`,
    `<NavIcon icon={FI.overview} />`,
  ],
  // Sessions group
  [
    `<CalendarRange className="w-4 h-4 shrink-0 text-emerald-400" />`,
    `<NavIcon icon={FI.sessions} />`,
  ],
  // Chevrons - group level
  [
    `<ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />`,
    `<NavIcon icon={FI.chevronRight} size={14} />`,
  ],
  [
    `<ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />`,
    `<NavIcon icon={FI.chevronDown} size={14} />`,
  ],
  // Nested chevrons
  [
    `<ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />`,
    `<NavIcon icon={FI.chevronRight} size={12} />`,
  ],
  [
    `<ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />`,
    `<NavIcon icon={FI.chevronDown} size={12} />`,
  ],
];

// Order-sensitive contextual replacements for repeated icons
const contextual = [
  // Session children - first School, BookOpen, PlusCircle, Calendar in session block
  [/href="\/setup\/classes"[\s\S]*?<School className="w-3\.5 h-3\.5 shrink-0 text-slate-400" \/>/, (m) => m.replace(/<School[^/]*\/>/, `<NavIcon icon={FI.classes} size={15} />`)],
  [/href="\/setup\/subject-mapping"[\s\S]*?<BookOpen className="w-3\.5 h-3\.5 shrink-0 text-slate-400" \/>/, (m) => m.replace(/<BookOpen[^/]*\/>/, `<NavIcon icon={FI.subjects} size={15} />`)],
  [/<PlusCircle className="w-3\.5 h-3\.5 shrink-0 text-emerald-400" \/>/g, `<NavIcon icon={FI.createSession} size={15} />`],
  [/href="\/session\/manager"[\s\S]*?<Calendar className="w-3\.5 h-3\.5 shrink-0 text-slate-400" \/>/, (m) => m.replace(/<Calendar[^/]*\/>/, `<NavIcon icon={FI.sessionManager} size={15} />`)],
  [/<GraduationCap className="w-4 h-4 shrink-0 text-sky-400" \/>/g, `<NavIcon icon={FI.students} />`],
  [/href="\/student\/enrollment"[\s\S]*?<Users className="w-3\.5 h-3\.5 shrink-0 text-slate-400" \/>/, (m) => m.replace(/<Users[^/]*\/>/, `<NavIcon icon={FI.enrollment} size={15} />`)],
  [/href="\/academic\/subject-mapping"[\s\S]*?<BookOpen className="w-3\.5 h-3\.5 shrink-0 text-slate-400" \/>/, (m) => m.replace(/<BookOpen[^/]*\/>/, `<NavIcon icon={FI.subjectAlloc} size={15} />`)],
  [/<UserCheck className="w-3\.5 h-3\.5 shrink-0 text-amber-400" \/>/g, null], // handle below per context
];

fs.writeFileSync("scripts/_sidebar-tmp.tsx", src);
console.log("Header patched. Length", src.length);
console.log("Remaining lucide-like tags:", (src.match(/<(ShieldAlert|LayoutDashboard|CalendarRange|School|BookOpen|PlusCircle|Calendar|GraduationCap|Users|UserCheck|CalendarCheck|UserX|Award|Sliders|TableProperties|CheckCircle|ShieldCheck|FileSpreadsheet|FileBarChart|AlertTriangle|Send|MessageSquare|Receipt|CreditCard|Sparkles|HandCoins|Banknote|FileText|CalendarX2|Landmark|BarChart3|TrendingUp|TrendingDown|Download|Contact|LayoutGrid|Settings|Building2|FileSignature|Boxes|Wrench|ChevronRight|ChevronDown)\b/g) || []).length);
