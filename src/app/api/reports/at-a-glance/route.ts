import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const classId = searchParams.get("classId");
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
        institution: true,
        gradingSystem: { include: { slabs: { orderBy: { markMin: "desc" } } } },
      },
    });

    if (!exam) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    // Sections in class
    const classSections = await prisma.section.findMany({
      where: { classId: exam.classId },
      orderBy: { name: "asc" },
    });

    // Enrollment filter
    const targetClassId = classId || exam.classId;
    const whereEnrollment: any = { classId: targetClassId };
    if (sectionId) whereEnrollment.sectionId = sectionId;
    if (groupType && groupType !== "ALL") whereEnrollment.groupType = groupType;
    if (shift && shift !== "ALL") whereEnrollment.section = { shift: shift.toUpperCase() };

    // Fetch class-wide processed results to determine Class-level Highest / Lowest
    const classWideResults = await prisma.processedStudentResult.findMany({
      where: {
        examId,
        enrollment: { classId: targetClassId },
      },
      select: {
        totalObtainedMarks: true,
        finalGpa: true,
        isPassed: true,
      },
    });

    // Fetch scoped processed results (filtered by section/group if specified)
    const scopedResults = await prisma.processedStudentResult.findMany({
      where: {
        examId,
        enrollment: whereEnrollment,
      },
      include: {
        enrollment: {
          include: {
            student: true,
            section: true,
            class: true,
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
        { enrollment: { classRoll: "asc" } },
      ],
    });

    // All subjects configured for this exam
    const examConfigs = await prisma.examSubjectConfig.findMany({
      where: { examId },
      include: { subject: true },
      orderBy: { subject: { subjectCode: "asc" } },
    });

    // Class & group subject mappings for 4th subject detection
    const subjectMappings = await prisma.classSubjectMapping.findMany({
      where: { classId: targetClassId },
      include: { subject: true },
    });

    const fourthSubjectIds = new Set(
      subjectMappings.filter((m) => m.subjectType === "OPTIONAL_4TH").map((m) => m.subjectId)
    );

    // 1. Core Summary Metrics
    const totalStudents = scopedResults.length;
    const passedList = scopedResults.filter((r) => r.isPassed);
    const failedList = scopedResults.filter((r) => !r.isPassed);
    const passedCount = passedList.length;
    const failedCount = failedList.length;
    const passPercentage = totalStudents > 0 ? ((passedCount / totalStudents) * 100).toFixed(2) : "0.00";
    const failedPercentage = totalStudents > 0 ? ((failedCount / totalStudents) * 100).toFixed(2) : "0.00";

    // Class stats
    const classMarks = classWideResults.map((r) => r.totalObtainedMarks);
    const highestMarkInClass = classMarks.length > 0 ? Math.max(...classMarks).toFixed(2) : "0.00";
    const lowestMarkInClass = classMarks.length > 0 ? Math.min(...classMarks).toFixed(2) : "0.00";

    const classPassedGpas = classWideResults.filter((r) => r.isPassed).map((r) => r.finalGpa);
    const highestGpaInClass = classPassedGpas.length > 0 ? Math.max(...classPassedGpas).toFixed(2) : "0.00";

    // Section/Scoped stats
    const sectionMarks = scopedResults.map((r) => r.totalObtainedMarks);
    const highestMarkInSection = sectionMarks.length > 0 ? Math.max(...sectionMarks).toFixed(2) : "0.00";
    const lowestMarkInSection = sectionMarks.length > 0 ? Math.min(...sectionMarks).toFixed(2) : "0.00";

    const sectionPassedGpas = passedList.map((r) => r.finalGpa);
    const highestGpaInSection = sectionPassedGpas.length > 0 ? Math.max(...sectionPassedGpas).toFixed(2) : "0.00";

    // 2. List of student on the basis of GPA (only passed students)
    const gpaSlabs = [
      { label: "GPA 5", min: 5.0, max: 99.0 },
      { label: "GPA 4.5 & above", min: 4.5, max: 5.0 },
      { label: "GPA 4 & above", min: 4.0, max: 4.5 },
      { label: "GPA 3.5 & above", min: 3.5, max: 4.0 },
      { label: "GPA 3 & above", min: 3.0, max: 3.5 },
      { label: "GPA 2.5 & above", min: 2.5, max: 3.0 },
      { label: "GPA 2 & above", min: 2.0, max: 2.5 },
      { label: "GPA < 2", min: 0.001, max: 2.0 },
    ];

    const gpaBrackets = gpaSlabs.map((slab) => {
      const matched = passedList.filter((r) => {
        if (slab.label === "GPA 5") {
          return r.finalGpa >= 5.0;
        }
        return r.finalGpa >= slab.min && r.finalGpa < slab.max;
      });

      const studentIds = matched
        .map((m) => m.enrollment.student.studentIdNo || String(m.enrollment.classRoll))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const count = studentIds.length;
      return {
        bracket: slab.label,
        count,
        studentIds,
        display: count > 0 ? `${studentIds.join(", ")} = ${count}` : "NIL",
      };
    });

    // 3. Failed according to number of subjects
    // Calculate exact failed subject count for each failed student
    const failedStudentsWithCount = failedList.map((r) => {
      const failingSubCount = r.subjectResults.filter((s) => !s.isPassed).length || r.totalFailedSubjects || 1;
      return {
        studentId: r.enrollment.student.studentIdNo || String(r.enrollment.classRoll),
        failingSubCount,
      };
    });

    const failedSlabs = [
      { label: "One Subject", match: (c: number) => c === 1 },
      { label: "Two Subject", match: (c: number) => c === 2 },
      { label: "Three Subject", match: (c: number) => c === 3 },
      { label: "Four Subject", match: (c: number) => c === 4 },
      { label: "Five & more Subject", match: (c: number) => c >= 5 },
    ];

    const failedBrackets = failedSlabs.map((slab) => {
      const matched = failedStudentsWithCount.filter((s) => slab.match(s.failingSubCount));
      const studentIds = matched
        .map((s) => s.studentId)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const count = studentIds.length;
      return {
        bracket: slab.label,
        count,
        studentIds,
        display: count > 0 ? `${studentIds.join(", ")} = ${count}` : "NIL",
      };
    });

    // 4. Subjectwise Result Analysis
    // Distinct subjects from exam configs or scoped results
    const subjectMap = new Map<string, { id: string; name: string; code: string; isFourth: boolean }>();
    for (const conf of examConfigs) {
      subjectMap.set(conf.subjectId, {
        id: conf.subject.id,
        name: conf.subject.name,
        code: conf.subject.subjectCode || "",
        isFourth: fourthSubjectIds.has(conf.subjectId),
      });
    }

    // Fallback: collect subjects from results if examConfigs empty
    for (const r of scopedResults) {
      for (const sr of r.subjectResults) {
        if (!subjectMap.has(sr.subjectId)) {
          subjectMap.set(sr.subjectId, {
            id: sr.subject.id,
            name: sr.subject.name,
            code: sr.subject.subjectCode || "",
            isFourth: sr.subjectType === "OPTIONAL_4TH" || fourthSubjectIds.has(sr.subjectId),
          });
        }
      }
    }

    const distinctSubjects = Array.from(subjectMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true })
    );

    const subjectwiseAnalysis = distinctSubjects.map((sub, index) => {
      // Find all student evaluations for this subject
      let passedInSub = 0;
      let failedInSub = 0;
      let evaluatedCount = 0;

      for (const r of scopedResults) {
        const sr = r.subjectResults.find((s) => s.subjectId === sub.id);
        if (sr) {
          evaluatedCount++;
          if (sr.isPassed) {
            passedInSub++;
          } else {
            failedInSub++;
          }
        }
      }

      const passPct = evaluatedCount > 0 ? ((passedInSub / evaluatedCount) * 100).toFixed(2) + "%" : "0.00%";
      const failPct = evaluatedCount > 0 ? ((failedInSub / evaluatedCount) * 100).toFixed(2) + "%" : "0.00%";

      return {
        sl: index + 1,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        passedCount: passedInSub,
        passPercentage: passPct,
        failedCount: failedInSub,
        failedPercentage: failPct,
      };
    });

    // 5. Result Sheet (Page 2)
    const gradeLetters = ["A+", "A", "A-", "B", "C", "D", "F"];
    const resultSheet = scopedResults.map((r, idx) => {
      const counts: Record<string, string | number> = {};
      gradeLetters.forEach((g) => (counts[g] = "-"));

      r.subjectResults.forEach((sr) => {
        const g = sr.letterGrade;
        if (g && gradeLetters.includes(g)) {
          const current = counts[g] === "-" ? 0 : (counts[g] as number);
          counts[g] = current + 1;
        }
      });

      return {
        sl: idx + 1,
        studentName: `${r.enrollment.student.firstName} ${r.enrollment.student.lastName}`.trim(),
        roll: r.enrollment.classRoll,
        studentId: r.enrollment.student.studentIdNo || String(r.enrollment.classRoll),
        totalMark: r.totalObtainedMarks.toFixed(2),
        gpa: r.isPassed ? r.finalGpa.toFixed(2) : "-",
        grade: r.isPassed ? r.finalLetterGrade : "-",
        positionSection: r.meritRankSection ?? idx + 1,
        positionClass: r.meritRankClass ?? idx + 1,
        gradeCounts: counts,
      };
    });

    // 6. Grade Statistics By Course (Page 3)
    const gradeStatisticsByCourse = distinctSubjects.map((sub) => {
      const counts: Record<string, string | number> = {};
      gradeLetters.forEach((g) => (counts[g] = "-"));

      for (const r of scopedResults) {
        const sr = r.subjectResults.find((s) => s.subjectId === sub.id);
        if (sr && sr.letterGrade) {
          const g = sr.letterGrade;
          if (gradeLetters.includes(g)) {
            const current = counts[g] === "-" ? 0 : (counts[g] as number);
            counts[g] = current + 1;
          }
        }
      }

      const displayName = sub.isFourth ? `${sub.name}(4th)` : sub.name;

      return {
        subjectId: sub.id,
        subjectName: displayName,
        subjectCode: sub.code,
        counts,
      };
    });

    // 7. Failed Statistics By Course (Page 4)
    const failedStatisticsByCourse = failedList.map((r) => {
      const failingSubjectNames: string[] = [];
      for (const sr of r.subjectResults) {
        if (!sr.isPassed) {
          const isFourth = sr.subjectType === "OPTIONAL_4TH" || fourthSubjectIds.has(sr.subjectId);
          const name = isFourth ? `${sr.subject.name}(4th)` : sr.subject.name;
          failingSubjectNames.push(name);
        }
      }

      // If no subject failed recorded explicitly, fall back to failureReason or generic
      if (failingSubjectNames.length === 0) {
        failingSubjectNames.push("Subject Below Pass Criteria");
      }

      return {
        studentId: r.enrollment.student.studentIdNo || String(r.enrollment.classRoll),
        studentName: `${r.enrollment.student.firstName} ${r.enrollment.student.lastName}`.trim(),
        roll: r.enrollment.classRoll,
        failQty: failingSubjectNames.length,
        failSubNames: failingSubjectNames.join(", "),
      };
    });

    // Order failed statistics by roll or fail qty
    failedStatisticsByCourse.sort((a, b) => a.roll - b.roll);

    // 8. Failed Statistics By Course without 4th Subject (Page 5)
    const failedStatisticsByCourseWithoutFourth = failedList
      .map((r) => {
        const failingSubjectNames: string[] = [];
        for (const sr of r.subjectResults) {
          const isFourth = sr.subjectType === "OPTIONAL_4TH" || fourthSubjectIds.has(sr.subjectId);
          if (!sr.isPassed && !isFourth) {
            failingSubjectNames.push(sr.subject.name);
          }
        }

        // Exclude students who did not fail any non-4th subject
        if (failingSubjectNames.length === 0) {
          return null;
        }

        return {
          studentId: r.enrollment.student.studentIdNo || String(r.enrollment.classRoll),
          studentName: `${r.enrollment.student.firstName} ${r.enrollment.student.lastName}`.trim(),
          roll: r.enrollment.classRoll,
          failQty: failingSubjectNames.length,
          failSubNames: failingSubjectNames.join(", "),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    failedStatisticsByCourseWithoutFourth.sort((a, b) => a.roll - b.roll);

    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        name: exam.name,
        termCode: exam.termCode,
        status: exam.status,
        academicYear: exam.academicYear.yearName,
        class: exam.class.name,
        classNumeric: exam.class.numericValue,
        institution: {
          name: exam.institution.name,
          address: exam.institution.address || "",
          code: exam.institution.code,
        },
      },
      sections: classSections,
      summary: {
        totalStudents,
        passedCount,
        failedCount,
        passPercentage,
        failedPercentage,
        highestMarkInClass,
        highestMarkInSection,
        lowestMarkInClass,
        lowestMarkInSection,
        highestGpaInClass,
        highestGpaInSection,
      },
      gpaBrackets,
      failedBrackets,
      subjectwiseAnalysis,
      resultSheet,
      gradeStatisticsByCourse,
      failedStatisticsByCourse,
      failedStatisticsByCourseWithoutFourth,
    });
  } catch (error: any) {
    console.error("At-a-glance API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
