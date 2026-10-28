const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Inline calculation test based on nctb-engine
async function runCalc() {
  const exam = await prisma.exam.findFirst({
    include: {
      gradingSystem: { include: { slabs: { orderBy: { markMin: "desc" } } } },
      subjectConfigs: { include: { components: true, subject: true } },
    },
  });

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { classId: exam.classId },
    include: {
      student: true,
      allocations: { include: { subject: true } },
      marks: { include: { components: { include: { component: true } }, subject: true } },
    },
  });

  console.log(`Calculating results for ${enrollments.length} students in "${exam.name}"...`);

  const results = [];

  for (const enr of enrollments) {
    let grandTotal = 0;
    let mandatoryGpSum = 0;
    let mandatoryCount = 0;
    let failedCount = 0;
    let fourthBonus = 0;
    const subOutputs = [];

    for (const alloc of enr.allocations) {
      const sm = enr.marks.find((m) => m.subjectId === alloc.subjectId);
      const conf = exam.subjectConfigs.find((c) => c.subjectId === alloc.subjectId);
      const is4th = alloc.subjectType === "OPTIONAL_4TH";

      let subTotal = 0;
      let subPassed = true;
      let failReason = null;

      if (sm) {
        for (const c of sm.components) {
          subTotal += c.obtainedMarks;
          const compDef = conf.components.find((cd) => cd.id === c.componentId);
          if (compDef && compDef.isMandatoryPass && c.obtainedMarks < compDef.passMarks) {
            subPassed = false;
            failReason = `Failed in ${compDef.componentName} (${c.obtainedMarks}/${compDef.passMarks})`;
          }
        }
      }

      grandTotal += subTotal;

      // Grade lookup
      let lg = "F";
      let gp = 0.0;
      for (const slab of exam.gradingSystem.slabs) {
        if (subTotal >= slab.markMin && subTotal <= slab.markMax) {
          lg = slab.letterGrade;
          gp = slab.gradePoint;
          break;
        }
      }

      const effectivePassed = subPassed && lg !== "F";
      const effectiveGp = effectivePassed ? gp : 0.0;
      const effectiveLg = effectivePassed ? lg : "F";

      if (!effectivePassed && !is4th) {
        failedCount++;
      }

      if (is4th) {
        if (effectivePassed && effectiveGp > exam.gradingSystem.fourthSubjectThreshold) {
          fourthBonus = effectiveGp - exam.gradingSystem.fourthSubjectThreshold;
        }
      } else {
        mandatoryCount++;
        mandatoryGpSum += effectiveGp;
      }

      subOutputs.push({
        subjectName: alloc.subject.name,
        subjectType: alloc.subjectType,
        totalMarks: subTotal,
        letterGrade: effectiveLg,
        gradePoint: effectiveGp,
        isPassed: effectivePassed,
        failureReason: failReason,
      });
    }

    const gpaWithout4th = mandatoryCount > 0 ? mandatoryGpSum / mandatoryCount : 0.0;
    const isOverallPassed = failedCount === 0;
    let finalGpa = 0.0;
    let finalLg = "F";

    if (isOverallPassed && mandatoryCount > 0) {
      finalGpa = Math.min(5.0, (mandatoryGpSum + fourthBonus) / mandatoryCount);
      finalGpa = parseFloat(finalGpa.toFixed(2));
      for (const slab of exam.gradingSystem.slabs) {
        if (!slab.isFail && finalGpa >= slab.gradePoint) {
          finalLg = slab.letterGrade;
          break;
        }
      }
    }

    results.push({
      roll: enr.classRoll,
      name: `${enr.student.firstName} ${enr.student.lastName}`,
      totalMarks: grandTotal,
      gpaWithout4th: parseFloat(gpaWithout4th.toFixed(2)),
      fourthBonus: parseFloat(fourthBonus.toFixed(2)),
      finalGpa,
      finalLg,
      isPassed: isOverallPassed,
      failedCount,
      subOutputs,
      enrollmentId: enr.id,
    });
  }

  // Sort by Merit Rank (Passed first, then GPA desc, Total desc, Roll asc)
  results.sort((a, b) => {
    if (a.isPassed !== b.isPassed) return a.isPassed ? -1 : 1;
    if (b.finalGpa !== a.finalGpa) return b.finalGpa - a.finalGpa;
    if (b.totalMarks !== a.totalMarks) return b.totalMarks - a.totalMarks;
    return a.roll - b.roll;
  });

  // Assign Merit Ranks & Insert into Processed DB
  await prisma.processedStudentResult.deleteMany({ where: { examId: exam.id } });

  console.log("\n================ MERIT RANK & PROCESSED RESULTS ================");
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const rank = r.isPassed ? i + 1 : null;
    console.log(
      `Rank: ${rank ? "#" + rank : "FAIL"} | Roll #${r.roll} - ${r.name.padEnd(16)} | Total: ${r.totalMarks} | GPA (w/o 4th): ${r.gpaWithout4th} | 4th Bonus: +${r.fourthBonus} | Final GPA: ${r.finalGpa.toFixed(2)} (${r.finalLg}) | Status: ${r.isPassed ? "PASSED" : "FAILED"}`
    );

    const saved = await prisma.processedStudentResult.create({
      data: {
        examId: exam.id,
        enrollmentId: r.enrollmentId,
        totalObtainedMarks: r.totalMarks,
        gpaWithoutFourth: r.gpaWithout4th,
        fourthSubjectBonusPoints: r.fourthBonus,
        finalGpa: r.finalGpa,
        finalLetterGrade: r.finalLg,
        isPassed: r.isPassed,
        totalFailedSubjects: r.failedCount,
        meritRankClass: rank,
        meritRankSection: rank,
      },
    });

    for (const sub of r.subOutputs) {
      const subject = await prisma.subject.findFirst({ where: { name: sub.subjectName } });
      await prisma.processedSubjectResult.create({
        data: {
          processedStudentResultId: saved.id,
          subjectId: subject.id,
          subjectType: sub.subjectType,
          totalObtainedMarks: sub.totalMarks,
          letterGrade: sub.letterGrade,
          gradePoint: sub.gradePoint,
          isPassed: sub.isPassed,
          failureReason: sub.failureReason,
        },
      });
    }
  }

  // Set Exam to DRAFT_PREVIEW
  await prisma.exam.update({
    where: { id: exam.id },
    data: { status: "DRAFT_PREVIEW" },
  });

  console.log("================================================================\n");
  console.log("Exam status updated to DRAFT_PREVIEW. Ready for Verification & Publishing!");
}

runCalc()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
