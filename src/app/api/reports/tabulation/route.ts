import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const sectionId = searchParams.get("sectionId");
    const groupType = searchParams.get("groupType") || searchParams.get("group");
    const shift = searchParams.get("shift");

    if (!examId) {
      return NextResponse.json({ success: false, error: "examId is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        academicYear: true,
        class: true,
        gradingSystem: { include: { slabs: { orderBy: { markMin: "desc" } } } },
        institution: true,
      },
    });

    if (!exam) throw new Error("Exam not found");

    const whereEnrollment: any = { classId: exam.classId };
    if (sectionId) whereEnrollment.sectionId = sectionId;
    if (groupType && groupType !== "ALL") whereEnrollment.groupType = groupType;
    if (shift && shift !== "ALL") {
      whereEnrollment.section = { shift: shift.toUpperCase() };
    }

    // Fetch processed results
    const results = await prisma.processedStudentResult.findMany({
      where: {
        examId,
        enrollment: whereEnrollment,
      },
      include: {
        enrollment: {
          include: {
            student: true,
            section: true,
          },
        },
        subjectResults: {
          include: {
            subject: true,
          },
          orderBy: {
            subject: { subjectCode: "asc" },
          },
        },
      },
      orderBy: [
        { isPassed: "desc" },
        { finalGpa: "desc" },
        { totalObtainedMarks: "desc" },
      ],
    });

    // Unique subjects list for table headers
    const subjects = await prisma.subject.findMany({
      where: {
        configs: {
          some: { examId },
        },
      },
      orderBy: { subjectCode: "asc" },
    });

    // Fetch combined subject rules for this exam
    const combinedRules = await prisma.combinedSubjectRule.findMany({
      where: { examId },
      include: {
        primarySubject: true,
        secondarySubject: true,
      },
    });

    return NextResponse.json({
      success: true,
      exam,
      subjects,
      combinedRules,
      tabulation: results.map((r) => ({
        id: r.id,
        enrollmentId: r.enrollmentId,
        studentIdNo: r.enrollment.student.studentIdNo,
        roll: r.enrollment.classRoll,
        studentName: `${r.enrollment.student.firstName} ${r.enrollment.student.lastName}`,
        sectionName: r.enrollment.section.name,
        sectionId: r.enrollment.sectionId,
        sectionShift: r.enrollment.section?.shift,
        groupType: r.enrollment.groupType,
        classId: exam.classId,
        className: exam.class.name,
        totalObtainedMarks: r.totalObtainedMarks,
        gpaWithoutFourth: r.gpaWithoutFourth,
        fourthBonus: r.fourthSubjectBonusPoints,
        finalGpa: r.finalGpa,
        finalGrade: r.finalLetterGrade,
        isPassed: r.isPassed,
        classRank: r.meritRankClass,
        sectionRank: r.meritRankSection,
        subjects: r.subjectResults.map((s) => ({
          subjectId: s.subjectId,
          subjectCode: s.subject.subjectCode,
          subjectName: s.subject.name,
          subjectType: s.subjectType,
          marks: s.totalObtainedMarks,
          grade: s.letterGrade,
          point: s.gradePoint,
          isPassed: s.isPassed,
          failureReason: s.failureReason,
          isCombined: s.isCombined,
          combinedMarks: s.combinedMarks,
          combinedPairSubjectId: s.combinedPairSubjectId,
        })),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
