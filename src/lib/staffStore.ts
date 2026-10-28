"use client";

import { getScopedStorageKey, getActiveTenantCode } from "./clientTenant";

export type StaffCategory = "TEACHING" | "NON_TEACHING";
export type MpoStatus = "MPO_ENLISTED" | "NON_MPO" | "CONTRACTUAL" | "PART_TIME";
export type StaffGender = "MALE" | "FEMALE" | "OTHER";
export type StaffStatus = "ACTIVE" | "ON_LEAVE" | "RETIRED";

export interface TeacherStaffMember {
  id: string;
  staffId: string;
  mpoIndex: string;
  name: string;
  nameBn: string;
  gender: StaffGender;
  bloodGroup: string;
  nid: string;
  dateOfBirth: string;
  joiningDate: string;
  category: StaffCategory;
  designation: string;
  department: string;
  mpoStatus: MpoStatus;
  salaryGrade: string;
  education: string;
  assignedSubjects: string[];
  assignedClasses: string[];
  isClassTeacher?: boolean;
  classTeacherOf?: string;
  phone: string;
  email: string;
  emergencyContact?: string;
  address: string;
  status: StaffStatus;
}

export const DEFAULT_STAFF_LIST: TeacherStaffMember[] = [
  {
    id: "staff-001",
    staffId: "TCH-001",
    mpoIndex: "MPO-829104",
    name: "Prof. A. K. M. Shamsuddin",
    nameBn: "প্রফেসর এ. কে. এম. সামসুদ্দিন",
    gender: "MALE",
    bloodGroup: "B+",
    nid: "1972269201000041",
    dateOfBirth: "1968-04-12",
    joiningDate: "2004-02-01",
    category: "TEACHING",
    designation: "Principal",
    department: "Administration",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 4 (NPS)",
    education: "M.Sc in Physics (DU, 1st Class), B.Ed",
    assignedSubjects: ["Physics 2nd Paper", "Higher Science Seminar"],
    assignedClasses: ["Class 12 (Science)"],
    isClassTeacher: false,
    phone: "+880 1711-223344",
    email: "principal@dhakaideal.edu.bd",
    emergencyContact: "+880 1819-334455",
    address: "House 14, Road 4, Section 10, Mirpur, Dhaka-1216",
    status: "ACTIVE",
  },
  {
    id: "staff-002",
    staffId: "TCH-002",
    mpoIndex: "MPO-839211",
    name: "Mohammad Jahangir Hossain",
    nameBn: "মোহাম্মদ জাহাঙ্গীর হোসেন",
    gender: "MALE",
    bloodGroup: "A+",
    nid: "1975269201000088",
    dateOfBirth: "1973-09-18",
    joiningDate: "2007-06-15",
    category: "TEACHING",
    designation: "Vice Principal & Exam Controller",
    department: "Administration",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 5 (NPS)",
    education: "M.A in English Literature (RU), M.Ed (IER, DU)",
    assignedSubjects: ["English 1st Paper", "English 2nd Paper"],
    assignedClasses: ["Class 11 (General)", "Class 12 (General)"],
    isClassTeacher: false,
    phone: "+880 1712-445566",
    email: "controller@dhakaideal.edu.bd",
    emergencyContact: "+880 1912-667788",
    address: "Block C, Avenue 2, Mirpur 11, Dhaka-1216",
    status: "ACTIVE",
  },
  {
    id: "staff-003",
    staffId: "TCH-003",
    mpoIndex: "MPO-849202",
    name: "Nasrin Akhter",
    nameBn: "নাসরীন আক্তার",
    gender: "FEMALE",
    bloodGroup: "O+",
    nid: "1980269201000142",
    dateOfBirth: "1978-01-25",
    joiningDate: "2010-03-01",
    category: "TEACHING",
    designation: "Senior Teacher (Mathematics)",
    department: "Mathematics & Science",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 7 (NPS)",
    education: "M.Sc in Applied Mathematics (DU), B.Ed",
    assignedSubjects: ["General Mathematics", "Higher Mathematics"],
    assignedClasses: ["Class 9 (Science)", "Class 10 (Science)"],
    isClassTeacher: true,
    classTeacherOf: "Class 10 - Padma",
    phone: "+880 1819-112233",
    email: "nasrin.math@dhakaideal.edu.bd",
    emergencyContact: "+880 1713-998877",
    address: "Plot 22, Road 7, Mirpur-2, Dhaka",
    status: "ACTIVE",
  },
  {
    id: "staff-004",
    staffId: "TCH-004",
    mpoIndex: "MPO-812903",
    name: "Abdur Rahim Sarker",
    nameBn: "আব্দুর রহিম সরকার",
    gender: "MALE",
    bloodGroup: "AB+",
    nid: "1977269201000215",
    dateOfBirth: "1975-11-04",
    joiningDate: "2008-08-10",
    category: "TEACHING",
    designation: "Senior Teacher (Bangla)",
    department: "Languages",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 7 (NPS)",
    education: "M.A in Bangla Literature (JnU), B.Ed",
    assignedSubjects: ["Bangla 1st Paper", "Bangla 2nd Paper"],
    assignedClasses: ["Class 8 (Morning)", "Class 9 (Day)"],
    isClassTeacher: true,
    classTeacherOf: "Class 9 - Meghna",
    phone: "+880 1714-332211",
    email: "rahim.bangla@dhakaideal.edu.bd",
    emergencyContact: "+880 1811-445566",
    address: "Sector 6, Uttara Model Town, Dhaka",
    status: "ACTIVE",
  },
  {
    id: "staff-005",
    staffId: "TCH-005",
    mpoIndex: "MPO-904812",
    name: "Fatima Tuz Zohra",
    nameBn: "ফাতেমা তুজ জোহরা",
    gender: "FEMALE",
    bloodGroup: "B+",
    nid: "1988269201000302",
    dateOfBirth: "1986-06-14",
    joiningDate: "2016-01-10",
    category: "TEACHING",
    designation: "Assistant Teacher (English)",
    department: "Languages",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 9 (NPS)",
    education: "B.A (Hons), M.A in English (JU), B.Ed",
    assignedSubjects: ["English 1st Paper", "English Grammar & Comp."],
    assignedClasses: ["Class 6 (A)", "Class 7 (B)"],
    isClassTeacher: true,
    classTeacherOf: "Class 7 - Jamuna",
    phone: "+880 1911-778899",
    email: "fatima.eng@dhakaideal.edu.bd",
    emergencyContact: "+880 1715-667788",
    address: "Block F, Banasree, Rampura, Dhaka",
    status: "ACTIVE",
  },
  {
    id: "staff-006",
    staffId: "TCH-006",
    mpoIndex: "MPO-914820",
    name: "Engr. Tanvir Ahmed",
    nameBn: "প্রকৌ. তানভীর আহমেদ",
    gender: "MALE",
    bloodGroup: "O+",
    nid: "1991269201000418",
    dateOfBirth: "1989-12-03",
    joiningDate: "2018-04-01",
    category: "TEACHING",
    designation: "Assistant Teacher (ICT & Computer)",
    department: "ICT & Tech",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 9 (NPS)",
    education: "B.Sc in Computer Science & Engineering (SUST)",
    assignedSubjects: ["Information & Communication Tech (ICT)"],
    assignedClasses: ["Class 8", "Class 9", "Class 10", "Class 11"],
    isClassTeacher: false,
    phone: "+880 1722-889900",
    email: "tanvir.ict@dhakaideal.edu.bd",
    emergencyContact: "+880 1677-112233",
    address: "Kallayanpur Housing Estate, Mirpur, Dhaka",
    status: "ACTIVE",
  },
  {
    id: "staff-007",
    staffId: "TCH-007",
    mpoIndex: "Non-MPO",
    name: "Dr. Shamima Nasrin",
    nameBn: "ড. শামীমা নাসরীন",
    gender: "FEMALE",
    bloodGroup: "A-",
    nid: "1985269201000523",
    dateOfBirth: "1983-03-30",
    joiningDate: "2020-02-15",
    category: "TEACHING",
    designation: "Assistant Teacher (Biology & Science)",
    department: "Mathematics & Science",
    mpoStatus: "NON_MPO",
    salaryGrade: "Institutional Scale-9",
    education: "Ph.D in Zoology (DU), M.Sc in Biology (DU)",
    assignedSubjects: ["Biology", "General Science"],
    assignedClasses: ["Class 9 (Science)", "Class 10 (Science)"],
    isClassTeacher: false,
    phone: "+880 1733-556677",
    email: "shamima.bio@dhakaideal.edu.bd",
    emergencyContact: "+880 1818-443322",
    address: "Dhanmondi R/A, Road 8/A, Dhaka-1209",
    status: "ACTIVE",
  },
  {
    id: "staff-008",
    staffId: "TCH-008",
    mpoIndex: "MPO-804918",
    name: "Mawlana Abdul Matin",
    nameBn: "মাওলানা আব্দুল মতিন",
    gender: "MALE",
    bloodGroup: "B+",
    nid: "1974269201000609",
    dateOfBirth: "1971-08-19",
    joiningDate: "2006-09-01",
    category: "TEACHING",
    designation: "Senior Teacher (Islam & Moral Education)",
    department: "Social Sciences & Ethics",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 8 (NPS)",
    education: "Kamil (Hadith, 1st Class), M.A in Islamic Studies (RU)",
    assignedSubjects: ["Islam & Moral Education"],
    assignedClasses: ["Class 6", "Class 7", "Class 8", "Class 9"],
    isClassTeacher: false,
    phone: "+880 1716-112244",
    email: "abdulmatin@dhakaideal.edu.bd",
    emergencyContact: "+880 1914-556677",
    address: "Paikpara, Mirpur 1, Dhaka-1216",
    status: "ACTIVE",
  },
  {
    id: "staff-009",
    staffId: "TCH-009",
    mpoIndex: "MPO-852109",
    name: "Rezaul Karim",
    nameBn: "রেজাউল করিম",
    gender: "MALE",
    bloodGroup: "O+",
    nid: "1982269201000714",
    dateOfBirth: "1980-05-11",
    joiningDate: "2012-07-20",
    category: "TEACHING",
    designation: "Senior Teacher (Accounting & Finance)",
    department: "Commerce",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 8 (NPS)",
    education: "M.Com in Accounting (CU), B.Ed",
    assignedSubjects: ["Accounting", "Finance & Banking", "Business Ent."],
    assignedClasses: ["Class 9 (Commerce)", "Class 10 (Commerce)"],
    isClassTeacher: true,
    classTeacherOf: "Class 10 - Surma",
    phone: "+880 1718-990011",
    email: "rezaul.commerce@dhakaideal.edu.bd",
    emergencyContact: "+880 1819-223344",
    address: "Section 12, Block C, Mirpur, Dhaka",
    status: "ACTIVE",
  },
  {
    id: "staff-010",
    staffId: "STF-001",
    mpoIndex: "MPO-702914",
    name: "Kazi Nurul Islam",
    nameBn: "কাজী নুরুল ইসলাম",
    gender: "MALE",
    bloodGroup: "A+",
    nid: "1969269201000821",
    dateOfBirth: "1967-10-02",
    joiningDate: "1998-05-15",
    category: "NON_TEACHING",
    designation: "Head Clerk / Administrative Officer",
    department: "Administration",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 11 (NPS)",
    education: "B.Com (Pass, RU)",
    assignedSubjects: [],
    assignedClasses: [],
    phone: "+880 1715-443322",
    email: "admin.office@dhakaideal.edu.bd",
    emergencyContact: "+880 1912-334455",
    address: "Senpara Parbata, Mirpur 10, Dhaka",
    status: "ACTIVE",
  },
  {
    id: "staff-011",
    staffId: "STF-002",
    mpoIndex: "Non-MPO",
    name: "Farhana Yasmin",
    nameBn: "ফারহানা ইয়াসমিন",
    gender: "FEMALE",
    bloodGroup: "B+",
    nid: "1990269201000910",
    dateOfBirth: "1988-07-22",
    joiningDate: "2019-09-01",
    category: "NON_TEACHING",
    designation: "Accountant / Cashier",
    department: "Accounts & Finance",
    mpoStatus: "NON_MPO",
    salaryGrade: "Institutional Scale-12",
    education: "M.B.S in Accounting (NU)",
    assignedSubjects: [],
    assignedClasses: [],
    phone: "+880 1914-665544",
    email: "accounts@dhakaideal.edu.bd",
    emergencyContact: "+880 1716-887766",
    address: "Ibrahimpur, Kafrul, Dhaka-1206",
    status: "ACTIVE",
  },
  {
    id: "staff-012",
    staffId: "STF-003",
    mpoIndex: "Non-MPO",
    name: "Sabbir Hossain",
    nameBn: "সাব্বির হোসেন",
    gender: "MALE",
    bloodGroup: "AB-",
    nid: "1995269201001019",
    dateOfBirth: "1994-01-15",
    joiningDate: "2021-03-01",
    category: "NON_TEACHING",
    designation: "Computer Lab Demonstrator & IT Assistant",
    department: "ICT & Tech",
    mpoStatus: "CONTRACTUAL",
    salaryGrade: "Contractual Scale",
    education: "Diploma in Computer Engineering (BTEB)",
    assignedSubjects: ["Practical ICT Lab Support"],
    assignedClasses: ["Computer Lab 1", "Computer Lab 2"],
    phone: "+880 1678-990011",
    email: "it.support@dhakaideal.edu.bd",
    emergencyContact: "+880 1819-001122",
    address: "Shewrapara, Mirpur, Dhaka-1216",
    status: "ACTIVE",
  },
  {
    id: "staff-013",
    staffId: "STF-004",
    mpoIndex: "MPO-601924",
    name: "Mohammad Solaiman",
    nameBn: "মোহাম্মদ সোলায়মান",
    gender: "MALE",
    bloodGroup: "O+",
    nid: "1973269201001128",
    dateOfBirth: "1971-04-05",
    joiningDate: "2001-01-01",
    category: "NON_TEACHING",
    designation: "Senior Office Peon / MLSS",
    department: "General Support",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 19 (NPS)",
    education: "S.S.C Pass",
    assignedSubjects: [],
    assignedClasses: [],
    phone: "+880 1719-887766",
    email: "solaiman.staff@dhakaideal.edu.bd",
    emergencyContact: "+880 1913-223344",
    address: "Staff Quarter, Campus Grounds, Mirpur, Dhaka",
    status: "ACTIVE",
  },
];

