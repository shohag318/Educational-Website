import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SMS_TEMPLATE, renderSmsTemplate, dispatchBatchSMS } from "@/lib/sms/sms-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId, customTemplate, classId, sectionId, shift, groupType } = body;

    if (!examId) {
      return NextResponse.json({ success: false, error: "examId is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { institution: true },
    });

    if (!exam) throw new Error("Exam not found");

    const whereEnrollment: any = {};
    if (classId) whereEnrollment.classId = classId;
    if (sectionId) whereEnrollment.sectionId = sectionId;
    if (groupType && groupType !== "ALL") whereEnrollment.groupType = groupType;
    if (shift && shift !== "ALL") whereEnrollment.section = { shift: shift.toUpperCase() };

    // Fetch processed results with guardian contacts
    const results = await prisma.processedStudentResult.findMany({
      where: {
        examId,
        ...(Object.keys(whereEnrollment).length > 0 ? { enrollment: whereEnrollment } : {}),
      },
      include: {
        enrollment: {
          include: { student: true, section: true },
        },
      },
    });

    if (results.length === 0) {
      throw new Error("No processed results found for the selected filter criteria.");
    }

    const template = customTemplate || DEFAULT_SMS_TEMPLATE;
    const messagesToDispatch = results.map((r) => {
      const bodyText = renderSmsTemplate(template, {
        recipientPhone: r.enrollment.student.guardianPhone,
        studentName: `${r.enrollment.student.firstName} ${r.enrollment.student.lastName}`,
        classRoll: r.enrollment.classRoll,
        examName: exam.name,
        gpa: r.finalGpa,
        grade: r.finalLetterGrade,
        isPassed: r.isPassed,
        institutionName: exam.institution.name,
      });

      return {
        enrollmentId: r.enrollmentId,
        phone: r.enrollment.student.guardianPhone,
        body: bodyText,
      };
    });

    // Dispatch via SMS Adapter
    const dispatchResults = await dispatchBatchSMS(
      messagesToDispatch.map((m) => ({ phone: m.phone, body: m.body })),
      "MOCK",
      exam.institution.smsApiKey ?? undefined,
      exam.institution.smsSenderId ?? undefined
    );

    // Save Logs
    for (let i = 0; i < messagesToDispatch.length; i++) {
      const msg = messagesToDispatch[i];
      const disp = dispatchResults[i];

      await prisma.smsLog.create({
        data: {
          institutionId: exam.institutionId,
          examId,
          enrollmentId: msg.enrollmentId,
          recipientPhone: msg.phone,
          messageBody: msg.body,
          status: disp?.status ?? "SENT",
          gatewayResponse: disp?.response ?? "OK",
          sentAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: messagesToDispatch.length,
      sampleMessage: messagesToDispatch[0]?.body,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const shift = searchParams.get("shift");
    const groupType = searchParams.get("groupType") || searchParams.get("group");

    const whereClause: any = {};
    if (examId) whereClause.examId = examId;

    const whereEnrollment: any = {};
    if (classId) whereEnrollment.classId = classId;
    if (sectionId) whereEnrollment.sectionId = sectionId;
    if (groupType && groupType !== "ALL") whereEnrollment.groupType = groupType;
    if (shift && shift !== "ALL") whereEnrollment.section = { shift: shift.toUpperCase() };

    if (Object.keys(whereEnrollment).length > 0) {
      whereClause.enrollment = whereEnrollment;
    }

    const logs = await prisma.smsLog.findMany({
      where: whereClause,
      include: {
        enrollment: {
          include: { student: true, section: true },
        },
      },
      orderBy: { sentAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
