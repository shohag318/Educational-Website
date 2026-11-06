/**
 * Mock API request router.
 *
 * `handleMockRequest(method, pathSegments, searchParams, body)` mirrors the
 * real `/api/*` surface used by the UI (see `API_ENDPOINTS` in
 * `src/config-global.ts`) and mutates the in-memory store.
 *
 * Responses are always `{ success: true, data, ...extra }` or
 * `{ success: false, error }`. Several screens read extra top-level keys
 * (e.g. `rows`, `config`, `tabulation`, `reportCard`, `institution`), so those
 * are included alongside `data`.
 */
import {
  buildExamConfigs,
  isClassTestExam,
  makeConfig,
  MODULE_KEYS,
  NCTB_PRESET_PLANS,
  normalizeGroup,
  CURRENT_YEAR_ID,
  GRADING_SYSTEM_ID,
  INSTITUTION_ID,
  type MockAllocation,
  type MockClass,
  type MockClassSubject,
  type MockDb,
  type MockEnrollment,
  type MockExam,
  type MockExamSubjectConfig,
  type MockGradeSlab,
  type MockInstitution,
  type MockSection,
} from "./data";
import {
  buildAtAGlance,
  buildFailList,
  buildReportCard,
  buildTabulation,
  computeExamResults,
  filterResults,
} from "./results";
import { getStore, resetStore, uid } from "./store";

export interface MockResponse {
  status: number;
  body: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Body = Record<string, any>;

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

const ok = (data: unknown, extra: Record<string, unknown> = {}, status = 200): MockResponse => ({
  status,
  body: { success: true, data, ...extra },
});
const fail = (error: string, status = 400): MockResponse => ({ status, body: { success: false, error } });
const notFound = (): MockResponse => fail("Not found", 404);
const methodNotAllowed = (): MockResponse => fail("Method not allowed", 405);

const param = (sp: URLSearchParams, key: string): string | undefined => {
  const v = sp.get(key);
  return v === null || v === "" ? undefined : v;
};
const toNum = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
};
const toBool = (v: unknown): boolean => v === true || v === "true" || v === 1 || v === "1";
const arr = <T = any>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const now = () => new Date().toISOString();
const fullName = (e: MockEnrollment) => `${e.student.firstName} ${e.student.lastName}`.trim();
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// ---------------------------------------------------------------------------
// Lookup / decorate helpers
// ---------------------------------------------------------------------------

const classRef = (db: MockDb, id: string) => {
  const c = db.classes.find((x) => x.id === id);
  return c ? { id: c.id, name: c.name, numericValue: c.numericValue } : null;
};
const yearRef = (db: MockDb, id: string) => {
  const y = db.academicYears.find((x) => x.id === id);
  return y ? { id: y.id, yearName: y.yearName, isCurrent: y.isCurrent } : null;
};
const subjectRef = (db: MockDb, id: string) => {
  const s = db.subjects.find((x) => x.id === id);
  return s ? { id: s.id, subjectCode: s.subjectCode, name: s.name } : null;
};
const findSection = (db: MockDb, id: string): { cls: MockClass; section: MockSection } | null => {
  for (const cls of db.classes) {
    const section = cls.sections.find((s) => s.id === id);
    if (section) return { cls, section };
  }
  return null;
};
const currentYear = (db: MockDb) => db.academicYears.find((y) => y.isCurrent) ?? db.academicYears[0];
const primaryInstitutionId = (db: MockDb) => db.institutions[0]?.id ?? INSTITUTION_ID;

function decorateConfig(db: MockDb, cfg: MockExamSubjectConfig) {
  return { ...cfg, subject: subjectRef(db, cfg.subjectId) };
}

function decorateExam(db: MockDb, e: MockExam) {
  const inst = db.institutions.find((i) => i.id === e.institutionId) ?? db.institutions[0];
  return {
    ...e,
    class: classRef(db, e.classId),
    academicYear: yearRef(db, e.academicYearId),
    gradingSystem: (() => {
      const g = db.gradingSystems.find((x) => x.id === e.gradingSystemId);
      return g ? { id: g.id, name: g.name } : null;
    })(),
    institution: inst ? { id: inst.id, name: inst.name, code: inst.code, address: inst.address } : null,
    subjectConfigs: e.subjectConfigs
      .map((c) => decorateConfig(db, c))
      .sort((a, b) => (parseInt(a.subject?.subjectCode ?? "0", 10) || 0) - (parseInt(b.subject?.subjectCode ?? "0", 10) || 0)),
    _count: {
      marks: db.marks.filter((m) => m.examId === e.id).length,
      processedResults: db.processedResults.filter((r) => r.examId === e.id).length,
    },
  };
}

function decorateEnrollment(db: MockDb, e: MockEnrollment) {
  const found = findSection(db, e.sectionId);
  return {
    ...e,
    class: classRef(db, e.classId),
    section: found
      ? {
          id: found.section.id,
          name: found.section.name,
          shift: found.section.shift,
          groupType: found.section.groupType,
        }
      : null,
    academicYear: yearRef(db, e.academicYearId),
    allocations: e.allocations.map((a) => ({ ...a, subject: subjectRef(db, a.subjectId) })),
  };
}

function decorateClass(db: MockDb, c: MockClass) {
  const enr = db.enrollments.filter((e) => e.classId === c.id);
  return {
    ...c,
    _count: { enrollments: enr.length, sections: c.sections.length },
    sections: c.sections.map((s) => ({
      ...s,
      _count: { enrollments: enr.filter((e) => e.sectionId === s.id).length },
    })),
  };
}

function publicInstitution(i: MockInstitution) {
  const { adminPassword: _pw, ...rest } = i;
  void _pw;
  return rest;
}

function mappingsFor(db: MockDb, classId: string, group?: string): MockClassSubject[] {
  const g = group ? normalizeGroup(group) : "";
  return db.classSubjects.filter((m) => {
    if (m.classId !== classId) return false;
    if (!g) return true;
    if (g === "MANDATORY") return m.groupType === "MANDATORY";
    if (g === "ALL") return m.groupType === "ALL" || m.groupType === "MANDATORY";
    return m.groupType === g || m.groupType === "MANDATORY" || m.groupType === "ALL";
  });
}

function sortByCode<T extends { subjectCode?: string | null }>(list: T[]): T[] {
  return [...list].sort((a, b) => (parseInt(a.subjectCode ?? "0", 10) || 0) - (parseInt(b.subjectCode ?? "0", 10) || 0));
}

function removeSubjectEverywhere(db: MockDb, id: string) {
  db.subjects = db.subjects.filter((s) => s.id !== id);
  db.classSubjects = db.classSubjects.filter((m) => m.subjectId !== id);
  db.enrollments.forEach((e) => (e.allocations = e.allocations.filter((a) => a.subjectId !== id)));
  db.marks = db.marks.filter((m) => m.subjectId !== id);
  db.exams.forEach((e) => (e.subjectConfigs = e.subjectConfigs.filter((c) => c.subjectId !== id)));
  db.combinedRules = db.combinedRules.filter((r) => r.primarySubjectId !== id && r.secondarySubjectId !== id);
}

function removeEnrollments(db: MockDb, ids: Set<string>) {
  db.enrollments = db.enrollments.filter((e) => !ids.has(e.id));
  db.marks = db.marks.filter((m) => !ids.has(m.enrollmentId));
  db.processedResults = db.processedResults.filter((r) => !ids.has(r.enrollmentId));
}

function allocateFromMappings(db: MockDb, enr: MockEnrollment, fourthSubjectId?: string) {
  const maps = mappingsFor(db, enr.classId, enr.groupType).filter((m) => m.subjectType !== "OPTIONAL_4TH");
  for (const m of maps) {
    if (enr.allocations.some((a) => a.subjectId === m.subjectId)) continue;
    enr.allocations.push({ id: uid("alc"), enrollmentId: enr.id, subjectId: m.subjectId, subjectType: m.subjectType });
  }
  if (fourthSubjectId) setAllocation(enr, fourthSubjectId, "OPTIONAL_4TH");
}

function setAllocation(enr: MockEnrollment, subjectId: string, subjectType: string) {
  if (subjectType === "NONE") {
    enr.allocations = enr.allocations.filter((a) => a.subjectId !== subjectId);
    return;
  }
  if (subjectType === "OPTIONAL_4TH") {
    enr.allocations.forEach((a) => {
      if (a.subjectType === "OPTIONAL_4TH" && a.subjectId !== subjectId) a.subjectType = "GROUP_ELECTIVE";
    });
  }
  const existing = enr.allocations.find((a) => a.subjectId === subjectId);
  if (existing) existing.subjectType = subjectType;
  else enr.allocations.push({ id: uid("alc"), enrollmentId: enr.id, subjectId, subjectType } as MockAllocation);
}

