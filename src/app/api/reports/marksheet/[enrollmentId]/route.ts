import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { enrollmentId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ success: false, error: "examId is required" }, { status: 400 });
    }

    const enrollmentId = params.enrollmentId;

    const result = await prisma.processedStudentResult.findUnique({
      where: {
        examId_enrollmentId: {
          examId,
          enrollmentId,
        },
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
    });

    if (!result) {
      return NextResponse.json({ success: false, error: "Result not found" }, { status: 404 });
    }

    // Also get raw component marks for detailed marksheet
    const rawMarks = await prisma.studentMark.findMany({
      where: {
        examId,
        enrollmentId,
      },
      include: {
        components: {
          include: { component: true },
        },
      },
    });

    const marksMap = new Map<string, any>();
    for (const rm of rawMarks) {
      marksMap.set(rm.subjectId, rm);
    }

    const enhancedSubjects = result.subjectResults.map((sr) => {
      const raw = marksMap.get(sr.subjectId);
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

    return NextResponse.json({
      success: true,
      reportCard: {
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
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
