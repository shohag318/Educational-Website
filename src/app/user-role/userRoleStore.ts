// src/app/user-role/userRoleStore.ts
// LocalStorage reactive store for User Role & RBAC Management

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean; // Publish, lock, finalize, override
}

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  badgeBg: string;
  isSystem: boolean;
  permissions: {
    student_info: ModulePermission;
    results: ModulePermission;
    fees: ModulePermission;
    accountant: ModulePermission;
    user_roles: ModulePermission;
    sms_notice: ModulePermission;
    system_settings: ModulePermission;
  };
}

export interface UserAccount {
  id: string;
  name: string;
  username: string; // e.g. TCH-101, ADM-001
  email: string;
  phone: string;
  roleId: string;
  designation: string;
  department: string;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  twoFactorEnabled: boolean;
  lastLogin: string;
  avatarBg: string;
  createdAt: string;
  accessibleModules?: string[]; // Module keys explicitly granted/accessible by this user ID
}

export interface TeacherDelegation {
  id: string;
  userId: string;
  userName: string;
  designation: string;
  className: string;
  sectionName: string;
  subjectName: string;
  accessLevel: "MARK_ENTRY" | "VIEW_ONLY";
  assignedDate: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  category: "SECURITY" | "USER_MANAGEMENT" | "PERMISSION" | "DELEGATION";
  details: string;
  ipAddress: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

export const MODULE_KEYS = [
  { key: "student_info", name: "Student Information Module", desc: "Enrollment, Student Info, Profiles, ID Cards & Attendance" },
  { key: "results", name: "Result & Examination Engine", desc: "Grade Rules, Mark Input, Calculation, Processing & Publish Lock" },
  { key: "fees", name: "Student Fee Module & Ledger", desc: "Billing, Fee Collections, Receipt Vouchers & Scholarships/Waivers" },
  { key: "accountant", name: "Accountant Standpoint Module", desc: "Institutional Income, Operating Expenses, Payroll & Audit Balance" },
  { key: "user_roles", name: "User & Role Access Control", desc: "User Accounts, RBAC Permission Matrix & Teacher Scopes" },
  { key: "sms_notice", name: "SMS Gateway & Institutional Notices", desc: "Parent SMS Alerts, Circulars & Examination Announcements" },
  { key: "system_settings", name: "Academic Settings & EIIN Config", desc: "Academic Years, Class Mapping, Grading Slabs & Institute Info" },
] as const;

// Default System Roles
export const DEFAULT_ROLES: Role[] = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "Unrestricted master access to all school modules, data operations and security controls.",
    color: "text-purple-700 border-purple-200 bg-purple-50",
    badgeBg: "bg-purple-100 text-purple-800",
    isSystem: true,
    permissions: {
      student_info: { view: true, create: true, edit: true, delete: true, approve: true },
      results: { view: true, create: true, edit: true, delete: true, approve: true },
      fees: { view: true, create: true, edit: true, delete: true, approve: true },
      accountant: { view: true, create: true, edit: true, delete: true, approve: true },
      user_roles: { view: true, create: true, edit: true, delete: true, approve: true },
      sms_notice: { view: true, create: true, edit: true, delete: true, approve: true },
      system_settings: { view: true, create: true, edit: true, delete: true, approve: true },
    },
  },
  {
    id: "principal",
    name: "Principal / Headmaster",
    description: "Chief executive oversight, marksheet verification, fee review, audit inspection and notice signing.",
    color: "text-blue-700 border-blue-200 bg-blue-50",
    badgeBg: "bg-blue-100 text-blue-800",
    isSystem: true,
    permissions: {
      student_info: { view: true, create: true, edit: true, delete: false, approve: true },
      results: { view: true, create: false, edit: false, delete: false, approve: true },
      fees: { view: true, create: false, edit: false, delete: false, approve: true },
      accountant: { view: true, create: false, edit: false, delete: false, approve: true },
      user_roles: { view: true, create: false, edit: false, delete: false, approve: true },
      sms_notice: { view: true, create: true, edit: true, delete: false, approve: true },
      system_settings: { view: true, create: false, edit: true, delete: false, approve: true },
    },
  },
  {
    id: "exam_controller",
    name: "Exam Controller",
    description: "Manages exam scheduling, marks entry lockdown, grade recalculations, and result publication.",
    color: "text-emerald-700 border-emerald-200 bg-emerald-50",
    badgeBg: "bg-emerald-100 text-emerald-800",
    isSystem: true,
    permissions: {
      student_info: { view: true, create: false, edit: false, delete: false, approve: false },
      results: { view: true, create: true, edit: true, delete: false, approve: true },
      fees: { view: true, create: false, edit: false, delete: false, approve: false },
      accountant: { view: false, create: false, edit: false, delete: false, approve: false },
      user_roles: { view: false, create: false, edit: false, delete: false, approve: false },
      sms_notice: { view: true, create: true, edit: true, delete: false, approve: true },
      system_settings: { view: true, create: true, edit: true, delete: false, approve: false },
    },
  },
  {
    id: "subject_teacher",
    name: "Subject Teacher",
    description: "Enters student exam marks & daily attendance for assigned class/section subjects only.",
    color: "text-amber-700 border-amber-200 bg-amber-50",
    badgeBg: "bg-amber-100 text-amber-800",
    isSystem: true,
    permissions: {
      student_info: { view: true, create: false, edit: false, delete: false, approve: false },
      results: { view: true, create: true, edit: true, delete: false, approve: false },
      fees: { view: false, create: false, edit: false, delete: false, approve: false },
      accountant: { view: false, create: false, edit: false, delete: false, approve: false },
      user_roles: { view: false, create: false, edit: false, delete: false, approve: false },
      sms_notice: { view: true, create: false, edit: false, delete: false, approve: false },
      system_settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
  },
  {
    id: "accountant",
    name: "Accountant / Cashier",
    description: "Handles student fee collections, monthly fee matrix, waivers, payroll, and institution vouchers.",
    color: "text-teal-700 border-teal-200 bg-teal-50",
    badgeBg: "bg-teal-100 text-teal-800",
    isSystem: true,
    permissions: {
      student_info: { view: true, create: false, edit: false, delete: false, approve: false },
      results: { view: true, create: false, edit: false, delete: false, approve: false },
      fees: { view: true, create: true, edit: true, delete: true, approve: true },
      accountant: { view: true, create: true, edit: true, delete: false, approve: true },
      user_roles: { view: false, create: false, edit: false, delete: false, approve: false },
      sms_notice: { view: true, create: true, edit: false, delete: false, approve: false },
      system_settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
  },
  {
    id: "data_operator",
    name: "Data Entry Operator",
    description: "Enrolls new students, prints ID cards, manages seat plans and enters profile bio-data.",
    color: "text-slate-700 border-slate-200 bg-slate-50",
    badgeBg: "bg-slate-100 text-slate-800",
    isSystem: true,
    permissions: {
      student_info: { view: true, create: true, edit: true, delete: false, approve: false },
      results: { view: true, create: false, edit: false, delete: false, approve: false },
      fees: { view: true, create: false, edit: false, delete: false, approve: false },
      accountant: { view: false, create: false, edit: false, delete: false, approve: false },
      user_roles: { view: false, create: false, edit: false, delete: false, approve: false },
      sms_notice: { view: false, create: false, edit: false, delete: false, approve: false },
      system_settings: { view: true, create: false, edit: false, delete: false, approve: false },
    },
  },
  {
    id: "student_guardian",
    name: "Student / Guardian",
    description: "Read-only access to academic profile, published report cards, fee ledger, and institute notices.",
    color: "text-sky-700 border-sky-200 bg-sky-50",
    badgeBg: "bg-sky-100 text-sky-800",
    isSystem: true,
    permissions: {
      student_info: { view: true, create: false, edit: false, delete: false, approve: false },
      results: { view: true, create: false, edit: false, delete: false, approve: false },
      fees: { view: true, create: false, edit: false, delete: false, approve: false },
      accountant: { view: false, create: false, edit: false, delete: false, approve: false },
      user_roles: { view: false, create: false, edit: false, delete: false, approve: false },
      sms_notice: { view: true, create: false, edit: false, delete: false, approve: false },
      system_settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
  },
];

export function getDefaultModulesForRole(roleId: string, roles: Role[] = DEFAULT_ROLES): string[] {
  const role = roles.find((r) => r.id === roleId);
  if (!role) return [];
  const keys: string[] = [];
  for (const m of MODULE_KEYS) {
    if (role.permissions[m.key as keyof typeof role.permissions]?.view) {
      keys.push(m.key);
    }
  }
  return keys;
}

export function getUserAccessibleModules(user: UserAccount, roles: Role[] = DEFAULT_ROLES): string[] {
  if (Array.isArray(user.accessibleModules) && user.accessibleModules.length > 0) {
    return user.accessibleModules;
  }
  return getDefaultModulesForRole(user.roleId, roles);
}

// Pre-seeded User Accounts
export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "usr-01",
    name: "Prof. Md. Rafiqul Islam",
    username: "PRIN-001",
    email: "principal@dhakaschool.edu.bd",
    phone: "01711-234567",
    roleId: "principal",
    designation: "Principal & Headmaster",
    department: "Executive Administration",
    status: "ACTIVE",
    twoFactorEnabled: true,
    lastLogin: "Today at 08:45 AM",
    avatarBg: "bg-blue-600",
    createdAt: "2026-01-10",
    accessibleModules: ["student_info", "results", "fees", "accountant", "user_roles", "sms_notice", "system_settings"],
  },
  {
    id: "usr-02",
    name: "Mrs. Shamima Nasrin",
    username: "EXAM-101",
    email: "exam.shamima@dhakaschool.edu.bd",
    phone: "01819-876543",
    roleId: "exam_controller",
    designation: "Chief Exam Controller",
    department: "Examination Committee",
    status: "ACTIVE",
    twoFactorEnabled: true,
    lastLogin: "Yesterday at 04:20 PM",
    avatarBg: "bg-emerald-600",
    createdAt: "2026-01-15",
    accessibleModules: ["student_info", "results", "sms_notice", "system_settings"],
  },
  {
    id: "usr-03",
    name: "Kamal Hossain",
    username: "TCH-201",
    email: "kamal.math@dhakaschool.edu.bd",
    phone: "01912-345678",
    roleId: "subject_teacher",
    designation: "Senior Teacher (Mathematics)",
    department: "Science Department",
    status: "ACTIVE",
    twoFactorEnabled: false,
    lastLogin: "Today at 09:12 AM",
    avatarBg: "bg-amber-600",
    createdAt: "2026-01-20",
    accessibleModules: ["student_info", "results", "sms_notice"],
  },
  {
    id: "usr-04",
    name: "Farhana Sultana",
    username: "TCH-202",
    email: "farhana.physics@dhakaschool.edu.bd",
    phone: "01611-987654",
    roleId: "subject_teacher",
    designation: "Assistant Teacher (Physics)",
    department: "Science Department",
    status: "ACTIVE",
    twoFactorEnabled: false,
    lastLogin: "2 days ago",
    avatarBg: "bg-pink-600",
    createdAt: "2026-02-01",
    accessibleModules: ["student_info", "results", "sms_notice"],
  },
  {
    id: "usr-05",
    name: "Kazi Mahmudur Rahman",
    username: "ACC-301",
    email: "accounts@dhakaschool.edu.bd",
    phone: "01515-456789",
    roleId: "accountant",
    designation: "Senior Head Accountant",
    department: "Accounts & Finance",
    status: "ACTIVE",
    twoFactorEnabled: true,
    lastLogin: "Today at 10:02 AM",
    avatarBg: "bg-teal-600",
    createdAt: "2026-01-05",
    accessibleModules: ["student_info", "fees", "accountant", "sms_notice"],
  },
  {
    id: "usr-06",
    name: "Tanvir Hasan",
    username: "OPER-401",
    email: "operator.tanvir@dhakaschool.edu.bd",
    phone: "01722-334455",
    roleId: "data_operator",
    designation: "IT & Data Entry Specialist",
    department: "IT & Student Section",
    status: "ACTIVE",
    twoFactorEnabled: false,
    lastLogin: "3 days ago",
    avatarBg: "bg-slate-700",
    createdAt: "2026-01-25",
    accessibleModules: ["student_info", "results", "fees", "system_settings"],
  },
  {
    id: "usr-07",
    name: "System Administrator",
    username: "ADMIN-ROOT",
    email: "admin@system.local",
    phone: "01700-000000",
    roleId: "super_admin",
    designation: "Chief System Administrator",
    department: "Central IT",
    status: "ACTIVE",
    twoFactorEnabled: true,
    lastLogin: "Just now",
    avatarBg: "bg-purple-700",
    createdAt: "2026-01-01",
    accessibleModules: ["student_info", "results", "fees", "accountant", "user_roles", "sms_notice", "system_settings"],
  },
];

