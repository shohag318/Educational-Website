import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

// POST: Apply a template's marks distribution to an Exam
export async function POST(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const body = await req.json();
    const { templateId, examId } = body;

    if (!templateId || !examId) {
      return NextResponse.json(
        { success: false, error: "Template ID and Exam ID are required" },
        { status: 400 }
      );
    }

    const template = await prisma.assessmentTemplate.findUnique({
      where: { id: templateId },
      include: {
        class: true,
        items: {
          include: { subject: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    const appliedConfigs = [];

    for (const item of template.items) {
      const config = await prisma.examSubjectConfig.upsert({
        where: {
          examId_subjectId_groupType: {
            examId,
            subjectId: item.subjectId,
            groupType: "GENERAL",
          },
        },
        update: {
          totalFullMarks: item.totalMarks,
          passMode: "COMPONENT_WISE",
          aggregatePassMark: item.passMarks,
        },
        create: {
          examId,
          subjectId: item.subjectId,
          groupType: "GENERAL",
          totalFullMarks: item.totalMarks,
          passMode: "COMPONENT_WISE",
          aggregatePassMark: item.passMarks,
        },
      });

      // Remove existing components and recreate based on template
      await prisma.assessmentComponent.deleteMany({
        where: { examSubjectConfigId: config.id },
      });

      // 1. CQ
      if (item.cqMarks > 0) {
        const cqPass = Math.round(item.cqMarks * 0.33);
        await prisma.assessmentComponent.create({
          data: {
            examSubjectConfigId: config.id,
            componentName: "CQ",
            fullMarks: item.cqMarks,
            passMarks: cqPass,
            isMandatoryPass: true,
          },
        });
      }

      // 2. MCQ
      if (item.mcqMarks > 0) {
        const mcqPass = Math.round(item.mcqMarks * 0.33);
        await prisma.assessmentComponent.create({
          data: {
            examSubjectConfigId: config.id,
            componentName: "MCQ",
            fullMarks: item.mcqMarks,
            passMarks: mcqPass,
            isMandatoryPass: true,
          },
        });
      }

      // 3. Practical
      if (item.practicalMarks > 0) {
        const practicalPass = Math.round(item.practicalMarks * 0.33);
        await prisma.assessmentComponent.create({
          data: {
            examSubjectConfigId: config.id,
            componentName: "PRACTICAL",
            fullMarks: item.practicalMarks,
            passMarks: practicalPass,
            isMandatoryPass: true,
          },
        });
      }

      appliedConfigs.push(config);
    }

    return NextResponse.json({
      success: true,
      message: `Template "${template.name}" successfully applied to "${exam.name}" (${appliedConfigs.length} subjects configured)`,
      count: appliedConfigs.length,
    });
  } catch (error: any) {
    console.error("POST /api/rules/templates/apply error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