const LOCAL_STORAGE_KEY = "nctb_school_staff_roster_v1";

export function getStoredStaffList(instCode?: string): TeacherStaffMember[] {
  const code = instCode || getActiveTenantCode();
  const defaultList = code === "108254" ? DEFAULT_STAFF_LIST : [];
  if (typeof window === "undefined") {
    return defaultList;
  }
  try {
    const key = getScopedStorageKey(LOCAL_STORAGE_KEY, code);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (code === "108254") {
        const legacy = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (legacy) {
          localStorage.setItem(key, legacy);
          return JSON.parse(legacy);
        }
      }
      localStorage.setItem(key, JSON.stringify(defaultList));
      return defaultList;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return defaultList;
  } catch (e) {
    console.error("Failed to load staff roster from localStorage", e);
    return defaultList;
  }
}

export function saveStoredStaffList(list: TeacherStaffMember[], instCode?: string): void {
  if (typeof window === "undefined") return;
  const code = instCode || getActiveTenantCode();
  try {
    const key = getScopedStorageKey(LOCAL_STORAGE_KEY, code);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save staff roster to localStorage", e);
  }
}

export function resetStaffListToDefault(instCode?: string): TeacherStaffMember[] {
  const code = instCode || getActiveTenantCode();
  const defaultList = code === "108254" ? DEFAULT_STAFF_LIST : [];
  if (typeof window === "undefined") return defaultList;
  try {
    const key = getScopedStorageKey(LOCAL_STORAGE_KEY, code);
    localStorage.setItem(key, JSON.stringify(defaultList));
  } catch (e) {
    console.error("Failed to reset staff roster to localStorage", e);
  }
  return defaultList;
}