// Pre-seeded Teacher Delegations
export const DEFAULT_DELEGATIONS: TeacherDelegation[] = [
  {
    id: "del-01",
    userId: "usr-03",
    userName: "Kamal Hossain",
    designation: "Senior Teacher (Mathematics)",
    className: "Class 10",
    sectionName: "Section A",
    subjectName: "Higher Mathematics",
    accessLevel: "MARK_ENTRY",
    assignedDate: "2026-01-10",
  },
  {
    id: "del-02",
    userId: "usr-03",
    userName: "Kamal Hossain",
    designation: "Senior Teacher (Mathematics)",
    className: "Class 9",
    sectionName: "Section B",
    subjectName: "General Mathematics",
    accessLevel: "MARK_ENTRY",
    assignedDate: "2026-01-10",
  },
  {
    id: "del-03",
    userId: "usr-04",
    userName: "Farhana Sultana",
    designation: "Assistant Teacher (Physics)",
    className: "Class 10",
    sectionName: "Section A",
    subjectName: "Physics",
    accessLevel: "MARK_ENTRY",
    assignedDate: "2026-01-12",
  },
  {
    id: "del-04",
    userId: "usr-04",
    userName: "Farhana Sultana",
    designation: "Assistant Teacher (Physics)",
    className: "Class 8",
    sectionName: "Section A",
    subjectName: "General Science",
    accessLevel: "VIEW_ONLY",
    assignedDate: "2026-01-15",
  },
];

