export interface ResultSmsValues {
  examId: string;
  classId?: string;
  template?: string;
}

export function validateResultSms(values: ResultSmsValues): string | null {
  if (!values.examId) return "Select an exam";
  return null;
}
