const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Checking institutions in database...");
  const insts = await prisma.institution.findMany();
  console.log(`Found ${insts.length} institutions.`);

  for (const inst of insts) {
    let updated = false;
    const updateData = {};

    if (!inst.adminId) {
      updateData.adminId = inst.code === "108254" ? "admin_108254" : `admin_${inst.code}`;
      updated = true;
    }
    if (!inst.adminPassword) {
      updateData.adminPassword = inst.code === "108254" ? "SmartAdmin@108254" : `SmartAdmin@${inst.code}`;
      updated = true;
    }
    if (!inst.contactEmail) {
      updateData.contactEmail = inst.code === "108254" ? "admin@dhakaideal.edu.bd" : "info@dalta.edu.bd";
      updated = true;
    }
    if (!inst.contactPhone) {
      updateData.contactPhone = inst.code === "108254" ? "+880 1712-345678" : "+880 1819-876543";
      updated = true;
    }
    if (!inst.nameBn && inst.code === "108254") {
      updateData.nameBn = "ঢাকা আইডিয়াল মডেল হাই স্কুল অ্যান্ড কলেজ";
      updated = true;
    }
    if (!inst.slug) {
      updateData.slug = inst.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      updated = true;
    }

    if (updated) {
      await prisma.institution.update({
        where: { id: inst.id },
        data: updateData,
      });
      console.log(`Updated institution ${inst.name} (${inst.code}) with admin ID: ${updateData.adminId || inst.adminId}`);
    }
  }

  console.log("All institutions prepared successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