// Pre-seeded Audit Logs
export const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-1",
    timestamp: "2026-10-09 10:14 AM",
    userName: "System Administrator",
    action: "ROLE_PERMISSION_UPDATED",
    category: "PERMISSION",
    details: "Super Admin updated permissions for role 'Accountant / Cashier' (Granted fee voucher override).",
    ipAddress: "192.168.1.10",
    severity: "WARNING",
  },
  {
    id: "log-2",
    timestamp: "2026-10-09 09:30 AM",
    userName: "Kazi Mahmudur Rahman",
    action: "FEE_WAIVER_APPLIED",
    category: "SECURITY",
    details: "Applied 50% Merit Scholarship waiver for student ID 20261001.",
    ipAddress: "192.168.1.24",
    severity: "INFO",
  },
  {
    id: "log-3",
    timestamp: "2026-10-08 04:15 PM",
    userName: "Mrs. Shamima Nasrin",
    action: "EXAM_MARKS_LOCKDOWN",
    category: "SECURITY",
    details: "Locked marks input sheet for Half-Yearly 2026 Class 10 Science section.",
    ipAddress: "192.168.1.18",
    severity: "CRITICAL",
  },
  {
    id: "log-4",
    timestamp: "2026-10-08 11:20 AM",
    userName: "Prof. Md. Rafiqul Islam",
    action: "TEACHER_SCOPE_DELEGATED",
    category: "DELEGATION",
    details: "Assigned Kamal Hossain to Class 10 Section A Higher Mathematics mark entry.",
    ipAddress: "192.168.1.12",
    severity: "INFO",
  },
  {
    id: "log-5",
    timestamp: "2026-10-07 02:40 PM",
    userName: "System Administrator",
    action: "USER_ACCOUNT_CREATED",
    category: "USER_MANAGEMENT",
    details: "Created user account for Tanvir Hasan (OPER-401) with role 'Data Entry Operator'.",
    ipAddress: "192.168.1.10",
    severity: "INFO",
  },
];

