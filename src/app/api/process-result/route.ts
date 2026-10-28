import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NCTBResultEngine, RawStudentMarkEntry, SubjectConfig, CombinedSubjectRuleConfig } from "@/lib/engine/nctb-engine";
import { calculateMeritRanks, StudentForRanking } from "@/lib/engine/merit-calculator";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId } = body;

    if (!examId) {
      return NextResponse.json({ success: false, error: "examId is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        gradingSystem: {
          include: { slabs: true },
        },
        subjectConfigs: {
          include: {
            components: true,
            subject: true,
          },
        },
        combinedRules: true,
      },
    });

    if (!exam) throw new Error("Exam not found");

    if (exam.status === "PUBLISHED") {
      throw new Error("Cannot reprocess a PUBLISHED exam without unpublishing.");
    }

    // 1. Prepare Subject Configs Map
    const configsMap = new Map<string, SubjectConfig>();
    for (const conf of exam.subjectConfigs) {
      configsMap.set(conf.subjectId, {
        subjectId: conf.subjectId,
        subjectCode: conf.subject.subjectCode || "",
        subjectName: conf.subject.name,
        passMode: conf.passMode as any,
        aggregatePassMark: conf.aggregatePassMark,
        totalFullMarks: conf.totalFullMarks,
        components: conf.components.map((c) => ({
          componentName: c.componentName,
          fullMarks: c.fullMarks,
          passMarks: c.passMarks,
          isMandatoryPass: c.isMandatoryPass,
        })),
      });
    }

    // 2. Prepare Engine
    const engine = new NCTBResultEngine(
      exam.gradingSystem.slabs.map((s) => ({
        letterGrade: s.letterGrade,
        gradePoint: s.gradePoint,
        markMin: s.markMin,
        markMax: s.markMax,
        isFail: s.isFail,
      })),
      exam.gradingSystem.fourthSubjectThreshold,
      exam.gradingSystem.maxGpa
    );

    // 3. Fetch all enrollments for this class
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId: exam.classId },
      include: {
        allocations: { include: { subject: true } },
        marks: {
          where: { examId },
          include: {
            components: { include: { component: true } },
            subject: true,
          },
        },
      },
    });

    const studentsForRanking: StudentForRanking[] = [];
    const calculatedStudentOutputs: any[] = [];

    // 4. Calculate each student
    for (const enr of enrollments) {
      const rawMarks: RawStudentMarkEntry[] = enr.allocations.map((alloc) => {
        const studentMark = enr.marks.find((m) => m.subjectId === alloc.subjectId);
        return {
          subjectId: alloc.subjectId,
          subjectCode: alloc.subject.subjectCode || "",
          subjectName: alloc.subject.name,
          subjectType: alloc.subjectType as any,
          isAbsent: studentMark?.isAbsent ?? false,
          components:
            studentMark?.components.map((c) => ({
              componentName: c.component.componentName,
              obtainedMarks: c.obtainedMarks,
            })) ?? [],
        };
      });

      const combinedRuleConfigs: CombinedSubjectRuleConfig[] = (exam.combinedRules || []).map((r) => ({
        id: r.id,
        name: r.name,
        primarySubjectId: r.primarySubjectId,
        secondarySubjectId: r.secondarySubjectId,
        combinedPassMark: r.combinedPassMark,
        combinedFullMarks: r.combinedFullMarks,
        passMode: r.passMode as any,
        gradeMode: r.gradeMode as any,
      }));

      const output = engine.processStudent(enr.id, rawMarks, configsMap, combinedRuleConfigs);
      calculatedStudentOutputs.push({
        enrollmentId: enr.id,
        classId: enr.classId,
        sectionId: enr.sectionId,
        classRoll: enr.classRoll,
        output,
      });

      studentsForRanking.push({
        enrollmentId: enr.id,
        classId: enr.classId,
        sectionId: enr.sectionId,
        classRoll: enr.classRoll,
        isPassed: output.isPassed,
        finalGpa: output.finalGpa,
        totalObtainedMarks: output.totalObtainedMarks,
      });
    }

    // 5. Calculate Merit Ranks
    const meritRanks = calculateMeritRanks(studentsForRanking);

    // 6. Delete previous processed results transactionally and re-insert
    await prisma.$transaction(
      async (tx) => {
        // Delete old records
        await tx.processedStudentResult.deleteMany({
          where: { examId },
        });

        for (const item of calculatedStudentOutputs) {
          const ranks = meritRanks.get(item.enrollmentId) ?? { classRank: 0, sectionRank: 0 };
          const out = item.output;

          await tx.processedStudentResult.create({
            data: {
              examId,
              enrollmentId: item.enrollmentId,
              totalObtainedMarks: out.totalObtainedMarks,
              gpaWithoutFourth: out.gpaWithoutFourth,
              fourthSubjectBonusPoints: out.fourthSubjectBonusPoints,
              finalGpa: out.finalGpa,
              finalLetterGrade: out.finalLetterGrade,
              isPassed: out.isPassed,
              totalFailedSubjects: out.totalFailedSubjects,
              meritRankClass: ranks.classRank,
              meritRankSection: ranks.sectionRank,
              subjectResults: {
                create: out.subjectResults.map((sub: any) => ({
                  subjectId: sub.subjectId,
                  subjectType: sub.subjectType,
                  totalObtainedMarks: sub.totalObtainedMarks,
                  letterGrade: sub.letterGrade,
                  gradePoint: sub.gradePoint,
                  isPassed: sub.isPassed,
                  failureReason: sub.failureReason,
                  isCombined: sub.isCombined ?? false,
                  combinedPairSubjectId: sub.combinedPairSubjectId ?? null,
                  combinedMarks: sub.combinedMarks ?? null,
                })),
              },
            },
          });
        }

        // Update exam status to DRAFT_PREVIEW
        await tx.exam.update({
          where: { id: examId },
          data: { status: "DRAFT_PREVIEW" },
        });
      },
      { timeout: 60000, maxWait: 20000 }
    );

    // 7. Aggregate Summary Stats & Anomaly Flags
    const totalStudents = calculatedStudentOutputs.length;
    const passedCount = calculatedStudentOutputs.filter((s) => s.output.isPassed).length;
    const failedCount = totalStudents - passedCount;
    const gpa5Count = calculatedStudentOutputs.filter((s) => s.output.finalGpa === 5.0).length;
    const passRate = totalStudents > 0 ? (passedCount / totalStudents) * 100 : 0;

    return NextResponse.json({
      success: true,
      message: "Result processed and Merit Ranks generated successfully.",
      summary: {
        totalStudents,
        passedCount,
        failedCount,
        gpa5Count,
        passRate: parseFloat(passRate.toFixed(2)),
      },
    });
  } catch (error: any) {
    console.error("Processing error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
