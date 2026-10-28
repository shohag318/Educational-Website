"use client";

import { getScopedStorageKey, getActiveTenantCode } from "@/lib/clientTenant";

export interface IncomeEntry {
  id: string;
  voucherNo: string;
  title: string;
  category:
    | "STUDENT_TUITION"
    | "EXAM_ASSESSMENT"
    | "SESSION_DEVELOPMENT"
    | "LAB_PRACTICAL"
    | "ADMISSION_FORM"
    | "DONATION_GRANT"
    | "BANK_INTEREST"
    | "CANTEEN_RENT"
    | "OTHER";
  amount: number;
  date: string;
  paymentMethod: "Sonali Bank" | "Agrani Bank" | "bKash MFS" | "Nagad" | "Cash in Hand";
  referenceNo?: string;
  receivedBy?: string;
  remarks?: string;
  isAutoSynced?: boolean;
}

export interface ExpenseEntry {
  id: string;
  voucherNo: string;
  title: string;
  category:
    | "SALARY_PAYROLL"
    | "UTILITIES_ELECTRICITY"
    | "LAB_CONSUMABLES"
    | "EXAM_PRINTING"
    | "CAMPUS_MAINTENANCE"
    | "ICT_INFRASTRUCTURE"
    | "SPORTS_CULTURAL"
    | "SECURITY_CLEANING"
    | "MISC_OFFICE";
  amount: number;
  date: string;
  paymentMethod: "Sonali Bank Cheque" | "Agrani Bank EFT" | "Petty Cash" | "bKash Commercial";
  payee: string;
  approvedBy: string;
  referenceNo?: string;
  remarks?: string;
}

export interface PayrollRecord {
  id: string;
  empId: string;
  name: string;
  designation: string;
  department: "ACADEMIC" | "ADMINISTRATION" | "SUPPORT_STAFF";
  scaleGrade: string;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  conveyance: number;
  providentFundDeduction: number;
  welfareFundDeduction: number;
  netPayable: number;
  month: string;
  status: "PAID" | "PENDING";
  paymentDate?: string;
  paymentMethod?: string;
  bankAccountNo?: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  voucherNo: string;
  category: "INCOME" | "EXPENSE" | "PAYROLL" | "FEE_RECONCILIATION";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  auditor: string;
  verificationStatus: "VERIFIED" | "FLAGGED" | "PENDING";
  notes?: string;
}

// Storage Keys
export const ACCOUNTANT_INCOME_KEY = "nctb_acc_income_v1";
export const ACCOUNTANT_EXPENSE_KEY = "nctb_acc_expense_v1";
export const ACCOUNTANT_PAYROLL_KEY = "nctb_acc_payroll_v1";
export const ACCOUNTANT_AUDIT_KEY = "nctb_acc_audit_v1";

// Default Initial Incomes (Realistic School Revenue)
export const DEFAULT_INCOMES: IncomeEntry[] = [
  {
    id: "inc_001",
    voucherNo: "RV-2026-101",
    title: "October Student Monthly Tuition Collection",
    category: "STUDENT_TUITION",
    amount: 1450000,
    date: "2026-10-05",
    paymentMethod: "bKash MFS",
    referenceNo: "MFS-BULK-BATCH-1",
    receivedBy: "Accounts Officer",
    remarks: "Auto-synced from Student Fee Module collection records",
    isAutoSynced: true,
  },
  {
    id: "inc_002",
    voucherNo: "RV-2026-102",
    title: "Annual Session & Development Fund Collection",
    category: "SESSION_DEVELOPMENT",
    amount: 850000,
    date: "2026-10-04",
    paymentMethod: "Sonali Bank",
    referenceNo: "SB-DEP-49021",
    receivedBy: "Senior Cashier",
    remarks: "Annual infrastructure & library fund installment",
  },
  {
    id: "inc_003",
    voucherNo: "RV-2026-103",
    title: "Second Term Examination & Printing Fees",
    category: "EXAM_ASSESSMENT",
    amount: 420000,
    date: "2026-10-03",
    paymentMethod: "bKash MFS",
    referenceNo: "MFS-EXM-091",
    receivedBy: "Accounts Officer",
    remarks: "Question paper & answer scripts assessment fees",
  },
  {
    id: "inc_004",
    voucherNo: "RV-2026-104",
    title: "Science & ICT Lab Access Charges",
    category: "LAB_PRACTICAL",
    amount: 185000,
    date: "2026-10-02",
    paymentMethod: "Agrani Bank",
    referenceNo: "AB-TRF-102",
    receivedBy: "Lab Administrator",
    remarks: "Physics, Chem, Bio & Multimedia practical lab fees",
  },
  {
    id: "inc_005",
    voucherNo: "RV-2026-105",
    title: "SMC Education Quality Development Grant",
    category: "DONATION_GRANT",
    amount: 300000,
    date: "2026-10-01",
    paymentMethod: "Sonali Bank",
    referenceNo: "CHQ-SMC-992",
    receivedBy: "Headmaster & SMC",
    remarks: "Special matching grant approved by School Governing Body",
  },
  {
    id: "inc_006",
    voucherNo: "RV-2026-106",
    title: "Quarterly Bank Interest on Fixed & Current Deposit",
    category: "BANK_INTEREST",
    amount: 68500,
    date: "2026-09-30",
    paymentMethod: "Sonali Bank",
    referenceNo: "SB-INT-Q3",
    receivedBy: "Sonali Bank Main Branch",
    remarks: "Interest credit to institutional operational account",
  },
  {
    id: "inc_007",
    voucherNo: "RV-2026-107",
    title: "School Canteen & Stationery Corner Lease Rent",
    category: "CANTEEN_RENT",
    amount: 45000,
    date: "2026-10-01",
    paymentMethod: "Cash in Hand",
    referenceNo: "REC-CNTN-10",
    receivedBy: "Estate Manager",
    remarks: "Monthly lease rent for student cafeteria & stationery shop",
  },
];

