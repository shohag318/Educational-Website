"use client";

import { getStoredSchoolInfo } from "./settingsStore";
import { getScopedStorageKey, getActiveTenantCode } from "./clientTenant";

export type SignatureType =
  | "HEAD_OF_INSTITUTION"
  | "EXAM_CONTROLLER"
  | "CLASS_TEACHER"
  | "SUBJECT_TEACHER"
  | "VICE_PRINCIPAL"
  | "ACCOUNTS_OFFICER"
  | "GOVERNING_BODY_PRESIDENT"
  | "TABULATOR"
  | "GUARDIAN"
  | "CUSTOM";

export interface SignatureDocumentSettings {
  marksheet: boolean;
  tabulation: boolean;
  admitCard: boolean;
  seatPlan: boolean;
  idCard: boolean;
  certificate: boolean;
  feeReceipt: boolean;
}

export interface InstitutionalSignature {
  id: string;
  type: SignatureType;
  designation: string;
  designationBn?: string;
  name: string;
  department?: string;
  signatureUrl?: string; // Image file data or drawn svg/canvas data
  signatureStyle: "IMAGE" | "DRAWN" | "SCRIPT";
  scriptFont?: string; // Font family for generated handwritten script
  hasSeal: boolean;
  sealText?: string;
  isActive: boolean;
  displayOrder: number;
  documents: SignatureDocumentSettings;
  notes?: string;
  updatedAt: string;
}

export const SIGNATURES_STORAGE_KEY = "smart_academy_institutional_signatures";
export const SIGNATURES_UPDATED_EVENT = "institutional_signatures_updated";

export const SIGNATURE_TYPE_OPTIONS: { label: string; value: SignatureType; defaultDesignation: string; defaultBn: string }[] = [
  { label: "Head of Institution (Principal / Headmaster)", value: "HEAD_OF_INSTITUTION", defaultDesignation: "Principal", defaultBn: "অধ্যক্ষ" },
  { label: "Exam Controller (Convener)", value: "EXAM_CONTROLLER", defaultDesignation: "Controller of Examinations", defaultBn: "পরীক্ষা নিয়ন্ত্রক" },
  { label: "Class Teacher (Section In-Charge)", value: "CLASS_TEACHER", defaultDesignation: "Class Teacher", defaultBn: "শ্রেণি শিক্ষক" },
  { label: "Vice Principal / Asst. Headmaster", value: "VICE_PRINCIPAL", defaultDesignation: "Vice Principal", defaultBn: "উপাধ্যক্ষ" },
  { label: "Accounts Officer / Bursar", value: "ACCOUNTS_OFFICER", defaultDesignation: "Accounts Officer", defaultBn: "হিসাব কর্মকর্তা" },
  { label: "Chairman / Managing Committee President", value: "GOVERNING_BODY_PRESIDENT", defaultDesignation: "President, Managing Committee", defaultBn: "সভাপতি, পরিচালনা পরিষদ" },
  { label: "Result Tabulator / Scrutinizer", value: "TABULATOR", defaultDesignation: "Tabulator", defaultBn: "টেবুলেটর" },
  { label: "Subject Teacher / Evaluator", value: "SUBJECT_TEACHER", defaultDesignation: "Subject Teacher", defaultBn: "বিষয় শিক্ষক" },
  { label: "Parent / Guardian", value: "GUARDIAN", defaultDesignation: "Guardian's Signature", defaultBn: "অভিভাবকের স্বাক্ষর" },
  { label: "Custom Designation", value: "CUSTOM", defaultDesignation: "Authorized Officer", defaultBn: "অনুমোদিত কর্মকর্তা" },
];

export const SCRIPT_FONTS = [
  { id: "font_casual", name: "Modern Flow", fontClass: "font-serif italic font-semibold tracking-wider" },
  { id: "font_classic", name: "Classic Calligraphy", fontClass: "font-serif italic font-bold tracking-widest" },
  { id: "font_cursive", name: "Official Executive", fontClass: "font-sans italic font-bold tracking-tight" },
];

