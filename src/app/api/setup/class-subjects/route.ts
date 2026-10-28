import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Preset definitions for Bangladeshi NCTB curriculum
const NCTB_PRESETS: Record<
  string,
  {
    name: string;
    subjects: { code: string; name: string; type: "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH" }[];
  }
> = {
  nctb_science: {
    name: "NCTB SSC Science Package",
    subjects: [
      { code: "101", name: "Bangla 1st Paper", type: "MANDATORY" },
      { code: "102", name: "Bangla 2nd Paper", type: "MANDATORY" },
      { code: "107", name: "English 1st Paper", type: "MANDATORY" },
      { code: "108", name: "English 2nd Paper", type: "MANDATORY" },
      { code: "109", name: "Mathematics", type: "MANDATORY" },
      { code: "154", name: "Information & Communication Tech (ICT)", type: "MANDATORY" },
      { code: "150", name: "Bangladesh & Global Studies", type: "MANDATORY" },
      { code: "136", name: "Physics", type: "MANDATORY" },
      { code: "137", name: "Chemistry", type: "MANDATORY" },
      { code: "138", name: "Biology", type: "GROUP_ELECTIVE" },
      { code: "126", name: "Higher Mathematics", type: "OPTIONAL_4TH" },
    ],
  },
  nctb_humanities: {
    name: "NCTB SSC Humanities Package",
    subjects: [
      { code: "101", name: "Bangla 1st Paper", type: "MANDATORY" },
      { code: "102", name: "Bangla 2nd Paper", type: "MANDATORY" },
      { code: "107", name: "English 1st Paper", type: "MANDATORY" },
      { code: "108", name: "English 2nd Paper", type: "MANDATORY" },
      { code: "109", name: "Mathematics", type: "MANDATORY" },
      { code: "154", name: "Information & Communication Tech (ICT)", type: "MANDATORY" },
      { code: "127", name: "General Science", type: "MANDATORY" },
      { code: "153", name: "History of Bangladesh & World Civ.", type: "MANDATORY" },
      { code: "110", name: "Geography & Environment", type: "MANDATORY" },
      { code: "140", name: "Civics & Citizenship", type: "GROUP_ELECTIVE" },
      { code: "134", name: "Agriculture Studies", type: "OPTIONAL_4TH" },
    ],
  },
  nctb_business: {
    name: "NCTB SSC Business Studies Package",
    subjects: [
      { code: "101", name: "Bangla 1st Paper", type: "MANDATORY" },
      { code: "102", name: "Bangla 2nd Paper", type: "MANDATORY" },
      { code: "107", name: "English 1st Paper", type: "MANDATORY" },
      { code: "108", name: "English 2nd Paper", type: "MANDATORY" },
      { code: "109", name: "Mathematics", type: "MANDATORY" },
      { code: "154", name: "Information & Communication Tech (ICT)", type: "MANDATORY" },
      { code: "127", name: "General Science", type: "MANDATORY" },
      { code: "146", name: "Accounting", type: "MANDATORY" },
      { code: "143", name: "Business Entrepreneurship", type: "MANDATORY" },
      { code: "152", name: "Finance & Banking", type: "GROUP_ELECTIVE" },
      { code: "134", name: "Agriculture Studies", type: "OPTIONAL_4TH" },
    ],
  },
  nctb_general_junior: {
    name: "NCTB Junior Package (Classes 6-8)",
    subjects: [
      { code: "101", name: "Bangla 1st Paper", type: "MANDATORY" },
      { code: "102", name: "Bangla 2nd Paper", type: "MANDATORY" },
      { code: "107", name: "English 1st Paper", type: "MANDATORY" },
      { code: "108", name: "English 2nd Paper", type: "MANDATORY" },
      { code: "109", name: "Mathematics", type: "MANDATORY" },
      { code: "127", name: "General Science", type: "MANDATORY" },
      { code: "150", name: "Bangladesh & Global Studies", type: "MANDATORY" },
      { code: "154", name: "Information & Communication Tech (ICT)", type: "MANDATORY" },
      { code: "111", name: "Islam & Moral Education", type: "MANDATORY" },
    ],
  },
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const groupType = searchParams.get("groupType") || "SCIENCE";

    if (!classId) {
      return NextResponse.json({ success: false, error: "classId parameter is required" }, { status: 400 });
    }

    const classInfo = await prisma.academicClass.findUnique({
      where: { id: classId },
      include: {
        sections: true,
      },
    });

    if (!classInfo) {
      return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });
    }

    // Determine query filter for mappings
    const mappingWhere: any = { classId };
    if (groupType && groupType !== "ALL") {
      if (groupType === "MANDATORY") {
        mappingWhere.OR = [
          { groupType: "MANDATORY" },
          { subjectType: "MANDATORY" },
          { groupType: "ALL" },
        ];
      } else {
        mappingWhere.groupType = { in: [groupType, "ALL", "MANDATORY"] };
      }
    }

    const mappings = await prisma.classSubjectMapping.findMany({
      where: mappingWhere,
      include: {
        subject: true,
      },
      orderBy: [
        { subjectType: "asc" }, // MANDATORY first, then GROUP_ELECTIVE, then OPTIONAL_4TH
        { subject: { subjectCode: "asc" } },
      ],
    });

    // Fetch catalog subjects for the selected class:
    // Only return subjects belonging to this specific class (mapped to this class,
    // configured in exams for this class, allocated to students in this class,
    // in assessment templates for this class, or unassigned to any class).
    const allSubjects = await prisma.subject.findMany({
      where: {
        institutionId: classInfo.institutionId,
        OR: [
          { classMappings: { some: { classId } } },
          { configs: { some: { exam: { classId } } } },
          { allocations: { some: { enrollment: { classId } } } },
          { assessmentTemplateItems: { some: { template: { classId } } } },
          { classMappings: { none: {} } },
        ],
      },
      orderBy: { subjectCode: "asc" },
    });

    // Sort numerically by code, then alphabetically by name
    allSubjects.sort((a, b) => {
      const codeA = parseInt(a.subjectCode || "0", 10) || 0;
      const codeB = parseInt(b.subjectCode || "0", 10) || 0;
      if (codeA !== codeB) return codeA - codeB;
      return a.name.localeCompare(b.name);
    });

    // Count enrolled students in this Class and Group
    const studentFilter: any = { classId };
    if (groupType && groupType !== "ALL" && groupType !== "MANDATORY") {
      studentFilter.groupType = groupType;
    }
    const enrolledCount = await prisma.studentEnrollment.count({
      where: studentFilter,
    });

    // Detect distinct group types in this class sections
    const sectionGroups = Array.from(new Set(classInfo.sections.map((s) => s.groupType)));
    const standardGroups = ["MANDATORY", "SCIENCE", "HUMANITIES", "BUSINESS_STUDIES", "GENERAL"];
    const availableGroups = Array.from(new Set([...standardGroups, ...sectionGroups]));

    return NextResponse.json({
      success: true,
      data: {
        classInfo,
        mappings,
        allSubjects,
        enrolledCount,
        availableGroups,
        presets: Object.entries(NCTB_PRESETS).map(([key, val]) => ({
          key,
          name: val.name,
          subjectCount: val.subjects.length,
        })),
      },
    });
  } catch (error: any) {
    console.error("GET Class Subject Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Single Map or Update (Upsert)
    if (action === "upsert" || !action) {
      const { classId, groupType = "SCIENCE", subjectId, subjectType = "MANDATORY", creditWeight = 1.0 } = body;
      if (!classId || !subjectId) {
        return NextResponse.json({ success: false, error: "classId and subjectId are required" }, { status: 400 });
      }

      const mapping = await prisma.classSubjectMapping.upsert({
        where: {
          classId_groupType_subjectId: {
            classId,
            groupType,
            subjectId,
          },
        },
        update: {
          subjectType,
          creditWeight: parseFloat(creditWeight) || 1.0,
        },
        create: {
          classId,
          groupType,
          subjectId,
          subjectType,
          creditWeight: parseFloat(creditWeight) || 1.0,
        },
        include: { subject: true },
      });

      return NextResponse.json({ success: true, data: mapping });
    }

    // 2. Batch Assign multiple subjects
    if (action === "batch_assign") {
      const { classId, groupType = "SCIENCE", subjectIds, subjectType = "MANDATORY" } = body;
      if (!classId || !Array.isArray(subjectIds)) {
        return NextResponse.json({ success: false, error: "classId and subjectIds array required" }, { status: 400 });
      }

      for (const subId of subjectIds) {
        await prisma.classSubjectMapping.upsert({
          where: {
            classId_groupType_subjectId: {
              classId,
              groupType,
              subjectId: subId,
            },
          },
          update: { subjectType },
          create: {
            classId,
            groupType,
            subjectId: subId,
            subjectType,
          },
        });
      }

      return NextResponse.json({ success: true, message: `Successfully mapped ${subjectIds.length} subjects` });
    }

    // 3. Remove single mapping
    if (action === "remove") {
      const { classId, groupType, subjectId } = body;
      await prisma.classSubjectMapping.deleteMany({
        where: {
          classId,
          ...(groupType === "MANDATORY"
            ? { OR: [{ groupType: "MANDATORY" }, { groupType: "ALL" }, { subjectType: "MANDATORY" }] }
            : { groupType }),
          subjectId,
        },
      });
      return NextResponse.json({ success: true, message: "Mapping removed successfully" });
    }

    // 4. Remove multiple mappings
    if (action === "remove_batch") {
      const { classId, groupType, subjectIds } = body;
      await prisma.classSubjectMapping.deleteMany({
        where: {
          classId,
          ...(groupType === "MANDATORY"
            ? { OR: [{ groupType: "MANDATORY" }, { groupType: "ALL" }, { subjectType: "MANDATORY" }] }
            : { groupType }),
          subjectId: { in: subjectIds },
        },
      });
      return NextResponse.json({ success: true, message: `Removed ${subjectIds.length} subjects from mapping` });
    }

    // 5. Apply NCTB Predefined Package
    if (action === "apply_preset") {
      const { classId, groupType, presetKey } = body;
      const preset = NCTB_PRESETS[presetKey];
      if (!preset) {
        return NextResponse.json({ success: false, error: "Invalid preset key specified" }, { status: 400 });
      }

      const academicClass = await prisma.academicClass.findUnique({
        where: { id: classId },
        select: { institutionId: true },
      });
      if (!academicClass) {
        return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });
      }

      // Upsert subjects in master catalog and map to class
      for (const item of preset.subjects) {
        let subject = await prisma.subject.findFirst({
          where: { institutionId: academicClass.institutionId, subjectCode: item.code },
        });

        if (!subject) {
          subject = await prisma.subject.create({
            data: {
              institutionId: academicClass.institutionId,
              subjectCode: item.code,
              name: item.name,
            },
          });
        }

        await prisma.classSubjectMapping.upsert({
          where: {
            classId_groupType_subjectId: {
              classId,
              groupType,
              subjectId: subject.id,
            },
          },
          update: {
            subjectType: item.type,
          },
          create: {
            classId,
            groupType,
            subjectId: subject.id,
            subjectType: item.type,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Applied ${preset.name} with ${preset.subjects.length} subjects mapped to this class & group!`,
      });
    }

    // 6. Copy / Clone mapping from another Class / Group
    if (action === "copy_from") {
      const { targetClassId, targetGroupType, sourceClassId, sourceGroupType } = body;
      if (!targetClassId || !targetGroupType || !sourceClassId || !sourceGroupType) {
        return NextResponse.json(
          { success: false, error: "sourceClassId, sourceGroupType, targetClassId, and targetGroupType required" },
          { status: 400 }
        );
      }

      const sourceMappings = await prisma.classSubjectMapping.findMany({
        where: {
          classId: sourceClassId,
          groupType: sourceGroupType,
        },
      });

      if (sourceMappings.length === 0) {
        return NextResponse.json(
          { success: false, error: "No subjects found in the selected source Class & Group to copy" },
          { status: 400 }
        );
      }

      for (const m of sourceMappings) {
        await prisma.classSubjectMapping.upsert({
          where: {
            classId_groupType_subjectId: {
              classId: targetClassId,
              groupType: targetGroupType,
              subjectId: m.subjectId,
            },
          },
          update: {
            subjectType: m.subjectType,
            creditWeight: m.creditWeight,
          },
          create: {
            classId: targetClassId,
            groupType: targetGroupType,
            subjectId: m.subjectId,
            subjectType: m.subjectType,
            creditWeight: m.creditWeight,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully copied ${sourceMappings.length} subject mappings!`,
      });
    }

    // 7. Create New Master Subject & Map to Class
    if (action === "create_subject_and_map") {
      const { classId, groupType = "SCIENCE", subjectCode, name, subjectType = "MANDATORY" } = body;
      if (!name || !classId) {
        return NextResponse.json({ success: false, error: "Subject name and classId are required" }, { status: 400 });
      }

      const academicClass = await prisma.academicClass.findUnique({
        where: { id: classId },
        select: { institutionId: true },
      });
      if (!academicClass) {
        return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });
      }

      const cleanCode = subjectCode ? String(subjectCode).trim() : null;
      const cleanName = String(name).trim();

      if (!cleanName) {
        return NextResponse.json({ success: false, error: "Subject name cannot be empty" }, { status: 400 });
      }

      let subject = null;
      if (cleanCode) {
        subject = await prisma.subject.findFirst({
          where: { institutionId: academicClass.institutionId, subjectCode: cleanCode },
        });
      }

      if (!subject) {
        subject = await prisma.subject.findFirst({
          where: { institutionId: academicClass.institutionId, name: cleanName },
        });
      }

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            institutionId: academicClass.institutionId,
            subjectCode: cleanCode || null,
            name: cleanName,
          },
        });
      } else if (cleanCode && !subject.subjectCode) {
        subject = await prisma.subject.update({
          where: { id: subject.id },
          data: { subjectCode: cleanCode },
        });
      }

      const mapping = await prisma.classSubjectMapping.upsert({
        where: {
          classId_groupType_subjectId: {
            classId,
            groupType,
            subjectId: subject.id,
          },
        },
        update: { subjectType },
        create: {
          classId,
          groupType,
          subjectId: subject.id,
          subjectType,
        },
        include: { subject: true },
      });

      return NextResponse.json({ success: true, data: mapping });
    }

    // 8. Sync Mappings to Enrolled Students
    if (action === "sync_to_students") {
      const { classId, groupType } = body;
      if (!classId) {
        return NextResponse.json({ success: false, error: "classId is required" }, { status: 400 });
      }

      const studentWhere: any = { classId };
      if (groupType && groupType !== "ALL" && groupType !== "MANDATORY") {
        studentWhere.groupType = groupType;
      }

      const enrollments = await prisma.studentEnrollment.findMany({
        where: studentWhere,
        include: {
          allocations: true,
        },
      });

      const mappings = await prisma.classSubjectMapping.findMany({
        where: {
          classId,
          ...(groupType && groupType !== "ALL"
            ? groupType === "MANDATORY"
              ? { OR: [{ groupType: "MANDATORY" }, { subjectType: "MANDATORY" }, { groupType: "ALL" }] }
              : { groupType: { in: [groupType, "ALL", "MANDATORY"] } }
            : {}),
        },
        include: { subject: true },
      });

      if (mappings.length === 0) {
        return NextResponse.json(
          { success: false, error: "No subjects are mapped for this Class & Group. Please map subjects first." },
          { status: 400 }
        );
      }

      let updatedCount = 0;

      for (const enr of enrollments) {
        // Find existing 4th subject if any
        const existing4th = enr.allocations.find((a) => a.subjectType === "OPTIONAL_4TH");

        for (const m of mappings) {
          // If the student already chose this subject as 4th subject, keep OPTIONAL_4TH
          const is4th = existing4th?.subjectId === m.subjectId || m.subjectType === "OPTIONAL_4TH";
          const finalType = is4th ? "OPTIONAL_4TH" : m.subjectType;

          await prisma.studentSubjectAllocation.upsert({
            where: {
              enrollmentId_subjectId: {
                enrollmentId: enr.id,
                subjectId: m.subjectId,
              },
            },
            update: {
              subjectType: finalType,
            },
            create: {
              enrollmentId: enr.id,
              subjectId: m.subjectId,
              subjectType: finalType,
            },
          });
        }
        updatedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${mappings.length} subjects to ${updatedCount} enrolled student(s)!`,
        updatedCount,
      });
    }

    // 9. Delete subject(s) from catalog pool
    if (action === "delete_catalog_subject" || action === "delete_from_catalog") {
      const { subjectId, subjectIds } = body;
      const idsToDelete: string[] = subjectIds || (subjectId ? [subjectId] : []);
      if (idsToDelete.length === 0) {
        return NextResponse.json({ success: false, error: "subjectId or subjectIds required" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.processedSubjectResult.deleteMany({ where: { subjectId: { in: idsToDelete } } });
        await tx.studentMark.deleteMany({ where: { subjectId: { in: idsToDelete } } });
        await tx.studentSubjectAllocation.deleteMany({ where: { subjectId: { in: idsToDelete } } });
        await tx.examSubjectConfig.deleteMany({ where: { subjectId: { in: idsToDelete } } });
        await tx.classSubjectMapping.deleteMany({ where: { subjectId: { in: idsToDelete } } });
        await tx.subject.deleteMany({ where: { id: { in: idsToDelete } } });
      });

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${idsToDelete.length} subject(s) from catalog pool`,
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Class Subject Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