function mergeCustomFields(student: MockEnrollment["student"], incoming: unknown) {
  if (!incoming || typeof incoming !== "object") return;
  let current: Record<string, unknown> = {};
  try {
    current = student.customFields ? JSON.parse(student.customFields) : {};
  } catch {
    current = {};
  }
  student.customFields = JSON.stringify({ ...current, ...(incoming as Record<string, unknown>) });
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function handleMockRequest(
  method: string,
  pathSegments: string[],
  searchParams: URLSearchParams,
  body?: unknown
): Promise<MockResponse> {
  const m = method.toUpperCase();
  const segs = (pathSegments || []).filter(Boolean).map(safeDecode);
  const payload: Body = body && typeof body === "object" ? (body as Body) : {};
  try {
    return route(m, segs, searchParams, payload);
  } catch (err) {
    console.error("[mock-api] handler error", err);
    return fail(err instanceof Error ? err.message : "Mock handler error", 500);
  }
}

function route(m: string, segs: string[], sp: URLSearchParams, body: Body): MockResponse {
  const db = getStore();
  const [a, b, c] = segs;

  switch (a) {
    case "academic-years":
      return academicYears(db, m, sp, body);
    case "classes":
      return classesRoute(db, m, sp, body);
    case "subjects":
      return subjectsRoute(db, m, sp, body);
    case "students":
      if (b === "bulk") return m === "POST" ? studentsBulk(db, body) : methodNotAllowed();
      if (b === "promote") return m === "POST" ? studentsPromote(db, body) : methodNotAllowed();
      return b ? notFound() : studentsRoute(db, m, sp, body);
    case "exams":
      if (b === "subjects") return examSubjects(db, m, sp, body);
      return b ? notFound() : examsRoute(db, m, sp, body);
    case "exam-routine":
      return b ? notFound() : examRoutine(db, m, body);
    case "marks":
      return b ? notFound() : marksRoute(db, m, sp, body);
    case "process-result":
      return m === "POST" ? processResult(db, body) : methodNotAllowed();
    case "setup":
      if (b === "class-subjects") return classSubjectsRoute(db, m, sp, body);
      if (b === "seed") return m === "POST" || m === "GET" ? seedRoute(false) : methodNotAllowed();
      if (b === "seed-dalta") return m === "POST" || m === "GET" ? seedRoute(true) : methodNotAllowed();
      return notFound();
    case "rules":
      if (b === "grading") return gradingRoute(db, m, body);
      if (b === "combined") return combinedRoute(db, m, sp, body);
      if (b === "components") return componentsRoute(db, m, sp, body);
      if (b === "templates") {
        if (c === "apply") return m === "POST" ? applyTemplate(db, body) : methodNotAllowed();
        return c ? notFound() : templatesRoute(db, m, sp, body);
      }
      return notFound();
    case "reports":
      return reportsRoute(db, m, sp, b, c);
    case "sms":
      if (b === "dispatch") return smsDispatch(db, m, sp, body);
      if (b === "custom") return m === "POST" ? smsCustom(db, body) : methodNotAllowed();
      if (b === "attendance") return m === "POST" ? smsAttendance(db, body) : methodNotAllowed();
      return notFound();
    case "auth":
      if (b === "portal-info") return m === "GET" ? portalInfo(db, sp) : methodNotAllowed();
      if (b === "portal-login") return m === "POST" ? portalLogin(db, body) : methodNotAllowed();
      return notFound();
    case "super-admin":
      if (b === "institutions") return institutionsRoute(db, m, c, body);
      return notFound();
    default:
      return notFound();
  }
}

// ---------------------------------------------------------------------------
// Academic years
// ---------------------------------------------------------------------------

function academicYears(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  if (m === "GET") {
    let list = [...db.academicYears];
    if (toBool(sp.get("activeOnly"))) list = list.filter((y) => y.isCurrent);
    list.sort((x, y) => y.yearName.localeCompare(x.yearName));
    return ok(
      list.map((y) => {
        const inst = db.institutions.find((i) => i.id === y.institutionId) ?? db.institutions[0];
        return {
          ...y,
          institution: inst ? { id: inst.id, name: inst.name, code: inst.code } : null,
          _count: {
            enrollments: db.enrollments.filter((e) => e.academicYearId === y.id).length,
            exams: db.exams.filter((e) => e.academicYearId === y.id).length,
          },
        };
      })
    );
  }

  if (m === "POST") {
    const yearName = String(body.yearName ?? "").trim();
    if (!yearName) return fail("yearName is required");
    if (db.academicYears.some((y) => y.yearName === yearName)) return fail(`Session "${yearName}" already exists`);
    const isCurrent = toBool(body.isCurrent);
    if (isCurrent && !toBool(body.allowMultiple)) db.academicYears.forEach((y) => (y.isCurrent = false));
    const year = {
      id: uid("ay"),
      institutionId: primaryInstitutionId(db),
      yearName,
      isCurrent,
      startDate: body.startDate ?? now(),
      endDate: body.endDate ?? now(),
      termStructure: body.termStructure,
      notes: body.notes,
    };
    db.academicYears.push(year);
    for (const sel of arr<{ name: string; numericValue: number }>(body.selectedClasses)) {
      if (!db.classes.some((c) => c.name === sel.name)) {
        db.classes.push({
          id: uid("cls"),
          institutionId: primaryInstitutionId(db),
          name: sel.name,
          numericValue: toNum(sel.numericValue),
          sections: [],
        });
      }
    }
    return ok(year, {}, 201);
  }

  if (m === "PUT" || m === "PATCH") {
    const year = db.academicYears.find((y) => y.id === body.id);
    if (!year) return fail("Academic year not found", 404);
    if (body.yearName !== undefined) {
      const name = String(body.yearName).trim();
      if (!name) return fail("yearName cannot be empty");
      if (db.academicYears.some((y) => y.id !== year.id && y.yearName === name)) return fail(`Session "${name}" already exists`);
      year.yearName = name;
    }
    if (body.startDate !== undefined) year.startDate = body.startDate;
    if (body.endDate !== undefined) year.endDate = body.endDate;
    if (body.isCurrent !== undefined) {
      const next = toBool(body.isCurrent);
      if (next && !toBool(body.allowMultiple)) db.academicYears.forEach((y) => (y.isCurrent = false));
      year.isCurrent = next;
    }
    return ok(year);
  }

  if (m === "DELETE") {
    const id = param(sp, "id") ?? body.id;
    const year = db.academicYears.find((y) => y.id === id);
    if (!year) return fail("Academic year not found", 404);
    if (toBool(sp.get("permanent"))) {
      removeEnrollments(db, new Set(db.enrollments.filter((e) => e.academicYearId === id).map((e) => e.id)));
      const examIds = new Set(db.exams.filter((e) => e.academicYearId === id).map((e) => e.id));
      db.exams = db.exams.filter((e) => !examIds.has(e.id));
      db.marks = db.marks.filter((mk) => !examIds.has(mk.examId));
      db.combinedRules = db.combinedRules.filter((r) => !examIds.has(r.examId));
      db.academicYears = db.academicYears.filter((y) => y.id !== id);
      return ok({ id }, { message: "Session deleted permanently" });
    }
    year.isCurrent = false;
    return ok(year, { message: "Session archived" });
  }
  return methodNotAllowed();
}

// ---------------------------------------------------------------------------
// Classes & sections
// ---------------------------------------------------------------------------

function classesRoute(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  if (m === "GET") {
    const list = [...db.classes].sort((x, y) => x.numericValue - y.numericValue || x.name.localeCompare(y.name));
    return ok(list.map((c) => decorateClass(db, c)));
  }

  if (m === "POST") {
    const name = String(body.name ?? "").trim();
    if (!name) return fail("Class name is required");
    if (db.classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) return fail(`Class "${name}" already exists`);
    const cls: MockClass = {
      id: uid("cls"),
      institutionId: primaryInstitutionId(db),
      name,
      numericValue: toNum(body.numericValue),
      sections: [],
    };
    db.classes.push(cls);
    return ok(decorateClass(db, cls), {}, 201);
  }

  // PUT: add a section to a class
  if (m === "PUT") {
    const cls = db.classes.find((c) => c.id === (body.classId ?? body.id));
    if (!cls) return fail("Class not found", 404);
    const name = String(body.sectionName ?? body.name ?? "").trim();
    if (!name) return fail("Section name is required");
    const groupType = normalizeGroup(body.groupType || "GENERAL") as MockSection["groupType"];
    const shift = (String(body.shift || "DAY").toUpperCase() === "MORNING" ? "MORNING" : "DAY") as MockSection["shift"];
    if (cls.sections.some((s) => s.name.toLowerCase() === name.toLowerCase() && s.groupType === groupType && s.shift === shift)) {
      return fail(`Section "${name}" (${groupType}, ${shift}) already exists in ${cls.name}`);
    }
    const section: MockSection = {
      id: uid("sec"),
      classId: cls.id,
      name,
      groupType,
      shift,
      capacity: toNum(body.capacity, 40),
    };
    cls.sections.push(section);
    return ok(decorateClass(db, cls));
  }

  if (m === "PATCH") {
    const cls = db.classes.find((c) => c.id === body.id);
    if (!cls) return fail("Class not found", 404);
    if (body.name !== undefined) cls.name = String(body.name).trim() || cls.name;
    if (body.numericValue !== undefined) cls.numericValue = toNum(body.numericValue, cls.numericValue);
    return ok(decorateClass(db, cls));
  }

  if (m === "DELETE") {
    const sectionId = param(sp, "sectionId") ?? body.sectionId;
    const id = param(sp, "id") ?? body.id;
    if (sectionId) {
      const found = findSection(db, sectionId);
      if (!found) return fail("Section not found", 404);
      if (db.enrollments.some((e) => e.sectionId === sectionId)) {
        return fail("Cannot remove a section that still has enrolled students");
      }
      found.cls.sections = found.cls.sections.filter((s) => s.id !== sectionId);
      return ok({ id: sectionId });
    }
    const cls = db.classes.find((c) => c.id === id);
    if (!cls) return fail("Class not found", 404);
    if (db.enrollments.some((e) => e.classId === id)) return fail("Cannot delete a class that still has enrolled students");
    db.classes = db.classes.filter((c) => c.id !== id);
    db.classSubjects = db.classSubjects.filter((x) => x.classId !== id);
    const examIds = new Set(db.exams.filter((e) => e.classId === id).map((e) => e.id));
    db.exams = db.exams.filter((e) => e.classId !== id);
    db.marks = db.marks.filter((mk) => !examIds.has(mk.examId));
    return ok({ id });
  }
  return methodNotAllowed();
}

// ---------------------------------------------------------------------------
// Subjects (catalog, class/exam scoped lists, allocations)
// ---------------------------------------------------------------------------

function subjectsRoute(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  if (m === "GET") {
    const classId = param(sp, "classId");
    const examId = param(sp, "examId");
    const group = param(sp, "groupType");
    const g = group ? normalizeGroup(group) : "";
    let list: any[];

    if (examId && toBool(sp.get("examOnly"))) {
      const exam = db.exams.find((e) => e.id === examId);
      if (!exam) return fail("Exam not found", 404);
      list = exam.subjectConfigs
        .filter((c) => !g || g === "ALL" || c.groupType === g || ["ALL", "MANDATORY", "GENERAL"].includes(c.groupType))
        .map((c) => ({ ...subjectRef(db, c.subjectId), groupType: c.groupType }))
        .filter((s) => s.id);
    } else if (classId) {
      const seen = new Set<string>();
      list = [];
      for (const map of mappingsFor(db, classId, g && g !== "ALL" ? g : undefined)) {
        if (seen.has(map.subjectId)) continue;
        seen.add(map.subjectId);
        const ref = subjectRef(db, map.subjectId);
        if (ref) list.push({ ...ref, groupType: map.groupType, subjectType: map.subjectType, creditWeight: map.creditWeight });
      }
    } else {
      list = db.subjects.map((s) => ({ ...s }));
    }
    return ok(sortByCode(list));
  }

  if (m === "POST") {
    const name = String(body.name ?? "").trim();
    if (!name) return fail("Subject name is required");
    const code = body.subjectCode ? String(body.subjectCode).trim() : null;
    if (code && db.subjects.some((s) => s.subjectCode === code)) return fail(`Subject code "${code}" already exists`);
    const sub = { id: uid("sub"), institutionId: primaryInstitutionId(db), subjectCode: code, name };
    db.subjects.push(sub);
    return ok(sub, {}, 201);
  }

  // PUT: subject allocation to student enrollments
  if (m === "PUT") {
    if (body.enrollmentId || body.enrollmentIds) {
      const ids: string[] = body.enrollmentIds ? arr<string>(body.enrollmentIds) : [body.enrollmentId];
      const subjectIds: string[] = body.subjectIds ? arr<string>(body.subjectIds) : body.subjectId ? [body.subjectId] : [];
      const type = String(body.subjectType || "MANDATORY");
      if (subjectIds.length === 0) return fail("subjectId is required");
      let touched = 0;
      for (const id of ids) {
        const enr = db.enrollments.find((e) => e.id === id);
        if (!enr) continue;
        subjectIds.forEach((sid) => setAllocation(enr, sid, type));
        touched += 1;
      }
      if (touched === 0) return fail("Enrollment not found", 404);
      return ok({ updated: touched }, { message: `Updated ${touched} enrollment(s)` });
    }
    // otherwise: update catalog subject
    const sub = db.subjects.find((s) => s.id === body.id);
    if (!sub) return fail("Subject not found", 404);
    if (body.name !== undefined) sub.name = String(body.name);
    if (body.subjectCode !== undefined) sub.subjectCode = body.subjectCode ? String(body.subjectCode) : null;
    return ok(sub);
  }

  if (m === "PATCH") {
    const sub = db.subjects.find((s) => s.id === body.id);
    if (!sub) return fail("Subject not found", 404);
    if (body.name !== undefined) sub.name = String(body.name);
    if (body.subjectCode !== undefined) sub.subjectCode = body.subjectCode ? String(body.subjectCode) : null;
    return ok(sub);
  }

  if (m === "DELETE") {
    const id = param(sp, "id") ?? body.id;
    if (!db.subjects.some((s) => s.id === id)) return fail("Subject not found", 404);
    removeSubjectEverywhere(db, id);
    return ok({ id });
  }
  return methodNotAllowed();
}

// ---------------------------------------------------------------------------
// Class <-> subject mapping (setup)
// ---------------------------------------------------------------------------

function upsertMapping(db: MockDb, classId: string, group: string, subjectId: string, subjectType: string) {
  const visible = mappingsFor(db, classId, group);
  const existing = visible.find((x) => x.subjectId === subjectId);
  if (existing) {
    existing.subjectType = subjectType;
    return existing;
  }
  const created: MockClassSubject = {
    id: uid("cs"),
    classId,
    groupType: normalizeGroup(group) || "ALL",
    subjectId,
    subjectType,
    creditWeight: 1,
  };
  db.classSubjects.push(created);
  return created;
}

function classSubjectsRoute(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  if (m === "GET") {
    const classId = param(sp, "classId");
    if (!classId) return fail("classId is required");
    const group = param(sp, "groupType");
    const g = group ? normalizeGroup(group) : "";
    const mappings = mappingsFor(db, classId, group)
      .map((x) => ({ ...x, subject: subjectRef(db, x.subjectId) }))
      .sort((x, y) => (parseInt(x.subject?.subjectCode ?? "0", 10) || 0) - (parseInt(y.subject?.subjectCode ?? "0", 10) || 0));
    const enrolled = db.enrollments.filter(
      (e) => e.classId === classId && (!g || g === "ALL" || g === "MANDATORY" || e.groupType === g)
    ).length;
    return ok({ classId, groupType: group ?? null, mappings, allSubjects: sortByCode(db.subjects), enrolledCount: enrolled });
  }
  if (m !== "POST") return methodNotAllowed();

  const action = String(body.action ?? "upsert");
  const classId: string = body.classId;
  const group: string = String(body.groupType ?? "ALL");
  const needClass = () => (classId && db.classes.some((c) => c.id === classId) ? null : fail("Class not found", 404));

  switch (action) {
    case "upsert": {
      const err = needClass();
      if (err) return err;
      if (!db.subjects.some((s) => s.id === body.subjectId)) return fail("Subject not found", 404);
      const mapping = upsertMapping(db, classId, group, body.subjectId, String(body.subjectType || "MANDATORY"));
      return ok(mapping, { message: "Subject mapping updated" });
    }
    case "batch_assign": {
      const err = needClass();
      if (err) return err;
      const ids = arr<string>(body.subjectIds);
      ids.forEach((id) => upsertMapping(db, classId, group, id, String(body.subjectType || "MANDATORY")));
      return ok({ count: ids.length }, { count: ids.length, message: `Assigned ${ids.length} subject(s)` });
    }
    case "remove":
    case "remove_batch": {
      const err = needClass();
      if (err) return err;
      const ids = new Set<string>(action === "remove" ? [body.subjectId] : arr<string>(body.subjectIds));
      const visible = new Set(mappingsFor(db, classId, group).map((x) => x.id));
      const before = db.classSubjects.length;
      db.classSubjects = db.classSubjects.filter((x) => !(visible.has(x.id) && ids.has(x.subjectId)));
      const removed = before - db.classSubjects.length;
      return ok({ count: removed }, { count: removed, message: `Removed ${removed} mapping(s)` });
    }
    case "delete_catalog_subject": {
      const ids = body.subjectIds ? arr<string>(body.subjectIds) : [body.subjectId];
      ids.filter(Boolean).forEach((id) => removeSubjectEverywhere(db, id));
      return ok({ count: ids.length }, { count: ids.length, message: `Removed ${ids.length} subject(s)` });
    }
    case "create_subject_and_map": {
      const err = needClass();
      if (err) return err;
      const name = String(body.name ?? "").trim();
      if (!name) return fail("Subject name is required");
      const code = body.subjectCode ? String(body.subjectCode).trim() : null;
      if (code && db.subjects.some((s) => s.subjectCode === code)) return fail(`Subject code "${code}" already exists`);
      const sub = { id: uid("sub"), institutionId: primaryInstitutionId(db), subjectCode: code, name };
      db.subjects.push(sub);
      upsertMapping(db, classId, group, sub.id, String(body.subjectType || "MANDATORY"));
      return ok(sub, { message: `Created ${name}` });
    }
    case "apply_preset": {
      const err = needClass();
      if (err) return err;
      const preset = NCTB_PRESET_PLANS[String(body.presetKey)];
      if (!preset) return fail("Unknown preset");
      const g = normalizeGroup(group);
      db.classSubjects = db.classSubjects.filter((x) => !(x.classId === classId && (x.groupType === g || x.groupType === "MANDATORY")));
      const add = (codes: string[], type: string, grp: string) =>
        codes.forEach((code) => {
          const sub = db.subjects.find((s) => s.subjectCode === code);
          if (sub) db.classSubjects.push({ id: uid("cs"), classId, groupType: grp, subjectId: sub.id, subjectType: type, creditWeight: 1 });
        });
      add(preset.mandatory, "MANDATORY", "MANDATORY");
      add(preset.elective, "GROUP_ELECTIVE", g === "MANDATORY" || g === "ALL" ? "ALL" : g);
      add(preset.fourth, "OPTIONAL_4TH", g === "MANDATORY" || g === "ALL" ? "ALL" : g);
      return ok({ ok: true }, { message: "NCTB preset applied" });
    }
    case "copy_from": {
      const target: string = body.targetClassId;
      if (!db.classes.some((c) => c.id === target) || !db.classes.some((c) => c.id === body.sourceClassId)) {
        return fail("Class not found", 404);
      }
      const src = normalizeGroup(body.sourceGroupType);
      const dst = normalizeGroup(body.targetGroupType);
      const copies = db.classSubjects.filter((x) => x.classId === body.sourceClassId && x.groupType === src);
      db.classSubjects = db.classSubjects.filter((x) => !(x.classId === target && x.groupType === dst));
      copies.forEach((x) => db.classSubjects.push({ ...x, id: uid("cs"), classId: target, groupType: dst }));
      return ok({ count: copies.length }, { count: copies.length, message: `Copied ${copies.length} subject(s)` });
    }
    case "sync_to_students": {
      const err = needClass();
      if (err) return err;
      const g = normalizeGroup(group);
      let added = 0;
      db.enrollments
        .filter((e) => e.classId === classId && (g === "ALL" || g === "MANDATORY" || e.groupType === g))
        .forEach((e) => {
          const before = e.allocations.length;
          allocateFromMappings(db, e);
          added += e.allocations.length - before;
        });
      return ok({ count: added }, { count: added, message: `Synced ${added} allocation(s) to students` });
    }
    default:
      return fail(`Unknown action "${action}"`);
  }
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

function studentsRoute(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  if (m === "GET") {
    const classId = param(sp, "classId");
    const sectionId = param(sp, "sectionId");
    const shift = param(sp, "shift");
    const group = param(sp, "groupType");
    const session = param(sp, "session");
    const yearId = param(sp, "academicYearId");
    const search = param(sp, "search")?.toLowerCase();
    const status = param(sp, "status");
    const enrollmentId = param(sp, "enrollmentId");
    const limit = toNum(param(sp, "limit"), 0);

    let list = db.enrollments.filter((e) => {
      if (enrollmentId && e.id !== enrollmentId) return false;
      if (classId && e.classId !== classId) return false;
      if (sectionId && e.sectionId !== sectionId) return false;
      if (group && group !== "ALL" && e.groupType !== normalizeGroup(group)) return false;
      if (yearId && e.academicYearId !== yearId) return false;
      if (shift && shift !== "ALL") {
        const sec = findSection(db, e.sectionId)?.section;
        if (!sec || sec.shift.toUpperCase() !== shift.toUpperCase()) return false;
      }
      if (session && session !== "ALL") {
        if (db.academicYears.find((y) => y.id === e.academicYearId)?.yearName !== session) return false;
      }
      if (status === "ACTIVE" && e.student.isActive === false) return false;
      if (status === "INACTIVE" && e.student.isActive !== false) return false;
      if (search) {
        const hay = `${fullName(e)} ${e.student.studentIdNo} ${e.student.guardianPhone} ${e.classRoll}`.toLowerCase();
        if (!hay.includes(search.replace(/^#/, ""))) return false;
      }
      return true;
    });

    const classNum = (id: string) => db.classes.find((c) => c.id === id)?.numericValue ?? 0;
    list = list.sort(
      (x, y) =>
        classNum(x.classId) - classNum(y.classId) ||
        x.sectionId.localeCompare(y.sectionId) ||
        x.classRoll - y.classRoll
    );
    if (limit > 0) list = list.slice(0, limit);
    return ok(list.map((e) => decorateEnrollment(db, e)));
  }

  if (m === "POST") {
    const found = findSection(db, body.sectionId);
    const classId = body.classId ?? found?.cls.id;
    if (!classId || !db.classes.some((c) => c.id === classId)) return fail("classId is required");
    if (!found) return fail("sectionId is required");
    const firstName = String(body.firstName ?? "").trim();
    if (!firstName) return fail("First name is required");
    const year = db.academicYears.find((y) => y.id === body.academicYearId) ?? currentYear(db);
    const sameSection = db.enrollments.filter((e) => e.sectionId === body.sectionId && e.academicYearId === year.id);
    const roll = parseInt(String(body.classRoll ?? ""), 10) || Math.max(0, ...sameSection.map((e) => e.classRoll)) + 1;
    if (sameSection.some((e) => e.classRoll === roll)) return fail(`Roll #${roll} is already assigned in this section`);
    const studentIdNo = String(body.studentIdNo ?? "").trim() || `ST-${Date.now().toString().slice(-6)}`;
    if (db.enrollments.some((e) => e.student.studentIdNo === studentIdNo && e.academicYearId === year.id)) {
      return fail(`Student ID "${studentIdNo}" already exists`);
    }

    const studentId = uid("std");
    const enr: MockEnrollment = {
      id: uid("enr"),
      studentId,
      academicYearId: year.id,
      classId,
      sectionId: body.sectionId,
      groupType: normalizeGroup(body.groupType || found.section.groupType),
      classRoll: roll,
      student: {
        id: studentId,
        institutionId: primaryInstitutionId(db),
        studentIdNo,
        firstName,
        lastName: String(body.lastName ?? ""),
        gender: String(body.gender ?? ""),
        religion: String(body.religion ?? ""),
        address: String(body.address ?? ""),
        guardianName: String(body.guardianName ?? ""),
        guardianPhone: String(body.guardianPhone ?? ""),
        customFields: body.customFields ? JSON.stringify(body.customFields) : null,
        isActive: true,
      },
      allocations: [],
    };
    allocateFromMappings(db, enr, body.fourthSubjectId || undefined);
    db.enrollments.push(enr);
    return ok(decorateEnrollment(db, enr), {}, 201);
  }

  if (m === "PUT" || m === "PATCH") {
    const ids = new Set<string>();
    arr<string>(body.enrollmentIds).forEach((x) => ids.add(x));
    if (body.enrollmentId) ids.add(body.enrollmentId);
    const studentIds = new Set<string>(arr<string>(body.studentIds));
    if (body.studentId) studentIds.add(body.studentId);

    let targets = db.enrollments.filter((e) => ids.has(e.id));
    if (targets.length === 0) targets = db.enrollments.filter((e) => studentIds.has(e.studentId));
    if (targets.length === 0) return fail("Student not found", 404);

    const bulk = targets.length > 1;
    for (const enr of targets) {
      const s = enr.student;
      (["firstName", "lastName", "gender", "religion", "address", "guardianName", "guardianPhone"] as const).forEach((k) => {
        if (body[k] !== undefined) s[k] = String(body[k] ?? "");
      });
      if (!bulk && body.studentIdNo !== undefined) {
        const next = String(body.studentIdNo).trim();
        if (!next) return fail("Student ID cannot be empty");
        if (db.enrollments.some((e) => e.id !== enr.id && e.studentId !== s.id && e.student.studentIdNo === next)) {
          return fail(`Student ID "${next}" already exists`);
        }
        s.studentIdNo = next;
      }
      if (body.isActive !== undefined) s.isActive = toBool(body.isActive);
      if (!bulk && body.classRoll !== undefined) {
        const roll = parseInt(String(body.classRoll), 10);
        if (Number.isFinite(roll)) enr.classRoll = roll;
      }
      if (!bulk && body.sectionId) {
        const found = findSection(db, body.sectionId);
        if (found) {
          enr.sectionId = found.section.id;
          enr.classId = found.cls.id;
        }
      }
      if (!bulk && body.groupType) enr.groupType = normalizeGroup(body.groupType);
      if (body.customFields) mergeCustomFields(s, body.customFields);
      if (!bulk && "fourthSubjectId" in body) {
        enr.allocations = enr.allocations.filter((al) => al.subjectType !== "OPTIONAL_4TH");
        if (body.fourthSubjectId) setAllocation(enr, body.fourthSubjectId, "OPTIONAL_4TH");
      }
    }
    return ok(decorateEnrollment(db, targets[0]), { count: targets.length });
  }

  if (m === "DELETE") {
    const ids = new Set<string>();
    arr<string>(body.enrollmentIds).forEach((x) => ids.add(x));
    if (body.enrollmentId) ids.add(body.enrollmentId);
    const queryId = param(sp, "id") ?? param(sp, "enrollmentId");
    if (queryId) ids.add(queryId);
    const studentIds = new Set<string>(arr<string>(body.studentIds));
    if (body.studentId) studentIds.add(body.studentId);
    if (ids.size === 0 && studentIds.size > 0) {
      db.enrollments.filter((e) => studentIds.has(e.studentId)).forEach((e) => ids.add(e.id));
    }
    const existing = db.enrollments.filter((e) => ids.has(e.id)).length;
    if (existing === 0) return fail("Student not found", 404);
    removeEnrollments(db, ids);
    return ok({ count: existing }, { count: existing });
  }
  return methodNotAllowed();
}

function studentsBulk(db: MockDb, body: Body): MockResponse {
  const found = findSection(db, body.sectionId);
  const classId = body.classId ?? found?.cls.id;
  if (!found || !classId) return fail("classId and sectionId are required");
  const rows = arr<Body>(body.students);
  if (rows.length === 0) return fail("No students provided");
  const year = db.academicYears.find((y) => y.id === body.academicYearId) ?? currentYear(db);
  const created: MockEnrollment[] = [];
  const skipped: string[] = [];

  for (const row of rows) {
    const sameSection = db.enrollments.filter((e) => e.sectionId === found.section.id && e.academicYearId === year.id);
    let roll = parseInt(String(row.classRoll ?? ""), 10);
    if (!Number.isFinite(roll) || sameSection.some((e) => e.classRoll === roll)) {
      roll = Math.max(0, ...sameSection.map((e) => e.classRoll)) + 1;
    }
    const studentIdNo = String(row.studentIdNo ?? "").trim() || `ST-${Date.now().toString().slice(-5)}-${roll}`;
    if (db.enrollments.some((e) => e.student.studentIdNo === studentIdNo && e.academicYearId === year.id)) {
      skipped.push(studentIdNo);
      continue;
    }
    const studentId = uid("std");
    const enr: MockEnrollment = {
      id: uid("enr"),
      studentId,
      academicYearId: year.id,
      classId,
      sectionId: found.section.id,
      groupType: normalizeGroup(row.groupType || found.section.groupType),
      classRoll: roll,
      student: {
        id: studentId,
        institutionId: primaryInstitutionId(db),
        studentIdNo,
        firstName: String(row.firstName ?? `Student ${roll}`),
        lastName: String(row.lastName ?? ""),
        gender: String(row.gender ?? ""),
        religion: String(row.religion ?? ""),
        address: String(row.address ?? ""),
        guardianName: String(row.guardianName ?? ""),
        guardianPhone: String(row.guardianPhone ?? "01700000000"),
        customFields: row.customFields && Object.keys(row.customFields).length ? JSON.stringify(row.customFields) : null,
        isActive: true,
      },
      allocations: [],
    };
    allocateFromMappings(db, enr, row.fourthSubjectId || undefined);
    db.enrollments.push(enr);
    created.push(enr);
  }

  const message = `Successfully enrolled ${created.length} student(s)${skipped.length ? ` (${skipped.length} duplicate ID(s) skipped)` : ""}.`;
  return ok(created.map((e) => decorateEnrollment(db, e)), { count: created.length, skipped, message }, 201);
}

function studentsPromote(db: MockDb, body: Body): MockResponse {
  const ids = arr<string>(body.enrollmentIds);
  if (ids.length === 0) return fail("No students selected");
  const found = findSection(db, body.targetSectionId);
  const targetClassId = body.targetClassId ?? found?.cls.id;
  if (!targetClassId || !db.classes.some((c) => c.id === targetClassId)) return fail("Target class is required");
  if (!found) return fail("Target section is required");
  const targetYear =
    db.academicYears.find((y) => y.id === body.targetAcademicYearId) ?? currentYear(db);
  const resequence = body.rollAssignment === "RESEQUENCE";
  let nextRoll = Math.max(1, parseInt(String(body.startingRoll ?? "1"), 10) || 1);
  const group = body.targetGroupType ? normalizeGroup(body.targetGroupType) : found.section.groupType;

  const sources = db.enrollments
    .filter((e) => ids.includes(e.id))
    .sort((x, y) => x.classRoll - y.classRoll);
  if (sources.length === 0) return fail("Students not found", 404);

  let promoted = 0;
  for (const src of sources) {
    const inTarget = db.enrollments.filter((e) => e.sectionId === found.section.id && e.academicYearId === targetYear.id);
    let roll = resequence ? nextRoll++ : src.classRoll;
    while (inTarget.some((e) => e.classRoll === roll && e.id !== src.id)) roll += 1;

    const sameSlot = src.academicYearId === targetYear.id;
    const target: MockEnrollment = sameSlot
      ? src
      : {
          id: uid("enr"),
          studentId: src.studentId,
          academicYearId: targetYear.id,
          classId: targetClassId,
          sectionId: found.section.id,
          groupType: group,
          classRoll: roll,
          student: JSON.parse(JSON.stringify(src.student)),
          allocations: [],
        };
    if (sameSlot) {
      src.classId = targetClassId;
      src.sectionId = found.section.id;
      src.groupType = group;
      src.classRoll = roll;
      src.allocations = [];
    } else {
      db.enrollments.push(target);
    }
    if (body.allocateSubjects !== false) allocateFromMappings(db, target);
    promoted += 1;
  }
  return ok({ count: promoted }, { count: promoted, message: `Promoted ${promoted} student(s) to ${found.cls.name} - ${found.section.name}.` });
}

// ---------------------------------------------------------------------------
// Exams & exam subject configs
// ---------------------------------------------------------------------------

const EXAM_STATUSES = ["DRAFT", "MARK_ENTRY", "DRAFT_PREVIEW", "PUBLISHED"];

function resolveYearId(db: MockDb, body: Body): string {
  if (body.academicYearId && db.academicYears.some((y) => y.id === body.academicYearId)) return body.academicYearId;
  const byName = body.session ? db.academicYears.find((y) => y.yearName === body.session) : undefined;
  return (byName ?? currentYear(db) ?? { id: CURRENT_YEAR_ID }).id;
}

function examsRoute(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  if (m === "GET") {
    const classId = param(sp, "classId");
    const id = param(sp, "id");
    const list = db.exams.filter((e) => (!classId || e.classId === classId) && (!id || e.id === id));
    return ok(list.map((e) => decorateExam(db, e)));
  }

  if (m === "POST") {
    const name = String(body.name ?? "").trim();
    if (!name) return fail("Exam name is required");
    if (!db.classes.some((c) => c.id === body.classId)) return fail("A valid class is required");
    const termCode = String(body.termCode ?? "Semester");
    const exam: MockExam = {
      id: uid("exm"),
      institutionId: primaryInstitutionId(db),
      academicYearId: resolveYearId(db, body),
      classId: body.classId,
      gradingSystemId: (db.gradingSystems.find((g) => g.isDefault) ?? db.gradingSystems[0])?.id ?? GRADING_SYSTEM_ID,
      name,
      termCode,
      status: "DRAFT",
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      subjectConfigs: [],
    };
    if (toBool(body.autoAssignSubjects)) {
      exam.subjectConfigs = buildExamConfigs(db, exam.id, exam.classId, isClassTestExam(exam));
    }
    db.exams.push(exam);
    return ok(decorateExam(db, exam), {}, 201);
  }

  if (m === "PUT") {
    const exam = db.exams.find((e) => e.id === body.id);
    if (!exam) return fail("Exam not found", 404);
    if (body.name !== undefined) exam.name = String(body.name).trim() || exam.name;
    if (body.termCode !== undefined) exam.termCode = String(body.termCode);
    if (body.classId && db.classes.some((c) => c.id === body.classId)) exam.classId = body.classId;
    if (body.academicYearId || body.session) exam.academicYearId = resolveYearId(db, body);
    if (body.startDate !== undefined) exam.startDate = body.startDate;
    if (body.endDate !== undefined) exam.endDate = body.endDate;
    return ok(decorateExam(db, exam));
  }

  if (m === "PATCH") {
    const exam = db.exams.find((e) => e.id === (body.examId ?? body.id));
    if (!exam) return fail("Exam not found", 404);
    if (body.status !== undefined) {
      const status = String(body.status).toUpperCase();
      if (!EXAM_STATUSES.includes(status)) return fail(`Invalid status "${body.status}"`);
      exam.status = status;
    }
    if (body.name !== undefined) exam.name = String(body.name);
    return ok(decorateExam(db, exam));
  }

  if (m === "DELETE") {
    const id = param(sp, "id") ?? body.id;
    if (!db.exams.some((e) => e.id === id)) return fail("Exam not found", 404);
    db.exams = db.exams.filter((e) => e.id !== id);
    db.marks = db.marks.filter((mk) => mk.examId !== id);
    db.combinedRules = db.combinedRules.filter((r) => r.examId !== id);
    db.processedResults = db.processedResults.filter((r) => r.examId !== id);
    return ok({ id });
  }
  return methodNotAllowed();
}

function applyComponents(cfg: MockExamSubjectConfig, comps: Body[]) {
  cfg.components = comps.map((c, i) => {
    const name = String(c.componentName ?? c.name ?? `C${i + 1}`).toUpperCase().trim();
    return {
      id: `${cfg.id}_${name}`,
      examSubjectConfigId: cfg.id,
      componentName: name,
      fullMarks: toNum(c.fullMarks),
      passMarks: toNum(c.passMarks),
      isMandatoryPass: c.isMandatoryPass === undefined ? true : toBool(c.isMandatoryPass),
    };
  });
}

function examSubjects(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  if (m === "GET") {
    const examId = param(sp, "examId");
    const exam = db.exams.find((e) => e.id === examId);
    if (!exam) return fail("Exam not found", 404);
    const configs = exam.subjectConfigs.map((c) => decorateConfig(db, c));
    return ok(
      {
        configs,
        classMappings: mappingsFor(db, exam.classId).map((x) => ({ ...x, subject: subjectRef(db, x.subjectId) })),
        allCatalogSubjects: sortByCode(db.subjects),
      },
      { configs }
    );
  }

  if (m === "POST") {
    const exam = db.exams.find((e) => e.id === body.examId);
    if (!exam) return fail("Exam not found", 404);
    const classTest = isClassTestExam(exam);
    const action = String(body.action ?? "");

    if (action === "sync_class_mappings") {
      const wanted = buildExamConfigs(db, exam.id, exam.classId, classTest);
      let added = 0;
      for (const cfg of wanted) {
        if (exam.subjectConfigs.some((x) => x.subjectId === cfg.subjectId)) continue;
        exam.subjectConfigs.push(cfg);
        added += 1;
      }
      return ok({ count: added }, { count: added, message: `Synchronized ${added} subject(s) from class mappings.` });
    }

    if (action === "assign") {
      const ids = arr<string>(body.subjectIds);
      if (ids.length === 0) return fail("Select at least one subject");
      let added = 0;
      for (const sid of ids) {
        const sub = db.subjects.find((s) => s.id === sid);
        if (!sub || exam.subjectConfigs.some((x) => x.subjectId === sid)) continue;
        const map = mappingsFor(db, exam.classId).find((x) => x.subjectId === sid);
        const requested = normalizeGroup(body.groupType);
        const group = map
          ? map.groupType === "MANDATORY"
            ? "ALL"
            : map.groupType
          : requested && requested !== "MANDATORY"
          ? requested
          : "ALL";
        exam.subjectConfigs.push(makeConfig(exam.id, sub, group, map?.creditWeight ?? 1, classTest));
        added += 1;
      }
      return ok({ count: added }, { count: added, message: `Successfully assigned ${added} subject(s)!` });
    }

    // single create
    const sub = db.subjects.find((s) => s.id === body.subjectId);
    if (!sub) return fail("Subject not found", 404);
    if (exam.subjectConfigs.some((x) => x.subjectId === sub.id)) return fail("Subject already assigned to this exam");
    const cfg = makeConfig(exam.id, sub, normalizeGroup(body.groupType) || "ALL", toNum(body.creditWeight, 1), classTest);
    if (body.totalFullMarks !== undefined) cfg.totalFullMarks = toNum(body.totalFullMarks, cfg.totalFullMarks);
    if (body.passMode) cfg.passMode = String(body.passMode);
    if (body.aggregatePassMark !== undefined) cfg.aggregatePassMark = toNum(body.aggregatePassMark, cfg.aggregatePassMark);
    if (Array.isArray(body.components) && body.components.length) applyComponents(cfg, body.components);
    exam.subjectConfigs.push(cfg);
    return ok(decorateConfig(db, cfg), {}, 201);
  }

  if (m === "PUT" || m === "PATCH") {
    const cfgId = body.configId ?? body.id;
    for (const exam of db.exams) {
      const cfg = exam.subjectConfigs.find((c) => c.id === cfgId);
      if (!cfg) continue;
      if (body.groupType !== undefined) cfg.groupType = normalizeGroup(body.groupType) || cfg.groupType;
      if (body.totalFullMarks !== undefined) cfg.totalFullMarks = toNum(body.totalFullMarks, cfg.totalFullMarks);
      if (body.passMode !== undefined) cfg.passMode = String(body.passMode);
      if (body.aggregatePassMark !== undefined) cfg.aggregatePassMark = toNum(body.aggregatePassMark, cfg.aggregatePassMark);
      if (body.creditWeight !== undefined) cfg.creditWeight = toNum(body.creditWeight, cfg.creditWeight);
      if (Array.isArray(body.components)) applyComponents(cfg, body.components);
      return ok(decorateConfig(db, cfg));
    }
    return fail("Subject configuration not found", 404);
  }

  if (m === "DELETE") {
    const ids = new Set<string>(arr<string>(body.configIds));
    const single = param(sp, "configId") ?? body.configId;
    if (single) ids.add(single);
    if (ids.size === 0) return fail("configId is required");
    let removed = 0;
    for (const exam of db.exams) {
      const gone = exam.subjectConfigs.filter((c) => ids.has(c.id));
      if (gone.length === 0) continue;
      removed += gone.length;
      exam.subjectConfigs = exam.subjectConfigs.filter((c) => !ids.has(c.id));
      const goneSubjects = new Set(gone.map((c) => c.subjectId));
      db.marks = db.marks.filter((mk) => !(mk.examId === exam.id && goneSubjects.has(mk.subjectId)));
    }
    if (removed === 0) return fail("Subject configuration not found", 404);
    return ok({ count: removed }, { count: removed, message: `Successfully removed ${removed} subject(s).` });
  }
  return methodNotAllowed();
}

// ---------------------------------------------------------------------------
// Exam routine (server part only returns lookup data; routines kept in store)
// ---------------------------------------------------------------------------

function examRoutine(db: MockDb, m: string, body: Body): MockResponse {
  if (m === "GET") {
    return ok({
      classes: [...db.classes]
        .sort((x, y) => x.numericValue - y.numericValue)
        .map((c) => ({ id: c.id, name: c.name, numericValue: c.numericValue, shift: c.sections[0]?.shift ?? "DAY" })),
      exams: db.exams.map((e) => ({
        id: e.id,
        name: e.name,
        classId: e.classId,
        termCode: e.termCode,
        status: e.status,
        academicYear: yearRef(db, e.academicYearId),
        subjectConfigs: e.subjectConfigs.map((c) => ({ subject: subjectRef(db, c.subjectId) })),
      })),
      allSubjects: sortByCode(db.subjects).map((s) => ({ id: s.id, subjectCode: s.subjectCode, name: s.name })),
      routines: db.routines,
    });
  }
  if (m === "POST" || m === "PUT") {
    const incoming = (body.routine ?? body) as Body;
    if (!incoming.examId && !incoming.classId) return fail("examId or classId is required");
    const existing = db.routines.find((r) => (incoming.id && r.id === incoming.id) || (incoming.examId && r.examId === incoming.examId));
    if (existing) {
      Object.assign(existing, incoming, { id: existing.id, updatedAt: now() });
      return ok(existing);
    }
    const created = { ...(incoming as any), id: incoming.id ?? uid("rt"), items: arr(incoming.items), updatedAt: now() };
    db.routines.push(created);
    return ok(created, {}, 201);
  }
  return methodNotAllowed();
}

// ---------------------------------------------------------------------------
// Marks & result processing
// ---------------------------------------------------------------------------

function marksRoute(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  if (m === "GET") {
    const examId = param(sp, "examId");
    const subjectId = param(sp, "subjectId");
    if (!examId || !subjectId) return fail("examId and subjectId are required");
    const exam = db.exams.find((e) => e.id === examId);
    if (!exam) return fail("Exam not found", 404);
    const cfg = exam.subjectConfigs.find((c) => c.subjectId === subjectId);
    if (!cfg) return fail("This subject is not assigned to the selected exam", 404);

    const classId = param(sp, "classId");
    const sectionId = param(sp, "sectionId");
    const shift = param(sp, "shift");
    const group = param(sp, "groupType");

    const rows = db.enrollments
      .filter((e) => {
        if (e.classId !== exam.classId || e.academicYearId !== exam.academicYearId) return false;
        if (e.student.isActive === false) return false;
        if (classId && e.classId !== classId) return false;
        if (sectionId && e.sectionId !== sectionId) return false;
        if (group && group !== "ALL" && e.groupType !== normalizeGroup(group)) return false;
        const sec = findSection(db, e.sectionId)?.section;
        if (shift && shift !== "ALL" && sec?.shift.toUpperCase() !== shift.toUpperCase()) return false;
        return e.allocations.some((a) => a.subjectId === subjectId);
      })
      .sort((x, y) => x.sectionId.localeCompare(y.sectionId) || x.classRoll - y.classRoll)
      .map((e) => {
        const mark = db.marks.find((mk) => mk.examId === examId && mk.enrollmentId === e.id && mk.subjectId === subjectId);
        const sec = findSection(db, e.sectionId)?.section;
        return {
          enrollmentId: e.id,
          studentId: e.studentId,
          studentIdNo: e.student.studentIdNo,
          roll: e.classRoll,
          name: fullName(e),
          studentName: fullName(e),
          subjectType: e.allocations.find((a) => a.subjectId === subjectId)?.subjectType ?? "MANDATORY",
          isAbsent: mark?.isAbsent ?? false,
          isOverride: mark?.isOverride ?? false,
          components: { ...(mark?.components ?? {}) },
          sectionId: e.sectionId,
          sectionName: sec?.name ?? "",
          sectionShift: sec?.shift ?? "",
          groupType: e.groupType,
        };
      });

    const config = {
      id: cfg.id,
      examId,
      subjectId,
      subject: subjectRef(db, subjectId),
      groupType: cfg.groupType,
      totalFullMarks: cfg.totalFullMarks,
      passMode: cfg.passMode,
      aggregatePassMark: cfg.aggregatePassMark,
      creditWeight: cfg.creditWeight,
      components: cfg.components,
    };
    return ok(rows, { rows, config });
  }

  if (m === "POST" || m === "PUT") {
    const exam = db.exams.find((e) => e.id === body.examId);
    if (!exam) return fail("Exam not found", 404);
    if (!db.subjects.some((s) => s.id === body.subjectId)) return fail("Subject not found", 404);
    const entries = arr<Body>(body.entries);
    const isOverride = toBool(body.isOverride);
    let saved = 0;
    for (const entry of entries) {
      if (!db.enrollments.some((e) => e.id === entry.enrollmentId)) continue;
      const components: Record<string, number | ""> = {};
      Object.entries((entry.components ?? {}) as Record<string, unknown>).forEach(([k, v]) => {
        components[k] = v === "" || v === null || v === undefined ? "" : toNum(v);
      });
      let mark = db.marks.find(
        (mk) => mk.examId === exam.id && mk.enrollmentId === entry.enrollmentId && mk.subjectId === body.subjectId
      );
      if (!mark) {
        mark = {
          id: uid("mrk"),
          examId: exam.id,
          enrollmentId: entry.enrollmentId,
          subjectId: body.subjectId,
          isAbsent: false,
          isOverride: false,
          components: {},
          updatedAt: now(),
        };
        db.marks.push(mark);
      }
      mark.isAbsent = toBool(entry.isAbsent);
      mark.components = isOverride ? { ...mark.components, ...components } : components;
      mark.updatedAt = now();
      if (isOverride) {
        mark.isOverride = true;
        mark.auditReason = body.auditReason;
        mark.modifiedBy = body.modifiedBy;
      }
      saved += 1;
    }
    return ok({ count: saved }, { count: saved, message: `Saved marks for ${saved} student(s)` });
  }
  return methodNotAllowed();
}

function processResult(db: MockDb, body: Body): MockResponse {
  const comp = computeExamResults(db, body.examId);
  if (!comp) return fail("Exam not found", 404);
  const { exam, results } = comp;
  if (results.length === 0) return fail("No marks have been entered for this exam yet");

  db.processedResults = db.processedResults.filter((r) => r.examId !== exam.id);
  results.forEach((r) =>
    db.processedResults.push({
      id: uid("pr"),
      examId: exam.id,
      enrollmentId: r.enrollmentId,
      totalObtainedMarks: r.totalObtainedMarks,
      gpaWithoutFourth: r.gpaWithoutFourth,
      fourthSubjectBonusPoints: r.fourthBonus,
      finalGpa: r.finalGpa,
      finalLetterGrade: r.finalGrade,
      isPassed: r.isPassed,
      totalFailedSubjects: r.totalFailedSubjects,
      meritRankClass: r.isPassed ? r.classRank : null,
      meritRankSection: r.isPassed ? r.sectionRank : null,
    })
  );
  if (exam.status === "DRAFT" || exam.status === "MARK_ENTRY") exam.status = "DRAFT_PREVIEW";

  const passed = results.filter((r) => r.isPassed).length;
  const summary = {
    totalStudents: results.length,
    passedCount: passed,
    failedCount: results.length - passed,
    gpa5Count: results.filter((r) => r.finalGpa >= 5).length,
    passRate: ((passed / results.length) * 100).toFixed(1),
  };
  return ok(summary, { summary, message: `Processed results for ${results.length} student(s)` });
}

// ---------------------------------------------------------------------------
// Seed routes
// ---------------------------------------------------------------------------

function seedRoute(dalta: boolean): MockResponse {
  const db = resetStore({ dalta });
  return ok(
    { students: db.enrollments.length, exams: db.exams.length },
    { message: dalta ? "Dalta sample data loaded (mock)" : "Mock store reset to base seed" }
  );
}

// ---------------------------------------------------------------------------
// Rules: grading, combined, components, templates
// ---------------------------------------------------------------------------

function normalizeSlabs(gradingSystemId: string, slabs: Body[]): MockGradeSlab[] {
  return slabs.map((s) => ({
    id: s.id || uid("slab"),
    gradingSystemId,
    letterGrade: String(s.letterGrade ?? ""),
    gradePoint: toNum(s.gradePoint),
    markMin: toNum(s.markMin),
    markMax: toNum(s.markMax),
    isFail: toBool(s.isFail),
    comments: s.comments ?? null,
  }));
}

function gradingRoute(db: MockDb, m: string, body: Body): MockResponse {
  if (m === "GET") return ok(db.gradingSystems);

  if (m === "POST") {
    const existing = db.gradingSystems.find((g) => g.id === (body.id ?? body.gradingSystemId));
    if (existing) return applyGrading(existing, body);
    const id = uid("gs");
    const grading = {
      id,
      institutionId: primaryInstitutionId(db),
      name: String(body.name ?? "Custom Grading System"),
      maxGpa: toNum(body.maxGpa, 5),
      fourthSubjectThreshold: toNum(body.fourthSubjectThreshold, 2),
      passGpa: toNum(body.passGpa, 1),
      isDefault: false,
      slabs: [] as MockGradeSlab[],
    };
    grading.slabs = normalizeSlabs(id, arr(body.slabs));
    db.gradingSystems.push(grading);
    return ok(grading, {}, 201);
  }

  if (m === "PUT" || m === "PATCH") {
    const g = db.gradingSystems.find((x) => x.id === (body.gradingSystemId ?? body.id));
    if (!g) return fail("Grading system not found", 404);
    return applyGrading(g, body);
  }
  return methodNotAllowed();
}

function applyGrading(g: MockDb["gradingSystems"][number], body: Body): MockResponse {
  if (body.name !== undefined) g.name = String(body.name);
  if (body.maxGpa !== undefined) g.maxGpa = toNum(body.maxGpa, g.maxGpa);
  if (body.fourthSubjectThreshold !== undefined) g.fourthSubjectThreshold = toNum(body.fourthSubjectThreshold, g.fourthSubjectThreshold);
  if (body.passGpa !== undefined) g.passGpa = toNum(body.passGpa, g.passGpa);
  if (Array.isArray(body.slabs)) g.slabs = normalizeSlabs(g.id, body.slabs);
  return ok(g);
}

function combinedRoute(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  const decorate = (r: MockDb["combinedRules"][number]) => ({
    ...r,
    primarySubject: subjectRef(db, r.primarySubjectId),
    secondarySubject: subjectRef(db, r.secondarySubjectId),
  });

  if (m === "GET") {
    const examId = param(sp, "examId");
    return ok(db.combinedRules.filter((r) => !examId || r.examId === examId).map(decorate));
  }

  if (m === "POST" || m === "PUT" || m === "PATCH") {
    if (!db.exams.some((e) => e.id === body.examId)) return fail("Exam not found", 404);
    if (!db.subjects.some((s) => s.id === body.primarySubjectId) || !db.subjects.some((s) => s.id === body.secondarySubjectId)) {
      return fail("Both primary and secondary subjects are required");
    }
    if (body.primarySubjectId === body.secondarySubjectId) return fail("Primary and secondary subjects must differ");
    const fields = {
      examId: body.examId,
      name: body.name ? String(body.name) : null,
      primarySubjectId: body.primarySubjectId,
      secondarySubjectId: body.secondarySubjectId,
      combinedPassMark: toNum(body.combinedPassMark, 66),
      combinedFullMarks: toNum(body.combinedFullMarks, 200),
      passMode: String(body.passMode ?? "AGGREGATE_ONLY"),
      gradeMode: String(body.gradeMode ?? "AVERAGE"),
    };
    const existing = db.combinedRules.find(
      (r) =>
        (body.id && r.id === body.id) ||
        (!body.id && r.examId === fields.examId && r.primarySubjectId === fields.primarySubjectId && r.secondarySubjectId === fields.secondarySubjectId)
    );
    if (existing) {
      Object.assign(existing, fields);
      return ok(decorate(existing));
    }
    const created = { id: uid("rule"), ...fields };
    db.combinedRules.push(created);
    return ok(decorate(created), {}, 201);
  }

  if (m === "DELETE") {
    const id = param(sp, "id") ?? body.id;
    if (!db.combinedRules.some((r) => r.id === id)) return fail("Rule not found", 404);
    db.combinedRules = db.combinedRules.filter((r) => r.id !== id);
    return ok({ id });
  }
  return methodNotAllowed();
}

function componentsRoute(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  const allConfigs = () => db.exams.flatMap((e) => e.subjectConfigs);
  if (m === "GET") {
    const cfgId = param(sp, "examSubjectConfigId") ?? param(sp, "configId");
    const cfg = allConfigs().find((c) => c.id === cfgId);
    return ok(cfg ? cfg.components : allConfigs().flatMap((c) => c.components));
  }
  if (m === "POST") {
    const cfg = allConfigs().find((c) => c.id === body.examSubjectConfigId);
    if (!cfg) return fail("Subject configuration not found", 404);
    const name = String(body.componentName ?? "").toUpperCase().trim();
    if (!name) return fail("componentName is required");
    const existing = cfg.components.find((c) => c.componentName === name);
    const comp = existing ?? { id: uid("cmp"), examSubjectConfigId: cfg.id, componentName: name, fullMarks: 0, passMarks: 0, isMandatoryPass: true };
    comp.fullMarks = toNum(body.fullMarks, comp.fullMarks);
    comp.passMarks = toNum(body.passMarks, comp.passMarks);
    if (body.isMandatoryPass !== undefined) comp.isMandatoryPass = toBool(body.isMandatoryPass);
    if (!existing) cfg.components.push(comp);
    return ok(comp, {}, existing ? 200 : 201);
  }
  if (m === "PUT" || m === "PATCH") {
    for (const cfg of allConfigs()) {
      const comp = cfg.components.find((c) => c.id === body.id);
      if (!comp) continue;
      if (body.componentName !== undefined) comp.componentName = String(body.componentName).toUpperCase();
      if (body.fullMarks !== undefined) comp.fullMarks = toNum(body.fullMarks, comp.fullMarks);
      if (body.passMarks !== undefined) comp.passMarks = toNum(body.passMarks, comp.passMarks);
      if (body.isMandatoryPass !== undefined) comp.isMandatoryPass = toBool(body.isMandatoryPass);
      return ok(comp);
    }
    return fail("Component not found", 404);
  }
  if (m === "DELETE") {
    const id = param(sp, "id") ?? body.id;
    for (const cfg of allConfigs()) {
      if (cfg.components.some((c) => c.id === id)) {
        cfg.components = cfg.components.filter((c) => c.id !== id);
        return ok({ id });
      }
    }
    return fail("Component not found", 404);
  }
  return methodNotAllowed();
}

function decorateTemplate(db: MockDb, t: MockDb["templates"][number]) {
  return {
    ...t,
    class: classRef(db, t.classId),
    items: t.items.map((i) => ({ ...i, subject: subjectRef(db, i.subjectId) })),
  };
}

function templatesRoute(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  if (m === "GET") {
    const classId = param(sp, "classId");
    return ok(db.templates.filter((t) => !classId || t.classId === classId).map((t) => decorateTemplate(db, t)));
  }

  if (m === "POST" || m === "PUT" || m === "PATCH") {
    const name = String(body.name ?? "").trim();
    const isUpdate = m !== "POST" && body.id;
    const existing = isUpdate ? db.templates.find((t) => t.id === body.id) : undefined;
    if (isUpdate && !existing) return fail("Template not found", 404);
    if (!isUpdate && !name) return fail("Template name is required");
    if (!isUpdate && !db.classes.some((c) => c.id === body.classId)) return fail("A valid class is required");

    const tpl = existing ?? {
      id: uid("tpl"),
      institutionId: primaryInstitutionId(db),
      name,
      classId: body.classId as string,
      description: null as string | null,
      items: [] as MockDb["templates"][number]["items"],
    };
    if (name) tpl.name = name;
    if (body.classId) tpl.classId = body.classId;
    if (body.description !== undefined) tpl.description = body.description ? String(body.description) : null;
    if (Array.isArray(body.items)) {
      tpl.items = arr<Body>(body.items)
        .filter((i) => db.subjects.some((s) => s.id === i.subjectId))
        .map((i) => ({
          id: uid("tpli"),
          templateId: tpl.id,
          subjectId: i.subjectId,
          totalMarks: toNum(i.totalMarks, 100),
          passMarks: toNum(i.passMarks, 33),
          cqMarks: toNum(i.cqMarks),
          mcqMarks: toNum(i.mcqMarks),
          practicalMarks: toNum(i.practicalMarks),
        }));
    }
    if (!existing) db.templates.push(tpl);
    return ok(decorateTemplate(db, tpl), {}, existing ? 200 : 201);
  }

  if (m === "DELETE") {
    const id = param(sp, "id") ?? body.id;
    if (!db.templates.some((t) => t.id === id)) return fail("Template not found", 404);
    db.templates = db.templates.filter((t) => t.id !== id);
    return ok({ id });
  }
  return methodNotAllowed();
}

function applyTemplate(db: MockDb, body: Body): MockResponse {
  const tpl = db.templates.find((t) => t.id === body.templateId);
  if (!tpl) return fail("Template not found", 404);
  const exam = db.exams.find((e) => e.id === body.examId);
  if (!exam) return fail("Exam not found", 404);

  let count = 0;
  for (const item of tpl.items) {
    const sub = db.subjects.find((s) => s.id === item.subjectId);
    if (!sub) continue;
    let cfg = exam.subjectConfigs.find((c) => c.subjectId === item.subjectId);
    if (!cfg) {
      const map = mappingsFor(db, exam.classId).find((x) => x.subjectId === sub.id);
      cfg = makeConfig(exam.id, sub, map ? (map.groupType === "MANDATORY" ? "ALL" : map.groupType) : "ALL", map?.creditWeight ?? 1);
      exam.subjectConfigs.push(cfg);
    }
    cfg.totalFullMarks = item.totalMarks;
    cfg.aggregatePassMark = item.passMarks;
    const parts: [string, number][] = [
      ["CQ", item.cqMarks],
      ["MCQ", item.mcqMarks],
      ["PRACTICAL", item.practicalMarks],
    ];
    applyComponents(
      cfg,
      parts
        .filter(([, full]) => full > 0)
        .map(([componentName, fullMarks]) => ({
          componentName,
          fullMarks,
          passMarks: Math.max(1, Math.round((fullMarks * item.passMarks) / (item.totalMarks || 100))),
          isMandatoryPass: true,
        }))
    );
    count += 1;
  }
  return ok({ count }, { count, message: `Template "${tpl.name}" applied to ${exam.name}: ${count} subject(s) configured.` });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

function reportsRoute(db: MockDb, m: string, sp: URLSearchParams, b?: string, c?: string): MockResponse {
  if (m !== "GET") return methodNotAllowed();
  const examId = param(sp, "examId");
  const filters = {
    classId: param(sp, "classId"),
    sectionId: param(sp, "sectionId"),
    shift: param(sp, "shift"),
    groupType: param(sp, "groupType") ? normalizeGroup(param(sp, "groupType")) : undefined,
  };

  if (!b || !["tabulation", "at-a-glance", "fail-list", "marksheet"].includes(b)) return notFound();
  if (!examId) return fail("examId is required");
  const comp = computeExamResults(db, examId);
  if (!comp) return fail("Exam not found", 404);

  if (b === "tabulation") {
    const t = buildTabulation(db, comp, filters);
    return ok(t.tabulation, t);
  }

  if (b === "at-a-glance") {
    if (comp.results.length === 0) return fail("No results available for this exam yet", 404);
    const report = buildAtAGlance(db, comp, filters);
    return ok(report, report);
  }

  if (b === "fail-list") {
    const rows = buildFailList(comp, { ...filters, subjectId: param(sp, "subjectId") });
    return ok(rows, { count: rows.length });
  }

  // marksheet
  if (c === "bulk") {
    const rows = filterResults(comp.results, filters).sort(
      (x, y) => x.sectionId.localeCompare(y.sectionId) || x.roll - y.roll
    );
    const cards = rows.map((r) =>
      buildReportCard(db, comp, r, db.enrollments.find((e) => e.id === r.enrollmentId))
    );
    return ok(cards, { reportCards: cards, count: cards.length });
  }
  const enrollmentId = param(sp, "enrollmentId") ?? c;
  if (!enrollmentId) return fail("enrollmentId is required");
  const result = comp.results.find((r) => r.enrollmentId === enrollmentId);
  if (!result) return fail("No result found for this student in the selected exam", 404);
  const card = buildReportCard(db, comp, result, db.enrollments.find((e) => e.id === enrollmentId));
  return ok(card, { reportCard: card });
}

// ---------------------------------------------------------------------------
// SMS
// ---------------------------------------------------------------------------

const validPhone = (p: unknown) => /^(\+?88)?01[3-9]\d{8}$/.test(String(p ?? "").replace(/[\s-]/g, ""));

function renderTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

function smsDispatch(db: MockDb, m: string, sp: URLSearchParams, body: Body): MockResponse {
  if (m === "GET") {
    const examId = param(sp, "examId");
    const f = {
      classId: param(sp, "classId"),
      sectionId: param(sp, "sectionId"),
      shift: param(sp, "shift"),
      groupType: param(sp, "groupType") ? normalizeGroup(param(sp, "groupType")) : undefined,
    };
    const hasFilter = Boolean(f.classId || f.sectionId || (f.shift && f.shift !== "ALL") || (f.groupType && f.groupType !== "ALL"));
    let logs = db.smsLogs.filter((l) => l.campaign === "RESULT" && (!examId || l.examId === examId));
    if (hasFilter) {
      logs = logs.filter((l) => {
        const enr = db.enrollments.find((e) => e.id === l.enrollmentId);
        if (!enr) return false;
        if (f.classId && enr.classId !== f.classId) return false;
        if (f.sectionId && enr.sectionId !== f.sectionId) return false;
        if (f.groupType && f.groupType !== "ALL" && enr.groupType !== f.groupType) return false;
        const sec = findSection(db, enr.sectionId)?.section;
        if (f.shift && f.shift !== "ALL" && sec?.shift !== f.shift.toUpperCase()) return false;
        return true;
      });
    }
    return ok(logs.slice(0, 100));
  }

  if (m !== "POST") return methodNotAllowed();
  const comp = computeExamResults(db, body.examId);
  if (!comp) return fail("Exam not found", 404);
  const targets = filterResults(comp.results, {
    classId: body.classId,
    sectionId: body.sectionId,
    shift: body.shift,
    groupType: body.groupType ? normalizeGroup(body.groupType) : undefined,
  });
  if (targets.length === 0) return fail("No processed results found for the selected filters");
  const template: string =
    body.customTemplate ||
    "Dear Guardian, {student_name} (Roll: {roll}) obtained GPA: {gpa}, Grade: {grade} in {exam_name}. Status: {status}. - {institution}";
  const institution = db.institutions[0]?.name ?? "School";

  let sent = 0;
  let failed = 0;
  const created = targets.map((r) => {
    const okPhone = validPhone(r.phone);
    okPhone ? (sent += 1) : (failed += 1);
    const log = {
      id: uid("sms"),
      examId: comp.exam.id,
      enrollmentId: r.enrollmentId,
      recipientPhone: r.phone,
      status: okPhone ? "SENT" : "FAILED",
      messageBody: renderTemplate(template, {
        student_name: r.studentName,
        roll: r.roll,
        gpa: r.finalGpa.toFixed(2),
        grade: r.finalGrade,
        status: r.isPassed ? "PASSED" : "FAILED",
        exam_name: comp.exam.name,
        institution,
      }),
      sentAt: now(),
      gatewayResponse: okPhone ? "MOCK-GATEWAY: queued (200 OK)" : "MOCK-GATEWAY: invalid recipient number",
      campaign: "RESULT",
    };
    return log;
  });
  db.smsLogs.unshift(...created);
  return ok(created, { sentCount: sent, failedCount: failed, totalTargeted: targets.length });
}

function smsCustom(db: MockDb, body: Body): MockResponse {
  const recipients = arr<Body>(body.recipients);
  if (recipients.length === 0) return fail("No recipients provided");
  let sent = 0;
  let failed = 0;
  recipients.forEach((r) => {
    const good = validPhone(r.guardianPhone ?? r.phone);
    good ? (sent += 1) : (failed += 1);
    db.smsLogs.unshift({
      id: uid("sms"),
      enrollmentId: r.enrollmentId,
      recipientPhone: String(r.guardianPhone ?? r.phone ?? ""),
      status: good ? "SENT" : "FAILED",
      messageBody: String(r.messageBody ?? ""),
      sentAt: now(),
      gatewayResponse: good ? "MOCK-GATEWAY: queued (200 OK)" : "MOCK-GATEWAY: invalid recipient number",
      campaign: "CUSTOM",
    });
  });
  return ok(
    { sentCount: sent, failedCount: failed },
    {
      sentCount: sent,
      failedCount: failed,
      totalTargeted: recipients.length,
      sampleMessage: String(recipients[0]?.messageBody ?? ""),
    }
  );
}

function smsAttendance(db: MockDb, body: Body): MockResponse {
  const messages = arr<Body>(body.messages);
  if (messages.length === 0) return fail("No messages provided");
  messages.forEach((msg) => {
    const good = validPhone(msg.phone);
    db.smsLogs.unshift({
      id: uid("sms"),
      enrollmentId: msg.studentId,
      recipientPhone: String(msg.phone ?? ""),
      status: good ? "SENT" : "FAILED",
      messageBody: String(msg.body ?? ""),
      sentAt: now(),
      gatewayResponse: good ? "MOCK-GATEWAY: queued (200 OK)" : "MOCK-GATEWAY: invalid recipient number",
      campaign: "ATTENDANCE",
    });
  });
  const log = {
    id: uid("sms_batch"),
    campaignType: String(body.campaignType ?? "ATTENDANCE_ALERT"),
    recipientCount: messages.length,
    status: "DELIVERED",
    timestamp: now(),
    sampleMessage: String(messages[0]?.body ?? ""),
    className: body.className ?? "",
    sectionName: body.sectionName ?? "",
    provider: body.provider ?? "MOCK",
    senderId: body.senderId ?? "",
  };
  return ok({ count: messages.length }, { count: messages.length, log });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function portalInfo(db: MockDb, sp: URLSearchParams): MockResponse {
  const code = param(sp, "code");
  if (code) {
    const inst = db.institutions.find((i) => i.code === code || i.slug === code);
    if (!inst) return fail(`Institution code '${code}' was not found.`, 404);
    const pub = publicInstitution(inst);
    return ok(pub, { institution: pub });
  }
  const list = db.institutions
    .filter((i) => i.status === "ACTIVE")
    .map((i) => ({ id: i.id, code: i.code, name: i.name, nameBn: i.nameBn, address: i.address, status: i.status }));
  return ok(list, { list });
}

function portalLogin(db: MockDb, body: Body): MockResponse {
  const code = String(body.institutionCode ?? "").trim();
  const adminId = String(body.adminId ?? "").trim();
  const password = String(body.password ?? "");
  const inst = code
    ? db.institutions.find((i) => i.code === code)
    : db.institutions.find((i) => i.adminId === adminId);
  if (!inst) return fail("Institution not found", 404);
  if (inst.status !== "ACTIVE") return fail(`This institution is ${inst.status.toLowerCase()}. Contact the super admin.`, 403);
  if (inst.adminId !== adminId || inst.adminPassword !== password) {
    return fail("Invalid login credentials. Please try again.", 401);
  }
  const pub = publicInstitution(inst);
  return ok(
    { institution: pub },
    {
      institution: pub,
      session: { role: "INSTITUTION_ADMIN", adminId: inst.adminId, institutionCode: inst.code, accessibleModules: inst.accessibleModules },
      redirectUrl: "/",
    }
  );
}

// ---------------------------------------------------------------------------
// Super admin: institutions
// ---------------------------------------------------------------------------

function institutionsRoute(db: MockDb, m: string, id: string | undefined, body: Body): MockResponse {
  const withStats = (i: MockInstitution) => {
    const primary = i.id === primaryInstitutionId(db);
    return {
      ...i,
      stats: primary
        ? {
            students: db.enrollments.length,
            classes: db.classes.length,
            exams: db.exams.length,
            academicYears: db.academicYears.length,
          }
        : { students: 0, classes: 0, exams: 0, academicYears: 0 },
    };
  };

  if (!id) {
    if (m === "GET") {
      const list = db.institutions.map(withStats);
      return ok(list, {
        summary: {
          total: list.length,
          active: list.filter((i) => i.status === "ACTIVE").length,
          totalStudents: list.reduce((s, i) => s + i.stats.students, 0),
        },
      });
    }
    if (m === "POST") {
      const code = String(body.code ?? "").trim();
      const name = String(body.name ?? "").trim();
      if (!code || !name) return fail("Institution name and EIIN code are required");
      if (db.institutions.some((i) => i.code === code)) return fail(`EIIN code "${code}" already exists`);
      const inst: MockInstitution = {
        id: uid("inst"),
        code,
        name,
        nameBn: String(body.nameBn ?? ""),
        address: String(body.address ?? ""),
        contactEmail: String(body.contactEmail ?? ""),
        contactPhone: String(body.contactPhone ?? ""),
        adminId: String(body.adminId || `admin_${code}`),
        adminPassword: String(body.adminPassword || "Smart@1234"),
        status: (body.status as MockInstitution["status"]) || "ACTIVE",
        slug: slug(name) || code,
        smsSenderId: String(body.smsSenderId ?? ""),
        notes: String(body.notes ?? ""),
        accessibleModules: Array.isArray(body.accessibleModules) && body.accessibleModules.length ? body.accessibleModules : [...MODULE_KEYS],
        createdAt: now(),
      };
      db.institutions.push(inst);
      return ok(withStats(inst), {}, 201);
    }
    return methodNotAllowed();
  }

  const inst = db.institutions.find((i) => i.id === id);
  if (!inst) return fail("Institution not found", 404);

  if (m === "GET") return ok(withStats(inst));

  if (m === "PUT" || m === "PATCH") {
    if (body.code !== undefined) {
      const code = String(body.code).trim();
      if (!code) return fail("EIIN code cannot be empty");
      if (db.institutions.some((i) => i.id !== inst.id && i.code === code)) return fail(`EIIN code "${code}" already exists`);
      inst.code = code;
    }
    (["name", "nameBn", "address", "contactEmail", "contactPhone", "adminId", "adminPassword", "smsSenderId", "notes"] as const).forEach(
      (k) => {
        if (body[k] !== undefined && body[k] !== null) inst[k] = String(body[k]);
      }
    );
    if (body.status) inst.status = body.status;
    if (Array.isArray(body.accessibleModules)) inst.accessibleModules = body.accessibleModules;
    return ok(withStats(inst));
  }

  if (m === "DELETE") {
    db.institutions = db.institutions.filter((i) => i.id !== id);
    return ok({ id });
  }
  return methodNotAllowed();
}