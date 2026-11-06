/**
 * Seed datasets for the mock API layer (realistic Bangladesh school).
 *
 * Everything in here is plain data + a few small builders. The mutable runtime
 * copy lives in `store.ts`; never mutate `seedData` directly.
 */

// ---------------------------------------------------------------------------
// Types (loose, API-shaped)
// ---------------------------------------------------------------------------

export type GroupKey = "GENERAL" | "SCIENCE" | "HUMANITIES" | "BUSINESS_STUDIES";

export interface MockInstitution {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  adminId: string;
  adminPassword: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  slug: string;
  smsSenderId: string;
  notes: string;
  accessibleModules: string[];
  createdAt: string;
}

export interface MockAcademicYear {
  id: string;
  institutionId: string;
  yearName: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  termStructure?: string;
  notes?: string;
}

export interface MockSection {
  id: string;
  classId: string;
  name: string;
  groupType: GroupKey;
  shift: "MORNING" | "DAY";
  capacity: number;
}

export interface MockClass {
  id: string;
  institutionId: string;
  name: string;
  numericValue: number;
  sections: MockSection[];
}

export interface MockSubject {
  id: string;
  institutionId: string;
  subjectCode: string | null;
  name: string;
}

export interface MockClassSubject {
  id: string;
  classId: string;
  /** SCIENCE / HUMANITIES / BUSINESS_STUDIES / GENERAL / MANDATORY / ALL */
  groupType: string;
  subjectId: string;
  /** MANDATORY | GROUP_ELECTIVE | OPTIONAL_4TH */
  subjectType: string;
  creditWeight: number;
}

export interface MockStudent {
  id: string;
  institutionId: string;
  studentIdNo: string;
  firstName: string;
  lastName: string;
  gender: string;
  religion: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  /** JSON string, like the real API */
  customFields: string | null;
  isActive: boolean;
}

export interface MockAllocation {
  id: string;
  enrollmentId: string;
  subjectId: string;
  subjectType: string;
}

export interface MockEnrollment {
  id: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  groupType: string;
  classRoll: number;
  student: MockStudent;
  allocations: MockAllocation[];
}

export interface MockComponent {
  id: string;
  examSubjectConfigId: string;
  componentName: string;
  fullMarks: number;
  passMarks: number;
  isMandatoryPass: boolean;
}

export interface MockExamSubjectConfig {
  id: string;
  examId: string;
  subjectId: string;
  groupType: string;
  totalFullMarks: number;
  passMode: string;
  aggregatePassMark: number;
  creditWeight: number;
  components: MockComponent[];
}

export interface MockExam {
  id: string;
  institutionId: string;
  academicYearId: string;
  classId: string;
  gradingSystemId: string;
  name: string;
  termCode: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  subjectConfigs: MockExamSubjectConfig[];
}

export interface MockMark {
  id: string;
  examId: string;
  enrollmentId: string;
  subjectId: string;
  isAbsent: boolean;
  isOverride: boolean;
  components: Record<string, number | "">;
  auditReason?: string;
  modifiedBy?: string;
  updatedAt: string;
}

export interface MockProcessedResult {
  id: string;
  examId: string;
  enrollmentId: string;
  totalObtainedMarks: number;
  gpaWithoutFourth: number;
  fourthSubjectBonusPoints: number;
  finalGpa: number;
  finalLetterGrade: string;
  isPassed: boolean;
  totalFailedSubjects: number;
  meritRankClass: number | null;
  meritRankSection: number | null;
}

export interface MockGradeSlab {
  id: string;
  gradingSystemId: string;
  letterGrade: string;
  gradePoint: number;
  markMin: number;
  markMax: number;
  isFail: boolean;
  comments: string | null;
}

export interface MockGradingSystem {
  id: string;
  institutionId: string;
  name: string;
  maxGpa: number;
  fourthSubjectThreshold: number;
  passGpa: number;
  isDefault: boolean;
  slabs: MockGradeSlab[];
}

export interface MockCombinedRule {
  id: string;
  examId: string;
  name: string | null;
  primarySubjectId: string;
  secondarySubjectId: string;
  combinedPassMark: number;
  combinedFullMarks: number;
  passMode: string;
  gradeMode: string;
}

export interface MockTemplateItem {
  id: string;
  templateId: string;
  subjectId: string;
  totalMarks: number;
  passMarks: number;
  cqMarks: number;
  mcqMarks: number;
  practicalMarks: number;
}

