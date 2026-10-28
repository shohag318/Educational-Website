import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const examId = searchParams.get("examId");
    const session = searchParams.get("session");

    // Fetch classes and exams scoped strictly to this institution
    const classes = await prisma.academicClass.findMany({
      where: { institutionId: tenant.id },
      select: {
        id: true,
        name: true,
        numericValue: true,
        shift: true,
      },
      orderBy: { numericValue: "asc" },
    });

    const exams = await prisma.exam.findMany({
      where: {
        institutionId: tenant.id,
        ...(classId ? { classId } : {}),
      },
      select: {
        id: true,
        name: true,
        classId: true,
        termCode: true,
        academicYear: {
          select: {
            id: true,
            yearName: true,
          },
        },
        subjectConfigs: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const allSubjects = await prisma.subject.findMany({
      where: { institutionId: tenant.id },
      select: {
        id: true,
        subjectCode: true,
        name: true,
      },
      orderBy: { subjectCode: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        classes,
        exams,
        allSubjects,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