// SVG signature paths for realistic initial display
const SAMPLE_PRINCIPAL_SIG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 80' width='240' height='80'><path d='M20 55 C 35 25, 45 60, 60 30 C 70 15, 80 40, 95 35 C 110 30, 105 60, 130 38 C 150 20, 160 55, 180 32 C 195 20, 205 35, 220 30 M 30 65 Q 110 60 215 48' stroke='%231e293b' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>";
const SAMPLE_CONTROLLER_SIG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 80' width='240' height='80'><path d='M25 45 C 40 20, 50 65, 75 35 C 90 20, 95 50, 115 40 C 130 32, 145 60, 170 30 C 185 15, 195 45, 215 35 M 40 62 Q 130 52 200 48' stroke='%230f172a' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>";
const SAMPLE_TEACHER_SIG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 80' width='240' height='80'><path d='M30 40 C 45 25, 55 50, 75 35 C 90 25, 100 55, 120 40 C 135 30, 150 45, 180 35 M 45 58 Q 120 52 190 42' stroke='%231e293b' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>";
const SAMPLE_ACCOUNTS_SIG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 80' width='240' height='80'><path d='M35 50 C 50 25, 60 60, 85 35 C 105 20, 115 55, 140 38 C 160 25, 175 45, 205 32 M 50 64 Q 130 55 195 45' stroke='%231e293b' stroke-width='2.1' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>";

