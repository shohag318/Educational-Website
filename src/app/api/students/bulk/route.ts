import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { classId, sectionId, students, institutionId } = body;

    if (!classId || !sectionId) {
      return NextResponse.json(
        { success: false, error: "Class ID and Section ID are required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { success: false, error: "No student records provided for bulk enrollment." },
        { status: 400 }
      );
    }

    const tenant = await getTenantInstitution(req);
    const instId = institutionId || tenant.id;

    let academicYear = await prisma.academicYear.findFirst({
      where: { institutionId: instId, isCurrent: true },
    });
    if (!academicYear) {
      academicYear = await prisma.academicYear.findFirst({
        where: { institutionId: instId },
      });
    }
    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          institutionId: instId,
          yearName: new Date().getFullYear().toString(),
          isCurrent: true,
          startDate: new Date(`${new Date().getFullYear()}-01-01`),
          endDate: new Date(`${new Date().getFullYear()}-12-31`),
        },
      });
    }
    const yearId = academicYear.id;

    // Fetch class subject mappings
    const allMappings = await prisma.classSubjectMapping.findMany({
      where: { classId },
      include: { subject: true },
    });

    const institutionSubjects = await prisma.subject.findMany({
      where: { institutionId: instId },
    });

    const targetSection = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    // 1. Validate internal duplicate rolls within the incoming payload
    const seenRolls = new Map<number, string>();
    for (const s of students) {
      if (!s.firstName || !s.classRoll) continue;
      const rollInt = parseInt(String(s.classRoll).replace(/\D/g, "") || "0", 10);
      if (rollInt <= 0) continue;
      const sName = `${String(s.firstName).trim()} ${s.lastName ? String(s.lastName).trim() : ""}`.trim();

      if (seenRolls.has(rollInt)) {
        return NextResponse.json(
          {
            success: false,
            error: `Duplicate Class Roll #${rollInt} found in uploaded Excel file ("${seenRolls.get(rollInt)}" and "${sName}"). Each student in this section must have a unique roll number.`,
          },
          { status: 400 }
        );
      }
      seenRolls.set(rollInt, sName);
    }

    // 2. Pre-fetch existing enrollments in the target section to check for roll collisions
    const existingSectionEnrollments = await prisma.studentEnrollment.findMany({
      where: {
        academicYearId: yearId,
        classId,
        sectionId,
      },
      include: {
        student: true,
      },
    });

    const rollToExisting = new Map<number, typeof existingSectionEnrollments[0]>();
    for (const enr of existingSectionEnrollments) {
      rollToExisting.set(enr.classRoll, enr);
    }

    // 3. Pre-check for roll conflicts with existing students in this section
    for (const s of students) {
      if (!s.firstName || !s.studentIdNo || !s.classRoll) continue;
      const rollInt = parseInt(String(s.classRoll).replace(/\D/g, "") || "0", 10);
      const studentIdNo = String(s.studentIdNo).trim();
      const occupied = rollToExisting.get(rollInt);

      if (occupied && occupied.student.studentIdNo !== studentIdNo) {
        const sName = `${String(s.firstName).trim()} ${s.lastName ? String(s.lastName).trim() : ""}`.trim();
        return NextResponse.json(
          {
            success: false,
            error: `Class Roll #${rollInt} is already assigned to "${occupied.student.firstName} ${occupied.student.lastName}" (ID: ${occupied.student.studentIdNo}) in this section. Cannot assign it to "${sName}" (ID: ${studentIdNo}). Please update the roll in your Excel sheet.`,
          },
          { status: 400 }
        );
      }
    }

    let enrolledCount = 0;

    // 4. Execute all database upserts within an atomic transaction
    await prisma.$transaction(async (tx) => {
      for (const s of students) {
        if (!s.firstName || !s.studentIdNo || !s.classRoll) continue;

        const rollInt = parseInt(String(s.classRoll).replace(/\D/g, "") || "1", 10);
        const studentIdNo = String(s.studentIdNo).trim();
        const firstName = String(s.firstName).trim();
        const lastName = s.lastName ? String(s.lastName).trim() : "";
        const guardianName = s.guardianName
          ? String(s.guardianName).trim()
          : s.fatherName
          ? String(s.fatherName).trim()
          : s.motherName
          ? String(s.motherName).trim()
          : "";

        let guardianPhone = s.guardianPhone ? String(s.guardianPhone).trim() : "";
        let religion = s.religion ? String(s.religion).trim() : null;
        let address = s.address ? String(s.address).trim() : null;
        let gender = s.gender ? String(s.gender).trim() : null;

        // Parse customFields and extract any core student fields mapped as custom
        let customObj: Record<string, any> = {};
        if (s.customFields) {
          try {
            customObj = typeof s.customFields === "string" ? JSON.parse(s.customFields) : { ...s.customFields };
          } catch (e) {}
        }

        // 1. Phone extraction
        const phoneKey = Object.keys(customObj).find(
          (k) => k.toLowerCase().includes("phone") || k.toLowerCase().includes("mobile")
        );
        if ((!guardianPhone || guardianPhone === "01700000000") && phoneKey && customObj[phoneKey]) {
          guardianPhone = String(customObj[phoneKey]).trim();
          delete customObj[phoneKey];
        }
        if (!guardianPhone) guardianPhone = "01700000000";

        // 2. Gender extraction
        const genderKey = Object.keys(customObj).find(
          (k) => k.toLowerCase().includes("gender") || k.toLowerCase().includes("sex")
        );
        if (!gender && genderKey && customObj[genderKey]) {
          gender = String(customObj[genderKey]).trim();
          delete customObj[genderKey];
        }
        if (!gender) gender = "Male";

        // 3. Religion extraction
        const religionKey = Object.keys(customObj).find((k) => k.toLowerCase().includes("religion"));
        if (!religion && religionKey && customObj[religionKey]) {
          religion = String(customObj[religionKey]).trim();
          delete customObj[religionKey];
        }

        // 4. Address extraction
        const addressKey = Object.keys(customObj).find((k) => k.toLowerCase().includes("address"));
        if (!address && addressKey && customObj[addressKey]) {
          address = String(customObj[addressKey]).trim();
          delete customObj[addressKey];
        }

        // Inherit group from targetSection if student row did not explicitly specify a non-general group
        let groupType = s.groupType ? String(s.groupType).toUpperCase().replace(/\s+/g, "_") : "";
        if (!groupType || groupType === "GENERAL") {
          if (targetSection?.groupType && targetSection.groupType !== "GENERAL") {
            groupType = targetSection.groupType;
          } else {
            groupType = groupType || "GENERAL";
          }
        }
        const customFields = Object.keys(customObj).length > 0 ? JSON.stringify(customObj) : null;

        // Upsert Student Profile
        const student = await tx.student.upsert({
          where: {
            institutionId_studentIdNo: {
              institutionId: instId,
              studentIdNo,
            },
          },
          update: {
            firstName,
            lastName,
            gender,
            guardianName,
            guardianPhone,
            religion,
            address,
            customFields,
          },
          create: {
            institutionId: instId,
            studentIdNo,
            firstName,
            lastName,
            gender,
            guardianName,
            guardianPhone,
            religion,
            address,
            customFields,
          },
        });

        // Upsert Enrollment
        const existingEnrollment = await tx.studentEnrollment.findFirst({
          where: {
            studentId: student.id,
            academicYearId: yearId,
            classId,
          },
        });

        let enrollment;
        if (existingEnrollment) {
          enrollment = await tx.studentEnrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              sectionId,
              groupType,
              classRoll: rollInt,
            },
          });
        } else {
          enrollment = await tx.studentEnrollment.create({
            data: {
              studentId: student.id,
              academicYearId: yearId,
              classId,
              sectionId,
              groupType,
              classRoll: rollInt,
            },
          });
        }

        // Allocate subjects
        const existingAllocations = await tx.studentSubjectAllocation.count({
          where: { enrollmentId: enrollment.id },
        });

        if (existingAllocations === 0) {
          const relevantMappings = allMappings.filter(
            (m) => m.groupType === groupType || m.groupType === "ALL"
          );

          if (relevantMappings.length > 0) {
            for (const m of relevantMappings) {
              const is4th = s.fourthSubjectId
                ? m.subjectId === s.fourthSubjectId
                : m.subjectType === "OPTIONAL_4TH";
              await tx.studentSubjectAllocation.create({
                data: {
                  enrollmentId: enrollment.id,
                  subjectId: m.subjectId,
                  subjectType: is4th ? "OPTIONAL_4TH" : m.subjectType,
                },
              });
            }
          } else {
            for (const sub of institutionSubjects) {
              const is4th = s.fourthSubjectId && sub.id === s.fourthSubjectId;
              await tx.studentSubjectAllocation.create({
                data: {
                  enrollmentId: enrollment.id,
                  subjectId: sub.id,
                  subjectType: is4th ? "OPTIONAL_4TH" : "MANDATORY",
                },
              });
            }
          }
        }

        enrolledCount++;
      }
    });

    return NextResponse.json({
      success: true,
      count: enrolledCount,
      message: `Successfully enrolled ${enrolledCount} student(s) from Excel Sheet.`,
    });
  } catch (error: any) {
    console.error("Bulk enrollment error:", error);
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "Class Roll / Student ID";
      return NextResponse.json(
        {
          success: false,
          error: `Unique constraint conflict (${target}): A student with this roll number or ID already exists in this section.`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
