import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const groupType = searchParams.get("groupType") || searchParams.get("group");
    const shift = searchParams.get("shift");

    if (!examId) {
      return NextResponse.json({ success: false, error: "examId is required" }, { status: 400 });
    }

    const whereEnrollment: any = {};
    if (classId) whereEnrollment.classId = classId;
    if (sectionId) whereEnrollment.sectionId = sectionId;
    if (groupType && groupType !== "ALL") whereEnrollment.groupType = groupType;
    if (shift && shift !== "ALL") whereEnrollment.section = { shift: shift.toUpperCase() };

    const whereClause: any = {
      isPassed: false,
      processedResult: {
        examId,
        ...(Object.keys(whereEnrollment).length > 0 ? { enrollment: whereEnrollment } : {}),
      },
    };

    if (subjectId) {
      whereClause.subjectId = subjectId;
    }

    const failedSubjects = await prisma.processedSubjectResult.findMany({
      where: whereClause,
      include: {
        subject: true,
        processedResult: {
          include: {
            enrollment: {
              include: {
                student: true,
                class: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: [
        { processedResult: { enrollment: { classRoll: "asc" } } },
        { subject: { subjectCode: "asc" } },
      ],
    });

    const formatted = failedSubjects.map((item) => ({
      enrollmentId: item.processedResult.enrollmentId,
      studentIdNo: item.processedResult.enrollment.student.studentIdNo,
      studentName: `${item.processedResult.enrollment.student.firstName} ${item.processedResult.enrollment.student.lastName}`,
      roll: item.processedResult.enrollment.classRoll,
      classId: item.processedResult.enrollment.classId,
      className: item.processedResult.enrollment.class.name,
      sectionId: item.processedResult.enrollment.sectionId,
      sectionName: item.processedResult.enrollment.section.name,
      sectionShift: item.processedResult.enrollment.section?.shift,
      groupType: item.processedResult.enrollment.groupType,
      phone: item.processedResult.enrollment.student.guardianPhone,
      subjectCode: item.subject.subjectCode,
      subjectName: item.subject.name,
      subjectType: item.subjectType,
      marks: item.totalObtainedMarks,
      letterGrade: item.letterGrade,
      failureReason: item.failureReason || "Marks below pass threshold",
    }));

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