export function getDefaultSignatures(): InstitutionalSignature[] {
  let headName = "Prof. A. K. M. Shamsuddin";
  let headTitle = "Principal";
  let controllerName = "Mohammad Jahangir Hossain";
  let controllerTitle = "Exam Controller & Vice Principal";

  if (typeof window !== "undefined") {
    try {
      const schoolInfo = getStoredSchoolInfo();
      if (schoolInfo) {
        if (schoolInfo.headName) headName = schoolInfo.headName;
        if (schoolInfo.headTitle) headTitle = schoolInfo.headTitle;
        if (schoolInfo.controllerName) controllerName = schoolInfo.controllerName;
        if (schoolInfo.controllerTitle) controllerTitle = schoolInfo.controllerTitle;
      }
    } catch (e) {
      // ignore
    }
  }

  return [
    {
      id: "sig_head_01",
      type: "HEAD_OF_INSTITUTION",
      designation: headTitle || "Principal",
      designationBn: "অধ্যক্ষ",
      name: headName || "Prof. A. K. M. Shamsuddin",
      department: "Office of the Principal",
      signatureUrl: SAMPLE_PRINCIPAL_SIG,
      signatureStyle: "IMAGE",
      hasSeal: true,
      sealText: "OFFICE OF THE PRINCIPAL",
      isActive: true,
      displayOrder: 1,
      documents: {
        marksheet: true,
        tabulation: true,
        admitCard: true,
        seatPlan: false,
        idCard: true,
        certificate: true,
        feeReceipt: false,
      },
      notes: "Mandatory statutory signature on all academic transcripts and certificates.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sig_controller_02",
      type: "EXAM_CONTROLLER",
      designation: controllerTitle || "Controller of Examinations",
      designationBn: "পরীক্ষা নিয়ন্ত্রক",
      name: controllerName || "Mohammad Jahangir Hossain",
      department: "Exam Management Committee",
      signatureUrl: SAMPLE_CONTROLLER_SIG,
      signatureStyle: "IMAGE",
      hasSeal: true,
      sealText: "EXAMINATION COMMITTEE",
      isActive: true,
      displayOrder: 2,
      documents: {
        marksheet: true,
        tabulation: true,
        admitCard: true,
        seatPlan: true,
        idCard: false,
        certificate: false,
        feeReceipt: false,
      },
      notes: "Affixed on marksheets, admit cards, and final tabulation books.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sig_class_teacher_03",
      type: "CLASS_TEACHER",
      designation: "Class Teacher",
      designationBn: "শ্রেণি শিক্ষক",
      name: "Nasreen Sultana",
      department: "Senior Faculty & Section In-Charge",
      signatureUrl: SAMPLE_TEACHER_SIG,
      signatureStyle: "IMAGE",
      hasSeal: false,
      isActive: true,
      displayOrder: 3,
      documents: {
        marksheet: true,
        tabulation: true,
        admitCard: false,
        seatPlan: false,
        idCard: false,
        certificate: false,
        feeReceipt: false,
      },
      notes: "Appears on student terminal marksheets and progress report cards.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sig_accounts_04",
      type: "ACCOUNTS_OFFICER",
      designation: "Accounts Officer & Bursar",
      designationBn: "হিসাব কর্মকর্তা",
      name: "Faridur Rahman",
      department: "Accounts & Financial Wing",
      signatureUrl: SAMPLE_ACCOUNTS_SIG,
      signatureStyle: "IMAGE",
      hasSeal: true,
      sealText: "ACCOUNTS DEPARTMENT",
      isActive: true,
      displayOrder: 4,
      documents: {
        marksheet: false,
        tabulation: false,
        admitCard: false,
        seatPlan: false,
        idCard: false,
        certificate: false,
        feeReceipt: true,
      },
      notes: "Authorized cashier & bursar signature on fees receipts and payment vouchers.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sig_chairman_05",
      type: "GOVERNING_BODY_PRESIDENT",
      designation: "President, Managing Committee",
      designationBn: "সভাপতি, পরিচালনা পরিষদ",
      name: "Advocate M. A. Matin",
      department: "School Governing Body",
      signatureStyle: "SCRIPT",
      scriptFont: "font_classic",
      hasSeal: true,
      sealText: "PRESIDENT, GOVERNING BODY",
      isActive: true,
      displayOrder: 5,
      documents: {
        marksheet: false,
        tabulation: false,
        admitCard: false,
        seatPlan: false,
        idCard: false,
        certificate: true,
        feeReceipt: false,
      },
      notes: "Statutory countersignature on testimonials, character certificates & awards.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sig_tabulator_06",
      type: "TABULATOR",
      designation: "Result Scrutinizer & Tabulator",
      designationBn: "টেবুলেটর",
      name: "Md. Shahinur Alam",
      department: "Evaluation Committee",
      signatureStyle: "SCRIPT",
      scriptFont: "font_casual",
      hasSeal: false,
      isActive: true,
      displayOrder: 6,
      documents: {
        marksheet: false,
        tabulation: true,
        admitCard: false,
        seatPlan: false,
        idCard: false,
        certificate: false,
        feeReceipt: false,
      },
      notes: "Mandatory signature on Tabulation Sheet (NCTB Grade Register).",
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getStoredSignatures(instCode?: string): InstitutionalSignature[] {
  const code = instCode || getActiveTenantCode();
  if (typeof window === "undefined") {
    return getDefaultSignatures();
  }
  try {
    const key = getScopedStorageKey(SIGNATURES_STORAGE_KEY, code);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (code === "108254") {
        const legacy = localStorage.getItem(SIGNATURES_STORAGE_KEY);
        if (legacy) {
          localStorage.setItem(key, legacy);
          return JSON.parse(legacy);
        }
      }
      const defaults = getDefaultSignatures();
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getDefaultSignatures();
  } catch (err) {
    console.error("Error reading signatures from localStorage:", err);
    return getDefaultSignatures();
  }
}

export function saveStoredSignatures(signatures: InstitutionalSignature[], instCode?: string): void {
  if (typeof window === "undefined") return;
  const code = instCode || getActiveTenantCode();
  try {
    const key = getScopedStorageKey(SIGNATURES_STORAGE_KEY, code);
    localStorage.setItem(key, JSON.stringify(signatures));
    window.dispatchEvent(new CustomEvent(SIGNATURES_UPDATED_EVENT, { detail: signatures }));
  } catch (err) {
    console.error("Error saving signatures to localStorage:", err);
  }
}

export function updateSingleSignature(id: string, updates: Partial<InstitutionalSignature>, instCode?: string): void {
  const code = instCode || getActiveTenantCode();
  const current = getStoredSignatures(code);
  const updated = current.map((sig) => {
    if (sig.id === id) {
      return {
        ...sig,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    return sig;
  });
  saveStoredSignatures(updated, code);
}

export function addSignature(newSig: Omit<InstitutionalSignature, "id" | "updatedAt">, instCode?: string): InstitutionalSignature {
  const code = instCode || getActiveTenantCode();
  const current = getStoredSignatures(code);
  const created: InstitutionalSignature = {
    ...newSig,
    id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    updatedAt: new Date().toISOString(),
  };
  saveStoredSignatures([...current, created], code);
  return created;
}

export function deleteSignature(id: string, instCode?: string): void {
  const code = instCode || getActiveTenantCode();
  const current = getStoredSignatures(code);
  const filtered = current.filter((sig) => sig.id !== id);
  saveStoredSignatures(filtered, code);
}

export function resetSignaturesToDefault(instCode?: string): InstitutionalSignature[] {
  const code = instCode || getActiveTenantCode();
  const defaults = getDefaultSignatures();
  saveStoredSignatures(defaults, code);
  return defaults;
}
