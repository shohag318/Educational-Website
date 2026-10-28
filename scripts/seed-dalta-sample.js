const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedDalta() {
  console.log("Seeding Dalta Degree College PDF Sample Data...");

  // 1. Institution
  const inst = await prisma.institution.upsert({
    where: { code: "108299" },
    update: {
      name: "Dalta Degree College",
      address: "Ramgonj, Lakshmipur",
    },
    create: {
      code: "108299",
      name: "Dalta Degree College",
      address: "Ramgonj, Lakshmipur",
      smsSenderId: "DALTA_COLLEGE",
    },
  });

  // 2. Academic Year
  const year = await prisma.academicYear.upsert({
    where: {
      institutionId_yearName: {
        institutionId: inst.id,
        yearName: "2025-2026",
      },
    },
    update: { isCurrent: true },
    create: {
      institutionId: inst.id,
      yearName: "2025-2026",
      isCurrent: true,
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-06-30"),
    },
  });

  // 3. Class XI
  const clsXI = await prisma.academicClass.upsert({
    where: {
      institutionId_name: {
        institutionId: inst.id,
        name: "XI",
      },
    },
    update: { numericValue: 11 },
    create: {
      institutionId: inst.id,
      name: "XI",
      numericValue: 11,
    },
  });

  // 4. Section A - Science
  const secA = await prisma.section.upsert({
    where: {
      classId_name_groupType_shift: {
        classId: clsXI.id,
        name: "A",
        groupType: "SCIENCE",
        shift: "DAY",
      },
    },
    update: { capacity: 60 },
    create: {
      classId: clsXI.id,
      name: "A",
      groupType: "SCIENCE",
      shift: "DAY",
      capacity: 60,
    },
  });

  // 5. Grading System
  const grading = await prisma.gradingSystem.upsert({
    where: { id: "dalta-grading" },
    update: {},
    create: {
      id: "dalta-grading",
      institutionId: inst.id,
      name: "NCTB Higher Secondary Grading",
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

  // 6. Subjects from PDF
  const subjectsData = [
    { code: "101", name: "Bangla 1st paper", isFourth: false },
    { code: "107", name: "English 1st paper", isFourth: false },
    { code: "275", name: "ICT", isFourth: false },
    { code: "174", name: "Physics 1st Paper", isFourth: false },
    { code: "176", name: "Chemistry 1st Paper", isFourth: false },
    { code: "178", name: "Biology 1st Paper", isFourth: false },
    { code: "265", name: "Higher Mathematics 1st Paper", isFourth: true },
  ];

  const subjectsMap = {};
  for (const s of subjectsData) {
    const sub = await prisma.subject.upsert({
      where: {
        institutionId_subjectCode: {
          institutionId: inst.id,
          subjectCode: s.code,
        },
      },
      update: { name: s.name },
      create: {
        institutionId: inst.id,
        subjectCode: s.code,
        name: s.name,
      },
    });
    subjectsMap[s.code] = sub;

    // Class subject mapping
    await prisma.classSubjectMapping.upsert({
      where: {
        classId_groupType_subjectId: {
          classId: clsXI.id,
          groupType: "SCIENCE",
          subjectId: sub.id,
        },
      },
      update: { subjectType: s.isFourth ? "OPTIONAL_4TH" : "MANDATORY" },
      create: {
        classId: clsXI.id,
        groupType: "SCIENCE",
        subjectId: sub.id,
        subjectType: s.isFourth ? "OPTIONAL_4TH" : "MANDATORY",
      },
    });
  }

  // 7. Exam: Year Final Examination-2026
  let exam = await prisma.exam.findFirst({
    where: { institutionId: inst.id, name: "Year Final Examination-2026" },
  });
  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        institutionId: inst.id,
        academicYearId: year.id,
        classId: clsXI.id,
        gradingSystemId: grading.id,
        name: "Year Final Examination-2026",
        termCode: "YF-2026",
        status: "PUBLISHED",
        startDate: new Date("2026-05-10"),
        endDate: new Date("2026-05-25"),
      },
    });
  }

  // Configure Exam Subjects
  for (const s of subjectsData) {
    const sub = subjectsMap[s.code];
    let conf = await prisma.examSubjectConfig.findFirst({
      where: { examId: exam.id, subjectId: sub.id },
    });
    if (!conf) {
      await prisma.examSubjectConfig.create({
        data: {
          examId: exam.id,
          subjectId: sub.id,
          groupType: "SCIENCE",
          totalFullMarks: 100,
          passMode: "AGGREGATE_ONLY",
          aggregatePassMark: 33,
        },
      });
    }
  }

  // 8. 26 Students Roster from PDF Page 2 & Page 4
  const studentsList = [
    {
      name: "Hosna Hossain", roll: 127, idNo: "25261127", marks: 401.0, gpa: 3.33, grade: "B", passed: true,
      rankSec: 1, rankClass: 1,
      subGrades: { "101": "A", "107": "C", "275": "B", "174": "A-", "176": "A-", "178": "B", "265": "B" },
    },
    {
      name: "Umme Salma Jemi", roll: 108, idNo: "25261108", marks: 384.0, gpa: 3.17, grade: "B", passed: true,
      rankSec: 2, rankClass: 2,
      subGrades: { "101": "B", "107": "B", "275": "B", "174": "B", "176": "A", "178": "B", "265": "C" },
    },
    {
      name: "Tajkiya Islam", roll: 120, idNo: "25261120", marks: 354.0, gpa: 2.92, grade: "C", passed: true,
      rankSec: 3, rankClass: 3,
      subGrades: { "101": "B", "107": "B", "275": "B", "174": "A-", "176": "C", "178": "B", "265": "C" },
    },
    {
      name: "Maria Sultana Mary", roll: 104, idNo: "25261104", marks: 364.0, gpa: 2.75, grade: "C", passed: true,
      rankSec: 4, rankClass: 4,
      subGrades: { "101": "B", "107": "B", "275": "B", "174": "B", "176": "A-", "178": "C", "265": "C" },
    },
    {
      name: "Fatema Akter Sorna", roll: 121, idNo: "25261121", marks: 322.0, gpa: 2.25, grade: "C", passed: true,
      rankSec: 5, rankClass: 5,
      subGrades: { "101": "C", "107": "C", "275": "B", "174": "A-", "176": "C", "178": "D", "265": "C" },
    },
    {
      name: "Tania Akter Mim", roll: 103, idNo: "25261103", marks: 323.0, gpa: 2.17, grade: "C", passed: true,
      rankSec: 6, rankClass: 6,
      subGrades: { "101": "C", "107": "C", "275": "C", "174": "C", "176": "C", "178": "C", "265": "B" },
    },
    {
      name: "Juliya Akter Tanju", roll: 107, idNo: "25261107", marks: 322.0, gpa: 2.17, grade: "C", passed: true,
      rankSec: 7, rankClass: 7,
      subGrades: { "101": "C", "107": "B", "275": "C", "174": "D", "176": "B", "178": "C", "265": "D" },
    },
    {
      name: "Fariha Ali Eshita", roll: 110, idNo: "25261110", marks: 339.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 8, rankClass: 8,
      subGrades: { "101": "B", "107": "B", "275": "F", "174": "B", "176": "A-", "178": "F", "265": "C" },
    },
    {
      name: "Nusrat Jahan Ononna", roll: 102, idNo: "25261102", marks: 305.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 9, rankClass: 9,
      subGrades: { "101": "C", "107": "D", "275": "B", "174": "B", "176": "F", "178": "D", "265": "B" },
    },
    {
      name: "Sajjad Hossain", roll: 116, idNo: "25261116", marks: 258.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 10, rankClass: 10,
      subGrades: { "101": "C", "107": "C", "275": "F", "174": "A-", "176": "F", "178": "C", "265": "F" },
    },
    {
      name: "Samia Akter", roll: 124, idNo: "25261124", marks: 296.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 11, rankClass: 11,
      subGrades: { "101": "D", "107": "C", "275": "F", "174": "C", "176": "A-", "178": "F", "265": "C" },
    },
    {
      name: "Nahida Akther", roll: 111, idNo: "25261111", marks: 266.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 12, rankClass: 12,
      subGrades: { "101": "C", "107": "B", "275": "F", "174": "F", "176": "C", "178": "F", "265": "C" },
    },
    {
      name: "Tasnim Jahan Bushra", roll: 112, idNo: "25261112", marks: 247.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 13, rankClass: 13,
      subGrades: { "101": "C", "107": "C", "275": "F", "174": "F", "176": "C", "178": "F", "265": "C" },
    },
    {
      name: "Marjahan Akter", roll: 126, idNo: "25261126", marks: 220.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 14, rankClass: 14,
      subGrades: { "101": "F", "107": "D", "275": "F", "174": "F", "176": "C", "178": "F", "265": "B" },
    },
    {
      name: "Tanvir Jeshan", roll: 119, idNo: "25261119", marks: 186.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 15, rankClass: 15,
      subGrades: { "101": "D", "107": "D", "275": "F", "174": "F", "176": "C", "178": "F", "265": "F" },
    },
    {
      name: "Al- Amin", roll: 105, idNo: "25261105", marks: 246.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 16, rankClass: 16,
      subGrades: { "101": "D", "107": "F", "275": "F", "174": "F", "176": "C", "178": "F", "265": "C" },
    },
    {
      name: "Ahsan Habib Sojib", roll: 118, idNo: "25261118", marks: 176.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 17, rankClass: 17,
      subGrades: { "101": "D", "107": "C", "275": "F", "174": "F", "176": "F", "178": "F", "265": "F" },
    },
    {
      name: "Md Arman Faruk", roll: 132, idNo: "25261132", marks: 192.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 18, rankClass: 18,
      subGrades: { "101": "D", "107": "F", "275": "F", "174": "F", "176": "F", "178": "F", "265": "F" },
    },
    {
      name: "Yassin Arafat", roll: 117, idNo: "25261117", marks: 158.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 19, rankClass: 19,
      subGrades: { "101": "F", "107": "D", "275": "F", "174": "F", "176": "F", "178": "F", "265": "F" },
    },
    {
      name: "Shopon Ahmed", roll: 131, idNo: "25261131", marks: 140.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 20, rankClass: 20,
      subGrades: { "101": "D", "107": "F", "275": "F", "174": "F", "176": "F", "178": "F", "265": "F" },
    },
    {
      name: "Md. Majharul Islam", roll: 130, idNo: "25261130", marks: 139.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 21, rankClass: 21,
      subGrades: { "101": "D", "107": "F", "275": "F", "174": "F", "176": "F", "178": "F", "265": "F" },
    },
    {
      name: "Md. Al Amin", roll: 113, idNo: "25261113", marks: 140.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 22, rankClass: 22,
      subGrades: { "101": "F", "107": "F", "275": "F", "174": "F", "176": "F", "178": "F", "265": "F" },
    },
    {
      name: "Tarek Mahmud Tushar", roll: 129, idNo: "25261129", marks: 123.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 23, rankClass: 23,
      subGrades: { "101": "F", "107": "F", "275": "F", "174": "F", "176": "F", "178": "F", "265": "F" },
    },
    {
      name: "Meraj Hossain", roll: 125, idNo: "25261125", marks: 83.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 24, rankClass: 24,
      subGrades: { "101": "F", "107": "F", "275": "F", "174": "F", "176": "F", "178": "F", "265": "F" },
    },
    {
      name: "Md. Mizenor Rahaman", roll: 122, idNo: "25261122", marks: 60.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 25, rankClass: 25,
      subGrades: { "101": "F", "107": "F", "275": "F", "174": "F", "176": "F", "178": "F", "265": "F" },
    },
    {
      name: "Jubayer Hosen", roll: 114, idNo: "25261114", marks: 0.0, gpa: 0.0, grade: "F", passed: false,
      rankSec: 26, rankClass: 26,
      subGrades: { "101": "F", "107": "F", "275": "F", "174": "F", "176": "F", "178": "F", "265": "F" },
    },
  ];

  const gradeToPoint = {
    "A+": 5.0,
    "A": 4.0,
    "A-": 3.5,
    "B": 3.0,
    "C": 2.0,
    "D": 1.0,
    "F": 0.0,
  };

  const gradeToApproxMark = {
    "A+": 85,
    "A": 75,
    "A-": 65,
    "B": 55,
    "C": 45,
    "D": 35,
    "F": 20,
  };

  for (const s of studentsList) {
    const names = s.name.split(" ");
    const firstName = names.slice(0, -1).join(" ") || names[0];
    const lastName = names[names.length - 1] || "";

    const student = await prisma.student.upsert({
      where: {
        institutionId_studentIdNo: {
          institutionId: inst.id,
          studentIdNo: s.idNo,
        },
      },
      update: { firstName, lastName },
      create: {
        institutionId: inst.id,
        studentIdNo: s.idNo,
        firstName,
        lastName,
        guardianName: `${s.name}'s Guardian`,
        guardianPhone: "01700000000",
      },
    });

    const enrollment = await prisma.studentEnrollment.upsert({
      where: {
        academicYearId_classId_sectionId_classRoll: {
          academicYearId: year.id,
          classId: clsXI.id,
          sectionId: secA.id,
          classRoll: s.roll,
        },
      },
      update: { studentId: student.id, groupType: "SCIENCE" },
      create: {
        studentId: student.id,
        academicYearId: year.id,
        classId: clsXI.id,
        sectionId: secA.id,
        classRoll: s.roll,
        groupType: "SCIENCE",
      },
    });

    // Subject allocations
    for (const subDef of subjectsData) {
      const sub = subjectsMap[subDef.code];
      await prisma.studentSubjectAllocation.upsert({
        where: {
          enrollmentId_subjectId: {
            enrollmentId: enrollment.id,
            subjectId: sub.id,
          },
        },
        update: { subjectType: subDef.isFourth ? "OPTIONAL_4TH" : "MANDATORY" },
        create: {
          enrollmentId: enrollment.id,
          subjectId: sub.id,
          subjectType: subDef.isFourth ? "OPTIONAL_4TH" : "MANDATORY",
        },
      });
    }

    // Processed Student Result
    const failingCount = Object.values(s.subGrades).filter((g) => g === "F").length;
    const processedRes = await prisma.processedStudentResult.upsert({
      where: {
        examId_enrollmentId: {
          examId: exam.id,
          enrollmentId: enrollment.id,
        },
      },
      update: {
        totalObtainedMarks: s.marks,
        finalGpa: s.gpa,
        finalLetterGrade: s.grade,
        isPassed: s.passed,
        totalFailedSubjects: failingCount,
        meritRankSection: s.rankSec,
        meritRankClass: s.rankClass,
      },
      create: {
        examId: exam.id,
        enrollmentId: enrollment.id,
        totalObtainedMarks: s.marks,
        finalGpa: s.gpa,
        finalLetterGrade: s.grade,
        isPassed: s.passed,
        totalFailedSubjects: failingCount,
        meritRankSection: s.rankSec,
        meritRankClass: s.rankClass,
      },
    });

    // Subject results
    await prisma.processedSubjectResult.deleteMany({
      where: { processedStudentResultId: processedRes.id },
    });

    for (const [code, letterGrade] of Object.entries(s.subGrades)) {
      const sub = subjectsMap[code];
      const isSubPassed = letterGrade !== "F";
      const isFourth = code === "265";
      const gp = gradeToPoint[letterGrade] || 0.0;
      const subMark = s.marks === 0 ? 0 : gradeToApproxMark[letterGrade] || 33;

      await prisma.processedSubjectResult.create({
        data: {
          processedStudentResultId: processedRes.id,
          subjectId: sub.id,
          subjectType: isFourth ? "OPTIONAL_4TH" : "MANDATORY",
          totalObtainedMarks: subMark,
          letterGrade,
          gradePoint: gp,
          isPassed: isSubPassed,
          failureReason: isSubPassed ? null : `Failed in ${sub.name}`,
        },
      });
    }
  }

  console.log(`Seeded Dalta Degree College with 26 students successfully for exam: "${exam.name}"!`);
}

seedDalta()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
