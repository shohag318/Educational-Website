import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const classes = await prisma.academicClass.findMany({
      where: { institutionId: tenant.id },
      include: {
        sections: {
          include: {
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { numericValue: "asc" },
    });
    return NextResponse.json({ success: true, data: classes, tenant });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, numericValue, shift, institutionId } = body;

    const tenant = await getTenantInstitution(req);
    const targetInstId = institutionId || tenant.id;

    const newClass = await prisma.academicClass.create({
      data: {
        institutionId: targetInstId,
        name,
        numericValue: parseInt(numericValue, 10),
        shift: shift ? shift.toUpperCase() : "DAY",
      },
    });

    return NextResponse.json({ success: true, data: newClass });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { classId, sectionName, groupType, shift, capacity } = body;

    const section = await prisma.section.create({
      data: {
        classId,
        name: sectionName,
        groupType: groupType || "GENERAL",
        shift: shift ? shift.toUpperCase() : "DAY",
        capacity: capacity ? parseInt(capacity, 10) : 60,
      },
    });

    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, numericValue, shift } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Class ID is required" }, { status: 400 });
    }

    const updatedClass = await prisma.academicClass.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(numericValue !== undefined ? { numericValue: parseInt(numericValue, 10) } : {}),
        ...(shift ? { shift: shift.toUpperCase() } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updatedClass });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const sectionId = searchParams.get("sectionId");

    if (sectionId) {
      await prisma.section.delete({
        where: { id: sectionId },
      });
      return NextResponse.json({ success: true, message: "Section removed successfully" });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Class ID is required" }, { status: 400 });
    }

    await prisma.academicClass.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Class removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
