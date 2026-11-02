export interface Exam {
  id: string;
  institutionId?: string;
  academicYearId: string;
  classId: string;
  gradingSystemId: string;
  name: string;
  termCode?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ExamSubjectConfig {
  id: string;
  examId: string;
  subjectId: string;
  groupType: string;
  totalFullMarks: number;
  passMode: string;
  aggregatePassMark: number;
  creditWeight: number;
}

export interface AssessmentComponent {
  id: string;
  examSubjectConfigId: string;
  componentName: string;
  fullMarks: number;
  passMarks: number;
  isMandatoryPass: boolean;
}

export interface StudentMark {
  id: string;
  examId: string;
  enrollmentId: string;
  subjectId: string;
  isAbsent: boolean;
  isOverride: boolean;
}

export interface ProcessedStudentResult {
  id: string;
  examId: string;
  enrollmentId: string;
  totalObtainedMarks: number;
  gpaWithoutFourth: number;
  fourthSubjectBonusPoints: number;
  finalGpa: number;
  finalLetterGrade: string;
  isPassed: boolean;
  totalFailedSubjects: number;
  meritRankClass?: number | null;
  meritRankSection?: number | null;
}
