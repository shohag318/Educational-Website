const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testSms() {
  const exam = await prisma.exam.findFirst({
    include: { institution: true },
  });

  const results = await prisma.processedStudentResult.findMany({
    where: { examId: exam.id },
    include: { enrollment: { include: { student: true } } },
  });

  console.log(`\nSimulating SMS Dispatch for ${results.length} students...`);
  const template = "Dear Guardian, {student_name} (Roll: {roll}) obtained GPA: {gpa}, Grade: {grade} in {exam_name}. Status: {status}. - {institution}";

  for (const r of results) {
    const text = template
      .replace(/{student_name}/g, `${r.enrollment.student.firstName} ${r.enrollment.student.lastName}`)
      .replace(/{roll}/g, String(r.enrollment.classRoll))
      .replace(/{exam_name}/g, exam.name)
      .replace(/{gpa}/g, r.finalGpa.toFixed(2))
      .replace(/{grade}/g, r.finalLetterGrade)
      .replace(/{status}/g, r.isPassed ? "PASSED" : "FAILED")
      .replace(/{institution}/g, exam.institution.name);

    console.log(`[SMS to ${r.enrollment.student.guardianPhone}]: "${text}"`);

    await prisma.smsLog.create({
      data: {
        institutionId: exam.institutionId,
        examId: exam.id,
        enrollmentId: r.enrollmentId,
        recipientPhone: r.enrollment.student.guardianPhone,
        messageBody: text,
        status: "SENT",
        gatewayResponse: "Delivered via Mock Gateway",
        sentAt: new Date(),
      },
    });
  }

  console.log("\nSMS Campaign executed and all delivery logs persisted in database.");
}

testSms()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
