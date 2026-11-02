export interface CustomSmsValues {
  message: string;
  classId?: string;
  sectionId?: string;
  phones?: string[];
}

export function validateCustomSms(values: CustomSmsValues): string | null {
  if (!values.message?.trim()) return "Message is required";
  if (values.message.length > 480) return "Message is too long";
  return null;
}
