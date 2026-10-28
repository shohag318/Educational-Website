const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const exam = await prisma.exam.findFirst({
    include: {
      gradingSystem: { include: { slabs: true } },
      subjectConfigs: { include: { components: true, subject: true } },
    },
  });

  console.log("Exam Loaded:", exam.name);
  console.log("Grading System:", exam.gradingSystem.name, "Max GPA:", exam.gradingSystem.maxGpa);
  console.log("Subject Config Count:", exam.subjectConfigs.length);

  const enrollments = await prisma.studentEnrollment.findMany({
    include: {
      student: true,
      allocations: { include: { subject: true } },
      marks: { include: { components: { include: { component: true } } } },
    },
  });

  console.log("Total Enrolled Students:", enrollments.length);
  for (const enr of enrollments) {
    console.log(`- Roll #${enr.classRoll}: ${enr.student.firstName} ${enr.student.lastName}, Marks Count: ${enr.marks.length}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
