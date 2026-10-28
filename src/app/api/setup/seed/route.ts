import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // 1. Create or Find Institution
    let inst = await prisma.institution.findFirst({ where: { code: "108254" } });
    if (!inst) {
      inst = await prisma.institution.create({
        data: {
          code: "108254",
          name: "Dhaka Ideal Model High School & College",
          address: "Mirpur, Dhaka-1216, Bangladesh",
          smsSenderId: "DHAKA_IDEAL",
        },
      });
    }

    // 2. Academic Year
    let year = await prisma.academicYear.findFirst({
      where: { institutionId: inst.id, yearName: "2026" },
    });
    if (!year) {
      year = await prisma.academicYear.create({
        data: {
          institutionId: inst.id,
          yearName: "2026",
          isCurrent: true,
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
        },
      });
    }

    // 3. Classes & Sections
    let cls10 = await prisma.academicClass.findFirst({
      where: { institutionId: inst.id, name: "Class 10" },
    });
    if (!cls10) {
      cls10 = await prisma.academicClass.create({
        data: {
          institutionId: inst.id,
          name: "Class 10",
          numericValue: 10,
        },
      });
    }

    let secScience = await prisma.section.findFirst({
      where: { classId: cls10.id, name: "Section A", groupType: "SCIENCE" },
    });
    if (!secScience) {
      secScience = await prisma.section.create({
        data: {
          classId: cls10.id,
          name: "Section A",
          groupType: "SCIENCE",
          capacity: 50,
        },
      });
    }

    // 4. Grading System (Standard NCTB)
    let grading = await prisma.gradingSystem.findFirst({
      where: { institutionId: inst.id, name: "NCTB Standard Secondary Grading" },
    });
    if (!grading) {
      grading = await prisma.gradingSystem.create({
        data: {
          institutionId: inst.id,
          name: "NCTB Standard Secondary Grading",
          maxGpa: 5.0,
          fourthSubjectThreshold: 2.0,
          passGpa: 1.0,
          isDefault: true,
          slabs: {
            create: [
              { letterGrade: "A+", gradePoint: 5.0, markMin: 80, markMax: 100, isFail: false, comments: "Outstanding" },
              { letterGrade: "A", gradePoint: 4.0, markMin: 70, markMax: 79.99, isFail: false, comments: "Excellent" },
              { letterGrade: "A-", gradePoint: 3.5, markMin: 60, markMax: 69.99, isFail: false, comments: "Very Good" },
              { letterGrade: "B", gradePoint: 3.0, markMin: 50, markMax: 59.99, isFail: false, comments: "Good" },
              { letterGrade: "C", gradePoint: 2.0, markMin: 40, markMax: 49.99, isFail: false, comments: "Satisfactory" },
              { letterGrade: "D", gradePoint: 1.0, markMin: 33, markMax: 39.99, isFail: false, comments: "Passing" },
              { letterGrade: "F", gradePoint: 0.0, markMin: 0, markMax: 32.99, isFail: true, comments: "Failed" },
            ],
          },
        },
      });
    }

    // 5. Subjects
    const subjectsData = [
      { code: "101", name: "Bangla 1st Paper" },
      { code: "107", name: "English 1st Paper" },
      { code: "109", name: "Mathematics" },
      { code: "136", name: "Physics" },
      { code: "137", name: "Chemistry" },
      { code: "138", name: "Biology" },
      { code: "126", name: "Higher Mathematics" },
    ];

    const subjectsMap = new Map<string, string>();
    for (const s of subjectsData) {
      let sub = await prisma.subject.findFirst({
        where: { institutionId: inst.id, subjectCode: s.code },
      });
      if (!sub) {
        sub = await prisma.subject.create({
          data: {
            institutionId: inst.id,
            subjectCode: s.code,
            name: s.name,
          },
        });
      }
      subjectsMap.set(s.code, sub.id);
    }

    // 6. Exam: Half-Yearly 2026
    let exam = await prisma.exam.findFirst({
      where: { institutionId: inst.id, name: "Half-Yearly Examination 2026" },
    });
    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          institutionId: inst.id,
          academicYearId: year.id,
          classId: cls10.id,
          gradingSystemId: grading.id,
          name: "Half-Yearly Examination 2026",
          termCode: "HY-2026",
          status: "MARK_ENTRY",
          startDate: new Date("2026-06-15"),
          endDate: new Date("2026-06-30"),
        },
      });
    }

    // 7. Dynamic Subject Configuration & Component Breakdown for Exam
    // Science subjects have CQ(50)+MCQ(25)+Practical(25) = 100. Pass CQ: 17, MCQ: 8, Practical: 8
    // General subjects like Bangla/English/Math have CQ(70)+MCQ(30) = 100. Pass CQ: 23, MCQ: 10
    for (const [code, subjectId] of Array.from(subjectsMap.entries())) {
      let conf = await prisma.examSubjectConfig.findFirst({
        where: { examId: exam.id, subjectId },
      });
      if (!conf) {
        const isSciencePractical = ["136", "137", "138", "126"].includes(code);
        conf = await prisma.examSubjectConfig.create({
          data: {
            examId: exam.id,
            subjectId,
            groupType: "SCIENCE",
            totalFullMarks: 100,
            passMode: "COMPONENT_WISE",
            aggregatePassMark: 33,
            components: {
              create: isSciencePractical
                ? [
                    { componentName: "CQ", fullMarks: 50, passMarks: 17, isMandatoryPass: true },
                    { componentName: "MCQ", fullMarks: 25, passMarks: 8, isMandatoryPass: true },
                    { componentName: "PRACTICAL", fullMarks: 25, passMarks: 8, isMandatoryPass: true },
                  ]
                : [
                    { componentName: "CQ", fullMarks: 70, passMarks: 23, isMandatoryPass: true },
                    { componentName: "MCQ", fullMarks: 30, passMarks: 10, isMandatoryPass: true },
                  ],
            },
          },
        });
      }
    }

    // 7.1 Class & Group-wise Subject Mapping (Phase 1 Setup)
    const scienceMapping = [
      { code: "101", type: "MANDATORY" },
      { code: "107", type: "MANDATORY" },
      { code: "109", type: "MANDATORY" },
      { code: "136", type: "MANDATORY" },
      { code: "137", type: "MANDATORY" },
      { code: "138", type: "GROUP_ELECTIVE" },
      { code: "126", type: "OPTIONAL_4TH" },
    ];
    for (const sm of scienceMapping) {
      const subId = subjectsMap.get(sm.code);
      if (subId) {
        await prisma.classSubjectMapping.upsert({
          where: {
            classId_groupType_subjectId: {
              classId: cls10.id,
              groupType: "SCIENCE",
              subjectId: subId,
            },
          },
          update: { subjectType: sm.type },
          create: {
            classId: cls10.id,
            groupType: "SCIENCE",
            subjectId: subId,
            subjectType: sm.type,
          },
        });
      }
    }

    // 8. Sample Students & Enrollments
    const studentsSeed = [
      { idNo: "ST-2026-001", first: "Tanvir", last: "Ahmed", roll: 1, phone: "01711223344", fourth: "126" }, // Higher Math as 4th
      { idNo: "ST-2026-002", first: "Nusrat", last: "Jahan", roll: 2, phone: "01811223355", fourth: "138" }, // Biology as 4th
      { idNo: "ST-2026-003", first: "Rahim", last: "Chowdhury", roll: 3, phone: "01911223366", fourth: "126" },
      { idNo: "ST-2026-004", first: "Sumaiya", last: "Akter", roll: 4, phone: "01611223377", fourth: "138" },
      { idNo: "ST-2026-005", first: "Mahmudul", last: "Hasan", roll: 5, phone: "01511223388", fourth: "126" },
    ];

    for (const s of studentsSeed) {
      let student = await prisma.student.findFirst({
        where: { institutionId: inst.id, studentIdNo: s.idNo },
      });
      if (!student) {
        student = await prisma.student.create({
          data: {
            institutionId: inst.id,
            studentIdNo: s.idNo,
            firstName: s.first,
            lastName: s.last,
            gender: "Male",
            guardianName: `${s.last}'s Guardian`,
            guardianPhone: s.phone,
          },
        });
      }

      let enrollment = await prisma.studentEnrollment.findFirst({
        where: {
          academicYearId: year.id,
          classId: cls10.id,
          sectionId: secScience.id,
          classRoll: s.roll,
        },
      });

      if (!enrollment) {
        enrollment = await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            academicYearId: year.id,
            classId: cls10.id,
            sectionId: secScience.id,
            groupType: "SCIENCE",
            classRoll: s.roll,
          },
        });

        // Subject Allocations:
        // Mandatory: Bangla(101), English(107), Math(109), Physics(136), Chemistry(137)
        // One is Elective, One is 4th Subject!
        const mandatoryCodes = ["101", "107", "109", "136", "137"];
        for (const code of mandatoryCodes) {
          const subId = subjectsMap.get(code)!;
          await prisma.studentSubjectAllocation.create({
            data: {
              enrollmentId: enrollment.id,
              subjectId: subId,
              subjectType: "MANDATORY",
            },
          });
        }

        // Elective vs 4th Subject
        const electiveCode = s.fourth === "126" ? "138" : "126";
        await prisma.studentSubjectAllocation.create({
          data: {
            enrollmentId: enrollment.id,
            subjectId: subjectsMap.get(electiveCode)!,
            subjectType: "GROUP_ELECTIVE",
          },
        });

        await prisma.studentSubjectAllocation.create({
          data: {
            enrollmentId: enrollment.id,
            subjectId: subjectsMap.get(s.fourth)!,
            subjectType: "OPTIONAL_4TH",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Realistic NCTB institutional setup seeded successfully with Classes, Sections, Subjects, Dynamic Rules, and Students!",
      examId: exam.id,
      institutionId: inst.id,
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
