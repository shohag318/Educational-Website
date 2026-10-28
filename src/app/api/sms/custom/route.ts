import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchBatchSMS, formatBangladeshiPhone } from "@/lib/sms/sms-service";
import { getTenantInstitution } from "@/lib/serverTenant";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      recipients,
      campaignName = "Custom Guardian Broadcast",
      senderId = "SMARTACAD",
      provider = "MOCK",
      apiKey,
    } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "Recipients array is required and cannot be empty." },
        { status: 400 }
      );
    }

    // Filter recipients with valid phone numbers
    const validRecipients = recipients.filter(
      (r: any) => r.guardianPhone && String(r.guardianPhone).trim().length >= 8
    );

    if (validRecipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "None of the selected students have valid guardian phone numbers." },
        { status: 400 }
      );
    }

    const dispatchPayload = validRecipients.map((r: any) => ({
      phone: r.guardianPhone,
      body: r.messageBody,
    }));

    const dispatchResults = await dispatchBatchSMS(
      dispatchPayload,
      provider as "MOCK" | "SSL_WIRELESS" | "GREENWEB",
      apiKey,
      senderId
    );

    // Save Logs to Prisma database if possible
    try {
      const institution = await getTenantInstitution(req);
      const firstExam = await prisma.exam.findFirst({
        where: institution ? { institutionId: institution.id } : undefined,
      });
      const institutionId = institution?.id;
      const examId = firstExam?.id;

      if (institutionId && examId) {
        for (let i = 0; i < validRecipients.length; i++) {
          const rec = validRecipients[i];
          const disp = dispatchResults[i];

          if (rec.enrollmentId) {
            await prisma.smsLog.create({
              data: {
                institutionId,
                examId,
                enrollmentId: rec.enrollmentId,
                recipientPhone: formatBangladeshiPhone(rec.guardianPhone),
                messageBody: rec.messageBody,
                status: disp?.status ?? "SENT",
                gatewayResponse: disp?.response ?? "OK",
                sentAt: new Date(),
              },
            });
          }
        }
      }
    } catch (logErr) {
      console.warn("SMS database logging skipped or failed:", logErr);
    }

    const sentCount = dispatchResults.filter((r) => r.status === "SENT").length;
    const failedCount = dispatchResults.filter((r) => r.status === "FAILED").length;

    return NextResponse.json({
      success: true,
      totalCount: recipients.length,
      sentCount,
      failedCount,
      sampleMessage: validRecipients[0]?.messageBody,
      campaignName,
      dispatchResults,
    });
  } catch (error: any) {
    console.error("Custom SMS Dispatch Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
