import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const shift = searchParams.get("shift");
    const groupType = searchParams.get("groupType") || searchParams.get("group");

    if (!examId) {
      return NextResponse.json({ success: false, error: "examId is required" }, { status: 400 });
    }

    const whereEnrollment: any = {};
    if (classId) whereEnrollment.classId = classId;
    if (sectionId) whereEnrollment.sectionId = sectionId;
    if (shift && shift !== "ALL") {
      whereEnrollment.section = { shift: shift.toUpperCase() };
    }
    if (groupType && groupType !== "ALL") {
      whereEnrollment.groupType = groupType;
    }

    const results = await prisma.processedStudentResult.findMany({
      where: {
        examId,
        ...(Object.keys(whereEnrollment).length > 0 ? { enrollment: whereEnrollment } : {}),
      },
      include: {
        enrollment: {
          include: {
            student: true,
            class: true,
            section: true,
            academicYear: true,
          },
        },
        exam: {
          include: {
            institution: true,
            gradingSystem: {
              include: {
                slabs: { orderBy: { markMin: "desc" } },
              },
            },
            subjectConfigs: {
              include: { components: true },
            },
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
        { enrollment: { classRoll: "asc" } },
      ],
    });

    if (results.length === 0) {
      return NextResponse.json({ success: true, reportCards: [] });
    }

    const enrollmentIds = results.map((r) => r.enrollmentId);

    // Get raw component marks for detailed marksheet
    const rawMarks = await prisma.studentMark.findMany({
      where: {
        examId,
        enrollmentId: { in: enrollmentIds },
      },
      include: {
        components: {
          include: { component: true },
        },
      },
    });

    const marksMap = new Map<string, any>();
    for (const rm of rawMarks) {
      marksMap.set(`${rm.enrollmentId}_${rm.subjectId}`, rm);
    }

    const reportCards = results.map((result) => {
      const enhancedSubjects = result.subjectResults.map((sr) => {
        const raw = marksMap.get(`${result.enrollmentId}_${sr.subjectId}`);
        const components = raw?.components.map((c: any) => ({
          name: c.component.componentName,
          obtained: c.obtainedMarks,
          passMarks: c.component.passMarks,
          fullMarks: c.component.fullMarks,
        })) ?? [];

        return {
          ...sr,
          components,
        };
      });

      return {
        id: result.id,
        enrollmentId: result.enrollmentId,
        institution: result.exam.institution,
        exam: {
          name: result.exam.name,
          year: result.enrollment.academicYear.yearName,
          termCode: result.exam.termCode,
        },
        student: {
          idNo: result.enrollment.student.studentIdNo,
          name: `${result.enrollment.student.firstName} ${result.enrollment.student.lastName}`,
          roll: result.enrollment.classRoll,
          className: result.enrollment.class.name,
          sectionName: result.enrollment.section.name,
          shift: result.enrollment.section.shift === "MORNING" ? "Morning" : "Day",
          group: result.enrollment.groupType,
          guardianName: result.enrollment.student.guardianName,
        },
        gradingSystem: result.exam.gradingSystem,
        summary: {
          totalObtainedMarks: result.totalObtainedMarks,
          gpaWithoutFourth: result.gpaWithoutFourth,
          fourthBonus: result.fourthSubjectBonusPoints,
          finalGpa: result.finalGpa,
          finalGrade: result.finalLetterGrade,
          isPassed: result.isPassed,
          totalFailedSubjects: result.totalFailedSubjects,
          classRank: result.meritRankClass,
          sectionRank: result.meritRankSection,
        },
        subjects: enhancedSubjects,
      };
    });

    return NextResponse.json({
      success: true,
      reportCards,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