export interface MockTemplate {
  id: string;
  institutionId: string;
  name: string;
  classId: string;
  description: string | null;
  items: MockTemplateItem[];
}

export interface MockRoutineItem {
  id: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  paperType: string;
  group: string;
  shift: string;
  roomNo: string;
  invigilator?: string;
  remarks?: string;
}

export interface MockRoutine {
  id: string;
  session: string;
  classId: string;
  className: string;
  examId: string;
  examName: string;
  shift: string;
  group: string;
  publishedDate: string;
  instructions: string[];
  controllerTitle: string;
  controllerName: string;
  headTitle: string;
  headName: string;
  items: MockRoutineItem[];
  updatedAt: string;
}

export interface MockSmsLog {
  id: string;
  examId?: string;
  enrollmentId?: string;
  recipientPhone: string;
  status: string;
  messageBody: string;
  sentAt: string;
  gatewayResponse: string;
  campaign?: string;
}

export interface MockDb {
  /** Counter used by `uid()` for ids of runtime-created entities. */
  seq: number;
  institutions: MockInstitution[];
  academicYears: MockAcademicYear[];
  classes: MockClass[];
  subjects: MockSubject[];
  classSubjects: MockClassSubject[];
  enrollments: MockEnrollment[];
  exams: MockExam[];
  marks: MockMark[];
  processedResults: MockProcessedResult[];
  gradingSystems: MockGradingSystem[];
  combinedRules: MockCombinedRule[];
  templates: MockTemplate[];
  routines: MockRoutine[];
  smsLogs: MockSmsLog[];
}

// ---------------------------------------------------------------------------
// Constants & small helpers
// ---------------------------------------------------------------------------

export const MODULE_KEYS = [
  "session",
  "student_info",
  "results",
  "fees",
  "accountant",
  "user_roles",
  "sms_notice",
  "downloads",
  "assets",
];

export const INSTITUTION_ID = "inst_1";
export const CURRENT_YEAR_ID = "ay_2025";
export const GRADING_SYSTEM_ID = "gs_1";

const pad = (n: number, w = 3) => String(n).padStart(w, "0");

const GROUP_KEY: Record<string, string> = {
  GENERAL: "gen",
  SCIENCE: "sci",
  HUMANITIES: "hum",
  BUSINESS_STUDIES: "bus",
};

