export interface ReportFilterValues {
  examId: string;
  classId?: string;
  sectionId?: string;
  groupType?: string;
}

export function validateReportFilter(values: ReportFilterValues): string | null {
  if (!values.examId) return "Select an exam";
  return null;
}
