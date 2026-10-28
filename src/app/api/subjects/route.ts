import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const classId = searchParams.get("classId");
    const groupType = searchParams.get("groupType") || searchParams.get("group");
    const examOnly = searchParams.get("examOnly") === "true" || searchParams.get("assignedOnly") === "true";
    const normalizedGroup = groupType?.toUpperCase();

    // 1. If examId is provided and examOnly is requested (or exam has configs assigned),
    // strictly return subjects that are assigned to this Target Exam
    if (examId) {
      const configWhere: any = { examId };
      if (normalizedGroup && normalizedGroup !== "ALL") {
        configWhere.groupType = { in: [normalizedGroup, "GENERAL", "ALL"] };
      }

      const examConfigs = await prisma.examSubjectConfig.findMany({
        where: configWhere,
        include: {
          subject: {
            include: {
              configs: { where: { examId }, include: { components: true } },
            },
          },
          components: {
            orderBy: { componentName: "asc" },
          },
        },
        orderBy: { subject: { subjectCode: "asc" } },
      });

      if (examConfigs.length > 0 || examOnly) {
        const subjectMap = new Map<string, any>();
        for (const ec of examConfigs) {
          if (ec.subject && !subjectMap.has(ec.subject.id)) {
            subjectMap.set(ec.subject.id, {
              ...ec.subject,
              groupType: ec.groupType,
              totalFullMarks: ec.totalFullMarks,
              passMode: ec.passMode,
              aggregatePassMark: ec.aggregatePassMark,
              components: ec.components,
            });
          }
        }

        let filteredSubjects = Array.from(subjectMap.values());
        filteredSubjects.sort((a, b) => {
          const codeA = parseInt(a.subjectCode) || 0;
          const codeB = parseInt(b.subjectCode) || 0;
          if (codeA !== codeB) return codeA - codeB;
          return a.name.localeCompare(b.name);
        });

        return NextResponse.json({ success: true, data: filteredSubjects });
      }
    }

    // 2. If classId is provided, filter subjects related to the selected class and group
    if (classId) {
      const mappingWhere: any = { classId };

      if (normalizedGroup && normalizedGroup !== "ALL") {
        mappingWhere.groupType = { in: [normalizedGroup, "ALL"] };
      }

      // 2.1 Fetch subjects explicitly mapped via ClassSubjectMapping
      const mappings = await prisma.classSubjectMapping.findMany({
        where: mappingWhere,
        include: {
          subject: {
            include: {
              configs: examId
                ? { where: { examId }, include: { components: true } }
                : { include: { components: true } },
            },
          },
        },
        orderBy: [
          { subjectType: "asc" },
          { subject: { subjectCode: "asc" } },
        ],
      });

      const subjectMap = new Map<string, any>();
      for (const m of mappings) {
        if (m.subject && !subjectMap.has(m.subject.id)) {
          subjectMap.set(m.subject.id, {
            ...m.subject,
            mappingType: m.subjectType,
          });
        }
      }

      let filteredSubjects = Array.from(subjectMap.values());

      // 2. Fallback: If no ClassSubjectMapping exists, check ExamSubjectConfig for this exam or class
      if (filteredSubjects.length === 0) {
        const configWhere: any = examId ? { examId } : { exam: { classId } };
        if (normalizedGroup && normalizedGroup !== "ALL") {
          configWhere.groupType = { in: [normalizedGroup, "GENERAL", "ALL"] };
        }
        const examConfigs = await prisma.examSubjectConfig.findMany({
          where: configWhere,
          include: {
            subject: {
              include: {
                configs: examId
                  ? { where: { examId }, include: { components: true } }
                  : { include: { components: true } },
              },
            },
          },
          orderBy: { subject: { subjectCode: "asc" } },
        });

        for (const ec of examConfigs) {
          if (ec.subject && !subjectMap.has(ec.subject.id)) {
            subjectMap.set(ec.subject.id, ec.subject);
          }
        }
        filteredSubjects = Array.from(subjectMap.values());
      }

      // 3. Fallback: If still empty, check StudentSubjectAllocation for students enrolled in this class & group
      if (filteredSubjects.length === 0) {
        const studentWhere: any = { classId };
        if (normalizedGroup && normalizedGroup !== "ALL") {
          studentWhere.groupType = normalizedGroup;
        }
        const allocations = await prisma.studentSubjectAllocation.findMany({
          where: { enrollment: studentWhere },
          include: {
            subject: {
              include: {
                configs: examId
                  ? { where: { examId }, include: { components: true } }
                  : { include: { components: true } },
              },
            },
          },
          orderBy: { subject: { subjectCode: "asc" } },
        });

        for (const al of allocations) {
          if (al.subject && !subjectMap.has(al.subject.id)) {
            subjectMap.set(al.subject.id, al.subject);
          }
        }
        filteredSubjects = Array.from(subjectMap.values());
      }

      // Sort by subjectCode numerically then alphabetically
      filteredSubjects.sort((a, b) => {
        const codeA = parseInt(a.subjectCode) || 0;
        const codeB = parseInt(b.subjectCode) || 0;
        if (codeA !== codeB) return codeA - codeB;
        return a.name.localeCompare(b.name);
      });

      return NextResponse.json({ success: true, data: filteredSubjects });
    }

    // Default: Return all subjects for this institution
    const tenant = await getTenantInstitution(req);
    const subjects = await prisma.subject.findMany({
      where: { institutionId: tenant.id },
      include: {
        configs: examId ? { where: { examId }, include: { components: true } } : { include: { components: true } },
        classMappings: {
          include: {
            class: true,
          },
        },
      },
      orderBy: { subjectCode: "asc" },
    });

    return NextResponse.json({ success: true, data: subjects, tenant });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subjectCode, name, institutionId } = body;

    const tenant = await getTenantInstitution(req);
    const instId = institutionId || tenant.id;

    const subject = await prisma.subject.create({
      data: {
        institutionId: instId,
        subjectCode: subjectCode ? String(subjectCode).trim() : null,
        name: String(name).trim(),
      },
    });

    return NextResponse.json({ success: true, data: subject });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update student subject allocation (supports single or batch assignment/removal)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { enrollmentId, enrollmentIds, subjectId, subjectIds, subjectType } = body;

    const targetEnrollmentIds: string[] =
      enrollmentIds && Array.isArray(enrollmentIds) && enrollmentIds.length > 0
        ? enrollmentIds
        : enrollmentId
        ? [enrollmentId]
        : [];

    const targetSubjectIds: string[] =
      subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0
        ? subjectIds
        : subjectId
        ? [subjectId]
        : [];

    if (targetEnrollmentIds.length === 0 || targetSubjectIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "enrollmentId(s) and subjectId(s) are required." },
        { status: 400 }
      );
    }

    // Process all assignments
    for (const enrId of targetEnrollmentIds) {
      // If setting to OPTIONAL_4TH, demote existing 4th subjects that are NOT in targetSubjectIds
      if (subjectType === "OPTIONAL_4TH") {
        await prisma.studentSubjectAllocation.updateMany({
          where: {
            enrollmentId: enrId,
            subjectType: "OPTIONAL_4TH",
            subjectId: { notIn: targetSubjectIds },
          },
          data: {
            subjectType: "GROUP_ELECTIVE",
          },
        });
      }

      for (const subId of targetSubjectIds) {
        if (subjectType === "NONE") {
          await prisma.studentSubjectAllocation.deleteMany({
            where: { enrollmentId: enrId, subjectId: subId },
          });
        } else {
          // A single subject cannot be both GROUP_ELECTIVE and OPTIONAL_4TH;
          // upsert ensures exactly ONE role for this subject for this student.
          await prisma.studentSubjectAllocation.upsert({
            where: {
              enrollmentId_subjectId: {
                enrollmentId: enrId,
                subjectId: subId,
              },
            },
            update: { subjectType },
            create: {
              enrollmentId: enrId,
              subjectId: subId,
              subjectType,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Subject allocation updated successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");

    let idsToDelete: string[] = [];
    if (ids) {
      idsToDelete = ids.split(",").filter(Boolean);
    } else if (id) {
      idsToDelete = [id];
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.subjectIds && Array.isArray(body.subjectIds)) {
        idsToDelete = body.subjectIds;
      } else if (body.subjectId || body.id) {
        idsToDelete = [body.subjectId || body.id];
      }
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ success: false, error: "Subject ID(s) required" }, { status: 400 });
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
