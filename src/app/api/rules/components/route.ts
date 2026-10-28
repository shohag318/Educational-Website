import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId, subjectId, subjectIds, groupType, totalFullMarks, passMode, aggregatePassMark, components } = body;

    // Support both multiple subjectIds (checkboxes) and single subjectId
    const targetSubjectIds: string[] = Array.isArray(subjectIds) && subjectIds.length > 0
      ? subjectIds
      : (subjectId ? [subjectId] : []);

    if (!examId || targetSubjectIds.length === 0) {
      return NextResponse.json({ success: false, error: "Please select an Exam and at least one Subject" }, { status: 400 });
    }

    const savedConfigs = [];

    for (const subId of targetSubjectIds) {
      const config = await prisma.examSubjectConfig.upsert({
        where: {
          examId_subjectId_groupType: {
            examId,
            subjectId: subId,
            groupType: groupType || "GENERAL",
          },
        },
        update: {
          totalFullMarks: parseFloat(totalFullMarks),
          passMode,
          aggregatePassMark: parseFloat(aggregatePassMark),
        },
        create: {
          examId,
          subjectId: subId,
          groupType: groupType || "GENERAL",
          totalFullMarks: parseFloat(totalFullMarks),
          passMode,
          aggregatePassMark: parseFloat(aggregatePassMark),
        },
      });

      // Delete existing components and recreate
      await prisma.assessmentComponent.deleteMany({
        where: { examSubjectConfigId: config.id },
      });

      if (components && Array.isArray(components)) {
        for (const comp of components) {
          await prisma.assessmentComponent.create({
            data: {
              examSubjectConfigId: config.id,
              componentName: comp.componentName,
              fullMarks: parseFloat(comp.fullMarks),
              passMarks: parseFloat(comp.passMarks),
              isMandatoryPass: comp.isMandatoryPass ?? true,
            },
          });
        }
      }

      savedConfigs.push(config);
    }

    return NextResponse.json({ success: true, count: savedConfigs.length, data: savedConfigs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    const where: any = {};
    if (tenant) {
      where.exam = { institutionId: tenant.id };
    }
    if (examId && examId !== "ALL") {
      where.examId = examId;
    }

    const configs = await prisma.examSubjectConfig.findMany({
      where,
      include: {
        exam: {
          include: {
            class: true,
            academicYear: true,
          },
        },
        subject: true,
        components: {
          orderBy: { componentName: "asc" },
        },
      },
      orderBy: [
        { exam: { name: "asc" } },
        { subject: { subjectCode: "asc" } },
      ],
    });

    return NextResponse.json({ success: true, data: configs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Config ID is required" }, { status: 400 });
    }

    await prisma.assessmentComponent.deleteMany({
      where: { examSubjectConfigId: id },
    });

    await prisma.examSubjectConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Configuration deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

