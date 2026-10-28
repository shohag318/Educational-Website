import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseAccessibleModules,
  serializeAccessibleModules,
  ALL_INSTITUTION_MODULE_KEYS,
} from "@/lib/institutionModules";

// GET /api/super-admin/institutions - List all institutions with statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const status = searchParams.get("status") || "ALL";

    const institutions = await prisma.institution.findMany({
      orderBy: { createdAt: "desc" },
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

    let filtered = institutions;

    if (status !== "ALL") {
      filtered = filtered.filter((inst) => inst.status === status);
    }

    if (search) {
      filtered = filtered.filter(
        (inst) =>
          inst.name.toLowerCase().includes(search) ||
          (inst.nameBn && inst.nameBn.toLowerCase().includes(search)) ||
          inst.code.toLowerCase().includes(search) ||
          (inst.adminId && inst.adminId.toLowerCase().includes(search)) ||
          (inst.contactEmail && inst.contactEmail.toLowerCase().includes(search)) ||
          (inst.contactPhone && inst.contactPhone.toLowerCase().includes(search))
      );
    }

    // Transform and return with metadata
    const data = filtered.map((inst) => ({
      id: inst.id,
      code: inst.code,
      name: inst.name,
      nameBn: inst.nameBn,
      address: inst.address,
      contactEmail: inst.contactEmail,
      contactPhone: inst.contactPhone,
      adminId: inst.adminId || `admin_${inst.code}`,
      adminPassword: inst.adminPassword || `SmartAdmin@${inst.code}`,
      status: inst.status || "ACTIVE",
      slug: inst.slug || inst.code,
      smsSenderId: inst.smsSenderId,
      notes: inst.notes,
      accessibleModules: parseAccessibleModules(inst.notes),
      createdAt: inst.createdAt,
      updatedAt: inst.updatedAt,
      stats: {
        students: inst._count.students,
        classes: inst._count.classes,
        exams: inst._count.exams,
        academicYears: inst._count.academicYears,
      },
    }));

    // Overall summary metrics
    const totalCount = institutions.length;
    const activeCount = institutions.filter((i) => i.status === "ACTIVE").length;
    const totalStudents = institutions.reduce((acc, curr) => acc + curr._count.students, 0);

    return NextResponse.json({
      success: true,
      data,
      summary: {
        total: totalCount,
        active: activeCount,
        totalStudents,
      },
    });
  } catch (error: any) {
    console.error("Error fetching institutions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch institutions", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/institutions - Create a new institution
export async function POST(request: Request) {
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
      status = "ACTIVE",
      smsSenderId,
      smsApiKey,
      accessibleModules,
    } = body;

    // Validation
    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: "EIIN / Institution Code and Name are required" },
        { status: 400 }
      );
    }

    // Check if code/EIIN already exists
    const existing = await prisma.institution.findUnique({
      where: { code: code.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Institution with EIIN / Code '${code}' already exists.` },
        { status: 409 }
      );
    }

    const cleanCode = code.trim();
    const cleanAdminId = adminId?.trim() || `admin_${cleanCode}`;
    const cleanAdminPassword = adminPassword?.trim() || `SmartPass@${cleanCode}`;
    const cleanSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Create the institution in database
    const institution = await prisma.institution.create({
      data: {
        code: cleanCode,
        name: name.trim(),
        nameBn: nameBn?.trim() || null,
        address: address?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        adminId: cleanAdminId,
        adminPassword: cleanAdminPassword,
        status: status || "ACTIVE",
        slug: cleanSlug || cleanCode,
        smsSenderId: smsSenderId?.trim() || null,
        smsApiKey: smsApiKey?.trim() || null,
        notes: serializeAccessibleModules(
          Array.isArray(accessibleModules) && accessibleModules.length > 0
            ? accessibleModules
            : ALL_INSTITUTION_MODULE_KEYS
        ),
        academicYears: {
          create: {
            yearName: new Date().getFullYear().toString(),
            isCurrent: true,
            startDate: new Date(`${new Date().getFullYear()}-01-01`),
            endDate: new Date(`${new Date().getFullYear()}-12-31`),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Institution successfully created with assigned admin credentials",
      data: {
        ...institution,
        accessibleModules: parseAccessibleModules(institution.notes),
      },
    });
  } catch (error: any) {
    console.error("Error creating institution:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create institution", details: error.message },
      { status: 500 }
    );
  }
}
