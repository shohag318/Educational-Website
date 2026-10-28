import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAccessibleModules } from "@/lib/institutionModules";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { institutionCode, adminId, password } = body;

    if (!adminId || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter both Admin ID and Password" },
        { status: 400 }
      );
    }

    const cleanId = adminId.trim();
    const cleanPass = password.trim();

    let institution = null;

    if (institutionCode && institutionCode.trim()) {
      const code = institutionCode.trim();
      // Look up with code
      institution = await prisma.institution.findFirst({
        where: {
          OR: [
            { code: code },
            { id: code },
            { slug: code },
          ],
        },
      });

      if (!institution) {
        return NextResponse.json(
          { success: false, error: `Institution with code '${code}' was not found.` },
          { status: 404 }
        );
      }

      // Check credentials
      const idMatch =
        (institution.adminId && institution.adminId.toLowerCase() === cleanId.toLowerCase()) ||
        institution.code.toLowerCase() === cleanId.toLowerCase() ||
        (institution.contactEmail && institution.contactEmail.toLowerCase() === cleanId.toLowerCase());

      const passwordMatch =
        institution.adminPassword === cleanPass ||
        // Fallback default password format if not set
        cleanPass === `SmartAdmin@${institution.code}`;

      if (!idMatch || !passwordMatch) {
        return NextResponse.json(
          { success: false, error: "Invalid Admin ID or Password for this institution." },
          { status: 401 }
        );
      }
    } else {
      // Find across all institutions
      const allInstitutions = await prisma.institution.findMany();
      institution = allInstitutions.find((inst) => {
        const idMatches =
          (inst.adminId && inst.adminId.toLowerCase() === cleanId.toLowerCase()) ||
          inst.code.toLowerCase() === cleanId.toLowerCase() ||
          (inst.contactEmail && inst.contactEmail.toLowerCase() === cleanId.toLowerCase());

        const passMatches =
          inst.adminPassword === cleanPass ||
          cleanPass === `SmartAdmin@${inst.code}`;

        return idMatches && passMatches;
      });

      if (!institution) {
        return NextResponse.json(
          { success: false, error: "Invalid Admin ID or Password. No matching institution found." },
          { status: 401 }
        );
      }
    }

    if (institution.status === "SUSPENDED") {
      return NextResponse.json(
        { success: false, error: "This institution account is currently suspended. Please contact Smart Academy Super Admin." },
        { status: 403 }
      );
    }

    const accessibleModules = parseAccessibleModules(institution.notes);

    return NextResponse.json({
      success: true,
      message: "Login successful! Redirecting to campus dashboard...",
      institution: {
        id: institution.id,
        code: institution.code,
        name: institution.name,
        nameBn: institution.nameBn,
        address: institution.address,
        contactEmail: institution.contactEmail,
        contactPhone: institution.contactPhone,
        adminId: institution.adminId || `admin_${institution.code}`,
        status: institution.status,
        accessibleModules,
      },
      session: {
        token: `session_${institution.id}_${Date.now()}`,
        loginAt: new Date().toISOString(),
        role: "INSTITUTION_ADMIN",
        adminId: institution.adminId || `admin_${institution.code}`,
        accessibleModules,
      },
      redirectUrl: "/",
    });
  } catch (error: any) {
    console.error("Portal login error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication system error", details: error.message },
      { status: 500 }
    );
  }
}
