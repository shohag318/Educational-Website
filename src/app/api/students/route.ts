import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const groupType = searchParams.get("groupType");
    const shift = searchParams.get("shift");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const academicYearId = searchParams.get("academicYearId");
    const session = searchParams.get("session");

    const whereClause: any = {
      student: { institutionId: tenant.id },
    };
    if (classId) whereClause.classId = classId;
    if (sectionId) whereClause.sectionId = sectionId;
    if (academicYearId && academicYearId !== "ALL") {
      whereClause.academicYearId = academicYearId;
    } else if (session && session !== "ALL") {
      whereClause.academicYear = { yearName: session, institutionId: tenant.id };
    }
    if (status === "ACTIVE") {
      whereClause.student.isActive = true;
    } else if (status === "INACTIVE") {
      whereClause.student.isActive = false;
    }

    const andConditions: any[] = [];

    if (groupType && groupType !== "ALL") {
      const upper = groupType.toUpperCase().replace(/\s+/g, "_");
      andConditions.push({
        OR: [
          { groupType: { in: [groupType, upper] } },
          { section: { groupType: { in: [groupType, upper] } } },
        ],
      });
    }

    if (shift && shift !== "ALL") {
      andConditions.push({
        OR: [
          { section: { shift: shift.toUpperCase() } },
          { class: { shift: shift.toUpperCase() } },
        ],
      });
    }

    if (search && search.trim()) {
      const s = search.trim();
      const parsedRoll = parseInt(s, 10);
      andConditions.push({
        OR: [
          { student: { firstName: { contains: s } } },
          { student: { lastName: { contains: s } } },
          { student: { studentIdNo: { contains: s } } },
          { student: { guardianPhone: { contains: s } } },
          { student: { guardianName: { contains: s } } },
          { student: { customFields: { contains: s } } },
          ...(!isNaN(parsedRoll) ? [{ classRoll: parsedRoll }] : []),
        ],
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const enrollments = await prisma.studentEnrollment.findMany({
      where: whereClause,
      include: {
        student: true,
        class: true,
        section: true,
        academicYear: true,
        allocations: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { classRoll: "asc" },
    });

    return NextResponse.json({ success: true, data: enrollments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      studentIdNo,
      firstName,
      lastName,
      gender,
      religion,
      address,
      guardianName,
      guardianPhone,
      customFields,
      classId,
      sectionId,
      groupType,
      classRoll,
      academicYearId,
      fourthSubjectId,
      institutionId,
    } = body;

    const tenant = await getTenantInstitution(req);
    const instId = institutionId || tenant.id;

    let yearId = academicYearId;
    if (!yearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { institutionId: instId, isCurrent: true },
      });
      if (activeYear) {
        yearId = activeYear.id;
      } else {
        const anyYear = await prisma.academicYear.findFirst({
          where: { institutionId: instId },
        });
        if (anyYear) {
          yearId = anyYear.id;
        } else {
          const newYear = await prisma.academicYear.create({
            data: {
              institutionId: instId,
              yearName: new Date().getFullYear().toString(),
              isCurrent: true,
              startDate: new Date(`${new Date().getFullYear()}-01-01`),
              endDate: new Date(`${new Date().getFullYear()}-12-31`),
            },
          });
          yearId = newYear.id;
        }
      }
    }

    const rollInt = parseInt(String(classRoll).replace(/\D/g, "") || "1", 10);

    // Pre-check 1: Check if Student ID already exists in institution
    const existingStudent = await prisma.student.findUnique({
      where: {
        institutionId_studentIdNo: {
          institutionId: instId,
          studentIdNo: String(studentIdNo).trim(),
        },
      },
    });

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: `Student ID "${studentIdNo}" is already in use by "${existingStudent.firstName} ${existingStudent.lastName}". Please use a unique Student ID.`,
        },
        { status: 400 }
      );
    }

    // Pre-check 2: Check if Class Roll is already taken in this section
    const existingRoll = await prisma.studentEnrollment.findFirst({
      where: {
        academicYearId: yearId,
        classId,
        sectionId,
        classRoll: rollInt,
      },
      include: { student: true },
    });

    if (existingRoll) {
      return NextResponse.json(
        {
          success: false,
          error: `Class Roll #${rollInt} is already assigned to "${existingRoll.student.firstName} ${existingRoll.student.lastName}" (ID: ${existingRoll.student.studentIdNo}) in this section. Please choose a different roll number.`,
        },
        { status: 400 }
      );
    }

    // Resolve effective group from input or target section
    const targetSection = await prisma.section.findUnique({ where: { id: sectionId } });
    const effectiveGroup =
      groupType && groupType !== "GENERAL"
        ? groupType
        : targetSection?.groupType && targetSection.groupType !== "GENERAL"
        ? targetSection.groupType
        : groupType || "GENERAL";

    // Create Student Profile
    const student = await prisma.student.create({
      data: {
        institutionId: instId,
        studentIdNo: String(studentIdNo).trim(),
        firstName,
        lastName,
        gender: gender || "Male",
        religion: religion || null,
        address: address || null,
        guardianName: guardianName ? String(guardianName).trim() : "",
        guardianPhone,
        customFields: customFields ? (typeof customFields === "string" ? customFields : JSON.stringify(customFields)) : null,
      },
    });

    // Create Enrollment
    const enrollment = await prisma.studentEnrollment.create({
      data: {
        studentId: student.id,
        academicYearId: yearId,
        classId,
        sectionId,
        groupType: effectiveGroup,
        classRoll: rollInt,
      },
    });

    // Automatically allocate subjects using Class & Group-wise mapping if configured
    const mappedSubjects = await prisma.classSubjectMapping.findMany({
      where: {
        classId,
        groupType: { in: [effectiveGroup, "ALL"] },
      },
    });

    if (mappedSubjects.length > 0) {
      for (const m of mappedSubjects) {
        const is4th = fourthSubjectId ? m.subjectId === fourthSubjectId : m.subjectType === "OPTIONAL_4TH";
        const finalType = is4th ? "OPTIONAL_4TH" : m.subjectType;
        await prisma.studentSubjectAllocation.create({
          data: {
            enrollmentId: enrollment.id,
            subjectId: m.subjectId,
            subjectType: finalType,
          },
        });
      }
    } else {
      // Fallback: allocate institution subjects
      const subjects = await prisma.subject.findMany({ where: { institutionId: instId } });
      for (const sub of subjects) {
        const is4th = fourthSubjectId && sub.id === fourthSubjectId;
        await prisma.studentSubjectAllocation.create({
          data: {
            enrollmentId: enrollment.id,
            subjectId: sub.id,
            subjectType: is4th ? "OPTIONAL_4TH" : "MANDATORY",
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: enrollment });
  } catch (error: any) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "Class Roll / Student ID";
      return NextResponse.json(
        {
          success: false,
          error: `Unique constraint conflict (${target}): A student with this roll number or ID already exists in this section.`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      studentId,
      studentIds,
      enrollmentId,
      isActive,
      customFields,
      studentIdNo,
      firstName,
      lastName,
      gender,
      guardianName,
      guardianPhone,
      religion,
      address,
      classRoll,
      sectionId,
      groupType,
      fourthSubjectId,
    } = body;

    // 1. Batch status updates
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      const targetIsActive =
        body.studentStatus === "ACTIVE"
          ? true
          : body.isActive !== undefined
          ? Boolean(body.isActive)
          : false;

      const statusMeta = {
        studentStatus: body.studentStatus || (targetIsActive ? "ACTIVE" : "INACTIVE"),
        statusReason: body.statusReason || "",
        statusDate: body.statusDate || new Date().toISOString().slice(0, 10),
        tcNumber: body.tcNumber || "",
        statusRemarks: body.statusRemarks || "",
      };

      const existingStudents = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, customFields: true },
      });

      for (const st of existingStudents) {
        let parsedCustom: Record<string, any> = {};
        if (st.customFields) {
          try {
            parsedCustom =
              typeof st.customFields === "string" ? JSON.parse(st.customFields) : st.customFields;
          } catch {}
        }
        const mergedCustom = { ...parsedCustom, ...statusMeta };
        await prisma.student.update({
          where: { id: st.id },
          data: {
            isActive: targetIsActive,
            customFields: JSON.stringify(mergedCustom),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `${studentIds.length} student(s) updated to status ${statusMeta.studentStatus}.`,
      });
    }

    // 2. Full Student & Enrollment Update by enrollmentId
    if (enrollmentId) {
      const enr = await prisma.studentEnrollment.findUnique({
        where: { id: enrollmentId },
        include: { student: true, class: true },
      });

      if (!enr) {
        return NextResponse.json({ success: false, error: "Enrollment record not found." }, { status: 404 });
      }

      const targetRoll =
        classRoll !== undefined && classRoll !== null && String(classRoll).trim() !== ""
          ? parseInt(String(classRoll).replace(/\D/g, "") || "1", 10)
          : enr.classRoll;
      const targetSectionId = sectionId || enr.sectionId;

      // Check for roll collision if roll or section changed
      if (targetRoll !== enr.classRoll || targetSectionId !== enr.sectionId) {
        const collision = await prisma.studentEnrollment.findFirst({
          where: {
            id: { not: enr.id },
            academicYearId: enr.academicYearId,
            classId: enr.classId,
            sectionId: targetSectionId,
            classRoll: targetRoll,
          },
          include: { student: true },
        });

        if (collision) {
          return NextResponse.json(
            {
              success: false,
              error: `Class Roll #${targetRoll} is already assigned to "${collision.student.firstName} ${collision.student.lastName}" (ID: ${collision.student.studentIdNo}) in this section.`,
            },
            { status: 400 }
          );
        }
      }

      // Check studentIdNo uniqueness if changed
      if (studentIdNo && String(studentIdNo).trim() !== enr.student.studentIdNo) {
        const existingId = await prisma.student.findUnique({
          where: {
            institutionId_studentIdNo: {
              institutionId: enr.student.institutionId,
              studentIdNo: String(studentIdNo).trim(),
            },
          },
        });
        if (existingId && existingId.id !== enr.student.id) {
          return NextResponse.json(
            {
              success: false,
              error: `Student ID "${studentIdNo}" is already in use by another student.`,
            },
            { status: 400 }
          );
        }
      }

      // Update Student master record
      const studentUpdate: any = {};
      if (studentIdNo !== undefined) studentUpdate.studentIdNo = String(studentIdNo).trim();
      if (firstName !== undefined) studentUpdate.firstName = firstName.trim();
      if (lastName !== undefined) studentUpdate.lastName = lastName.trim();
      if (gender !== undefined) studentUpdate.gender = gender;
      if (guardianName !== undefined) studentUpdate.guardianName = guardianName.trim();
      if (guardianPhone !== undefined) studentUpdate.guardianPhone = guardianPhone.trim();
      if (religion !== undefined) studentUpdate.religion = religion;
      if (address !== undefined) studentUpdate.address = address;
      if (isActive !== undefined) studentUpdate.isActive = Boolean(isActive);
      if (customFields !== undefined) {
        let existingCustom: Record<string, any> = {};
        if (enr.student.customFields) {
          try {
            existingCustom =
              typeof enr.student.customFields === "string"
                ? JSON.parse(enr.student.customFields)
                : enr.student.customFields;
          } catch (e) {}
        }
        const mergedCustom =
          typeof customFields === "object" && customFields !== null
            ? { ...existingCustom, ...customFields }
            : customFields;
        studentUpdate.customFields =
          typeof mergedCustom === "string" ? mergedCustom : JSON.stringify(mergedCustom);
      }

      await prisma.student.update({
        where: { id: enr.studentId },
        data: studentUpdate,
      });

      // Update Enrollment record
      const enrollmentUpdate: any = {
        classRoll: targetRoll,
        sectionId: targetSectionId,
      };
      if (groupType) {
        enrollmentUpdate.groupType = groupType.toUpperCase().replace(/\s+/g, "_");
      }

      const updatedEnr = await prisma.studentEnrollment.update({
        where: { id: enr.id },
        data: enrollmentUpdate,
        include: {
          student: true,
          class: true,
          section: true,
          allocations: { include: { subject: true } },
        },
      });

      // Update 4th Subject allocation if provided
      if (fourthSubjectId !== undefined) {
        if (fourthSubjectId) {
          await prisma.studentSubjectAllocation.deleteMany({
            where: { enrollmentId: enr.id, subjectType: "OPTIONAL_4TH" },
          });
          await prisma.studentSubjectAllocation.create({
            data: {
              enrollmentId: enr.id,
              subjectId: fourthSubjectId,
              subjectType: "OPTIONAL_4TH",
            },
          });
        } else {
          await prisma.studentSubjectAllocation.deleteMany({
            where: { enrollmentId: enr.id, subjectType: "OPTIONAL_4TH" },
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: updatedEnr,
        message: "Student profile and enrollment updated successfully.",
      });
    }

    // 3. Fallback Update by studentId
    if (studentId) {
      const existing = await prisma.student.findUnique({ where: { id: studentId } });
      const updateData: any = {};
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);
      if (studentIdNo !== undefined) updateData.studentIdNo = String(studentIdNo).trim();
      if (firstName !== undefined) updateData.firstName = firstName.trim();
      if (lastName !== undefined) updateData.lastName = lastName.trim();
      if (gender !== undefined) updateData.gender = gender;
      if (guardianName !== undefined) updateData.guardianName = guardianName.trim();
      if (guardianPhone !== undefined) updateData.guardianPhone = guardianPhone.trim();
      if (religion !== undefined) updateData.religion = religion;
      if (address !== undefined) updateData.address = address;
      if (customFields !== undefined) {
        let existingCustom: Record<string, any> = {};
        if (existing?.customFields) {
          try {
            existingCustom =
              typeof existing.customFields === "string"
                ? JSON.parse(existing.customFields)
                : existing.customFields;
          } catch (e) {}
        }
        const mergedCustom =
          typeof customFields === "object" && customFields !== null
            ? { ...existingCustom, ...customFields }
            : customFields;
        updateData.customFields =
          typeof mergedCustom === "string" ? mergedCustom : JSON.stringify(mergedCustom);
      }

      const updated = await prisma.student.update({
        where: { id: studentId },
        data: updateData,
      });
      return NextResponse.json({
        success: true,
        data: updated,
        message: `Student updated successfully.`,
      });
    }

    return NextResponse.json({ success: false, error: "enrollmentId or studentId is required." }, { status: 400 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Unique constraint conflict: Another student already has this Class Roll or Student ID.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const studentIds: string[] = Array.isArray(body.studentIds)
      ? body.studentIds
      : body.studentId
      ? [body.studentId]
      : searchParams.get("studentId")
      ? [searchParams.get("studentId")!]
      : [];

    const enrollmentIds: string[] = Array.isArray(body.enrollmentIds)
      ? body.enrollmentIds
      : body.enrollmentId
      ? [body.enrollmentId]
      : searchParams.get("enrollmentId")
      ? [searchParams.get("enrollmentId")!]
      : [];

    if (studentIds.length === 0 && enrollmentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "studentIds or enrollmentIds is required for deletion." },
        { status: 400 }
      );
    }

    // Resolve all target enrollments and student IDs
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        OR: [
          ...(enrollmentIds.length > 0 ? [{ id: { in: enrollmentIds } }] : []),
          ...(studentIds.length > 0 ? [{ studentId: { in: studentIds } }] : []),
        ],
      },
      select: { id: true, studentId: true },
    });

    const targetEnrollmentIds = Array.from(
      new Set([...enrollmentIds, ...enrollments.map((e) => e.id)])
    );
    const targetStudentIds = Array.from(
      new Set([...studentIds, ...enrollments.map((e) => e.studentId)])
    );

    // Look up marks and processed results for safe cascading in SQLite
    const marks = await prisma.studentMark.findMany({
      where: { enrollmentId: { in: targetEnrollmentIds } },
      select: { id: true },
    });
    const markIds = marks.map((m) => m.id);

    const procResults = await prisma.processedStudentResult.findMany({
      where: { enrollmentId: { in: targetEnrollmentIds } },
      select: { id: true },
    });
    const procResultIds = procResults.map((p) => p.id);

    await prisma.$transaction(async (tx) => {
      // 1. Delete marks audit logs and component entries
      if (markIds.length > 0) {
        await tx.markAuditLog.deleteMany({ where: { studentMarkId: { in: markIds } } });
        await tx.markComponentEntry.deleteMany({ where: { studentMarkId: { in: markIds } } });
        await tx.studentMark.deleteMany({ where: { id: { in: markIds } } });
      }

      // 2. Delete processed results
      if (procResultIds.length > 0) {
        await tx.processedSubjectResult.deleteMany({
          where: { processedStudentResultId: { in: procResultIds } },
        });
        await tx.processedStudentResult.deleteMany({ where: { id: { in: procResultIds } } });
      }

      // 3. Delete SMS logs, subject allocations, and enrollments
      if (targetEnrollmentIds.length > 0) {
        await tx.smsLog.deleteMany({ where: { enrollmentId: { in: targetEnrollmentIds } } });
        await tx.studentSubjectAllocation.deleteMany({
          where: { enrollmentId: { in: targetEnrollmentIds } },
        });
        await tx.studentEnrollment.deleteMany({ where: { id: { in: targetEnrollmentIds } } });
      }

      // 4. Delete student master records
      if (targetStudentIds.length > 0) {
        await tx.student.deleteMany({ where: { id: { in: targetStudentIds } } });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${targetStudentIds.length} student(s).`,
      deletedStudents: targetStudentIds.length,
      deletedEnrollments: targetEnrollmentIds.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