export function normalizeGroup(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function isClassTestExam(exam: { name?: string; termCode?: string | null }): boolean {
  const tc = String(exam.termCode ?? "").toLowerCase();
  return tc === "class test" || tc === "ct" || /class test/i.test(exam.name ?? "");
}

// ---------------------------------------------------------------------------
// Institution / years / grading
// ---------------------------------------------------------------------------

const institutions: MockInstitution[] = [
  {
    id: INSTITUTION_ID,
    code: "108254",
    name: "Dhaka Ideal Model High School & College",
    nameBn: "ঢাকা আইডিয়াল মডেল হাই স্কুল এন্ড কলেজ",
    address: "Section-10, Mirpur, Dhaka-1216, Bangladesh",
    contactEmail: "info@dhakaideal.edu.bd",
    contactPhone: "01711000000",
    adminId: "admin_108254",
    adminPassword: "Smart@1234",
    status: "ACTIVE",
    slug: "dhaka-ideal",
    smsSenderId: "DIMHSC",
    notes: "Demo institution (mock data)",
    accessibleModules: [...MODULE_KEYS],
    createdAt: "2025-01-05T09:00:00.000Z",
  },
];

const academicYears: MockAcademicYear[] = [
  {
    id: CURRENT_YEAR_ID,
    institutionId: INSTITUTION_ID,
    yearName: "2025-2026",
    isCurrent: true,
    startDate: "2025-07-01T00:00:00.000Z",
    endDate: "2026-06-30T00:00:00.000Z",
  },
  {
    id: "ay_2024",
    institutionId: INSTITUTION_ID,
    yearName: "2024-2025",
    isCurrent: false,
    startDate: "2024-07-01T00:00:00.000Z",
    endDate: "2025-06-30T00:00:00.000Z",
  },
];

const SLAB_DEFS: [string, number, number, number, boolean][] = [
  ["A+", 5, 80, 100, false],
  ["A", 4, 70, 79, false],
  ["A-", 3.5, 60, 69, false],
  ["B", 3, 50, 59, false],
  ["C", 2, 40, 49, false],
  ["D", 1, 33, 39, false],
  ["F", 0, 0, 32, true],
];

const gradingSystems: MockGradingSystem[] = [
  {
    id: GRADING_SYSTEM_ID,
    institutionId: INSTITUTION_ID,
    name: "NCTB Standard (GPA 5.00)",
    maxGpa: 5,
    fourthSubjectThreshold: 2,
    passGpa: 1,
    isDefault: true,
    slabs: SLAB_DEFS.map(([letterGrade, gradePoint, markMin, markMax, isFail], i) => ({
      id: `slab_${i + 1}`,
      gradingSystemId: GRADING_SYSTEM_ID,
      letterGrade,
      gradePoint,
      markMin,
      markMax,
      isFail,
      comments: null,
    })),
  },
];

// ---------------------------------------------------------------------------
// Classes & sections
// ---------------------------------------------------------------------------

type SectionDef = [name: string, group: GroupKey, shift: "MORNING" | "DAY"];

const JUNIOR_SECTIONS: SectionDef[] = [
  ["A", "GENERAL", "MORNING"],
  ["B", "GENERAL", "DAY"],
];
const SECONDARY_SECTIONS: SectionDef[] = [
  ["A", "SCIENCE", "MORNING"],
  ["B", "SCIENCE", "DAY"],
  ["A", "HUMANITIES", "DAY"],
  ["A", "BUSINESS_STUDIES", "DAY"],
];
const COLLEGE_SECTIONS: SectionDef[] = [
  ["A", "SCIENCE", "DAY"],
  ["A", "HUMANITIES", "DAY"],
  ["A", "BUSINESS_STUDIES", "DAY"],
];

const CLASS_DEFS: { num: number; name: string; sections: SectionDef[] }[] = [
  { num: 6, name: "Class 6", sections: JUNIOR_SECTIONS },
  { num: 7, name: "Class 7", sections: JUNIOR_SECTIONS },
  { num: 8, name: "Class 8", sections: JUNIOR_SECTIONS },
  { num: 9, name: "Class 9", sections: SECONDARY_SECTIONS },
  { num: 10, name: "Class 10", sections: SECONDARY_SECTIONS },
  { num: 11, name: "Class XI", sections: COLLEGE_SECTIONS },
  { num: 12, name: "Class XII", sections: COLLEGE_SECTIONS },
];

export const classId = (num: number) => `cls_${num}`;
export const sectionId = (num: number, group: string, name: string) =>
  `sec_${num}_${GROUP_KEY[group] ?? "gen"}_${name.toLowerCase()}`;

const classes: MockClass[] = CLASS_DEFS.map((c) => ({
  id: classId(c.num),
  institutionId: INSTITUTION_ID,
  name: c.name,
  numericValue: c.num,
  sections: c.sections.map(([name, group, shift]) => ({
    id: sectionId(c.num, group, name),
    classId: classId(c.num),
    name,
    groupType: group,
    shift,
    capacity: 40,
  })),
}));

// ---------------------------------------------------------------------------
// Subjects & class-subject mappings
// ---------------------------------------------------------------------------

const SUBJECT_DEFS: [code: string, name: string][] = [
  ["101", "Bangla 1st Paper"],
  ["102", "Bangla 2nd Paper"],
  ["107", "English 1st Paper"],
  ["108", "English 2nd Paper"],
  ["109", "Mathematics"],
  ["111", "Islam & Moral Education"],
  ["127", "Bangladesh & Global Studies"],
  ["134", "General Science"],
  ["154", "Information & Communication Technology"],
  ["136", "Physics"],
  ["137", "Chemistry"],
  ["138", "Biology"],
  ["126", "Higher Mathematics"],
  ["146", "Accounting"],
  ["152", "Finance & Banking"],
  ["150", "Civics & Citizenship"],
  ["110", "Geography & Environment"],
  ["153", "History of Bangladesh & World Civilization"],
];

export const subjectId = (code: string) => `sub_${code}`;

const subjects: MockSubject[] = SUBJECT_DEFS.map(([code, name]) => ({
  id: subjectId(code),
  institutionId: INSTITUTION_ID,
  subjectCode: code,
  name,
}));

interface MappingPlan {
  mandatory: string[];
  groups: Partial<Record<GroupKey, { elective: string[]; fourth?: string[] }>>;
}

const JUNIOR_PLAN: MappingPlan = {
  mandatory: ["101", "102", "107", "108", "109", "111", "127", "134", "154"],
  groups: {},
};
const SECONDARY_PLAN: MappingPlan = {
  mandatory: ["101", "102", "107", "108", "109", "111", "127", "154"],
  groups: {
    SCIENCE: { elective: ["136", "137", "138"], fourth: ["126"] },
    HUMANITIES: { elective: ["150", "110", "153"] },
    BUSINESS_STUDIES: { elective: ["146", "152"] },
  },
};
const COLLEGE_PLAN: MappingPlan = {
  mandatory: ["101", "102", "107", "108", "154"],
  groups: SECONDARY_PLAN.groups,
};

const planFor = (num: number) => (num <= 8 ? JUNIOR_PLAN : num <= 10 ? SECONDARY_PLAN : COLLEGE_PLAN);

const classSubjects: MockClassSubject[] = [];
(() => {
  let n = 0;
  const push = (num: number, groupType: string, code: string, subjectType: string) =>
    classSubjects.push({
      id: `cs_${++n}`,
      classId: classId(num),
      groupType,
      subjectId: subjectId(code),
      subjectType,
      creditWeight: 1,
    });
  for (const c of CLASS_DEFS) {
    const plan = planFor(c.num);
    plan.mandatory.forEach((code) => push(c.num, "MANDATORY", code, "MANDATORY"));
    (Object.keys(plan.groups) as GroupKey[]).forEach((g) => {
      const def = plan.groups[g]!;
      def.elective.forEach((code) => push(c.num, g, code, "GROUP_ELECTIVE"));
      (def.fourth ?? []).forEach((code) => push(c.num, g, code, "OPTIONAL_4TH"));
    });
  }
})();

/** NCTB-style presets used by `/setup/class-subjects` `apply_preset`. */
export const NCTB_PRESET_PLANS: Record<
  string,
  { mandatory: string[]; elective: string[]; fourth: string[] }
> = {
  nctb_science: {
    mandatory: ["101", "102", "107", "108", "109", "127", "154"],
    elective: ["136", "137", "138"],
    fourth: ["126"],
  },
  nctb_business: {
    mandatory: ["101", "102", "107", "108", "109", "127", "154"],
    elective: ["146", "152"],
    fourth: [],
  },
  nctb_humanities: {
    mandatory: ["101", "102", "107", "108", "109", "127", "154"],
    elective: ["150", "110", "153"],
    fourth: [],
  },
  nctb_general_junior: {
    mandatory: ["101", "102", "107", "108", "109", "134", "127", "154", "111"],
    elective: [],
    fourth: [],
  },
};

// ---------------------------------------------------------------------------
// Exam configs (marks distribution)
// ---------------------------------------------------------------------------

const PRACTICAL_CODES = new Set(["136", "137", "138"]);

export function defaultComponents(
  subjectCode: string | null | undefined,
  classTest: boolean
): { total: number; aggregatePass: number; comps: [string, number, number][] } {
  if (classTest) return { total: 20, aggregatePass: 7, comps: [["CT", 20, 7]] };
  if (subjectCode === "154") {
    return {
      total: 50,
      aggregatePass: 17,
      comps: [
        ["CQ", 25, 8],
        ["MCQ", 15, 5],
        ["PRACTICAL", 10, 4],
      ],
    };
  }
  if (subjectCode && PRACTICAL_CODES.has(subjectCode)) {
    return {
      total: 100,
      aggregatePass: 33,
      comps: [
        ["CQ", 50, 17],
        ["MCQ", 25, 8],
        ["PRACTICAL", 25, 8],
      ],
    };
  }
  return {
    total: 100,
    aggregatePass: 33,
    comps: [
      ["CQ", 70, 23],
      ["MCQ", 30, 10],
    ],
  };
}

export function makeConfig(
  examId: string,
  subject: MockSubject,
  groupType: string,
  creditWeight = 1,
  classTest = false
): MockExamSubjectConfig {
  const def = defaultComponents(subject.subjectCode, classTest);
  const id = `cfg_${examId}_${subject.subjectCode ?? subject.id}`;
  return {
    id,
    examId,
    subjectId: subject.id,
    groupType,
    totalFullMarks: def.total,
    passMode: "COMPONENT_WISE",
    aggregatePassMark: def.aggregatePass,
    creditWeight,
    components: def.comps.map(([componentName, fullMarks, passMarks]) => ({
      id: `${id}_${componentName}`,
      examSubjectConfigId: id,
      componentName,
      fullMarks,
      passMarks,
      isMandatoryPass: true,
    })),
  };
}

export function buildExamConfigs(
  db: Pick<MockDb, "classSubjects" | "subjects">,
  examId: string,
  forClassId: string,
  classTest = false
): MockExamSubjectConfig[] {
  const seen = new Set<string>();
  const out: MockExamSubjectConfig[] = [];
  for (const m of db.classSubjects) {
    if (m.classId !== forClassId || seen.has(m.subjectId)) continue;
    const sub = db.subjects.find((s) => s.id === m.subjectId);
    if (!sub) continue;
    seen.add(m.subjectId);
    out.push(makeConfig(examId, sub, m.groupType === "MANDATORY" ? "ALL" : m.groupType, m.creditWeight, classTest));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Students / enrollments
// ---------------------------------------------------------------------------

type Person = [first: string, last: string, gender: "Male" | "Female", religion: "Islam" | "Hindu", guardian: string];

interface StudentBatch {
  num: number;
  group: GroupKey;
  secName: string;
  people: Person[];
}

const STUDENT_BATCHES: StudentBatch[] = [
  {
    num: 10,
    group: "SCIENCE",
    secName: "A",
    people: [
      ["Md. Tanvir", "Hossain", "Male", "Islam", "Md. Abdul Hossain"],
      ["Nusrat", "Jahan", "Female", "Islam", "Md. Shahidul Islam"],
      ["Sabbir", "Ahmed", "Male", "Islam", "Md. Jahangir Alam"],
      ["Farhana", "Akter", "Female", "Islam", "Md. Rafiqul Islam"],
      ["Imran", "Hasan", "Male", "Islam", "Md. Nurul Haque"],
      ["Sadia", "Rahman", "Female", "Islam", "Md. Mizanur Rahman"],
      ["Arif", "Mahmud", "Male", "Islam", "Md. Mahbub Alam"],
      ["Tasnim", "Sultana", "Female", "Islam", "Md. Kamal Hossain"],
    ],
  },
  {
    num: 10,
    group: "HUMANITIES",
    secName: "A",
    people: [
      ["Rakib", "Hasan", "Male", "Islam", "Md. Anwar Hossain"],
      ["Mitu", "Rani Das", "Female", "Hindu", "Sukumar Das"],
      ["Jubayer", "Khan", "Male", "Islam", "Md. Faruk Khan"],
    ],
  },
  {
    num: 9,
    group: "SCIENCE",
    secName: "A",
    people: [
      ["Anika", "Tabassum", "Female", "Islam", "Md. Golam Mostafa"],
      ["Shakil", "Mia", "Male", "Islam", "Md. Abul Kalam"],
      ["Maliha", "Binte Alam", "Female", "Islam", "Md. Shamsul Alam"],
    ],
  },
  {
    num: 6,
    group: "GENERAL",
    secName: "A",
    people: [
      ["Ayaan", "Rahman", "Male", "Islam", "Md. Habibur Rahman"],
      ["Zara", "Khatun", "Female", "Islam", "Md. Selim Reza"],
      ["Rohan", "Das", "Male", "Hindu", "Pradip Kumar Das"],
      ["Nabila", "Islam", "Female", "Islam", "Md. Saiful Islam"],
      ["Fahim", "Shahriar", "Male", "Islam", "Md. Shahriar Kabir"],
    ],
  },
  {
    num: 11,
    group: "SCIENCE",
    secName: "A",
    people: [
      ["Mehedi", "Hasan", "Male", "Islam", "Md. Delwar Hossain"],
      ["Jannatul", "Ferdous", "Female", "Islam", "Md. Abdur Razzak"],
      ["Tahmid", "Islam", "Male", "Islam", "Md. Rezaul Karim"],
      ["Sumaiya", "Akter", "Female", "Islam", "Md. Nasir Uddin"],
      ["Rashed", "Khan", "Male", "Islam", "Md. Sohel Khan"],
      ["Lamia", "Haque", "Female", "Islam", "Md. Enamul Haque"],
    ],
  },
];

/** Extra XI students added only by the `seed-dalta` dataset. */
const DALTA_EXTRA_BATCHES: StudentBatch[] = [
  {
    num: 11,
    group: "HUMANITIES",
    secName: "A",
    people: [
      ["Shamim", "Reza", "Male", "Islam", "Md. Abdul Matin"],
      ["Rupa", "Akter", "Female", "Islam", "Md. Babul Mia"],
    ],
  },
  {
    num: 11,
    group: "BUSINESS_STUDIES",
    secName: "A",
    people: [
      ["Nayeem", "Uddin", "Male", "Islam", "Md. Jashim Uddin"],
      ["Tonima", "Roy", "Female", "Hindu", "Bimal Roy"],
    ],
  },
];

function buildAllocations(
  mappings: MockClassSubject[],
  num: number,
  group: string,
  enrollmentId: string,
  roll: number,
  counter: { n: number }
): MockAllocation[] {
  const out: MockAllocation[] = [];
  const cid = classId(num);
  for (const m of mappings) {
    if (m.classId !== cid) continue;
    const applies = m.groupType === "MANDATORY" || m.groupType === "ALL" || m.groupType === group;
    if (!applies) continue;
    // 4th subject only for odd rolls so the data has both kinds of students
    if (m.subjectType === "OPTIONAL_4TH" && roll % 2 === 0) continue;
    out.push({
      id: `alc_${++counter.n}`,
      enrollmentId,
      subjectId: m.subjectId,
      subjectType: m.subjectType,
    });
  }
  return out;
}

function buildEnrollments(
  batches: StudentBatch[],
  mappings: MockClassSubject[],
  startIndex: number
): MockEnrollment[] {
  const out: MockEnrollment[] = [];
  const counter = { n: startIndex * 20 };
  let idx = startIndex;
  for (const b of batches) {
    const sec = sectionId(b.num, b.group, b.secName);
    b.people.forEach((p, i) => {
      idx += 1;
      const roll = i + 1;
      const [first, last, gender, religion, guardian] = p;
      const prefix = ["017", "018", "019", "016"][idx % 4];
      const phone = `${prefix}${String(10000000 + idx * 123457).slice(0, 8)}`;
      const enrId = `enr_${idx}`;
      out.push({
        id: enrId,
        studentId: `std_${idx}`,
        academicYearId: CURRENT_YEAR_ID,
        classId: classId(b.num),
        sectionId: sec,
        groupType: b.group,
        classRoll: roll,
        student: {
          id: `std_${idx}`,
          institutionId: INSTITUTION_ID,
          studentIdNo: `2025${pad(b.num, 2)}${pad(b.group === "SCIENCE" ? roll : b.group === "HUMANITIES" ? 20 + roll : b.group === "BUSINESS_STUDIES" ? 40 + roll : roll)}`,
          firstName: first,
          lastName: last,
          gender,
          religion,
          address: "Mirpur-10, Dhaka",
          guardianName: guardian,
          guardianPhone: phone,
          customFields: JSON.stringify({
            fatherName: guardian,
            motherName: `Mst. ${gender === "Female" ? "Rokeya" : "Salma"} Begum`,
            dob: `${2009 - Math.min(b.num, 12) + 6}-0${(idx % 9) + 1}-1${idx % 9}`,
            bloodGroup: ["A+", "B+", "O+", "AB+"][idx % 4],
            nationality: "Bangladeshi",
            studentCategory: "General",
            service: "None",
            studentStatus: "ACTIVE",
          }),
          isActive: true,
        },
        allocations: buildAllocations(mappings, b.num, b.group, enrId, roll, counter),
      });
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Exams & marks
// ---------------------------------------------------------------------------

function makeExam(
  db: Pick<MockDb, "classSubjects" | "subjects">,
  id: string,
  name: string,
  num: number,
  status: string,
  termCode: string,
  dates: [string, string]
): MockExam {
  return {
    id,
    institutionId: INSTITUTION_ID,
    academicYearId: CURRENT_YEAR_ID,
    classId: classId(num),
    gradingSystemId: GRADING_SYSTEM_ID,
    name,
    termCode,
    status,
    startDate: dates[0],
    endDate: dates[1],
    subjectConfigs: buildExamConfigs(db, id, classId(num), termCode === "Class Test"),
  };
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** forced[enrollmentId][subjectId] = ratio of full marks (use ~0.25 to force a fail) */
type Forced = Record<string, Record<string, number>>;

function generateMarks(
  exam: MockExam,
  enrollments: MockEnrollment[],
  startId: number,
  forced: Forced = {},
  absent: Record<string, string[]> = {}
): MockMark[] {
  const out: MockMark[] = [];
  let n = startId;
  const rand = mulberry32(exam.id.length * 7919 + startId);
  for (const enr of enrollments) {
    if (enr.classId !== exam.classId) continue;
    const ability = 0.55 + rand() * 0.42;
    for (const alloc of enr.allocations) {
      const cfg = exam.subjectConfigs.find((c) => c.subjectId === alloc.subjectId);
      if (!cfg) continue;
      const isAbsent = absent[enr.id]?.includes(alloc.subjectId) ?? false;
      const components: Record<string, number | ""> = {};
      for (const comp of cfg.components) {
        if (isAbsent) {
          components[comp.componentName] = "";
          continue;
        }
        const f = forced[enr.id]?.[alloc.subjectId];
        const ratio = f ?? Math.min(1, Math.max(0.5, ability + (rand() - 0.5) * 0.24));
        components[comp.componentName] = Math.round(comp.fullMarks * ratio);
      }
      out.push({
        id: `mrk_${++n}`,
        examId: exam.id,
        enrollmentId: enr.id,
        subjectId: alloc.subjectId,
        isAbsent,
        isOverride: false,
        components,
        updatedAt: "2025-12-20T10:00:00.000Z",
      });
    }
  }
  return out;
}

const findEnr = (list: MockEnrollment[], num: number, group: string, roll: number) =>
  list.find((e) => e.classId === classId(num) && e.groupType === group && e.classRoll === roll);

// ---------------------------------------------------------------------------
// Rules, templates, routine
// ---------------------------------------------------------------------------

function buildTemplate(): MockTemplate {
  const codes = ["101", "102", "107", "108", "109", "154", "136", "137"];
  const id = "tpl_1";
  return {
    id,
    institutionId: INSTITUTION_ID,
    name: "Class 10 Science - Standard Distribution",
    classId: classId(10),
    description: "CQ + MCQ for theory papers, practical for Physics/Chemistry, 50 marks for ICT.",
    items: codes.map((code) => {
      const def = defaultComponents(code, false);
      const byName = (n: string) => def.comps.find((c) => c[0] === n)?.[1] ?? 0;
      return {
        id: `${id}_${code}`,
        templateId: id,
        subjectId: subjectId(code),
        totalMarks: def.total,
        passMarks: def.aggregatePass,
        cqMarks: byName("CQ"),
        mcqMarks: byName("MCQ"),
        practicalMarks: byName("PRACTICAL"),
      };
    }),
  };
}

function buildRoutine(exam: MockExam): MockRoutine {
  const item = (
    n: number,
    date: string,
    day: string,
    code: string,
    name: string,
    paperType: string,
    group = "ALL"
  ): MockRoutineItem => ({
    id: `ri_${n}`,
    date,
    day,
    startTime: "10:00 AM",
    endTime: "01:00 PM",
    subjectCode: code,
    subjectName: name,
    paperType,
    group,
    shift: "ALL",
    roomNo: "Room 101, 102",
    invigilator: "",
    remarks: "",
  });
  return {
    id: "rt_1",
    session: "2025-2026",
    classId: exam.classId,
    className: "Class 10",
    examId: exam.id,
    examName: exam.name,
    shift: "ALL",
    group: "ALL",
    publishedDate: "2025-11-25",
    instructions: [
      "Students must bring their admit card and school ID card.",
      "Be present in the exam hall 15 minutes before the start time.",
      "Mobile phones are strictly prohibited inside the exam hall.",
    ],
    controllerTitle: "Exam Controller",
    controllerName: "Md. Shamsul Haque",
    headTitle: "Principal",
    headName: "Prof. Dr. Abdul Karim",
    items: [
      item(1, "2025-12-07", "Sunday", "101", "Bangla 1st Paper", "Theory (CQ + MCQ)"),
      item(2, "2025-12-09", "Tuesday", "102", "Bangla 2nd Paper", "Theory (CQ + MCQ)"),
      item(3, "2025-12-11", "Thursday", "107", "English 1st Paper", "Theory (CQ + MCQ)"),
      item(4, "2025-12-14", "Sunday", "108", "English 2nd Paper", "Theory (CQ + MCQ)"),
      item(5, "2025-12-16", "Tuesday", "109", "Mathematics", "Theory (CQ + MCQ)"),
      item(6, "2025-12-18", "Thursday", "154", "Information & Communication Technology", "Theory + Practical"),
      item(7, "2025-12-21", "Sunday", "136", "Physics", "Theory + Practical", "SCIENCE"),
    ],
    updatedAt: "2025-11-25T08:00:00.000Z",
  };
}

// ---------------------------------------------------------------------------
// Assemble seed
// ---------------------------------------------------------------------------

function buildSeed(): MockDb {
  const base = { classSubjects, subjects };
  const enrollments = buildEnrollments(STUDENT_BATCHES, classSubjects, 0);

  const exam1 = makeExam(base, "exm_1", "Half Yearly Examination-2025", 10, "PUBLISHED", "Semester", [
    "2025-12-07",
    "2025-12-21",
  ]);
  const exam2 = makeExam(base, "exm_2", "Annual Examination-2025", 9, "DRAFT_PREVIEW", "Semester", [
    "2025-12-01",
    "2025-12-15",
  ]);
  const exam3 = makeExam(base, "exm_3", "Class Test 1-2025", 6, "DRAFT_PREVIEW", "Class Test", [
    "2025-08-10",
    "2025-08-12",
  ]);

  const forced1: Forced = {};
  const forceFail = (num: number, group: string, roll: number, codes: string[]) => {
    const enr = findEnr(enrollments, num, group, roll);
    if (!enr) return;
    forced1[enr.id] = forced1[enr.id] ?? {};
    codes.forEach((c) => (forced1[enr.id][subjectId(c)] = 0.25));
  };
  forceFail(10, "SCIENCE", 5, ["109"]); // Imran fails Mathematics
  forceFail(10, "SCIENCE", 7, ["136", "137"]); // Arif fails Physics + Chemistry
  forceFail(10, "HUMANITIES", 3, ["110"]); // Jubayer fails Geography

  const forced3: Forced = {};
  const ctFail = findEnr(enrollments, 6, "GENERAL", 4);
  if (ctFail) forced3[ctFail.id] = { [subjectId("109")]: 0.2 };
  const ctAbsent = findEnr(enrollments, 6, "GENERAL", 5);

  let markCounter = 0;
  const m1 = generateMarks(exam1, enrollments, markCounter, forced1);
  markCounter += m1.length;
  const m2 = generateMarks(exam2, enrollments, markCounter);
  markCounter += m2.length;
  const m3 = generateMarks(
    exam3,
    enrollments,
    markCounter,
    forced3,
    ctAbsent ? { [ctAbsent.id]: [subjectId("134")] } : {}
  );

  const combinedRules: MockCombinedRule[] = [
    {
      id: "rule_1",
      examId: exam1.id,
      name: "Bangla (1st & 2nd Combined)",
      primarySubjectId: subjectId("101"),
      secondarySubjectId: subjectId("102"),
      combinedPassMark: 66,
      combinedFullMarks: 200,
      passMode: "AGGREGATE_ONLY",
      gradeMode: "AVERAGE",
    },
  ];

  return {
    seq: 1000,
    institutions,
    academicYears,
    classes,
    subjects,
    classSubjects,
    enrollments,
    exams: [exam1, exam2, exam3],
    marks: [...m1, ...m2, ...m3],
    processedResults: [],
    gradingSystems,
    combinedRules,
    templates: [buildTemplate()],
    routines: [buildRoutine(exam1)],
    smsLogs: [],
  };
}

export const seedData: MockDb = buildSeed();

/**
 * Richer dataset used by `/api/setup/seed-dalta`: adds a class XI
 * "Year Final Examination-2026" with marks for every XI student (plus a few
 * extra Humanities/Business students). Mutates and returns the given db.
 */
export function applyDaltaSeed(db: MockDb): MockDb {
  const startIndex = db.enrollments.length;
  const extras = buildEnrollments(DALTA_EXTRA_BATCHES, db.classSubjects, startIndex);
  db.enrollments.push(...extras);

  const exam = makeExam(db, "exm_4", "Year Final Examination-2026", 11, "DRAFT_PREVIEW", "Semester", [
    "2026-03-01",
    "2026-03-20",
  ]);
  const forced: Forced = {};
  const f1 = findEnr(db.enrollments, 11, "SCIENCE", 3);
  if (f1) forced[f1.id] = { [subjectId("136")]: 0.25 };
  const f2 = findEnr(db.enrollments, 11, "HUMANITIES", 2);
  if (f2) forced[f2.id] = { [subjectId("150")]: 0.25, [subjectId("110")]: 0.25 };

  db.exams.push(exam);
  db.marks.push(...generateMarks(exam, db.enrollments, db.marks.length + 500, forced));
  db.combinedRules.push({
    id: "rule_dalta_1",
    examId: exam.id,
    name: "Bangla (1st & 2nd Combined)",
    primarySubjectId: subjectId("101"),
    secondarySubjectId: subjectId("102"),
    combinedPassMark: 66,
    combinedFullMarks: 200,
    passMode: "AGGREGATE_ONLY",
    gradeMode: "AVERAGE",
  });
  return db;
}
