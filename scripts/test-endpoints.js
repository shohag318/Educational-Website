const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  console.log("=== Testing Database & Credentials ===");
  const institutions = await prisma.institution.findMany({
    include: {
      _count: {
        select: { students: true, classes: true, exams: true },
      },
    },
  });

  console.log(`Total Institutions in DB: ${institutions.length}`);
  for (const inst of institutions) {
    console.log(`- [${inst.code}] ${inst.name}`);
    console.log(`  Assigned Admin ID: ${inst.adminId}`);
    console.log(`  Assigned Password: ${inst.adminPassword}`);
    console.log(`  Portal Login Link: http://localhost:3000/portal-login?inst=${inst.code}`);
    console.log(`  Stats: ${inst._count.students} students, ${inst._count.classes} classes`);
  }

  console.log("\n=== Testing Login Logic Simulation ===");
  const targetCode = "108254";
  const inst = institutions.find(i => i.code === targetCode);
  if (inst) {
    const isIdMatch = inst.adminId === "admin_108254";
    const isPassMatch = inst.adminPassword === "SmartAdmin@108254";
    console.log(`Target: ${inst.name}`);
    console.log(`Verify ID ("admin_108254"): ${isIdMatch}`);
    console.log(`Verify Password ("SmartAdmin@108254"): ${isPassMatch}`);
    if (isIdMatch && isPassMatch) {
      console.log("LOGIN TEST: PASSED SUCCESSFUL!");
    } else {
      console.error("LOGIN TEST: FAILED!");
    }
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