import { getScopedStorageKey, getActiveTenantCode } from "@/lib/clientTenant";

// LocalStorage Keys (Base)
const ROLES_KEY = "nctb_user_roles_v1";
const USERS_KEY = "nctb_user_accounts_v1";
const DELEGATIONS_KEY = "nctb_teacher_delegations_v1";
const AUDIT_LOGS_KEY = "nctb_user_audit_logs_v1";

// Helper event dispatcher for reactive UI updates across components
function notifyStoreUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nctb_user_roles_updated"));
  }
}

// Generate default initial user accounts for any institution
export function getInitialUsersForInstitution(instCode: string): UserAccount[] {
  if (instCode === "108254") {
    return DEFAULT_USERS;
  }
  return [
    {
      id: `usr-${instCode}-01`,
      username: `admin_${instCode}`,
      name: "Head of Institution / Principal",
      email: `principal.${instCode}@school.edu.bd`,
      phone: "+880 1711-000000",
      roleId: "super_admin",
      status: "ACTIVE",
      createdAt: "2026-01-01",
      lastLogin: "Today, 09:30 AM",
      twoFactorEnabled: true,
      avatarBg: "bg-purple-600",
      designation: "Principal & Head of Institute",
      department: "Administration",
      accessibleModules: MODULE_KEYS.map((m) => m.key),
    },
    {
      id: `usr-${instCode}-02`,
      username: `vp_${instCode}`,
      name: "Vice Principal & Academic Lead",
      email: `vp.${instCode}@school.edu.bd`,
      phone: "+880 1812-000000",
      roleId: "academic_admin",
      status: "ACTIVE",
      createdAt: "2026-01-10",
      lastLogin: "Yesterday, 04:15 PM",
      twoFactorEnabled: false,
      avatarBg: "bg-blue-600",
      designation: "Vice Principal",
      department: "Academic Council",
      accessibleModules: getDefaultModulesForRole("academic_admin"),
    },
    {
      id: `usr-${instCode}-03`,
      username: `exam_${instCode}`,
      name: "Examination Committee Convener",
      email: `exam.${instCode}@school.edu.bd`,
      phone: "+880 1913-000000",
      roleId: "exam_controller",
      status: "ACTIVE",
      createdAt: "2026-01-15",
      lastLogin: "2 days ago",
      twoFactorEnabled: true,
      avatarBg: "bg-emerald-600",
      designation: "Exam Controller",
      department: "Evaluation Cell",
      accessibleModules: getDefaultModulesForRole("exam_controller"),
    },
    {
      id: `usr-${instCode}-04`,
      username: `teacher_${instCode}`,
      name: "Senior Subject Teacher",
      email: `teacher.${instCode}@school.edu.bd`,
      phone: "+880 1614-000000",
      roleId: "subject_teacher",
      status: "ACTIVE",
      createdAt: "2026-02-01",
      lastLogin: "Today, 11:10 AM",
      twoFactorEnabled: false,
      avatarBg: "bg-amber-600",
      designation: "Assistant Teacher",
      department: "Science Department",
      accessibleModules: getDefaultModulesForRole("subject_teacher"),
    },
  ];
}

