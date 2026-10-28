"use client";

import { getScopedStorageKey, getActiveTenantCode } from "./clientTenant";

export interface TemplateComponent {
  componentName: string;
  fullMarks: string;
  passMarks: string;
  isMandatoryPass: boolean;
}

export interface SubjectAssessmentTemplate {
  id: string;
  name: string;
  description: string;
  category: "Standard 100M" | "Science & Practical" | "Language & Theory" | "50 Marks" | "Practical & Viva" | "Custom";
  totalFullMarks: string;
  passMode: "COMPONENT_WISE" | "AGGREGATE_ONLY" | "BOTH";
  aggregatePassMark: string;
  components: TemplateComponent[];
  isBuiltIn?: boolean;
  createdAt?: string;
}

export const TEMPLATE_STORAGE_KEY = "nctb_subject_assessment_templates_v1";

export const BUILT_IN_TEMPLATES: SubjectAssessmentTemplate[] = [
  {
    id: "nctb-standard-100",
    name: "NCTB Standard 100M (70 CQ + 30 MCQ)",
    description: "Standard general subjects (Bangla, Math, Social Science, Religion) with CQ 70 (pass 23) and MCQ 30 (pass 10).",
    category: "Standard 100M",
    totalFullMarks: "100",
    passMode: "COMPONENT_WISE",
    aggregatePassMark: "33",
    isBuiltIn: true,
    components: [
      { componentName: "CQ", fullMarks: "70", passMarks: "23", isMandatoryPass: true },
      { componentName: "MCQ", fullMarks: "30", passMarks: "10", isMandatoryPass: true },
    ],
  },
  {
    id: "nctb-science-practical-100",
    name: "Science with Practical 100M (50 CQ + 25 MCQ + 25 Practical)",
    description: "Standard Science subjects (Physics, Chemistry, Biology, Higher Math) with CQ 50 (pass 17), MCQ 25 (pass 8), Practical 25 (pass 8).",
    category: "Science & Practical",
    totalFullMarks: "100",
    passMode: "COMPONENT_WISE",
    aggregatePassMark: "33",
    isBuiltIn: true,
    components: [
      { componentName: "CQ", fullMarks: "50", passMarks: "17", isMandatoryPass: true },
      { componentName: "MCQ", fullMarks: "25", passMarks: "8", isMandatoryPass: true },
      { componentName: "PRACTICAL", fullMarks: "25", passMarks: "8", isMandatoryPass: true },
    ],
  },
  {
    id: "theory-only-100",
    name: "100M Theory Only (English / Single Paper)",
    description: "Pure written theory subjects with no separate MCQ (e.g. English 1st/2nd Paper, Literature) with 33 aggregate pass mark.",
    category: "Language & Theory",
    totalFullMarks: "100",
    passMode: "AGGREGATE_ONLY",
    aggregatePassMark: "33",
    isBuiltIn: true,
    components: [
      { componentName: "THEORY", fullMarks: "100", passMarks: "33", isMandatoryPass: true },
    ],
  },
  {
    id: "theory-ca-100",
    name: "100M: Written 80 + Continuous Assessment (CA) 20",
    description: "New Curriculum / School term structure: 80 marks written examination (pass 26) + 20 marks CA / class assessment (pass 7).",
    category: "Standard 100M",
    totalFullMarks: "100",
    passMode: "COMPONENT_WISE",
    aggregatePassMark: "33",
    isBuiltIn: true,
    components: [
      { componentName: "WRITTEN", fullMarks: "80", passMarks: "26", isMandatoryPass: true },
      { componentName: "CA", fullMarks: "20", passMarks: "7", isMandatoryPass: true },
    ],
  },
  {
    id: "cq-mcq-50",
    name: "50M: Half Paper (35 CQ + 15 MCQ)",
    description: "50-mark subjects (Religion, Agriculture, Home Science, or Junior half-papers) with CQ 35 (pass 12) and MCQ 15 (pass 5).",
    category: "50 Marks",
    totalFullMarks: "50",
    passMode: "COMPONENT_WISE",
    aggregatePassMark: "17",
    isBuiltIn: true,
    components: [
      { componentName: "CQ", fullMarks: "35", passMarks: "12", isMandatoryPass: true },
      { componentName: "MCQ", fullMarks: "15", passMarks: "5", isMandatoryPass: true },
    ],
  },
  {
    id: "ict-practical-50",
    name: "50M: ICT / Computer (25 CQ + 15 MCQ + 10 Practical)",
    description: "Information & Communication Technology (ICT 50M) with CQ 25 (pass 8), MCQ 15 (pass 5), and Practical 10 (pass 4).",
    category: "50 Marks",
    totalFullMarks: "50",
    passMode: "COMPONENT_WISE",
    aggregatePassMark: "17",
    isBuiltIn: true,
    components: [
      { componentName: "CQ", fullMarks: "25", passMarks: "8", isMandatoryPass: true },
      { componentName: "MCQ", fullMarks: "15", passMarks: "5", isMandatoryPass: true },
      { componentName: "PRACTICAL", fullMarks: "10", passMarks: "4", isMandatoryPass: true },
    ],
  },
  {
    id: "theory-only-50",
    name: "50M: Theory / Written Only",
    description: "50-mark single written exam with 17 aggregate pass mark.",
    category: "50 Marks",
    totalFullMarks: "50",
    passMode: "AGGREGATE_ONLY",
    aggregatePassMark: "17",
    isBuiltIn: true,
    components: [
      { componentName: "THEORY", fullMarks: "50", passMarks: "17", isMandatoryPass: true },
    ],
  },
  {
    id: "practical-viva-25",
    name: "25M: Practical / Lab / Viva Only",
    description: "Standalone 25-mark practical or oral/viva exam with 8 pass mark.",
    category: "Practical & Viva",
    totalFullMarks: "25",
    passMode: "AGGREGATE_ONLY",
    aggregatePassMark: "8",
    isBuiltIn: true,
    components: [
      { componentName: "PRACTICAL", fullMarks: "25", passMarks: "8", isMandatoryPass: true },
    ],
  },
];