// Default Initial Expenses (Operational Costs)
export const DEFAULT_EXPENSES: ExpenseEntry[] = [
  {
    id: "exp_001",
    voucherNo: "PV-2026-201",
    title: "October Teachers & Staff Net Salary Disbursement",
    category: "SALARY_PAYROLL",
    amount: 1120000,
    date: "2026-10-02",
    paymentMethod: "Sonali Bank Cheque",
    payee: "Faculty & Staff Payroll Account",
    approvedBy: "Headmaster & President SMC",
    referenceNo: "SB-CHQ-77821",
    remarks: "Monthly salary disbursement for 12 faculty & 4 support staff",
  },
  {
    id: "exp_002",
    voucherNo: "PV-2026-202",
    title: "Term Assessment Question Paper & Answer Booklet Printing",
    category: "EXAM_PRINTING",
    amount: 145000,
    date: "2026-10-04",
    paymentMethod: "Sonali Bank Cheque",
    payee: "Al-Noor Press & Publications Ltd.",
    approvedBy: "Exam Controller",
    referenceNo: "INV-ANP-883",
    remarks: "Confidential question paper printing & OMR sheets",
  },
  {
    id: "exp_003",
    voucherNo: "PV-2026-203",
    title: "Campus Electricity & Power Utilities (DESCO)",
    category: "UTILITIES_ELECTRICITY",
    amount: 78500,
    date: "2026-10-03",
    paymentMethod: "Agrani Bank EFT",
    payee: "Dhaka Electric Supply Company (DESCO)",
    approvedBy: "Administrative Officer",
    referenceNo: "BILL-DESCO-9921",
    remarks: "Monthly electricity bill for academic buildings & labs",
  },
  {
    id: "exp_004",
    voucherNo: "PV-2026-204",
    title: "Science Practical Lab Chemicals & Glassware Replenishment",
    category: "LAB_CONSUMABLES",
    amount: 62000,
    date: "2026-10-02",
    paymentMethod: "Petty Cash",
    payee: "National Scientific Store, Curzon Road",
    approvedBy: "Head of Science Dept.",
    referenceNo: "VOUCH-NSS-41",
    remarks: "Chemistry lab reagents and biology dissection specimens",
  },
  {
    id: "exp_005",
    voucherNo: "PV-2026-205",
    title: "ICT Computer Lab Broadband Fiber & Hardware Maintenance",
    category: "ICT_INFRASTRUCTURE",
    amount: 48000,
    date: "2026-10-01",
    paymentMethod: "bKash Commercial",
    payee: "ConnectBD Fiber Telecom",
    approvedBy: "ICT Lab In-charge",
    referenceNo: "TRX-CBD-550",
    remarks: "Dedicated 100 Mbps fiber line + router replacement",
  },
  {
    id: "exp_006",
    voucherNo: "PV-2026-206",
    title: "Campus Security, Sanitization & Facility Maintenance",
    category: "CAMPUS_MAINTENANCE",
    amount: 52000,
    date: "2026-09-30",
    paymentMethod: "Petty Cash",
    payee: "CleanCare Facility Services",
    approvedBy: "Estate Officer",
    referenceNo: "INV-CC-109",
    remarks: "Building deep sanitization and water tank chlorination",
  },
  {
    id: "exp_007",
    voucherNo: "PV-2026-207",
    title: "Inter-School Sports Meet & Milad Mahfil Arrangement",
    category: "SPORTS_CULTURAL",
    amount: 38000,
    date: "2026-09-28",
    paymentMethod: "Petty Cash",
    payee: "Olympic Sports & Decorator",
    approvedBy: "Physical Education Teacher",
    referenceNo: "VOUCH-OLY-22",
    remarks: "Badminton nets, footballs, sound system and tabarruk",
  },
];

