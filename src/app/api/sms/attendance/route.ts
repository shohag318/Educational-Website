import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchBatchSMS, formatBangladeshiPhone } from "@/lib/sms/sms-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      provider = "MOCK",
      apiKey,
      senderId = "DHAKA_IDEAL",
      campaignType = "ATTENDANCE_NOTICE",
      className = "Class",
      sectionName = "Section",
      messages,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Recipient messages array is required and cannot be empty." },
        { status: 400 }
      );
    }

    // Filter valid phone numbers
    const validMessages = messages.filter((m: any) => m.phone && m.phone.trim().length >= 8);

    if (validMessages.length === 0) {
      return NextResponse.json(
        { success: false, error: "None of the recipients have valid phone numbers." },
        { status: 400 }
      );
    }

    // Dispatch via SMS service adapter
    const dispatchPayload = validMessages.map((m: any) => ({
      phone: m.phone,
      body: m.body,
    }));

    const dispatchResults = await dispatchBatchSMS(
      dispatchPayload,
      provider as "MOCK" | "SSL_WIRELESS" | "GREENWEB",
      apiKey,
      senderId
    );

    const logEntry = {
      id: `att-sms-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      campaignType,
      className,
      sectionName,
      recipientCount: validMessages.length,
      sampleMessage: validMessages[0]?.body || "",
      provider,
      senderId,
      status: "SENT",
      recipients: validMessages.map((m: any, idx: number) => ({
        studentName: m.studentName,
        roll: m.classRoll,
        phone: formatBangladeshiPhone(m.phone),
        status: dispatchResults[idx]?.status || "SENT",
        response: dispatchResults[idx]?.response || "OK",
      })),
    };

    return NextResponse.json({
      success: true,
      count: validMessages.length,
      skippedCount: messages.length - validMessages.length,
      log: logEntry,
      results: dispatchResults,
    });
  } catch (error: any) {
    console.error("Attendance SMS Dispatch Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch SMS" },
      { status: 500 }
    );
  }
}
