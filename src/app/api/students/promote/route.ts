import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      enrollmentIds,
      targetClassId,
      targetSectionId,
      targetAcademicYearId,
      targetGroupType,
      rollAssignment = "KEEP_SAME", // "KEEP_SAME" | "RESEQUENCE"
      startingRoll = 1,
      allocateSubjects = true,
    } = body;

    if (!enrollmentIds || !Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      return NextResponse.json({ success: false, error: "Please select at least one student to promote." }, { status: 400 });
    }

    if (!targetClassId || !targetSectionId) {
      return NextResponse.json({ success: false, error: "Target Class and Section are required." }, { status: 400 });
    }

    const targetClass = await prisma.academicClass.findUnique({
      where: { id: targetClassId },
      include: { institution: true },
    });

    if (!targetClass) {
      return NextResponse.json({ success: false, error: "Target Class not found." }, { status: 404 });
    }

    const targetSection = await prisma.section.findUnique({
      where: { id: targetSectionId },
    });

    if (!targetSection) {
      return NextResponse.json({ success: false, error: "Target Section not found." }, { status: 404 });
    }

    // Resolve academic year
    let yearId = targetAcademicYearId;
    if (!yearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { institutionId: targetClass.institutionId, isCurrent: true },
      });
      yearId = activeYear?.id;
    }

    if (!yearId) {
      const anyYear = await prisma.academicYear.findFirst({
        where: { institutionId: targetClass.institutionId },
      });
      yearId = anyYear?.id;
    }

    if (!yearId) {
      return NextResponse.json({ success: false, error: "No academic year found for promotion." }, { status: 400 });
    }

    // Fetch existing source enrollments
    const sourceEnrollments = await prisma.studentEnrollment.findMany({
      where: { id: { in: enrollmentIds } },
      include: {
        student: true,
        class: true,
        section: true,
      },
      orderBy: { classRoll: "asc" },
    });

    if (sourceEnrollments.length === 0) {
      return NextResponse.json({ success: false, error: "Selected student records not found." }, { status: 404 });
    }

    // Pre-fetch existing enrollments in destination class/section to avoid roll collisions
    const existingTargetEnrollments = await prisma.studentEnrollment.findMany({
      where: {
        academicYearId: yearId,
        classId: targetClassId,
        sectionId: targetSectionId,
      },
      select: {
        id: true,
        studentId: true,
        classRoll: true,
      },
    });

    const usedRolls = new Set<number>(existingTargetEnrollments.map((e) => e.classRoll));
    const alreadyEnrolledMap = new Map<string, string>(); // studentId -> enrollmentId
    for (const e of existingTargetEnrollments) {
      alreadyEnrolledMap.set(e.studentId, e.id);
    }

    // Pre-fetch class subject mappings for target class if allocation is requested
    const targetSubjectMappings = allocateSubjects
      ? await prisma.classSubjectMapping.findMany({
          where: { classId: targetClassId },
          include: { subject: true },
        })
      : [];

    const promotedRecords: any[] = [];

    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      let rollSeq = parseInt(String(startingRoll), 10) || 1;

      for (let i = 0; i < sourceEnrollments.length; i++) {
        const source = sourceEnrollments[i];
        let assignedRoll: number;

        if (rollAssignment === "RESEQUENCE") {
          assignedRoll = rollSeq;
          while (usedRolls.has(assignedRoll)) {
            assignedRoll++;
          }
          rollSeq = assignedRoll + 1;
        } else {
          // KEEP_SAME
          assignedRoll = source.classRoll;
          if (usedRolls.has(assignedRoll)) {
            // Collision: find next highest free roll
            let maxRoll = usedRolls.size > 0 ? Math.max(...Array.from(usedRolls)) : assignedRoll;
            assignedRoll = maxRoll + 1;
          }
        }
        usedRolls.add(assignedRoll);

        const effectiveGroup =
          targetGroupType && targetGroupType !== "SAME"
            ? targetGroupType
            : (source.groupType || targetSection.groupType || "GENERAL");

        const existingEnrId = alreadyEnrolledMap.get(source.studentId);

        let newEnrollment;
        if (existingEnrId) {
          // Already enrolled in target class & year, update
          newEnrollment = await tx.studentEnrollment.update({
            where: { id: existingEnrId },
            data: {
              sectionId: targetSectionId,
              groupType: effectiveGroup,
              classRoll: assignedRoll,
            },
          });
        } else {
          // Create new enrollment record for next class
          newEnrollment = await tx.studentEnrollment.create({
            data: {
              studentId: source.studentId,
              academicYearId: yearId,
              classId: targetClassId,
              sectionId: targetSectionId,
              groupType: effectiveGroup,
              classRoll: assignedRoll,
            },
          });
        }

        // Allocate default subjects for the new class if requested
        if (allocateSubjects && targetSubjectMappings.length > 0) {
          const matchingMappings = targetSubjectMappings.filter(
            (m) => m.groupType === "ALL" || m.groupType === effectiveGroup
          );

          // Remove any previous allocations for this enrollment to avoid duplicate key errors
          await tx.studentSubjectAllocation.deleteMany({
            where: { enrollmentId: newEnrollment.id },
          });

          for (const mapping of matchingMappings) {
            await tx.studentSubjectAllocation.create({
              data: {
                enrollmentId: newEnrollment.id,
                subjectId: mapping.subjectId,
                subjectType: mapping.subjectType,
              },
            });
          }
        }

        // Make sure student is set to active
        await tx.student.update({
          where: { id: source.studentId },
          data: { isActive: true },
        });

        promotedRecords.push({
          studentId: source.studentId,
          studentName: `${source.student.firstName} ${source.student.lastName}`,
          oldRoll: source.classRoll,
          newRoll: assignedRoll,
          oldClass: source.class.name,
          newClass: targetClass.name,
        });
      }
    });

    return NextResponse.json({
      success: true,
      count: promotedRecords.length,
      promotedRecords,
      targetClass: targetClass.name,
      targetSection: targetSection.name,
      message: `Successfully promoted ${promotedRecords.length} student(s) to ${targetClass.name} (${targetSection.name})!`,
    });
  } catch (error: any) {
    console.error("Promotion error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
