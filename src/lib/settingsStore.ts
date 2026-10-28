"use client";

export interface SchoolBasicInfo {
  // Identity & Branding
  name: string;
  nameBn: string;
  eiin: string;
  institutionCode: string;
  centerCode: string;
  instituteType: "SCHOOL_AND_COLLEGE" | "HIGH_SCHOOL" | "COLLEGE" | "MADRASAH";
  board: string;
  establishedYear: string;
  motto: string;
  logoUrl?: string;

  // Academic Session & Dashboard Controls
  academicYear: string;
  activeTerm: string;
  medium: "BANGLA" | "ENGLISH" | "BOTH";
  shifts: string[];
  classRange: string;
  weekendDays: string[];

  // Campus Contact & Location
  address: string;
  thana: string;
  district: string;
  division: string;
  postalCode: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;

  // Leadership & Administration
  headTitle: "Principal" | "Headmaster" | "Headmistress" | "Superintendent";
  headName: string;
  headPhone?: string;
  headEmail?: string;
  controllerTitle: string;
  controllerName: string;

  // System & Meta
  currencySymbol: string;
  updatedAt: string;
}

export interface InstitutionPreset {
  id: string;
  title: string;
  tagline: string;
  data: Partial<SchoolBasicInfo>;
}

export const INSTITUTION_PRESETS: InstitutionPreset[] = [
  {
    id: "dhaka_ideal",
    title: "Dhaka Ideal Model High School & College",
    tagline: "EIIN: 108254 • Mirpur, Dhaka • Dhaka Board",
    data: {
      name: "Dhaka Ideal Model High School & College",
      nameBn: "ঢাকা আইডিয়াল মডেল হাই স্কুল অ্যান্ড কলেজ",
      eiin: "108254",
      institutionCode: "DIMHSC-1082",
      centerCode: "304",
      instituteType: "SCHOOL_AND_COLLEGE",
      board: "Dhaka",
      establishedYear: "1994",
      motto: "Excellence in Education, Character, and Discipline",
      address: "Road 4, Block D, Section 10",
      thana: "Mirpur",
      district: "Dhaka",
      division: "Dhaka",
      postalCode: "1216",
      phone: "+880 2-9001234",
      mobile: "+880 1712-345678",
      email: "info@dhakaideal.edu.bd",
      website: "https://www.dhakaideal.edu.bd",
      headTitle: "Principal",
      headName: "Prof. A. K. M. Shamsuddin",
      headPhone: "+880 1711-223344",
      headEmail: "principal@dhakaideal.edu.bd",
      controllerTitle: "Exam Controller & Vice Principal",
      controllerName: "Mohammad Jahangir Hossain",
      academicYear: "2026",
      activeTerm: "Annual Examination",
      medium: "BOTH",
      shifts: ["Morning", "Day"],
      classRange: "Class 6 to Class 12",
      weekendDays: ["Friday", "Saturday"],
    },
  },
  {
    id: "govt_lab",
    title: "Govt. Laboratory High School & College",
    tagline: "EIIN: 107961 • Dhanmondi, Dhaka • Premier Govt. Institute",
    data: {
      name: "Govt. Laboratory High School & College",
      nameBn: "সরকারি ল্যাবরেটরি হাই স্কুল অ্যান্ড কলেজ",
      eiin: "107961",
      institutionCode: "GLHSC-1079",
      centerCode: "102",
      instituteType: "SCHOOL_AND_COLLEGE",
      board: "Dhaka",
      establishedYear: "1961",
      motto: "Labor Omnia Vincit (Labor Conquers Everything)",
      address: "Mirpur Road, Dhanmondi",
      thana: "Dhanmondi",
      district: "Dhaka",
      division: "Dhaka",
      postalCode: "1205",
      phone: "+880 2-9662345",
      mobile: "+880 1715-667788",
      email: "glhsc.dhaka@gov.bd",
      website: "https://www.glhsc.gov.bd",
      headTitle: "Principal",
      headName: "Dr. Md. Nazmul Haque",
      headPhone: "+880 1711-998877",
      headEmail: "principal@glhsc.gov.bd",
      controllerTitle: "Exam Committee Convener",
      controllerName: "Nasreen Sultana",
      academicYear: "2026",
      activeTerm: "Annual Examination",
      medium: "BANGLA",
      shifts: ["Morning", "Day"],
      classRange: "Class 1 to Class 12",
      weekendDays: ["Friday", "Saturday"],
    },
  },
  {
    id: "ctg_collegiate",
    title: "Chattogram Collegiate School & College",
    tagline: "EIIN: 134156 • Sadarghat, Chattogram • Chattogram Board",
    data: {
      name: "Chattogram Collegiate School & College",
      nameBn: "চট্টগ্রাম কলেজিয়েট স্কুল অ্যান্ড কলেজ",
      eiin: "134156",
      institutionCode: "CCSC-1341",
      centerCode: "201",
      instituteType: "SCHOOL_AND_COLLEGE",
      board: "Chattogram",
      establishedYear: "1836",
      motto: "Truth, Discipline and Knowledge",
      address: "Ice Factory Road, Sadarghat",
      thana: "Kotwali",
      district: "Chattogram",
      division: "Chattogram",
      postalCode: "4000",
      phone: "+880 31-615678",
      mobile: "+880 1819-223344",
      email: "info@ctgcollegiate.edu.bd",
      website: "https://www.ctgcollegiate.edu.bd",
      headTitle: "Headmaster",
      headName: "Md. Harun Ur Rashid",
      headPhone: "+880 1819-334455",
      headEmail: "headmaster@ctgcollegiate.edu.bd",
      controllerTitle: "Controller of Examinations",
      controllerName: "Animesh Barua",
      academicYear: "2026",
      activeTerm: "Annual Examination",
      medium: "BANGLA",
      shifts: ["Morning", "Day"],
      classRange: "Class 5 to Class 12",
      weekendDays: ["Friday", "Saturday"],
    },
  },
  {
    id: "rajshahi_model",
    title: "Rajshahi Model School & College",
    tagline: "EIIN: 126487 • Kazihata, Rajshahi • Rajshahi Board",
    data: {
      name: "Rajshahi Model School & College",
      nameBn: "রাজশাহী মডেল স্কুল অ্যান্ড কলেজ",
      eiin: "126487",
      institutionCode: "RMSC-1264",
      centerCode: "405",
      instituteType: "SCHOOL_AND_COLLEGE",
      board: "Rajshahi",
      establishedYear: "2006",
      motto: "Enlightened Students, Modern Bangladesh",
      address: "Kazihata, Rajpara",
      thana: "Rajpara",
      district: "Rajshahi",
      division: "Rajshahi",
      postalCode: "6000",
      phone: "+880 721-772345",
      mobile: "+880 1716-445566",
      email: "info@rmsc.edu.bd",
      website: "https://www.rmsc.edu.bd",
      headTitle: "Principal",
      headName: "Prof. Md. Mahbubur Rahman",
      headPhone: "+880 1711-556677",
      headEmail: "principal@rmsc.edu.bd",
      controllerTitle: "Vice Principal & Exam Controller",
      controllerName: "Dr. Farhana Yasmin",
      academicYear: "2026",
      activeTerm: "Annual Examination",
      medium: "BOTH",
      shifts: ["Day"],
      classRange: "Class 6 to Class 12",
      weekendDays: ["Friday"],
    },
  },
];

