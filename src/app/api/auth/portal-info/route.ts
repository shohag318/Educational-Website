import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAccessibleModules } from "@/lib/institutionModules";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code") || searchParams.get("inst");

    if (!code) {
      // Return list of active institutions (minimal info for dropdown)
      const list = await prisma.institution.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          code: true,
          name: true,
          nameBn: true,
          address: true,
          adminId: true,
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ success: true, list });
    }

    const cleanCode = code.trim();
    const inst = await prisma.institution.findFirst({
      where: {
        OR: [
          { code: cleanCode },
          { id: cleanCode },
          { slug: cleanCode },
        ],
      },
      select: {
        id: true,
        code: true,
        name: true,
        nameBn: true,
        address: true,
        contactEmail: true,
        contactPhone: true,
        adminId: true,
        status: true,
        notes: true,
      },
    });

    if (!inst) {
      return NextResponse.json(
        { success: false, error: "Institution not found" },
        { status: 404 }
      );
    }

    const accessibleModules = parseAccessibleModules(inst.notes);
    return NextResponse.json({
      success: true,
      institution: {
        ...inst,
        accessibleModules,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch institution info", details: error.message },
      { status: 500 }
    );
  }
}
