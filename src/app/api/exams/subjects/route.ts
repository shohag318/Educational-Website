import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to determine standard default components
function getDefaultComponents(code: string, name: string, totalMarks: number = 100) {
  const nameLower = name.toLowerCase();
  const isSciencePractical =
    ["136", "137", "138", "126"].includes(code) ||
    nameLower.includes("physics") ||
    nameLower.includes("chemistry") ||
    nameLower.includes("biology") ||
    nameLower.includes("practical") ||
    nameLower.includes("higher math") ||
    nameLower.includes("agriculture");

  const isIct = code === "154" || nameLower.includes("information and communication") || nameLower.includes("ict");

  if (totalMarks === 50) {
    if (isIct || isSciencePractical) {
      return [
        { componentName: "MCQ", fullMarks: 25, passMarks: 8, isMandatoryPass: true },
        { componentName: "PRACTICAL", fullMarks: 25, passMarks: 8, isMandatoryPass: true },
      ];
    }
    return [
      { componentName: "CQ", fullMarks: 35, passMarks: 12, isMandatoryPass: true },
      { componentName: "MCQ", fullMarks: 15, passMarks: 5, isMandatoryPass: true },
    ];
  }

  if (isSciencePractical) {
    return [
      { componentName: "CQ", fullMarks: 50, passMarks: 17, isMandatoryPass: true },
      { componentName: "MCQ", fullMarks: 25, passMarks: 8, isMandatoryPass: true },
      { componentName: "PRACTICAL", fullMarks: 25, passMarks: 8, isMandatoryPass: true },
    ];
  }

  return [
    { componentName: "CQ", fullMarks: 70, passMarks: 23, isMandatoryPass: true },
    { componentName: "MCQ", fullMarks: 30, passMarks: 10, isMandatoryPass: true },
  ];
}

