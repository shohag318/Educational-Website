import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const systems = await prisma.gradingSystem.findMany({
      where: { institutionId: tenant.id },
      include: {
        slabs: {
          orderBy: { markMin: "desc" },
        },
      },
    });
    return NextResponse.json({ success: true, data: systems, tenant });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update 4th subject threshold or max GPA dynamically
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { gradingSystemId, fourthSubjectThreshold, maxGpa, passGpa, slabs } = body;

    const updated = await prisma.gradingSystem.update({
      where: { id: gradingSystemId },
      data: {
        fourthSubjectThreshold: parseFloat(fourthSubjectThreshold),
        maxGpa: parseFloat(maxGpa),
        passGpa: parseFloat(passGpa),
      },
    });

    if (slabs && Array.isArray(slabs)) {
      for (const s of slabs) {
        await prisma.gradeSlab.update({
          where: { id: s.id },
          data: {
            letterGrade: s.letterGrade,
            gradePoint: parseFloat(s.gradePoint),
            markMin: parseFloat(s.markMin),
            markMax: parseFloat(s.markMax),
            isFail: s.isFail,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
