import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseAccessibleModules,
  serializeAccessibleModules,
} from "@/lib/institutionModules";

// GET /api/super-admin/institutions/[id] - Get details of one institution
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const institution = await prisma.institution.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            students: true,
            classes: true,
            exams: true,
            academicYears: true,
          },
        },
      },
    });

    if (!institution) {
      return NextResponse.json(
        { success: false, error: "Institution not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...institution,
        accessibleModules: parseAccessibleModules(institution.notes),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch institution", details: error.message },
      { status: 500 }
    );
  }
}

// PUT / PATCH /api/super-admin/institutions/[id] - Update institution and assign ID/password
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      nameBn,
      address,
      contactEmail,
      contactPhone,
      adminId,
      adminPassword,
      status,
      smsSenderId,
      smsApiKey,
      accessibleModules,
    } = body;

    const existing = await prisma.institution.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Institution not found" },
        { status: 404 }
      );
    }

    // If code is being changed, check for conflict
    if (code && code !== existing.code) {
      const conflict = await prisma.institution.findUnique({
        where: { code: code.trim() },
      });
      if (conflict && conflict.id !== params.id) {
        return NextResponse.json(
          { success: false, error: `Institution with code '${code}' already exists` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.institution.update({
      where: { id: params.id },
      data: {
        ...(code && { code: code.trim() }),
        ...(name && { name: name.trim() }),
        ...(nameBn !== undefined && { nameBn: nameBn?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(contactEmail !== undefined && { contactEmail: contactEmail?.trim() || null }),
        ...(contactPhone !== undefined && { contactPhone: contactPhone?.trim() || null }),
        ...(adminId !== undefined && { adminId: adminId?.trim() || null }),
        ...(adminPassword !== undefined && { adminPassword: adminPassword?.trim() || null }),
        ...(status && { status }),
        ...(smsSenderId !== undefined && { smsSenderId: smsSenderId?.trim() || null }),
        ...(smsApiKey !== undefined && { smsApiKey: smsApiKey?.trim() || null }),
        ...(accessibleModules !== undefined && {
          notes: serializeAccessibleModules(accessibleModules, existing.notes),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Institution and admin credentials updated successfully",
      data: {
        ...updated,
        accessibleModules: parseAccessibleModules(updated.notes),
      },
    });
  } catch (error: any) {
    console.error("Error updating institution:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update institution", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/institutions/[id] - Remove institution
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.institution.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Institution not found" },
        { status: 404 }
      );
    }

    // Delete institution (Prisma cascade relations will clean up dependent models)
    await prisma.institution.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: `Institution '${existing.name}' was successfully deleted`,
    });
  } catch (error: any) {
    console.error("Error deleting institution:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete institution", details: error.message },
      { status: 500 }
    );
  }
}