// Default Initial Teacher & Staff Payroll Roster
export const DEFAULT_PAYROLL: PayrollRecord[] = [
  {
    id: "pay_001",
    empId: "EMP-101",
    name: "Dr. Rafiqul Islam",
    designation: "Headmaster / Principal",
    department: "ADMINISTRATION",
    scaleGrade: "Grade 6 (Principal)",
    basicSalary: 65000,
    houseRent: 26000,
    medicalAllowance: 2500,
    conveyance: 3000,
    providentFundDeduction: 6500,
    welfareFundDeduction: 1000,
    netPayable: 89000,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Sonali Bank Cheque",
    bankAccountNo: "SB-0021-99412",
  },
  {
    id: "pay_002",
    empId: "EMP-102",
    name: "Mohammad Shah Alam",
    designation: "Assistant Headmaster",
    department: "ADMINISTRATION",
    scaleGrade: "Grade 7 (Senior Admin)",
    basicSalary: 52000,
    houseRent: 20800,
    medicalAllowance: 2000,
    conveyance: 2500,
    providentFundDeduction: 5200,
    welfareFundDeduction: 800,
    netPayable: 71300,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Sonali Bank Cheque",
    bankAccountNo: "SB-0021-99413",
  },
  {
    id: "pay_003",
    empId: "EMP-103",
    name: "Mrs. Nasrin Sultana",
    designation: "Senior Teacher (Mathematics & Higher Math)",
    department: "ACADEMIC",
    scaleGrade: "Grade 9 (Senior Teacher)",
    basicSalary: 42000,
    houseRent: 16800,
    medicalAllowance: 1500,
    conveyance: 2000,
    providentFundDeduction: 4200,
    welfareFundDeduction: 600,
    netPayable: 57500,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Sonali Bank EFT",
    bankAccountNo: "SB-0021-99414",
  },
  {
    id: "pay_004",
    empId: "EMP-104",
    name: "Kazi Anwar Hossain",
    designation: "Senior Teacher (Physics & General Science)",
    department: "ACADEMIC",
    scaleGrade: "Grade 9 (Senior Teacher)",
    basicSalary: 42000,
    houseRent: 16800,
    medicalAllowance: 1500,
    conveyance: 2000,
    providentFundDeduction: 4200,
    welfareFundDeduction: 600,
    netPayable: 57500,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Sonali Bank EFT",
    bankAccountNo: "SB-0021-99415",
  },
  {
    id: "pay_005",
    empId: "EMP-105",
    name: "Afroza Begum",
    designation: "Senior Teacher (English Language & Literature)",
    department: "ACADEMIC",
    scaleGrade: "Grade 9 (Senior Teacher)",
    basicSalary: 42000,
    houseRent: 16800,
    medicalAllowance: 1500,
    conveyance: 2000,
    providentFundDeduction: 4200,
    welfareFundDeduction: 600,
    netPayable: 57500,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Sonali Bank EFT",
    bankAccountNo: "SB-0021-99416",
  },
  {
    id: "pay_006",
    empId: "EMP-106",
    name: "Md. Tariqul Islam",
    designation: "Teacher (Chemistry & Biology)",
    department: "ACADEMIC",
    scaleGrade: "Grade 10 (Teacher)",
    basicSalary: 35000,
    houseRent: 14000,
    medicalAllowance: 1500,
    conveyance: 1500,
    providentFundDeduction: 3500,
    welfareFundDeduction: 500,
    netPayable: 48000,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Sonali Bank EFT",
    bankAccountNo: "SB-0021-99417",
  },
  {
    id: "pay_007",
    empId: "EMP-107",
    name: "Shahnaz Parvin",
    designation: "Teacher (Bangla & Social Science)",
    department: "ACADEMIC",
    scaleGrade: "Grade 10 (Teacher)",
    basicSalary: 35000,
    houseRent: 14000,
    medicalAllowance: 1500,
    conveyance: 1500,
    providentFundDeduction: 3500,
    welfareFundDeduction: 500,
    netPayable: 48000,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Sonali Bank EFT",
    bankAccountNo: "SB-0021-99418",
  },
  {
    id: "pay_008",
    empId: "EMP-108",
    name: "Tanvir Ahmed",
    designation: "ICT Coordinator & Computer Lab In-charge",
    department: "ACADEMIC",
    scaleGrade: "Grade 10 (ICT Specialist)",
    basicSalary: 36000,
    houseRent: 14400,
    medicalAllowance: 1500,
    conveyance: 1500,
    providentFundDeduction: 3600,
    welfareFundDeduction: 500,
    netPayable: 49300,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Sonali Bank EFT",
    bankAccountNo: "SB-0021-99419",
  },
  {
    id: "pay_009",
    empId: "EMP-109",
    name: "Abdur Rahim",
    designation: "Senior Accountant & Bursar",
    department: "ADMINISTRATION",
    scaleGrade: "Grade 10 (Accounts Officer)",
    basicSalary: 36000,
    houseRent: 14400,
    medicalAllowance: 1500,
    conveyance: 1500,
    providentFundDeduction: 3600,
    welfareFundDeduction: 500,
    netPayable: 49300,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Sonali Bank EFT",
    bankAccountNo: "SB-0021-99420",
  },
  {
    id: "pay_010",
    empId: "EMP-110",
    name: "Fazlur Rahman",
    designation: "Head Clerk & Office Assistant",
    department: "ADMINISTRATION",
    scaleGrade: "Grade 14 (Clerk)",
    basicSalary: 22000,
    houseRent: 8800,
    medicalAllowance: 1200,
    conveyance: 1000,
    providentFundDeduction: 2200,
    welfareFundDeduction: 300,
    netPayable: 30500,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Sonali Bank EFT",
    bankAccountNo: "SB-0021-99421",
  },
  {
    id: "pay_011",
    empId: "EMP-111",
    name: "Delowar Hossain",
    designation: "Science Laboratory Assistant",
    department: "SUPPORT_STAFF",
    scaleGrade: "Grade 16 (Staff)",
    basicSalary: 18000,
    houseRent: 7200,
    medicalAllowance: 1000,
    conveyance: 1000,
    providentFundDeduction: 1800,
    welfareFundDeduction: 200,
    netPayable: 25200,
    month: "October 2026",
    status: "PAID",
    paymentDate: "2026-10-02",
    paymentMethod: "Cash in Hand",
    bankAccountNo: "N/A",
  },
  {
    id: "pay_012",
    empId: "EMP-112",
    name: "Abdul Mannan",
    designation: "Security Officer & Caretaker",
    department: "SUPPORT_STAFF",
    scaleGrade: "Grade 18 (Security)",
    basicSalary: 16000,
    houseRent: 6400,
    medicalAllowance: 1000,
    conveyance: 800,
    providentFundDeduction: 1600,
    welfareFundDeduction: 200,
    netPayable: 22400,
    month: "October 2026",
    status: "PENDING",
    paymentMethod: "Cash in Hand",
    bankAccountNo: "N/A",
  },
];

