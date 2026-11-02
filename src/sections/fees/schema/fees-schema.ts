export interface FeeHeadValues {
  name: string;
  amount: number;
  months: string[];
}

export interface WaiverFormValues {
  studentId: string;
  percent: number;
  reason: string;
}

export function validateWaiver(values: WaiverFormValues): string | null {
  if (!values.studentId) return "Select a student";
  if (values.percent < 0 || values.percent > 100) return "Waiver must be between 0 and 100";
  return null;
}