export const DEFAULT_SCHOOL_INFO: SchoolBasicInfo = {
  name: "Dhaka Ideal Model High School & College",
  nameBn: "ঢাকা আইডিয়াল মডেল হাই স্কুল অ্যান্ড কলেজ",
  eiin: "108254",
  institutionCode: "DIMHSC-1082",
  centerCode: "304",
  instituteType: "SCHOOL_AND_COLLEGE",
  board: "Dhaka",
  establishedYear: "1994",
  motto: "Excellence in Education, Character, and Discipline",
  logoUrl: "",

  academicYear: "2026",
  activeTerm: "Annual Examination",
  medium: "BOTH",
  shifts: ["Morning", "Day"],
  classRange: "Class 6 to Class 12",
  weekendDays: ["Friday", "Saturday"],

  address: "Road 4, Block D, Section 10",
  thana: "Mirpur",
  district: "Dhaka",
  division: "Dhaka",
  postalCode: "1216",
  phone: "+880 2-9001234",
  mobile: "+880 1712-345678",
  email: "info@dhakaideal.edu.bd",
  website: "https://www.dhakaideal.edu.bd",

  headTitle: "Principal",
  headName: "Prof. A. K. M. Shamsuddin",
  headPhone: "+880 1711-223344",
  headEmail: "principal@dhakaideal.edu.bd",
  controllerTitle: "Exam Controller & Vice Principal",
  controllerName: "Mohammad Jahangir Hossain",

  currencySymbol: "৳",
  updatedAt: new Date().toISOString(),
};

export const SETTINGS_STORAGE_KEY = "nctb_school_settings_v1";
export const SETTINGS_UPDATED_EVENT = "nctb_settings_updated";

export function getStoredSchoolInfo(): SchoolBasicInfo {
  if (typeof window === "undefined") return DEFAULT_SCHOOL_INFO;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL_INFO));
      return DEFAULT_SCHOOL_INFO;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SCHOOL_INFO, ...parsed };
  } catch (e) {
    console.error("Failed to parse stored school settings", e);
    return DEFAULT_SCHOOL_INFO;
  }
}

export function saveStoredSchoolInfo(info: SchoolBasicInfo): void {
  if (typeof window === "undefined") return;
  try {
    const updated = {
      ...info,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: updated }));
    const code = updated.eiin || updated.institutionCode;
    if (code) {
      window.dispatchEvent(
        new CustomEvent("smart_academy_tenant_switched", {
          detail: { code, name: updated.name },
        })
      );
    }
  } catch (e) {
    console.error("Failed to save school settings", e);
  }
}

export function resetSchoolInfoToDefault(): SchoolBasicInfo {
  if (typeof window === "undefined") return DEFAULT_SCHOOL_INFO;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL_INFO));
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: DEFAULT_SCHOOL_INFO }));
    window.dispatchEvent(
      new CustomEvent("smart_academy_tenant_switched", {
        detail: { code: DEFAULT_SCHOOL_INFO.eiin, name: DEFAULT_SCHOOL_INFO.name },
      })
    );
  } catch (e) {
    console.error("Failed to reset school settings", e);
  }
  return DEFAULT_SCHOOL_INFO;
}

export function applyPresetById(presetId: string): SchoolBasicInfo {
  const preset = INSTITUTION_PRESETS.find((p) => p.id === presetId);
  const current = getStoredSchoolInfo();
  const merged: SchoolBasicInfo = {
    ...current,
    ...(preset?.data || {}),
    updatedAt: new Date().toISOString(),
  };
  saveStoredSchoolInfo(merged);
  return merged;
}