// Default Initial Audit Trail & Trial Balance Entries
export const DEFAULT_AUDIT_LOGS: AuditRecord[] = [
  {
    id: "aud_001",
    timestamp: "2026-10-05 16:45",
    voucherNo: "RV-2026-101",
    category: "FEE_RECONCILIATION",
    description: "Reconciled bKash Merchant collection with Student Tuition Ledger for October cycle",
    debit: 1450000,
    credit: 0,
    balance: 1450000,
    auditor: "Internal Auditor (SMC)",
    verificationStatus: "VERIFIED",
    notes: "Cross-checked with 580 cleared student invoice records",
  },
  {
    id: "aud_002",
    timestamp: "2026-10-04 14:10",
    voucherNo: "PV-2026-201",
    category: "PAYROLL",
    description: "Verified October staff payroll salary sheets, PF deductions, and bank transfer advice",
    debit: 0,
    credit: 1120000,
    balance: 330000,
    auditor: "Chartered Audit Team",
    verificationStatus: "VERIFIED",
    notes: "Authenticated against biometric attendance register and grade scales",
  },
  {
    id: "aud_003",
    timestamp: "2026-10-04 11:30",
    voucherNo: "PV-2026-202",
    category: "EXPENSE",
    description: "Inspection of Term Assessment Question Paper printing invoice & quotation comparative sheet",
    debit: 0,
    credit: 145000,
    balance: 185000,
    auditor: "Exam Moderation Committee",
    verificationStatus: "VERIFIED",
    notes: "Three tender quotations matched; lowest bidder accepted as per PPRA rules",
  },
  {
    id: "aud_004",
    timestamp: "2026-10-03 10:20",
    voucherNo: "RV-2026-102",
    category: "INCOME",
    description: "Audit of Annual Session and Infrastructure Development bank deposit slip",
    debit: 850000,
    credit: 0,
    balance: 1035000,
    auditor: "District Education Audit Board",
    verificationStatus: "VERIFIED",
    notes: "Sonali Bank deposit counter-foil reconciled with institutional bank passbook",
  },
  {
    id: "aud_005",
    timestamp: "2026-10-02 15:55",
    voucherNo: "VOUCH-PETTY-14",
    category: "EXPENSE",
    description: "Petty Cash physical verification and cash count at accountant vault",
    debit: 0,
    credit: 42000,
    balance: 993000,
    auditor: "Internal Auditor (SMC)",
    verificationStatus: "VERIFIED",
    notes: "Physical cash in safe ৳28,000 matches remaining imprest balance",
  },
];

