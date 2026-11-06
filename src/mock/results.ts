/**
 * Result computation + report builders (tabulation, fail-list, at-a-glance,
 * marksheet). Pure functions over a `MockDb`; no side effects.
 */
import type {
  MockDb,
  MockEnrollment,
  MockExam,
  MockExamSubjectConfig,
  MockGradingSystem,
} from "./data";

export interface SubjectResult {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: string;
  marks: number;
  fullMarks: number;
  grade: string;
  point: number;
  isPassed: boolean;
  isAbsent: boolean;
  isCombined: boolean;
  combinedMarks?: number;
  failureReason: string;
  components: { name: string; obtained: number | string; full: number }[];
}

export interface StudentResult {
  id: string;
  enrollmentId: string;
  studentId: string;
  studentIdNo: string;
  roll: number;
  studentName: string;
  phone: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  sectionShift: string;
  groupType: string;
  subjects: SubjectResult[];
  totalObtainedMarks: number;
  gpaWithoutFourth: number;
  fourthBonus: number;
  finalGpa: number;
  finalGrade: string;
  isPassed: boolean;
  totalFailedSubjects: number;
  classRank: number;
  sectionRank: number;
}

export interface ResultFilters {
  classId?: string | null;
  sectionId?: string | null;
  shift?: string | null;
  groupType?: string | null;
}

