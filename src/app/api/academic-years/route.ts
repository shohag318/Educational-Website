import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true" || searchParams.get("status") === "active";

    const whereClause: any = {
      institutionId: tenant.id,
    };
    if (activeOnly) {
      whereClause.isCurrent = true;
    }

    const years = await prisma.academicYear.findMany({
      where: whereClause,
      include: {
        institution: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            enrollments: true,
            exams: true,
          },
        },
      },
      orderBy: [{ isCurrent: "desc" }, { yearName: "desc" }],
    });
    return NextResponse.json({ success: true, data: years, tenant });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      yearName,
      startDate,
      endDate,
      isCurrent = false,
      allowMultiple = true,
      institutionId,
      selectedClasses,
    } = body;

    if (!yearName || typeof yearName !== "string" || !yearName.trim()) {
      return NextResponse.json(
        { success: false, error: "Session name (year) is required (e.g. 2026, 2026-2027)." },
        { status: 400 }
      );
    }

    const trimmedYear = yearName.trim();
    const tenant = await getTenantInstitution(req);
    const targetInstId = institutionId || tenant.id;

    // Check if session already exists for this institution
    const existing = await prisma.academicYear.findUnique({
      where: {
        institutionId_yearName: {
          institutionId: targetInstId,
          yearName: trimmedYear,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Academic session "${trimmedYear}" already exists for this institution.` },
        { status: 400 }
      );
    }

    // Default dates if not provided
    const parsedStart = startDate ? new Date(startDate) : new Date(`${trimmedYear.slice(0, 4)}-01-01T00:00:00.000Z`);
    const parsedEnd = endDate ? new Date(endDate) : new Date(`${trimmedYear.slice(0, 4)}-12-31T23:59:59.999Z`);

    // If marked current and NOT allowing multiple, deactivate other current sessions for this institution only
    if (isCurrent && !allowMultiple) {
      await prisma.academicYear.updateMany({
        where: { institutionId: targetInstId },
        data: { isCurrent: false },
      });
    }

    const newSession = await prisma.academicYear.create({
      data: {
        institutionId: targetInstId,
        yearName: trimmedYear,
        startDate: isNaN(parsedStart.getTime()) ? new Date() : parsedStart,
        endDate: isNaN(parsedEnd.getTime()) ? new Date() : parsedEnd,
        isCurrent: Boolean(isCurrent),
      },
      include: {
        institution: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            enrollments: true,
            exams: true,
          },
        },
      },
    });

    // Auto-provision or activate selected session classes
    if (Array.isArray(selectedClasses) && selectedClasses.length > 0) {
      for (const item of selectedClasses) {
        const className = typeof item === "string" ? item.trim() : item.name?.trim();
        if (!className) continue;

        let numVal =
          typeof item === "object" && typeof item.numericValue === "number"
            ? item.numericValue
            : parseInt(className.replace(/\D/g, ""), 10) || 0;

        const existingClass = await prisma.academicClass.findFirst({
          where: { institutionId: targetInstId, name: className },
        });

        if (!existingClass) {
          await prisma.academicClass.create({
            data: {
              institutionId: targetInstId,
              name: className,
              numericValue: numVal,
              shift: "DAY",
              sections: {
                create: {
                  name: "Section A",
                  groupType: numVal >= 11 ? "SCIENCE" : "GENERAL",
                  shift: "DAY",
                  capacity: 60,
                },
              },
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Session "${trimmedYear}" created successfully.`,
      data: newSession,
    });
  } catch (error: any) {
    console.error("Failed to create academic year session:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, yearName, startDate, endDate, isCurrent, allowMultiple = true } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Session ID is required for update." },
        { status: 400 }
      );
    }

    const existing = await prisma.academicYear.findUnique({
      where: { id },
      include: { institution: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Session not found." },
        { status: 404 }
      );
    }

    // If setting as active/current and NOT allowing multiple, deactivate all other sessions for this institution
    if (isCurrent && !allowMultiple) {
      await prisma.academicYear.updateMany({
        where: {
          institutionId: existing.institutionId,
          id: { not: id },
        },
        data: { isCurrent: false },
      });
    }

    const updateData: any = {};
    if (typeof isCurrent === "boolean") updateData.isCurrent = isCurrent;
    if (yearName && typeof yearName === "string" && yearName.trim()) {
      updateData.yearName = yearName.trim();
    }
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) updateData.startDate = d;
    }
    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) updateData.endDate = d;
    }

    const updated = await prisma.academicYear.update({
      where: { id },
      data: updateData,
      include: {
        institution: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            enrollments: true,
            exams: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Session updated successfully.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Failed to update session:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const isPermanentParam = searchParams.get("permanent") === "true";
    let id = idParam;
    let isPermanent = isPermanentParam;

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
        if (body?.permanent) isPermanent = true;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Session ID is required for deletion." },
        { status: 400 }
      );
    }

    const existing = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
            exams: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Academic session not found." },
        { status: 404 }
      );
    }

    // Safety guard: cannot delete active session without archiving first
    if (existing.isCurrent) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete active session "${existing.yearName}". Please set another session as active or archive this session before deleting.`,
        },
        { status: 400 }
      );
    }

    if (!isPermanent && (existing._count.enrollments > 0 || existing._count.exams > 0)) {
      return NextResponse.json(
        {
          success: false,
          error: `Session "${existing.yearName}" contains ${existing._count.enrollments} enrollments and ${existing._count.exams} examinations. Please use Permanent Delete in the Archive section to permanently remove all associated records.`,
        },
        { status: 400 }
      );
    }

    // Execute cascade delete inside a database transaction to ensure complete cleanup
    await prisma.$transaction(async (tx) => {
      // Collect enrollment IDs
      const enrollments = await tx.studentEnrollment.findMany({
        where: { academicYearId: id },
        select: { id: true },
      });
      const enrollmentIds = enrollments.map((e) => e.id);

      // Collect exam IDs
      const exams = await tx.exam.findMany({
        where: { academicYearId: id },
        select: { id: true },
      });
      const examIds = exams.map((e) => e.id);

      // 1. Processed results cleanup
      const processedResults = await tx.processedStudentResult.findMany({
        where: {
          OR: [
            ...(enrollmentIds.length > 0 ? [{ enrollmentId: { in: enrollmentIds } }] : []),
            ...(examIds.length > 0 ? [{ examId: { in: examIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const processedResultIds = processedResults.map((p) => p.id);

      if (processedResultIds.length > 0) {
        await tx.processedSubjectResult.deleteMany({
          where: { processedStudentResultId: { in: processedResultIds } },
        });
        await tx.processedStudentResult.deleteMany({
          where: { id: { in: processedResultIds } },
        });
      }

      // 2. Student Marks & entries & audit logs
      const studentMarks = await tx.studentMark.findMany({
        where: {
          OR: [
            ...(enrollmentIds.length > 0 ? [{ enrollmentId: { in: enrollmentIds } }] : []),
            ...(examIds.length > 0 ? [{ examId: { in: examIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const markIds = studentMarks.map((m) => m.id);

      if (markIds.length > 0) {
        await tx.markComponentEntry.deleteMany({
          where: { studentMarkId: { in: markIds } },
        });
        await tx.markAuditLog.deleteMany({
          where: { studentMarkId: { in: markIds } },
        });
        await tx.studentMark.deleteMany({
          where: { id: { in: markIds } },
        });
      }

      // 3. Exam subject configs & assessment components
      if (examIds.length > 0) {
        const configs = await tx.examSubjectConfig.findMany({
          where: { examId: { in: examIds } },
          select: { id: true },
        });
        const configIds = configs.map((c) => c.id);

        if (configIds.length > 0) {
          await tx.assessmentComponent.deleteMany({
            where: { examSubjectConfigId: { in: configIds } },
          });
          await tx.examSubjectConfig.deleteMany({
            where: { id: { in: configIds } },
          });
        }

        // 4. Combined subject rules
        await tx.combinedSubjectRule.deleteMany({
          where: { examId: { in: examIds } },
        });
      }

      // 5. SMS logs
      await tx.smsLog.deleteMany({
        where: {
          OR: [
            ...(enrollmentIds.length > 0 ? [{ enrollmentId: { in: enrollmentIds } }] : []),
            ...(examIds.length > 0 ? [{ examId: { in: examIds } }] : []),
          ],
        },
      });

      // 6. Student subject allocations
      if (enrollmentIds.length > 0) {
        await tx.studentSubjectAllocation.deleteMany({
          where: { enrollmentId: { in: enrollmentIds } },
        });
      }

      // 7. Exams
      if (examIds.length > 0) {
        await tx.exam.deleteMany({
          where: { id: { in: examIds } },
        });
      }

      // 8. Enrollments
      if (enrollmentIds.length > 0) {
        await tx.studentEnrollment.deleteMany({
          where: { id: { in: enrollmentIds } },
        });
      }

      // 9. Academic Year itself
      await tx.academicYear.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Session "${existing.yearName}" permanently deleted successfully.`,
    });
  } catch (error: any) {
    console.error("Failed to delete session:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete session" },
      { status: 500 }
    );
  }
}
