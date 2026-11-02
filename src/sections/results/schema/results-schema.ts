export interface ProcessResultValues {
  examId: string;
  classId?: string;
  sectionId?: string;
}

export function validateProcessResult(values: ProcessResultValues): string | null {
  if (!values.examId) return "Select an exam";
  return null;
}
