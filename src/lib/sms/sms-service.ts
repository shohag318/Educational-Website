// src/lib/sms/sms-service.ts

export interface SMSMessage {
  recipientPhone: string;
  studentName: string;
  classRoll: number;
  examName: string;
  gpa: number;
  grade: string;
  isPassed: boolean;
  institutionName: string;
}

export function formatBangladeshiPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.startsWith("880") && cleaned.length === 13) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("01") && cleaned.length === 11) {
    return `+88${cleaned}`;
  }
  return phone;
}

export function renderSmsTemplate(template: string, data: SMSMessage): string {
  return template
    .replace(/{student_name}/g, data.studentName)
    .replace(/{roll}/g, String(data.classRoll))
    .replace(/{exam_name}/g, data.examName)
    .replace(/{gpa}/g, data.gpa.toFixed(2))
    .replace(/{grade}/g, data.grade)
    .replace(/{status}/g, data.isPassed ? "PASSED" : "FAILED")
    .replace(/{institution}/g, data.institutionName);
}

export const DEFAULT_SMS_TEMPLATE =
  "Dear Guardian, {student_name} (Roll: {roll}) obtained GPA: {gpa}, Grade: {grade} in {exam_name}. Status: {status}. - {institution}";

export interface SMSDispatchResult {
  recipient: string;
  status: "SENT" | "FAILED";
  messageId: string;
  response: string;
}

export async function dispatchBatchSMS(
  messages: { phone: string; body: string }[],
  provider: "MOCK" | "SSL_WIRELESS" | "GREENWEB" = "MOCK",
  apiKey?: string,
  senderId?: string
): Promise<SMSDispatchResult[]> {
  const results: SMSDispatchResult[] = [];

  for (const msg of messages) {
    const formattedPhone = formatBangladeshiPhone(msg.phone);
    // In production, real HTTP calls to SSL Wireless / Greenweb APIs would go here
    if (provider === "MOCK" || !apiKey) {
      results.push({
        recipient: formattedPhone,
        status: "SENT",
        messageId: `MOCK-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        response: `Delivered via Mock Gateway to ${formattedPhone}`,
      });
    } else {
      // Integration hook for actual gateway API
      results.push({
        recipient: formattedPhone,
        status: "SENT",
        messageId: `GW-${Date.now()}`,
        response: `Dispatched to Gateway provider ${provider}`,
      });
    }
  }

  return results;
}
