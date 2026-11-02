import type { GroupType, ShiftType, SubjectType } from "./common";

export interface AcademicYear {
  id: string;
  institutionId?: string;
  yearName: string;
  isCurrent: boolean;
  startDate?: string;
  endDate?: string;
}

export interface AcademicClass {
  id: string;
  institutionId?: string;
  name: string;
  numericValue: number;
  shift?: ShiftType;
  sections?: ClassSection[];
}

export interface ClassSection {
  id: string;
  classId: string;
  name: string;
  groupType: GroupType;
  shift?: ShiftType;
  capacity?: number;
}

export interface Subject {
  id: string;
  institutionId?: string;
  subjectCode?: string | null;
  name: string;
}

export interface ClassSubjectMapping {
  id: string;
  classId: string;
  groupType: GroupType | string;
  subjectId: string;
  subjectType: SubjectType | string;
  creditWeight: number;
  subject?: Subject;
}

export interface GradeSlab {
  id: string;
  gradingSystemId: string;
  letterGrade: string;
  gradePoint: number;
  markMin: number;
  markMax: number;
  isFail: boolean;
  comments?: string | null;
}

export interface GradingSystem {
  id: string;
  institutionId?: string;
  name: string;
  maxGpa: number;
  fourthSubjectThreshold: number;
  passGpa: number;
  isDefault: boolean;
  slabs?: GradeSlab[];
}

export interface CombinedSubjectRule {
  id: string;
  examId: string;
  name?: string | null;
  primarySubjectId: string;
  secondarySubjectId: string;
  combinedPassMark: number;
  combinedFullMarks: number;
  passMode: string;
  gradeMode: string;
}

export interface AssessmentTemplateItem {
  id: string;
  templateId: string;
  subjectId: string;
  totalMarks: number;
  passMarks: number;
  cqMarks: number;
  mcqMarks: number;
  practicalMarks: number;
}

export interface AssessmentTemplate {
  id: string;
  institutionId: string;
  name: string;
  classId: string;
  description?: string | null;
  items?: AssessmentTemplateItem[];
}
