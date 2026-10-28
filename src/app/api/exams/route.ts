import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const academicYearId = searchParams.get("academicYearId");
    const session = searchParams.get("session");

    const whereClause: any = {
      institutionId: tenant.id,
    };
    if (classId) whereClause.classId = classId;
    if (academicYearId && academicYearId !== "ALL") {
      whereClause.academicYearId = academicYearId;
    } else if (session && session !== "ALL") {
      whereClause.academicYear = { yearName: session, institutionId: tenant.id };
    }

    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: {
        institution: true,
        academicYear: true,
        class: true,
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
        _count: {
          select: {
            marks: true,
            processedResults: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: exams, tenant });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      termCode,
      classId,
      gradingSystemId,
      academicYearId,
      session,
      startDate,
      endDate,
      autoAssignSubjects = true,
      institutionId,
    } = body;

    const tenant = await getTenantInstitution(req);
    const instId = institutionId || tenant.id;

    let yearId = academicYearId;
    if (!yearId && session && session !== "ALL") {
      const yearBySession = await prisma.academicYear.findFirst({
        where: { institutionId: instId, yearName: session },
      });
      yearId = yearBySession?.id;
    }
    if (!yearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { institutionId: instId, isCurrent: true },
      });
      yearId = activeYear?.id;
    }
    if (!yearId) {
      const anyYear = await prisma.academicYear.findFirst({
        where: { institutionId: instId },
      });
      yearId = anyYear?.id;
    }

    let defaultGradingId = gradingSystemId;
    if (!defaultGradingId) {
      const g = await prisma.gradingSystem.findFirst({
        where: { institutionId: instId },
      });
      defaultGradingId = g?.id;
    }

    const exam = await prisma.exam.create({
      data: {
        institutionId: instId,
        name,
        termCode,
        classId,
        gradingSystemId: defaultGradingId,
        academicYearId: yearId,
        status: "DRAFT",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    if (autoAssignSubjects) {
      const classMappings = await prisma.classSubjectMapping.findMany({
        where: { classId },
        include: { subject: true },
      });

      for (const mapping of classMappings) {
        const code = mapping.subject.subjectCode || "";
        const nameLower = mapping.subject.name.toLowerCase();
        const isSciencePractical =
          ["136", "137", "138", "126"].includes(code) ||
          nameLower.includes("physics") ||
          nameLower.includes("chemistry") ||
          nameLower.includes("biology") ||
          nameLower.includes("practical") ||
          nameLower.includes("higher math") ||
          nameLower.includes("agriculture");

        const groupType = mapping.groupType === "ALL" ? "GENERAL" : mapping.groupType;

        await prisma.examSubjectConfig.create({
          data: {
            examId: exam.id,
            subjectId: mapping.subjectId,
            groupType,
            totalFullMarks: 100,
            passMode: "COMPONENT_WISE",
            aggregatePassMark: 33,
            creditWeight: mapping.creditWeight || 1.0,
            components: {
              create: isSciencePractical
                ? [
                    { componentName: "CQ", fullMarks: 50, passMarks: 17, isMandatoryPass: true },
                    { componentName: "MCQ", fullMarks: 25, passMarks: 8, isMandatoryPass: true },
                    { componentName: "PRACTICAL", fullMarks: 25, passMarks: 8, isMandatoryPass: true },
                  ]
                : [
                    { componentName: "CQ", fullMarks: 70, passMarks: 23, isMandatoryPass: true },
                    { componentName: "MCQ", fullMarks: 30, passMarks: 10, isMandatoryPass: true },
                  ],
            },
          },
        });
      }
    }

    const createdExam = await prisma.exam.findUnique({
      where: { id: exam.id },
      include: {
        academicYear: true,
        class: true,
        gradingSystem: true,
        subjectConfigs: {
          include: {
            subject: true,
            components: true,
          },
        },
        _count: {
          select: {
            marks: true,
            processedResults: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: createdExam });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update status (e.g. DRAFT -> MARK_ENTRY -> DRAFT_PREVIEW -> PUBLISHED)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { examId, status } = body;

    const updated = await prisma.exam.update({
      where: { id: examId },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update exam details (name, termCode, classId, session, dates)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, termCode, classId, academicYearId, session, startDate, endDate } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Exam ID is required" }, { status: 400 });
    }

    const tenant = await getTenantInstitution(req);

    let yearId = academicYearId;
    if (!yearId && session && session !== "ALL") {
      const yearBySession = await prisma.academicYear.findFirst({
        where: { institutionId: tenant.id, yearName: session },
      });
      yearId = yearBySession?.id;
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(termCode ? { termCode } : {}),
        ...(classId ? { classId } : {}),
        ...(yearId ? { academicYearId: yearId } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      },
      include: {
        academicYear: true,
        class: true,
        gradingSystem: true,
        subjectConfigs: {
          include: {
            subject: true,
            components: true,
          },
        },
        _count: {
          select: {
            marks: true,
            processedResults: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete exam and all cascading configurations/marks
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let examId = searchParams.get("id");

    if (!examId) {
      try {
        const body = await req.json();
        examId = body.id || body.examId;
      } catch {}
    }

    if (!examId) {
      return NextResponse.json({ success: false, error: "Exam ID is required" }, { status: 400 });
    }

    await prisma.exam.delete({
      where: { id: examId },
    });

    return NextResponse.json({ success: true, message: "Exam deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
