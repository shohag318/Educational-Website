import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const subjectId = searchParams.get("subjectId");
    const shift = searchParams.get("shift");
    const groupType = searchParams.get("groupType") || searchParams.get("group");

    if (!examId || !subjectId) {
      return NextResponse.json({ success: false, error: "examId and subjectId are required" }, { status: 400 });
    }

    // Fetch target exam to align academic year and class
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true },
    });
    if (!exam) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    const targetClassId = classId || exam.classId;

    // Find target subject details
    const targetSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    // Find all subject IDs sharing this code in this institution
    const matchingSubjectIds = targetSubject?.subjectCode
      ? (
          await prisma.subject.findMany({
            where: {
              subjectCode: targetSubject.subjectCode,
              institutionId: exam.institutionId,
            },
            select: { id: true },
          })
        ).map((s) => s.id)
      : [subjectId];

    // Get Subject Config and Components for this exam
    const config = await prisma.examSubjectConfig.findFirst({
      where: { examId, subjectId: { in: matchingSubjectIds } },
      include: { components: true, subject: true },
    });

    const whereClause: any = {
      classId: targetClassId,
      academicYearId: exam.academicYearId,
      ...(sectionId ? { sectionId } : {}),
      // Only include students who have actively taken/allocated this subject
      allocations: {
        some: { subjectId: { in: matchingSubjectIds } },
      },
    };

    if (shift && shift !== "ALL") {
      whereClause.section = { shift: shift.toUpperCase() };
    }

    if (groupType && groupType !== "ALL") {
      whereClause.groupType = groupType;
    } else if (config?.groupType && config.groupType !== "GENERAL" && config.groupType !== "ALL") {
      // If subject belongs to a specific group (e.g. SCIENCE), only include students in that group
      whereClause.OR = [
        { groupType: config.groupType },
        { section: { groupType: config.groupType } },
      ];
    }

    // Find students allocated to this subject
    const enrollments = await prisma.studentEnrollment.findMany({
      where: whereClause,
      include: {
        student: true,
        class: true,
        section: true,
        allocations: { where: { subjectId: { in: matchingSubjectIds } } },
        marks: {
          where: { examId, subjectId: { in: matchingSubjectIds } },
          include: { components: true },
        },
      },
      orderBy: { classRoll: "asc" },
    });

    const rows = enrollments.map((enr) => {
      const markEntry = enr.marks[0];
      const alloc = enr.allocations[0];
      const componentValues: Record<string, number> = {};

      if (markEntry) {
        for (const c of markEntry.components) {
          const compDef = config?.components.find((cd) => cd.id === c.componentId);
          if (compDef) {
            componentValues[compDef.componentName] = c.obtainedMarks;
          }
        }
      }

      return {
        enrollmentId: enr.id,
        roll: enr.classRoll,
        studentIdNo: enr.student.studentIdNo,
        name: `${enr.student.firstName} ${enr.student.lastName}`,
        subjectType: alloc?.subjectType || "MANDATORY",
        isAbsent: markEntry?.isAbsent ?? false,
        isOverride: markEntry?.isOverride ?? false,
        components: componentValues,
        sectionName: enr.section?.name,
        sectionShift: enr.section?.shift,
      };
    });

    return NextResponse.json({
      success: true,
      config,
      rows,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Bulk Save Marks
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId, subjectId, entries, isOverride, auditReason, modifiedBy, ctMaxMark } = body;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error("Exam not found");

    if (exam.status === "PUBLISHED") {
      throw new Error("Exam is PUBLISHED. Modifications are strictly locked.");
    }

    const config = await prisma.examSubjectConfig.findFirst({
      where: { examId, subjectId },
      include: { components: true },
    });

    if (!config) throw new Error("Subject configuration not found for this exam");

    const compNameToId = new Map<string, string>();
    for (const c of config.components) {
      compNameToId.set(c.componentName, c.id);
    }

    // If ctMaxMark is provided, update existing CT component fullMarks and config totalFullMarks
    if (ctMaxMark && typeof ctMaxMark === "number" && ctMaxMark > 0) {
      if (compNameToId.has("CT")) {
        await prisma.assessmentComponent.update({
          where: { id: compNameToId.get("CT")! },
          data: { fullMarks: ctMaxMark },
        });
      }
      await prisma.examSubjectConfig.update({
        where: { id: config.id },
        data: { totalFullMarks: ctMaxMark },
      });
    }

    // If CT marks are submitted and config doesn't have a CT component yet, register it dynamically
    const hasCtEntry = entries.some(
      (e: any) => e.components && e.components.CT !== undefined && e.components.CT !== ""
    );
    if (hasCtEntry && !compNameToId.has("CT")) {
      const ctComp = await prisma.assessmentComponent.create({
        data: {
          examSubjectConfigId: config.id,
          componentName: "CT",
          fullMarks: ctMaxMark && ctMaxMark > 0 ? ctMaxMark : 20,
          passMarks: 0,
          isMandatoryPass: false,
        },
      });
      compNameToId.set("CT", ctComp.id);
    }

    for (const item of entries) {
      const { enrollmentId, isAbsent, components } = item;

      // Upsert StudentMark
      const studentMark = await prisma.studentMark.upsert({
        where: {
          examId_enrollmentId_subjectId: {
            examId,
            enrollmentId,
            subjectId,
          },
        },
        update: {
          isAbsent: !!isAbsent,
          isOverride: !!isOverride,
        },
        create: {
          examId,
          enrollmentId,
          subjectId,
          isAbsent: !!isAbsent,
          isOverride: !!isOverride,
        },
        include: { components: true },
      });

      // Audit Log if override
      if (isOverride && auditReason) {
        await prisma.markAuditLog.create({
          data: {
            studentMarkId: studentMark.id,
            modifiedBy: modifiedBy || "ADMIN",
            previousValue: JSON.stringify(studentMark.components),
            newValue: JSON.stringify(components),
            reason: auditReason,
          },
        });
      }

      // Upsert component entries
      if (components && typeof components === "object") {
        for (const [compName, markVal] of Object.entries(components)) {
          const compId = compNameToId.get(compName);
          if (compId) {
            const numVal = Math.max(0, parseFloat(String(markVal)) || 0);
            await prisma.markComponentEntry.upsert({
              where: {
                studentMarkId_componentId: {
                  studentMarkId: studentMark.id,
                  componentId: compId,
                },
              },
              update: { obtainedMarks: numVal },
              create: {
                studentMarkId: studentMark.id,
                componentId: compId,
                obtainedMarks: numVal,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, count: entries.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