export interface ExamComputation {
  exam: MockExam;
  grading: MockGradingSystem;
  results: StudentResult[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

function gradeFromPercent(grading: MockGradingSystem, percent: number) {
  const slabs = [...(grading.slabs ?? [])].sort((a, b) => b.markMin - a.markMin);
  const slab = slabs.find((s) => percent >= s.markMin) ?? slabs[slabs.length - 1];
  return slab
    ? { letter: slab.letterGrade, point: slab.isFail ? 0 : slab.gradePoint, isFail: slab.isFail }
    : { letter: "F", point: 0, isFail: true };
}

function gradeFromGpa(grading: MockGradingSystem, gpa: number): string {
  const slabs = [...(grading.slabs ?? [])].filter((s) => !s.isFail).sort((a, b) => b.gradePoint - a.gradePoint);
  return slabs.find((s) => gpa >= s.gradePoint)?.letterGrade ?? "F";
}

function evalSubject(
  cfg: MockExamSubjectConfig,
  mark: { isAbsent: boolean; components: Record<string, number | ""> } | undefined
) {
  const isAbsent = Boolean(mark?.isAbsent);
  const comps = cfg.components.map((c) => ({
    name: c.componentName,
    obtained: isAbsent ? "ABS" : mark?.components?.[c.componentName] ?? "",
    full: c.fullMarks,
    pass: c.passMarks,
    mandatory: c.isMandatoryPass,
  }));
  const total = isAbsent ? 0 : comps.reduce((s, c) => s + num(c.obtained), 0);
  let failureReason = "";
  if (isAbsent) {
    failureReason = "Absent";
  } else {
    if (cfg.passMode === "COMPONENT_WISE") {
      const bad = comps.find((c) => c.mandatory && num(c.obtained) < c.pass);
      if (bad) failureReason = `${bad.name} ${num(bad.obtained)}/${bad.full} below pass mark ${bad.pass}`;
    }
    if (!failureReason && total < cfg.aggregatePassMark) {
      failureReason = `Total ${total}/${cfg.totalFullMarks} below pass mark ${cfg.aggregatePassMark}`;
    }
  }
  return {
    isAbsent,
    total,
    failureReason,
    isPassed: !failureReason,
    components: comps.map(({ name, obtained, full }) => ({ name, obtained, full })),
  };
}

export function computeExamResults(db: MockDb, examId: string): ExamComputation | null {
  const exam = db.exams.find((e) => e.id === examId);
  if (!exam) return null;
  const grading =
    db.gradingSystems.find((g) => g.id === exam.gradingSystemId) ??
    db.gradingSystems.find((g) => g.isDefault) ??
    db.gradingSystems[0];
  if (!grading) return null;

  const cls = db.classes.find((c) => c.id === exam.classId);
  const rules = db.combinedRules.filter((r) => r.examId === examId);
  const examMarks = db.marks.filter((m) => m.examId === examId);
  const results: StudentResult[] = [];

  const enrollments = db.enrollments.filter(
    (e) => e.classId === exam.classId && e.academicYearId === exam.academicYearId && e.student.isActive !== false
  );

  for (const enr of enrollments) {
    const myMarks = examMarks.filter((m) => m.enrollmentId === enr.id);
    if (myMarks.length === 0) continue;

    const subjectResults: SubjectResult[] = [];
    for (const alloc of enr.allocations) {
      const cfg = exam.subjectConfigs.find((c) => c.subjectId === alloc.subjectId);
      const mark = myMarks.find((m) => m.subjectId === alloc.subjectId);
      if (!cfg || !mark) continue;
      const sub = db.subjects.find((s) => s.id === alloc.subjectId);
      const ev = evalSubject(cfg, mark);
      const g = gradeFromPercent(grading, (ev.total / (cfg.totalFullMarks || 100)) * 100);
      const failed = !ev.isPassed || g.isFail;
      subjectResults.push({
        subjectId: alloc.subjectId,
        subjectCode: sub?.subjectCode ?? "",
        subjectName: sub?.name ?? "Subject",
        subjectType: alloc.subjectType,
        marks: ev.total,
        fullMarks: cfg.totalFullMarks,
        grade: failed ? "F" : g.letter,
        point: failed ? 0 : g.point,
        isPassed: !failed,
        isAbsent: ev.isAbsent,
        isCombined: false,
        failureReason: ev.failureReason || (g.isFail ? "Below pass grade" : ""),
        components: ev.components,
      });
    }
    if (subjectResults.length === 0) continue;

    // Combined-subject rules (e.g. Bangla 1st + 2nd)
    const combinedUnits = new Map<string, number[]>();
    for (const rule of rules) {
      const a = subjectResults.find((s) => s.subjectId === rule.primarySubjectId);
      const b = subjectResults.find((s) => s.subjectId === rule.secondarySubjectId);
      if (!a || !b) continue;
      const combined = a.marks + b.marks;
      const aggPass = combined >= rule.combinedPassMark;
      const pass = rule.passMode === "BOTH" ? aggPass && a.isPassed && b.isPassed : aggPass;
      const percent = (combined / (rule.combinedFullMarks || 200)) * 100;
      const g = gradeFromPercent(grading, percent);
      for (const s of [a, b]) {
        s.isCombined = true;
        s.combinedMarks = combined;
        s.isPassed = pass;
        if (rule.gradeMode === "AVERAGE" || !pass) {
          s.grade = pass ? g.letter : "F";
          s.point = pass ? g.point : 0;
        }
        s.failureReason = pass ? "" : `Combined ${combined}/${rule.combinedFullMarks} below pass mark ${rule.combinedPassMark}`;
      }
      combinedUnits.set(rule.id, [a.point, b.point]);
      (a as SubjectResult & { _rule?: string })._rule = rule.id;
      (b as SubjectResult & { _rule?: string })._rule = rule.id;
    }

    // GPA
    const main = subjectResults.filter((s) => s.subjectType !== "OPTIONAL_4TH");
    const fourth = subjectResults.find((s) => s.subjectType === "OPTIONAL_4TH");
    const unitPoints: number[] = [];
    const countedRules = new Set<string>();
    for (const s of main) {
      const ruleId = (s as SubjectResult & { _rule?: string })._rule;
      if (ruleId) {
        if (countedRules.has(ruleId)) continue;
        countedRules.add(ruleId);
        const pts = combinedUnits.get(ruleId) ?? [s.point];
        unitPoints.push(pts.reduce((x, y) => x + y, 0) / pts.length);
      } else {
        unitPoints.push(s.point);
      }
    }
    const failedMain = main.filter((s) => !s.isPassed).length;
    const isPassed = failedMain === 0;
    const unitCount = unitPoints.length || 1;
    const sumPoints = unitPoints.reduce((x, y) => x + y, 0);
    const gpaWithoutFourth = isPassed ? sumPoints / unitCount : 0;
    let fourthBonus = 0;
    if (isPassed && fourth && fourth.isPassed) {
      fourthBonus = Math.max(0, fourth.point - grading.fourthSubjectThreshold) / unitCount;
    }
    const finalGpa = isPassed ? Math.min(grading.maxGpa, gpaWithoutFourth + fourthBonus) : 0;

    const sec = cls?.sections.find((s) => s.id === enr.sectionId);
    results.push({
      id: enr.id,
      enrollmentId: enr.id,
      studentId: enr.studentId,
      studentIdNo: enr.student.studentIdNo,
      roll: enr.classRoll,
      studentName: `${enr.student.firstName} ${enr.student.lastName}`.trim(),
      phone: enr.student.guardianPhone,
      classId: enr.classId,
      className: cls?.name ?? "",
      sectionId: enr.sectionId,
      sectionName: sec?.name ?? "",
      sectionShift: sec?.shift ?? "",
      groupType: enr.groupType,
      subjects: subjectResults.map((s) => {
        const { _rule, ...rest } = s as SubjectResult & { _rule?: string };
        void _rule;
        return rest;
      }),
      totalObtainedMarks: subjectResults.reduce((x, s) => x + s.marks, 0),
      gpaWithoutFourth: round2(gpaWithoutFourth),
      fourthBonus: round2(fourthBonus),
      finalGpa: round2(finalGpa),
      finalGrade: isPassed ? gradeFromGpa(grading, finalGpa) : "F",
      isPassed,
      totalFailedSubjects: failedMain,
      classRank: 0,
      sectionRank: 0,
    });
  }

  // Ranks (passed students only)
  const order = (a: StudentResult, b: StudentResult) =>
    b.finalGpa - a.finalGpa || b.totalObtainedMarks - a.totalObtainedMarks || a.roll - b.roll;
  const passed = results.filter((r) => r.isPassed).sort(order);
  passed.forEach((r, i) => (r.classRank = i + 1));
  const bySection = new Map<string, StudentResult[]>();
  passed.forEach((r) => bySection.set(r.sectionId, [...(bySection.get(r.sectionId) ?? []), r]));
  bySection.forEach((list) => list.forEach((r, i) => (r.sectionRank = i + 1)));

  results.sort(
    (a, b) =>
      (a.isPassed === b.isPassed ? 0 : a.isPassed ? -1 : 1) ||
      (a.isPassed ? a.classRank - b.classRank : a.roll - b.roll)
  );

  return { exam, grading, results };
}

export function filterResults(results: StudentResult[], f: ResultFilters): StudentResult[] {
  return results.filter((r) => {
    if (f.classId && r.classId !== f.classId) return false;
    if (f.sectionId && r.sectionId !== f.sectionId) return false;
    if (f.shift && f.shift !== "ALL" && r.sectionShift.toUpperCase() !== f.shift.toUpperCase()) return false;
    if (f.groupType && f.groupType !== "ALL" && r.groupType !== f.groupType) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Report builders
// ---------------------------------------------------------------------------

export function examHeader(db: MockDb, exam: MockExam) {
  const inst = db.institutions.find((i) => i.id === exam.institutionId) ?? db.institutions[0];
  const cls = db.classes.find((c) => c.id === exam.classId);
  const year = db.academicYears.find((y) => y.id === exam.academicYearId);
  return {
    id: exam.id,
    name: exam.name,
    status: exam.status,
    termCode: exam.termCode,
    classId: exam.classId,
    class: cls ? { id: cls.id, name: cls.name, numericValue: cls.numericValue } : null,
    academicYear: year ? { id: year.id, yearName: year.yearName, isCurrent: year.isCurrent } : null,
    institution: inst
      ? { id: inst.id, name: inst.name, nameBn: inst.nameBn, code: inst.code, address: inst.address }
      : null,
  };
}

function distinctSubjects(results: StudentResult[], db: MockDb, exam: MockExam) {
  const seen = new Map<string, { id: string; name: string; subjectCode: string }>();
  // keep exam-config order
  for (const cfg of exam.subjectConfigs) {
    const sub = db.subjects.find((s) => s.id === cfg.subjectId);
    if (!sub) continue;
    if (results.some((r) => r.subjects.some((s) => s.subjectId === cfg.subjectId))) {
      seen.set(sub.id, { id: sub.id, name: sub.name, subjectCode: sub.subjectCode ?? "" });
    }
  }
  return Array.from(seen.values()).sort((a, b) => (parseInt(a.subjectCode, 10) || 0) - (parseInt(b.subjectCode, 10) || 0));
}

export function buildTabulation(db: MockDb, comp: ExamComputation, f: ResultFilters) {
  const rows = filterResults(comp.results, f);
  const rules = db.combinedRules
    .filter((r) => r.examId === comp.exam.id)
    .map((r) => ({
      ...r,
      primarySubject: db.subjects.find((s) => s.id === r.primarySubjectId) ?? null,
      secondarySubject: db.subjects.find((s) => s.id === r.secondarySubjectId) ?? null,
    }));
  return {
    tabulation: rows,
    subjects: distinctSubjects(rows, db, comp.exam),
    combinedRules: rules,
    exam: examHeader(db, comp.exam),
  };
}

export function buildFailList(comp: ExamComputation, f: ResultFilters & { subjectId?: string | null }) {
  const rows: Record<string, unknown>[] = [];
  for (const r of filterResults(comp.results, f)) {
    for (const s of r.subjects) {
      if (s.isPassed) continue;
      if (f.subjectId && s.subjectId !== f.subjectId) continue;
      rows.push({
        enrollmentId: r.enrollmentId,
        studentIdNo: r.studentIdNo,
        roll: r.roll,
        studentName: r.studentName,
        className: r.className,
        sectionName: r.sectionName,
        groupType: r.groupType,
        subjectName: s.subjectName,
        subjectCode: s.subjectCode,
        marks: s.isAbsent ? "ABS" : s.marks,
        failureReason: s.failureReason,
        phone: r.phone,
        classId: r.classId,
        sectionId: r.sectionId,
        subjectId: s.subjectId,
        sectionShift: r.sectionShift,
      });
    }
  }
  return rows;
}

const GRADE_KEYS = ["A+", "A", "A-", "B", "C", "D", "F"];
const emptyCounts = () => Object.fromEntries(GRADE_KEYS.map((k) => [k, 0])) as Record<string, number>;
const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(2)}%` : "0.00%");

export function buildAtAGlance(db: MockDb, comp: ExamComputation, f: ResultFilters) {
  const all = comp.results;
  const rows = filterResults(all, f);
  const exam = comp.exam;
  const header = examHeader(db, exam);
  const cls = db.classes.find((c) => c.id === exam.classId);

  const total = rows.length;
  const passed = rows.filter((r) => r.isPassed);
  const failed = rows.filter((r) => !r.isPassed);
  const marks = rows.map((r) => r.totalObtainedMarks);
  const classMarks = all.map((r) => r.totalObtainedMarks);
  const max = (a: number[]) => (a.length ? Math.max(...a) : 0);
  const min = (a: number[]) => (a.length ? Math.min(...a) : 0);

  const brackets = ["5.00", "4.00 - 4.99", "3.50 - 3.99", "3.00 - 3.49", "2.00 - 2.99", "1.00 - 1.99"];
  const bracketOf = (gpa: number) =>
    gpa >= 5 ? 0 : gpa >= 4 ? 1 : gpa >= 3.5 ? 2 : gpa >= 3 ? 3 : gpa >= 2 ? 4 : 5;
  const gpaBrackets = brackets.map((bracket, i) => ({
    bracket,
    display:
      passed
        .filter((r) => bracketOf(r.finalGpa) === i)
        .map((r) => r.studentIdNo)
        .join(", ") || "-",
  }));

  const maxFail = Math.max(1, ...failed.map((r) => r.totalFailedSubjects));
  const failedBrackets = Array.from({ length: maxFail }, (_, i) => ({
    bracket: String(i + 1),
    display:
      failed
        .filter((r) => r.totalFailedSubjects === i + 1)
        .map((r) => r.studentIdNo)
        .join(", ") || "-",
  }));

  const subjectMap = new Map<string, { name: string; code: string }>();
  rows.forEach((r) => r.subjects.forEach((s) => subjectMap.set(s.subjectId, { name: s.subjectName, code: s.subjectCode })));
  const subjectList = Array.from(subjectMap.entries()).sort((a, b) => (parseInt(a[1].code, 10) || 0) - (parseInt(b[1].code, 10) || 0));

  const subjectwiseAnalysis = subjectList.map(([id, meta], i) => {
    const entries = rows.map((r) => r.subjects.find((s) => s.subjectId === id)).filter(Boolean) as SubjectResult[];
    const p = entries.filter((s) => s.isPassed).length;
    return {
      sl: i + 1,
      subjectName: meta.name,
      passedCount: p,
      passPercentage: pct(p, entries.length),
      failedCount: entries.length - p,
      failedPercentage: pct(entries.length - p, entries.length),
    };
  });

  const resultSheet = rows.map((r, i) => {
    const gradeCounts = emptyCounts();
    r.subjects.forEach((s) => (gradeCounts[s.grade] = (gradeCounts[s.grade] ?? 0) + 1));
    return {
      sl: i + 1,
      studentName: r.studentName,
      roll: r.roll,
      studentId: r.studentIdNo,
      totalMark: r.totalObtainedMarks,
      gpa: r.finalGpa.toFixed(2),
      grade: r.finalGrade,
      positionSection: r.isPassed ? r.sectionRank : "-",
      positionClass: r.isPassed ? r.classRank : "-",
      gradeCounts,
    };
  });

  const gradeStatisticsByCourse = subjectList.map(([id, meta]) => {
    const counts = emptyCounts();
    rows.forEach((r) => {
      const s = r.subjects.find((x) => x.subjectId === id);
      if (s) counts[s.grade] = (counts[s.grade] ?? 0) + 1;
    });
    return { subjectName: meta.name, counts };
  });

  const failRows = (excludeFourth: boolean) =>
    rows
      .map((r) => {
        const fails = r.subjects.filter((s) => !s.isPassed && (!excludeFourth || s.subjectType !== "OPTIONAL_4TH"));
        return { r, fails };
      })
      .filter((x) => x.fails.length > 0)
      .map(({ r, fails }) => ({
        studentId: r.studentIdNo,
        studentName: r.studentName,
        roll: r.roll,
        failQty: fails.length,
        failSubNames: fails.map((s) => s.subjectName).join(", "),
      }));

  return {
    exam: {
      id: exam.id,
      name: exam.name,
      class: cls?.name ?? header.class?.name ?? "",
      academicYear: header.academicYear?.yearName ?? "",
      institution: header.institution,
    },
    sections: cls?.sections ?? [],
    summary: {
      totalStudents: total,
      passedCount: passed.length,
      failedCount: failed.length,
      passPercentage: pct(passed.length, total),
      failedPercentage: pct(failed.length, total),
      highestMarkInClass: max(classMarks),
      lowestMarkInClass: min(classMarks),
      highestMarkInSection: max(marks),
      lowestMarkInSection: min(marks),
      highestGpaInClass: max(all.map((r) => r.finalGpa)).toFixed(2),
      highestGpaInSection: max(rows.map((r) => r.finalGpa)).toFixed(2),
    },
    gpaBrackets,
    failedBrackets,
    subjectwiseAnalysis,
    resultSheet,
    gradeStatisticsByCourse,
    failedStatisticsByCourse: failRows(false),
    failedStatisticsByCourseWithoutFourth: failRows(true),
  };
}

export function buildReportCard(db: MockDb, comp: ExamComputation, r: StudentResult, enr?: MockEnrollment) {
  const header = examHeader(db, comp.exam);
  const sec = db.classes.find((c) => c.id === r.classId)?.sections.find((s) => s.id === r.sectionId);
  return {
    institution: header.institution,
    exam: { id: comp.exam.id, name: comp.exam.name, year: header.academicYear?.yearName ?? "" },
    student: {
      id: r.studentId,
      name: r.studentName,
      roll: r.roll,
      idNo: r.studentIdNo,
      className: r.className,
      sectionName: r.sectionName,
      shift: sec?.shift === "MORNING" ? "Morning" : sec?.shift === "DAY" ? "Day" : "",
      group: r.groupType,
      guardianName: enr?.student.guardianName ?? "",
    },
    subjects: r.subjects.map((s) => ({
      id: `${r.enrollmentId}_${s.subjectId}`,
      subject: { id: s.subjectId, subjectCode: s.subjectCode, name: s.subjectName },
      subjectType: s.subjectType,
      components: s.components.map((c) => ({ name: c.name, obtained: c.obtained })),
      totalObtainedMarks: s.marks,
      letterGrade: s.grade,
      gradePoint: s.point,
    })),
    summary: {
      totalObtainedMarks: r.totalObtainedMarks,
      gpaWithoutFourth: r.gpaWithoutFourth,
      fourthBonus: r.fourthBonus,
      finalGpa: r.finalGpa,
      finalGrade: r.finalGrade,
      isPassed: r.isPassed,
      classRank: r.classRank,
      sectionRank: r.sectionRank,
    },
  };
}