// Roles Store
export function getStoredRoles(instCode?: string): Role[] {
  if (typeof window === "undefined") return DEFAULT_ROLES;
  try {
    const key = getScopedStorageKey(ROLES_KEY, instCode);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const code = instCode || getActiveTenantCode();
      const legacy = localStorage.getItem(ROLES_KEY);
      if (code === "108254" && legacy) {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      }
      localStorage.setItem(key, JSON.stringify(DEFAULT_ROLES));
      return DEFAULT_ROLES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ROLES;
  }
}

export function saveRoles(roles: Role[], instCode?: string): void {
  if (typeof window === "undefined") return;
  const key = getScopedStorageKey(ROLES_KEY, instCode);
  localStorage.setItem(key, JSON.stringify(roles));
  notifyStoreUpdate();
}

// Users Store
export function getStoredUsers(instCode?: string): UserAccount[] {
  const code = instCode || getActiveTenantCode();
  const defaultList = getInitialUsersForInstitution(code);
  if (typeof window === "undefined") return defaultList;
  try {
    const key = getScopedStorageKey(USERS_KEY, code);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const legacy = localStorage.getItem(USERS_KEY);
      if (code === "108254" && legacy) {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      }
      localStorage.setItem(key, JSON.stringify(defaultList));
      return defaultList;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((u: UserAccount) => ({
        ...u,
        accessibleModules:
          Array.isArray(u.accessibleModules) && u.accessibleModules.length > 0
            ? u.accessibleModules
            : getDefaultModulesForRole(u.roleId),
      }));
    }
    return defaultList;
  } catch {
    return defaultList;
  }
}

