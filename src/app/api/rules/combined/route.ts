import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantInstitution } from "@/lib/serverTenant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantInstitution(req);
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    const where: any = {};
    if (tenant) {
      where.exam = { institutionId: tenant.id };
    }
    if (examId && examId !== "ALL") {
      where.examId = examId;
    }

    const rules = await prisma.combinedSubjectRule.findMany({
      where,
      include: {
        exam: {
          include: {
            class: true,
          },
        },
        primarySubject: true,
        secondarySubject: true,
      },
      orderBy: [
        { exam: { name: "asc" } },
        { primarySubject: { subjectCode: "asc" } },
      ],
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      examId,
      primarySubjectId,
      secondarySubjectId,
      name,
      combinedPassMark,
      combinedFullMarks,
      passMode,
      gradeMode,
    } = body;

    if (!examId || !primarySubjectId || !secondarySubjectId) {
      return NextResponse.json(
        { success: false, error: "Exam and both Primary and Secondary subjects are required." },
        { status: 400 }
      );
    }

    if (primarySubjectId === secondarySubjectId) {
      return NextResponse.json(
        { success: false, error: "Primary and Secondary subjects cannot be the same subject." },
        { status: 400 }
      );
    }

    // Check if subjects exist
    const primary = await prisma.subject.findUnique({ where: { id: primarySubjectId } });
    const secondary = await prisma.subject.findUnique({ where: { id: secondarySubjectId } });

    if (!primary || !secondary) {
      return NextResponse.json(
        { success: false, error: "One or both subjects could not be found." },
        { status: 404 }
      );
    }

    const defaultName = name?.trim() || `${primary.name} & ${secondary.name} (Combined)`;
    const passMarkNum = parseFloat(combinedPassMark) || 66.0;
    const fullMarksNum = parseFloat(combinedFullMarks) || 200.0;
    const passModeVal = passMode === "BOTH" ? "BOTH" : "AGGREGATE_ONLY";
    const gradeModeVal = gradeMode === "INDIVIDUAL" ? "INDIVIDUAL" : "AVERAGE";

    // Check for collision with existing rules in this exam if not updating self
    const existingRules = await prisma.combinedSubjectRule.findMany({
      where: {
        examId,
        OR: [
          { primarySubjectId: primarySubjectId },
          { secondarySubjectId: primarySubjectId },
          { primarySubjectId: secondarySubjectId },
          { secondarySubjectId: secondarySubjectId },
        ],
      },
    });

    const conflict = existingRules.find((r) => r.id !== id);
    if (conflict) {
      // Update the existing rule instead of failing if it's the same pair reversed
      if (
        (conflict.primarySubjectId === primarySubjectId && conflict.secondarySubjectId === secondarySubjectId) ||
        (conflict.primarySubjectId === secondarySubjectId && conflict.secondarySubjectId === primarySubjectId)
      ) {
        const updated = await prisma.combinedSubjectRule.update({
          where: { id: conflict.id },
          data: {
            name: defaultName,
            combinedPassMark: passMarkNum,
            combinedFullMarks: fullMarksNum,
            passMode: passModeVal,
            gradeMode: gradeModeVal,
          },
          include: {
            primarySubject: true,
            secondarySubject: true,
          },
        });
        return NextResponse.json({ success: true, data: updated, message: "Rule updated successfully." });
      }

      return NextResponse.json(
        {
          success: false,
          error: `One of the subjects is already configured in rule "${conflict.name || 'Existing Rule'}". Please remove or edit that rule first.`,
        },
        { status: 400 }
      );
    }

    let savedRule;
    if (id) {
      savedRule = await prisma.combinedSubjectRule.update({
        where: { id },
        data: {
          examId,
          primarySubjectId,
          secondarySubjectId,
          name: defaultName,
          combinedPassMark: passMarkNum,
          combinedFullMarks: fullMarksNum,
          passMode: passModeVal,
          gradeMode: gradeModeVal,
        },
        include: {
          primarySubject: true,
          secondarySubject: true,
        },
      });
    } else {
      savedRule = await prisma.combinedSubjectRule.create({
        data: {
          examId,
          primarySubjectId,
          secondarySubjectId,
          name: defaultName,
          combinedPassMark: passMarkNum,
          combinedFullMarks: fullMarksNum,
          passMode: passModeVal,
          gradeMode: gradeModeVal,
        },
        include: {
          primarySubject: true,
          secondarySubject: true,
        },
      });
    }

    return NextResponse.json({ success: true, data: savedRule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Rule ID is required." }, { status: 400 });
    }

    await prisma.combinedSubjectRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Combined subject rule deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