// GET: Fetch assigned subjects, class mapped subjects, and available subjects for an exam
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ success: false, error: "examId is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        class: true,
        academicYear: true,
        gradingSystem: true,
        subjectConfigs: {
          include: {
            subject: true,
            components: {
              orderBy: { componentName: "asc" },
            },
          },
          orderBy: [
            { subject: { subjectCode: "asc" } },
          ],
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    // Fetch class-subject mappings for this exam's class
    const classMappings = await prisma.classSubjectMapping.findMany({
      where: { classId: exam.classId },
      include: { subject: true },
      orderBy: [
        { subjectType: "asc" },
        { subject: { subjectCode: "asc" } },
      ],
    });

    // Fetch all catalog subjects for this institution
    const allCatalogSubjects = await prisma.subject.findMany({
      where: { institutionId: exam.institutionId },
      orderBy: { subjectCode: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        exam,
        assignedConfigs: exam.subjectConfigs,
        classMappings,
        allCatalogSubjects,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Assign subjects or sync from class mappings
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, examId } = body;

    if (!examId) {
      return NextResponse.json({ success: false, error: "examId is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { class: true },
    });

    if (!exam) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    if (action === "sync_class_mappings") {
      // Find all class subject mappings for this exam's class
      const classMappings = await prisma.classSubjectMapping.findMany({
        where: { classId: exam.classId },
        include: { subject: true },
      });

      if (classMappings.length === 0) {
        return NextResponse.json({
          success: false,
          error: "No subjects are mapped to this class in Step 2. Please map subjects to the class first, or assign subjects manually.",
        }, { status: 400 });
      }

      let addedCount = 0;
      for (const mapping of classMappings) {
        const groupType = (mapping.groupType === "ALL" || mapping.groupType === "MANDATORY") ? "GENERAL" : mapping.groupType;

        // Check if config already exists for this exam, subject, and group
        const existing = await prisma.examSubjectConfig.findUnique({
          where: {
            examId_subjectId_groupType: {
              examId,
              subjectId: mapping.subjectId,
              groupType,
            },
          },
        });

        if (!existing) {
          const comps = getDefaultComponents(mapping.subject.subjectCode || "", mapping.subject.name);
          const totalMarks = comps.reduce((acc, c) => acc + c.fullMarks, 0);

          await prisma.examSubjectConfig.create({
            data: {
              examId,
              subjectId: mapping.subjectId,
              groupType,
              totalFullMarks: totalMarks,
              passMode: "COMPONENT_WISE",
              aggregatePassMark: 33,
              creditWeight: mapping.creditWeight || 1.0,
              components: {
                create: comps.map((c) => ({
                  componentName: c.componentName,
                  fullMarks: c.fullMarks,
                  passMarks: c.passMarks,
                  isMandatoryPass: c.isMandatoryPass,
                })),
              },
            },
          });
          addedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${addedCount} subject(s) to this examination.`,
        addedCount,
      });
    }

    // Manual assign one or multiple subjects
    const {
      subjectIds,
      subjectId,
      groupType = "GENERAL",
      totalFullMarks = 100,
      passMode = "COMPONENT_WISE",
      aggregatePassMark = 33,
      creditWeight = 1.0,
      components,
    } = body;

    const targetSubjectIds: string[] = Array.isArray(subjectIds) && subjectIds.length > 0
      ? subjectIds
      : subjectId ? [subjectId] : [];

    if (targetSubjectIds.length === 0) {
      return NextResponse.json({ success: false, error: "Please select at least one subject to assign." }, { status: 400 });
    }

    const assignedConfigs = [];

    for (const subId of targetSubjectIds) {
      const subject = await prisma.subject.findUnique({ where: { id: subId } });
      if (!subject) continue;

      // Determine appropriate group type
      let resolvedGroupType = groupType;
      if (!resolvedGroupType || resolvedGroupType === "ALL" || resolvedGroupType === "MANDATORY") {
        const mapping = await prisma.classSubjectMapping.findFirst({
          where: { classId: exam.classId, subjectId: subId },
        });
        if (mapping && mapping.groupType && mapping.groupType !== "ALL") {
          resolvedGroupType = mapping.groupType;
        } else {
          const nameLower = subject.name.toLowerCase();
          if (
            ["136", "137", "138", "126"].includes(subject.subjectCode || "") ||
            nameLower.includes("physics") ||
            nameLower.includes("chemistry") ||
            nameLower.includes("biology") ||
            nameLower.includes("higher math")
          ) {
            resolvedGroupType = "SCIENCE";
          } else if (
            nameLower.includes("accounting") ||
            nameLower.includes("finance") ||
            nameLower.includes("business")
          ) {
            resolvedGroupType = "BUSINESS_STUDIES";
          } else if (
            nameLower.includes("history") ||
            nameLower.includes("geography") ||
            nameLower.includes("civics") ||
            nameLower.includes("economics") ||
            nameLower.includes("islamic history")
          ) {
            resolvedGroupType = "HUMANITIES";
          } else {
            resolvedGroupType = "GENERAL";
          }
        }
      }

      const totalMarksVal = parseFloat(String(totalFullMarks)) || 100;
      const comps = Array.isArray(components) && components.length > 0
        ? components
        : getDefaultComponents(subject.subjectCode || "", subject.name, totalMarksVal);

      const computedTotal = parseFloat(String(totalFullMarks)) || comps.reduce((acc: number, c: any) => acc + (parseFloat(c.fullMarks) || 0), 0);

      // Upsert config
      const config = await prisma.examSubjectConfig.upsert({
        where: {
          examId_subjectId_groupType: {
            examId,
            subjectId: subId,
            groupType: resolvedGroupType,
          },
        },
        update: {
          totalFullMarks: computedTotal,
          passMode,
          aggregatePassMark: parseFloat(aggregatePassMark) || 33,
          creditWeight: parseFloat(creditWeight) || 1.0,
        },
        create: {
          examId,
          subjectId: subId,
          groupType: resolvedGroupType,
          totalFullMarks: computedTotal,
          passMode,
          aggregatePassMark: parseFloat(aggregatePassMark) || 33,
          creditWeight: parseFloat(creditWeight) || 1.0,
        },
      });

      // Clear existing components and insert newly configured ones
      await prisma.assessmentComponent.deleteMany({
        where: { examSubjectConfigId: config.id },
      });

      if (comps && comps.length > 0) {
        await prisma.assessmentComponent.createMany({
          data: comps.map((c: any) => ({
            examSubjectConfigId: config.id,
            componentName: c.componentName,
            fullMarks: parseFloat(c.fullMarks) || 0,
            passMarks: parseFloat(c.passMarks) || 0,
            isMandatoryPass: c.isMandatoryPass ?? true,
          })),
        });
      }

      assignedConfigs.push(config);
    }

    return NextResponse.json({
      success: true,
      message: `Assigned ${assignedConfigs.length} subject(s) to examination.`,
      count: assignedConfigs.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update an assigned subject config
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { configId, groupType, totalFullMarks, passMode, aggregatePassMark, creditWeight, components } = body;

    if (!configId) {
      return NextResponse.json({ success: false, error: "configId is required" }, { status: 400 });
    }

    const updated = await prisma.examSubjectConfig.update({
      where: { id: configId },
      data: {
        ...(groupType ? { groupType } : {}),
        ...(totalFullMarks !== undefined ? { totalFullMarks: parseFloat(totalFullMarks) } : {}),
        ...(passMode ? { passMode } : {}),
        ...(aggregatePassMark !== undefined ? { aggregatePassMark: parseFloat(aggregatePassMark) } : {}),
        ...(creditWeight !== undefined ? { creditWeight: parseFloat(creditWeight) } : {}),
      },
    });

    if (Array.isArray(components)) {
      await prisma.assessmentComponent.deleteMany({
        where: { examSubjectConfigId: configId },
      });

      if (components.length > 0) {
        await prisma.assessmentComponent.createMany({
          data: components.map((c: any) => ({
            examSubjectConfigId: configId,
            componentName: c.componentName,
            fullMarks: parseFloat(c.fullMarks) || 0,
            passMarks: parseFloat(c.passMarks) || 0,
            isMandatoryPass: c.isMandatoryPass ?? true,
          })),
        });
      }
    }

    return NextResponse.json({ success: true, data: updated, message: "Subject configuration updated successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove one or multiple assigned subject configs from an exam
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const configId = searchParams.get("configId");
    const configIdsParam = searchParams.get("configIds");

    let idsToDelete: string[] = [];
    if (configIdsParam) {
      idsToDelete = configIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (configId) {
      idsToDelete = [configId];
    } else {
      try {
        const body = await req.json();
        if (Array.isArray(body.configIds)) {
          idsToDelete = body.configIds;
        } else if (body.configId) {
          idsToDelete = [body.configId];
        }
      } catch {}
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ success: false, error: "configId or configIds parameter is required" }, { status: 400 });
    }

    // Delete child assessment components first
    await prisma.assessmentComponent.deleteMany({
      where: { examSubjectConfigId: { in: idsToDelete } },
    });

    // Delete the configs
    await prisma.examSubjectConfig.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully unassigned ${idsToDelete.length} subject(s) from examination.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