export function saveUsers(users: UserAccount[], instCode?: string): void {
  if (typeof window === "undefined") return;
  const key = getScopedStorageKey(USERS_KEY, instCode);
  localStorage.setItem(key, JSON.stringify(users));
  notifyStoreUpdate();
}

// Teacher Delegations Store
export function getStoredDelegations(instCode?: string): TeacherDelegation[] {
  const code = instCode || getActiveTenantCode();
  const defaultList = code === "108254" ? DEFAULT_DELEGATIONS : [];
  if (typeof window === "undefined") return defaultList;
  try {
    const key = getScopedStorageKey(DELEGATIONS_KEY, code);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const legacy = localStorage.getItem(DELEGATIONS_KEY);
      if (code === "108254" && legacy) {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      }
      localStorage.setItem(key, JSON.stringify(defaultList));
      return defaultList;
    }
    return JSON.parse(raw);
  } catch {
    return defaultList;
  }
}

export function saveDelegations(delegations: TeacherDelegation[], instCode?: string): void {
  if (typeof window === "undefined") return;
  const key = getScopedStorageKey(DELEGATIONS_KEY, instCode);
  localStorage.setItem(key, JSON.stringify(delegations));
  notifyStoreUpdate();
}

// Audit Logs Store
export function getStoredAuditLogs(instCode?: string): AuditLogEntry[] {
  const code = instCode || getActiveTenantCode();
  const defaultList = code === "108254" ? DEFAULT_AUDIT_LOGS : [];
  if (typeof window === "undefined") return defaultList;
  try {
    const key = getScopedStorageKey(AUDIT_LOGS_KEY, code);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const legacy = localStorage.getItem(AUDIT_LOGS_KEY);
      if (code === "108254" && legacy) {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      }
      localStorage.setItem(key, JSON.stringify(defaultList));
      return defaultList;
    }
    return JSON.parse(raw);
  } catch {
    return defaultList;
  }
}

export function saveAuditLogs(logs: AuditLogEntry[], instCode?: string): void {
  if (typeof window === "undefined") return;
  const key = getScopedStorageKey(AUDIT_LOGS_KEY, instCode);
  localStorage.setItem(key, JSON.stringify(logs));
  notifyStoreUpdate();
}

export function addAuditLog(
  userName: string,
  action: string,
  category: "SECURITY" | "USER_MANAGEMENT" | "PERMISSION" | "DELEGATION",
  details: string,
  severity: "INFO" | "WARNING" | "CRITICAL" = "INFO"
) {
  const currentLogs = getStoredAuditLogs();
  const newLog: AuditLogEntry = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    userName,
    action,
    category,
    details,
    ipAddress: "127.0.0.1 (Localhost)",
    severity,
  };
  saveAuditLogs([newLog, ...currentLogs]);
}
