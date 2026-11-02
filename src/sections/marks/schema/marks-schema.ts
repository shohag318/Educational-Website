export interface MarkEntryValues {
  examId: string;
  classId: string;
  subjectId: string;
  enrollmentId: string;
  isAbsent: boolean;
  components: Record<string, number>;
}

export function validateMarkEntry(values: MarkEntryValues): string | null {
  if (!values.examId || !values.subjectId || !values.enrollmentId) return "Exam, subject and student are required";
  return null;
}
