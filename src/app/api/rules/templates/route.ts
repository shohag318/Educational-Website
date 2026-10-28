import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

// GET: List all assessment templates for tenant
export async function GET(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const where: any = {
      institutionId: tenant.id,
    };

    if (classId && classId !== "ALL") {
      where.classId = classId;
    }

    const templates = await prisma.assessmentTemplate.findMany({
      where,
      include: {
        class: true,
        items: {
          include: {
            subject: true,
          },
          orderBy: {
            subject: {
              subjectCode: "asc",
            },
          },
        },
      },
      orderBy: [
        { class: { numericValue: "asc" } },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    console.error("GET /api/rules/templates error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new template with subjects & marks distribution
export async function POST(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const body = await req.json();
    const { name, classId, description, items } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Template Name is required" },
        { status: 400 }
      );
    }

    if (!classId) {
      return NextResponse.json(
        { success: false, error: "Please select a Class" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please select at least one Subject with marks distribution" },
        { status: 400 }
      );
    }

    // Validation: Check that CQ + MCQ + Practical == Total for every subject
    for (const item of items) {
      const total = parseFloat(item.totalMarks) || 0;
      const cq = parseFloat(item.cqMarks) || 0;
      const mcq = parseFloat(item.mcqMarks) || 0;
      const practical = parseFloat(item.practicalMarks) || 0;
      const sum = cq + mcq + practical;

      if (Math.abs(sum - total) > 0.01) {
        return NextResponse.json(
          {
            success: false,
            error: `Validation Failed: For subject ${item.subjectName || item.subjectId}, CQ (${cq}) + MCQ (${mcq}) + Practical (${practical}) = ${sum}, which does not equal Total Marks (${total}).`,
          },
          { status: 400 }
        );
      }
    }

    // Create template in transaction
    const template = await prisma.$transaction(async (tx) => {
      const created = await tx.assessmentTemplate.create({
        data: {
          institutionId: tenant.id,
          name: name.trim(),
          classId,
          description: description ? description.trim() : null,
        },
      });

      for (const item of items) {
        await tx.assessmentTemplateItem.create({
          data: {
            templateId: created.id,
            subjectId: item.subjectId,
            totalMarks: parseFloat(item.totalMarks) || 100,
            passMarks: parseFloat(item.passMarks) || 33,
            cqMarks: parseFloat(item.cqMarks) || 0,
            mcqMarks: parseFloat(item.mcqMarks) || 0,
            practicalMarks: parseFloat(item.practicalMarks) || 0,
          },
        });
      }

      return await tx.assessmentTemplate.findUnique({
        where: { id: created.id },
        include: {
          class: true,
          items: {
            include: { subject: true },
          },
        },
      });
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    console.error("POST /api/rules/templates error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing template
export async function PUT(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const body = await req.json();
    const { id, name, classId, description, items } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Template Name is required" }, { status: 400 });
    }

    if (!classId) {
      return NextResponse.json({ success: false, error: "Please select a Class" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "At least one Subject is required" }, { status: 400 });
    }

    // Validation: Check that CQ + MCQ + Practical == Total
    for (const item of items) {
      const total = parseFloat(item.totalMarks) || 0;
      const cq = parseFloat(item.cqMarks) || 0;
      const mcq = parseFloat(item.mcqMarks) || 0;
      const practical = parseFloat(item.practicalMarks) || 0;
      const sum = cq + mcq + practical;

      if (Math.abs(sum - total) > 0.01) {
        return NextResponse.json(
          {
            success: false,
            error: `Validation Failed: For subject ${item.subjectName || item.subjectId}, CQ (${cq}) + MCQ (${mcq}) + Practical (${practical}) = ${sum}, which does not equal Total Marks (${total}).`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.assessmentTemplate.update({
        where: { id },
        data: {
          name: name.trim(),
          classId,
          description: description ? description.trim() : null,
        },
      });

      // Delete existing items and recreate
      await tx.assessmentTemplateItem.deleteMany({
        where: { templateId: id },
      });

      for (const item of items) {
        await tx.assessmentTemplateItem.create({
          data: {
            templateId: id,
            subjectId: item.subjectId,
            totalMarks: parseFloat(item.totalMarks) || 100,
            passMarks: parseFloat(item.passMarks) || 33,
            cqMarks: parseFloat(item.cqMarks) || 0,
            mcqMarks: parseFloat(item.mcqMarks) || 0,
            practicalMarks: parseFloat(item.practicalMarks) || 0,
          },
        });
      }

      return await tx.assessmentTemplate.findUnique({
        where: { id },
        include: {
          class: true,
          items: {
            include: { subject: true },
          },
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/rules/templates error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a template
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 });
    }

    await prisma.assessmentTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Template deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/rules/templates error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