export function getCustomTemplates(instCode?: string): SubjectAssessmentTemplate[] {
  if (typeof window === "undefined") return [];
  const code = instCode || getActiveTenantCode();
  try {
    const key = getScopedStorageKey(TEMPLATE_STORAGE_KEY, code);
    const raw = localStorage.getItem(key) || (code === "108254" ? localStorage.getItem(TEMPLATE_STORAGE_KEY) : null);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load custom assessment templates", e);
    return [];
  }
}

export function getAllTemplates(instCode?: string): SubjectAssessmentTemplate[] {
  const custom = getCustomTemplates(instCode);
  return [...BUILT_IN_TEMPLATES, ...custom];
}

export function saveCustomTemplate(template: Omit<SubjectAssessmentTemplate, "id" | "isBuiltIn" | "createdAt">, instCode?: string): SubjectAssessmentTemplate {
  const code = instCode || getActiveTenantCode();
  const existing = getCustomTemplates(code);
  const newTemplate: SubjectAssessmentTemplate = {
    ...template,
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    category: "Custom",
    isBuiltIn: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [newTemplate, ...existing];
  try {
    const key = getScopedStorageKey(TEMPLATE_STORAGE_KEY, code);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save custom template", e);
  }
  return newTemplate;
}

export function deleteCustomTemplate(id: string, instCode?: string): boolean {
  const code = instCode || getActiveTenantCode();
  const existing = getCustomTemplates(code);
  const updated = existing.filter((t) => t.id !== id);
  try {
    const key = getScopedStorageKey(TEMPLATE_STORAGE_KEY, code);
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error("Failed to delete custom template", e);
    return false;
  }
}