// Helper Functions for Storage (Strictly Scoped by Institution)
export function getStoredIncomes(instCode?: string): IncomeEntry[] {
  if (typeof window === "undefined") return DEFAULT_INCOMES;
  try {
    const key = getScopedStorageKey(ACCOUNTANT_INCOME_KEY, instCode);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const code = instCode || getActiveTenantCode();
      const legacy = localStorage.getItem(ACCOUNTANT_INCOME_KEY);
      if (code === "108254" && legacy) {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      }
      const initial = code === "108254" ? DEFAULT_INCOMES : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredIncomes(items: IncomeEntry[], instCode?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getScopedStorageKey(ACCOUNTANT_INCOME_KEY, instCode);
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("nctb_accountant_updated"));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredExpenses(instCode?: string): ExpenseEntry[] {
  if (typeof window === "undefined") return DEFAULT_EXPENSES;
  try {
    const key = getScopedStorageKey(ACCOUNTANT_EXPENSE_KEY, instCode);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const code = instCode || getActiveTenantCode();
      const legacy = localStorage.getItem(ACCOUNTANT_EXPENSE_KEY);
      if (code === "108254" && legacy) {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      }
      const initial = code === "108254" ? DEFAULT_EXPENSES : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredExpenses(items: ExpenseEntry[], instCode?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getScopedStorageKey(ACCOUNTANT_EXPENSE_KEY, instCode);
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("nctb_accountant_updated"));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredPayroll(instCode?: string): PayrollRecord[] {
  if (typeof window === "undefined") return DEFAULT_PAYROLL;
  try {
    const key = getScopedStorageKey(ACCOUNTANT_PAYROLL_KEY, instCode);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const code = instCode || getActiveTenantCode();
      const legacy = localStorage.getItem(ACCOUNTANT_PAYROLL_KEY);
      if (code === "108254" && legacy) {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      }
      const initial = code === "108254" ? DEFAULT_PAYROLL : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredPayroll(items: PayrollRecord[], instCode?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getScopedStorageKey(ACCOUNTANT_PAYROLL_KEY, instCode);
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("nctb_accountant_updated"));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredAudit(instCode?: string): AuditRecord[] {
  if (typeof window === "undefined") return DEFAULT_AUDIT_LOGS;
  try {
    const key = getScopedStorageKey(ACCOUNTANT_AUDIT_KEY, instCode);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const code = instCode || getActiveTenantCode();
      const legacy = localStorage.getItem(ACCOUNTANT_AUDIT_KEY);
      if (code === "108254" && legacy) {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      }
      const initial = code === "108254" ? DEFAULT_AUDIT_LOGS : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredAudit(items: AuditRecord[], instCode?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getScopedStorageKey(ACCOUNTANT_AUDIT_KEY, instCode);
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("nctb_accountant_updated"));
  } catch (e) {
    console.error(e);
  }
}
