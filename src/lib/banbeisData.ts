import * as XLSX from "xlsx";
import { SchoolBasicInfo, getStoredSchoolInfo } from "./settingsStore";
import { getStoredPayroll, PayrollRecord } from "@/app/accountant/accountantStore";

export interface BanbeisClassStat {
  className: string;
  numericClass: number;
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  femalePercentage: string;
  sectionsCount: number;
  generalCount: number;
  scienceCount: number;
  humanitiesCount: number;
  businessCount: number;
}

export interface BanbeisDemographicStat {
  className: string;
  muslimCount: number;
  hinduCount: number;
  buddhistCount: number;
  christianCount: number;
  otherReligionCount: number;
  stipendCount: number;
  specialNeedsCount: number;
  orphanCount: number;
}

export interface BanbeisTeacherItem {
  slNo: number;
  empId: string;
  name: string;
  gender: "Male" | "Female";
  designation: string;
  department: string;
  subject: string;
  highestDegree: string;
  bEdStatus: "Yes" | "No";
  mpoStatus: "MPO Enlisted" | "Non-MPO" | "Institutional Fund";
  joiningDate: string;
  mobile: string;
}

export interface BanbeisExamStat {
  examName: string;
  academicYear: string;
  totalAppeared: number;
  maleAppeared?: number;
  femaleAppeared?: number;
  totalPassed: number;
  totalFailed: number;
  passPercentage: string;
  gpa5Count: number;
  gradeA: number;
  gradeAMinus: number;
  gradeB: number;
  gradeC: number;
  gradeD: number;
}

export interface BanbeisInfrastructureInfo {
  campusLandAcres: string;
  totalBuildings: number;
  totalRooms: number;
  classroomsCount: number;
  multimediaClassrooms: number;
  computerLabs: number;
  totalFunctionalComputers: number;
  scienceLabsCount: number;
  libraryBookCount: number;
  electricityConnection: string;
  solarPanelAvailable: string;
  internetBroadbandSpeed: string;
  safeDrinkingWaterType: string;
  separateBoysToilets: number;
  separateGirlsToilets: number;
  teachersWashrooms: number;
  playgroundAvailable: string;
  boundaryWallStatus: string;
}

export interface BanbeisStudentRecord {
  classRoll: number;
  studentIdNo: string;
  fullName: string;
  nameBn?: string;
  gender: string;
  religion: string;
  className: string;
  sectionName: string;
  groupType: string;
  shift: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  stipendEligible: "Yes" | "No";
  status: "Active" | "Inactive";
}

export interface BanbeisSubjectWiseStat {
  className: string;
  numericClass: number;
  subjectCode: string;
  subjectName: string;
  groupType: string;
  maleStudents: number;
  femaleStudents: number;
  totalStudents: number;
}

export interface BanbeisMasterCensus {
  generatedAt: string;
  academicYear: string;
  institution: SchoolBasicInfo;
  classStats: BanbeisClassStat[];
  demographics: BanbeisDemographicStat[];
  teachers: BanbeisTeacherItem[];
  examStats: BanbeisExamStat[];
  infrastructure: BanbeisInfrastructureInfo;
  students: BanbeisStudentRecord[];
  subjectWiseStats: BanbeisSubjectWiseStat[];
}

export const DEFAULT_INFRASTRUCTURE: BanbeisInfrastructureInfo = {
  campusLandAcres: "2.45 Acres",
  totalBuildings: 3,
  totalRooms: 34,
  classroomsCount: 24,
  multimediaClassrooms: 6,
  computerLabs: 2,
  totalFunctionalComputers: 42,
  scienceLabsCount: 3,
  libraryBookCount: 4500,
  electricityConnection: "National Grid (DESCO/BREB 3-Phase)",
  solarPanelAvailable: "Yes (2.5 KW Rooftop Array)",
  internetBroadbandSpeed: "Dedicated 100 Mbps Optical Fiber",
  safeDrinkingWaterType: "Deep Tube-well with Arsenic & Iron Filter",
  separateBoysToilets: 8,
  separateGirlsToilets: 10,
  teachersWashrooms: 4,
  playgroundAvailable: "Yes (Full-size Football & Cricket Ground)",
  boundaryWallStatus: "Fully Pucca Boundary Wall with Security Gate",
};

export const DEFAULT_BANBEIS_TEACHERS: BanbeisTeacherItem[] = [
  {
    slNo: 1,
    empId: "EMP-101",
    name: "Dr. Rafiqul Islam",
    gender: "Male",
    designation: "Principal / Headmaster",
    department: "Administration",
    subject: "Management & Bengali",
    highestDegree: "Ph.D. in Education, M.A.",
    bEdStatus: "Yes",
    mpoStatus: "MPO Enlisted",
    joiningDate: "2010-03-15",
    mobile: "01711223344",
  },
  {
    slNo: 2,
    empId: "EMP-102",
    name: "Mohammad Shah Alam",
    gender: "Male",
    designation: "Assistant Headmaster",
    department: "Administration",
    subject: "English Language & Literature",
    highestDegree: "M.A. in English",
    bEdStatus: "Yes",
    mpoStatus: "MPO Enlisted",
    joiningDate: "2012-08-01",
    mobile: "01819223344",
  },
  {
    slNo: 3,
    empId: "EMP-103",
    name: "Mrs. Nasrin Sultana",
    gender: "Female",
    designation: "Senior Teacher",
    department: "Mathematics",
    subject: "Higher Mathematics & General Math",
    highestDegree: "M.Sc. in Mathematics",
    bEdStatus: "Yes",
    mpoStatus: "MPO Enlisted",
    joiningDate: "2014-01-10",
    mobile: "01715667788",
  },
  {
    slNo: 4,
    empId: "EMP-104",
    name: "Kazi Anwar Hossain",
    gender: "Male",
    designation: "Senior Teacher",
    department: "Science",
    subject: "Physics & Physical Science",
    highestDegree: "M.Sc. in Physics",
    bEdStatus: "Yes",
    mpoStatus: "MPO Enlisted",
    joiningDate: "2015-05-18",
    mobile: "01912334455",
  },
  {
    slNo: 5,
    empId: "EMP-105",
    name: "Rokeya Begum",
    gender: "Female",
    designation: "Senior Teacher",
    department: "Science",
    subject: "Chemistry & Biology",
    highestDegree: "M.Sc. in Chemistry",
    bEdStatus: "Yes",
    mpoStatus: "MPO Enlisted",
    joiningDate: "2016-09-01",
    mobile: "01723445566",
  },
  {
    slNo: 6,
    empId: "EMP-106",
    name: "Md. Tanvir Ahmed",
    gender: "Male",
    designation: "Assistant Teacher",
    department: "ICT",
    subject: "Information & Communication Technology",
    highestDegree: "B.Sc. in CSE",
    bEdStatus: "No",
    mpoStatus: "MPO Enlisted",
    joiningDate: "2018-02-12",
    mobile: "01734556677",
  },
  {
    slNo: 7,
    empId: "EMP-107",
    name: "Farhana Yasmin",
    gender: "Female",
    designation: "Assistant Teacher",
    department: "Language",
    subject: "Bangla Literature & Grammar",
    highestDegree: "M.A. in Bangla",
    bEdStatus: "Yes",
    mpoStatus: "MPO Enlisted",
    joiningDate: "2019-03-20",
    mobile: "01823445566",
  },
  {
    slNo: 8,
    empId: "EMP-108",
    name: "Mahmudul Hasan",
    gender: "Male",
    designation: "Assistant Teacher",
    department: "Social Science",
    subject: "Bangladesh & Global Studies, History",
    highestDegree: "M.S.S. in Political Science",
    bEdStatus: "Yes",
    mpoStatus: "Institutional Fund",
    joiningDate: "2021-07-01",
    mobile: "01745667788",
  },
  {
    slNo: 9,
    empId: "EMP-109",
    name: "Mst. Sharmin Akter",
    gender: "Female",
    designation: "Assistant Teacher",
    department: "Business Studies",
    subject: "Accounting & Finance",
    highestDegree: "M.B.A. in Accounting",
    bEdStatus: "No",
    mpoStatus: "Institutional Fund",
    joiningDate: "2022-01-15",
    mobile: "01756778899",
  },
  {
    slNo: 10,
    empId: "EMP-110",
    name: "Maulana Abdul Hannan",
    gender: "Male",
    designation: "Assistant Teacher",
    department: "Religious Studies",
    subject: "Islam & Moral Education, Arabic",
    highestDegree: "Kamil (Hadith), M.A.",
    bEdStatus: "Yes",
    mpoStatus: "MPO Enlisted",
    joiningDate: "2013-11-05",
    mobile: "01934556677",
  },
  {
    slNo: 11,
    empId: "EMP-111",
    name: "Kamrul Hasan",
    gender: "Male",
    designation: "Demonstrator / Lab Assistant",
    department: "Science",
    subject: "Physics & Chemistry Practical",
    highestDegree: "B.Sc. (Pass)",
    bEdStatus: "No",
    mpoStatus: "Institutional Fund",
    joiningDate: "2020-04-01",
    mobile: "01834556677",
  },
  {
    slNo: 12,
    empId: "EMP-112",
    name: "Nazmul Karim",
    gender: "Male",
    designation: "Head Clerk / Office Assistant",
    department: "Administration",
    subject: "General Office Management",
    highestDegree: "B.A. (Pass)",
    bEdStatus: "No",
    mpoStatus: "MPO Enlisted",
    joiningDate: "2011-06-15",
    mobile: "01767889900",
  },
];

export const DEFAULT_BANBEIS_EXAM_STATS: BanbeisExamStat[] = [
  {
    examName: "Annual Examination (Class 6 - 9)",
    academicYear: "2026",
    totalAppeared: 384,
    maleAppeared: 196,
    femaleAppeared: 188,
    totalPassed: 368,
    totalFailed: 16,
    passPercentage: "95.83%",
    gpa5Count: 92,
    gradeA: 145,
    gradeAMinus: 76,
    gradeB: 38,
    gradeC: 15,
    gradeD: 2,
  },
  {
    examName: "Half-Yearly Assessment (Class 6 - 10)",
    academicYear: "2026",
    totalAppeared: 495,
    maleAppeared: 252,
    femaleAppeared: 243,
    totalPassed: 462,
    totalFailed: 33,
    passPercentage: "93.33%",
    gpa5Count: 110,
    gradeA: 184,
    gradeAMinus: 98,
    gradeB: 48,
    gradeC: 20,
    gradeD: 2,
  },
  {
    examName: "SSC Board Examination (Official BISE)",
    academicYear: "2025",
    totalAppeared: 112,
    maleAppeared: 58,
    femaleAppeared: 54,
    totalPassed: 110,
    totalFailed: 2,
    passPercentage: "98.21%",
    gpa5Count: 48,
    gradeA: 42,
    gradeAMinus: 14,
    gradeB: 6,
    gradeC: 0,
    gradeD: 0,
  },
  {
    examName: "HSC Board Examination (Official BISE)",
    academicYear: "2025",
    totalAppeared: 94,
    maleAppeared: 48,
    femaleAppeared: 46,
    totalPassed: 91,
    totalFailed: 3,
    passPercentage: "96.81%",
    gpa5Count: 36,
    gradeA: 38,
    gradeAMinus: 12,
    gradeB: 5,
    gradeC: 0,
    gradeD: 0,
  },
];

export const DEFAULT_BANBEIS_CLASS_STATS: BanbeisClassStat[] = [
  {
    className: "Class 6",
    numericClass: 6,
    totalStudents: 96,
    maleStudents: 49,
    femaleStudents: 47,
    femalePercentage: "48.96%",
    sectionsCount: 2,
    generalCount: 96,
    scienceCount: 0,
    humanitiesCount: 0,
    businessCount: 0,
  },
  {
    className: "Class 7",
    numericClass: 7,
    totalStudents: 92,
    maleStudents: 45,
    femaleStudents: 47,
    femalePercentage: "51.09%",
    sectionsCount: 2,
    generalCount: 92,
    scienceCount: 0,
    humanitiesCount: 0,
    businessCount: 0,
  },
  {
    className: "Class 8",
    numericClass: 8,
    totalStudents: 98,
    maleStudents: 50,
    femaleStudents: 48,
    femalePercentage: "48.98%",
    sectionsCount: 2,
    generalCount: 98,
    scienceCount: 0,
    humanitiesCount: 0,
    businessCount: 0,
  },
  {
    className: "Class 9",
    numericClass: 9,
    totalStudents: 104,
    maleStudents: 53,
    femaleStudents: 51,
    femalePercentage: "49.04%",
    sectionsCount: 3,
    generalCount: 0,
    scienceCount: 52,
    humanitiesCount: 28,
    businessCount: 24,
  },
  {
    className: "Class 10",
    numericClass: 10,
    totalStudents: 105,
    maleStudents: 52,
    femaleStudents: 53,
    femalePercentage: "50.48%",
    sectionsCount: 3,
    generalCount: 0,
    scienceCount: 55,
    humanitiesCount: 26,
    businessCount: 24,
  },
  {
    className: "Class 11",
    numericClass: 11,
    totalStudents: 94,
    maleStudents: 48,
    femaleStudents: 46,
    femalePercentage: "48.94%",
    sectionsCount: 3,
    generalCount: 0,
    scienceCount: 46,
    humanitiesCount: 26,
    businessCount: 22,
  },
  {
    className: "Class 12",
    numericClass: 12,
    totalStudents: 92,
    maleStudents: 46,
    femaleStudents: 46,
    femalePercentage: "50.00%",
    sectionsCount: 3,
    generalCount: 0,
    scienceCount: 48,
    humanitiesCount: 24,
    businessCount: 20,
  },
];

export const DEFAULT_BANBEIS_DEMOGRAPHICS: BanbeisDemographicStat[] = [
  {
    className: "Class 6",
    muslimCount: 84,
    hinduCount: 10,
    buddhistCount: 1,
    christianCount: 1,
    otherReligionCount: 0,
    stipendCount: 28,
    specialNeedsCount: 1,
    orphanCount: 2,
  },
  {
    className: "Class 7",
    muslimCount: 81,
    hinduCount: 9,
    buddhistCount: 1,
    christianCount: 1,
    otherReligionCount: 0,
    stipendCount: 26,
    specialNeedsCount: 0,
    orphanCount: 1,
  },
  {
    className: "Class 8",
    muslimCount: 86,
    hinduCount: 10,
    buddhistCount: 1,
    christianCount: 1,
    otherReligionCount: 0,
    stipendCount: 32,
    specialNeedsCount: 2,
    orphanCount: 3,
  },
  {
    className: "Class 9",
    muslimCount: 92,
    hinduCount: 10,
    buddhistCount: 1,
    christianCount: 1,
    otherReligionCount: 0,
    stipendCount: 34,
    specialNeedsCount: 1,
    orphanCount: 2,
  },
  {
    className: "Class 10",
    muslimCount: 93,
    hinduCount: 10,
    buddhistCount: 1,
    christianCount: 1,
    otherReligionCount: 0,
    stipendCount: 35,
    specialNeedsCount: 1,
    orphanCount: 2,
  },
  {
    className: "Class 11",
    muslimCount: 83,
    hinduCount: 9,
    buddhistCount: 1,
    christianCount: 1,
    otherReligionCount: 0,
    stipendCount: 24,
    specialNeedsCount: 0,
    orphanCount: 1,
  },
  {
    className: "Class 12",
    muslimCount: 81,
    hinduCount: 9,
    buddhistCount: 1,
    christianCount: 1,
    otherReligionCount: 0,
    stipendCount: 22,
    specialNeedsCount: 1,
    orphanCount: 1,
  },
];

export const DEFAULT_BANBEIS_STUDENT_ROSTER: BanbeisStudentRecord[] = [
  {
    classRoll: 1,
    studentIdNo: "ST-2026-601",
    fullName: "Tahmidur Rahman",
    gender: "Male",
    religion: "Islam",
    className: "Class 6",
    sectionName: "Section A",
    groupType: "GENERAL",
    shift: "Morning",
    guardianName: "Abdur Rahim",
    guardianPhone: "01711000101",
    address: "Mirpur-10, Dhaka",
    stipendEligible: "No",
    status: "Active",
  },
  {
    classRoll: 2,
    studentIdNo: "ST-2026-602",
    fullName: "Nusrat Jahan",
    gender: "Female",
    religion: "Islam",
    className: "Class 6",
    sectionName: "Section A",
    groupType: "GENERAL",
    shift: "Morning",
    guardianName: "Jahangir Hossain",
    guardianPhone: "01711000102",
    address: "Pallabi, Mirpur, Dhaka",
    stipendEligible: "Yes",
    status: "Active",
  },
  {
    classRoll: 3,
    studentIdNo: "ST-2026-603",
    fullName: "Sourav Roy",
    gender: "Male",
    religion: "Hinduism",
    className: "Class 6",
    sectionName: "Section A",
    groupType: "GENERAL",
    shift: "Morning",
    guardianName: "Bimal Chandra Roy",
    guardianPhone: "01711000103",
    address: "Senpara Parbata, Mirpur, Dhaka",
    stipendEligible: "No",
    status: "Active",
  },
  {
    classRoll: 1,
    studentIdNo: "ST-2026-901",
    fullName: "Farhan Tanvir",
    gender: "Male",
    religion: "Islam",
    className: "Class 9",
    sectionName: "Science A",
    groupType: "SCIENCE",
    shift: "Day",
    guardianName: "Tanvir Ahmed",
    guardianPhone: "01711000901",
    address: "Section 6, Mirpur, Dhaka",
    stipendEligible: "No",
    status: "Active",
  },
  {
    classRoll: 2,
    studentIdNo: "ST-2026-902",
    fullName: "Sadia Sultana",
    gender: "Female",
    religion: "Islam",
    className: "Class 9",
    sectionName: "Science A",
    groupType: "SCIENCE",
    shift: "Day",
    guardianName: "Sultan Mahmud",
    guardianPhone: "01711000902",
    address: "Rupnagar R/A, Dhaka",
    stipendEligible: "Yes",
    status: "Active",
  },
  {
    classRoll: 1,
    studentIdNo: "ST-2026-1001",
    fullName: "Ayesha Siddiqua",
    gender: "Female",
    religion: "Islam",
    className: "Class 10",
    sectionName: "Science A",
    groupType: "SCIENCE",
    shift: "Day",
    guardianName: "Abu Bakar Siddiq",
    guardianPhone: "01711001001",
    address: "Mirpur-2, Dhaka",
    stipendEligible: "Yes",
    status: "Active",
  },
  {
    classRoll: 2,
    studentIdNo: "ST-2026-1002",
    fullName: "Arnob Barua",
    gender: "Male",
    religion: "Buddhism",
    className: "Class 10",
    sectionName: "Science A",
    groupType: "SCIENCE",
    shift: "Day",
    guardianName: "Pranab Barua",
    guardianPhone: "01711001002",
    address: "Monipur, Mirpur, Dhaka",
    stipendEligible: "No",
    status: "Active",
  },
  {
    classRoll: 3,
    studentIdNo: "ST-2026-1003",
    fullName: "Christina Rozario",
    gender: "Female",
    religion: "Christianity",
    className: "Class 10",
    sectionName: "Humanities A",
    groupType: "HUMANITIES",
    shift: "Day",
    guardianName: "Francis Rozario",
    guardianPhone: "01711001003",
    address: "Farmgate, Dhaka",
    stipendEligible: "Yes",
    status: "Active",
  },
  {
    classRoll: 1,
    studentIdNo: "ST-2026-1101",
    fullName: "Rayhan Kabir",
    gender: "Male",
    religion: "Islam",
    className: "Class 11",
    sectionName: "Science A",
    groupType: "SCIENCE",
    shift: "Day",
    guardianName: "Humayun Kabir",
    guardianPhone: "01711001101",
    address: "Dhanmondi 27, Dhaka",
    stipendEligible: "No",
    status: "Active",
  },
  {
    classRoll: 1,
    studentIdNo: "ST-2026-1201",
    fullName: "Anika Tabassum",
    gender: "Female",
    religion: "Islam",
    className: "Class 12",
    sectionName: "Business Studies A",
    groupType: "BUSINESS_STUDIES",
    shift: "Day",
    guardianName: "Kamal Uddin",
    guardianPhone: "01711001201",
    address: "Mohammadpur, Dhaka",
    stipendEligible: "Yes",
    status: "Active",
  },
];

export const DEFAULT_BANBEIS_SUBJECT_WISE_STATS: BanbeisSubjectWiseStat[] = [
  // ===================== CLASS 9 =====================
  // Compulsory
  { className: "Class 9", numericClass: 9, subjectCode: "101", subjectName: "Bangla 1st Paper", groupType: "COMPULSORY", maleStudents: 53, femaleStudents: 51, totalStudents: 104 },
  { className: "Class 9", numericClass: 9, subjectCode: "102", subjectName: "Bangla 2nd Paper", groupType: "COMPULSORY", maleStudents: 53, femaleStudents: 51, totalStudents: 104 },
  { className: "Class 9", numericClass: 9, subjectCode: "107", subjectName: "English 1st Paper", groupType: "COMPULSORY", maleStudents: 53, femaleStudents: 51, totalStudents: 104 },
  { className: "Class 9", numericClass: 9, subjectCode: "108", subjectName: "English 2nd Paper", groupType: "COMPULSORY", maleStudents: 53, femaleStudents: 51, totalStudents: 104 },
  { className: "Class 9", numericClass: 9, subjectCode: "109", subjectName: "Mathematics", groupType: "COMPULSORY", maleStudents: 53, femaleStudents: 51, totalStudents: 104 },
  { className: "Class 9", numericClass: 9, subjectCode: "154", subjectName: "Information & Communication Tech (ICT)", groupType: "COMPULSORY", maleStudents: 53, femaleStudents: 51, totalStudents: 104 },
  { className: "Class 9", numericClass: 9, subjectCode: "111", subjectName: "Islam & Moral Education", groupType: "COMPULSORY", maleStudents: 53, femaleStudents: 51, totalStudents: 104 },
  // Science Group
  { className: "Class 9", numericClass: 9, subjectCode: "136", subjectName: "Physics", groupType: "SCIENCE", maleStudents: 27, femaleStudents: 25, totalStudents: 52 },
  { className: "Class 9", numericClass: 9, subjectCode: "137", subjectName: "Chemistry", groupType: "SCIENCE", maleStudents: 27, femaleStudents: 25, totalStudents: 52 },
  { className: "Class 9", numericClass: 9, subjectCode: "138", subjectName: "Biology", groupType: "SCIENCE", maleStudents: 27, femaleStudents: 25, totalStudents: 52 },
  { className: "Class 9", numericClass: 9, subjectCode: "126", subjectName: "Higher Mathematics", groupType: "SCIENCE", maleStudents: 27, femaleStudents: 25, totalStudents: 52 },
  { className: "Class 9", numericClass: 9, subjectCode: "150", subjectName: "Bangladesh & Global Studies", groupType: "SCIENCE", maleStudents: 27, femaleStudents: 25, totalStudents: 52 },
  // Humanities Group
  { className: "Class 9", numericClass: 9, subjectCode: "127", subjectName: "General Science", groupType: "HUMANITIES", maleStudents: 14, femaleStudents: 14, totalStudents: 28 },
  { className: "Class 9", numericClass: 9, subjectCode: "153", subjectName: "History of Bangladesh & World Civ.", groupType: "HUMANITIES", maleStudents: 14, femaleStudents: 14, totalStudents: 28 },
  { className: "Class 9", numericClass: 9, subjectCode: "110", subjectName: "Geography & Environment", groupType: "HUMANITIES", maleStudents: 14, femaleStudents: 14, totalStudents: 28 },
  { className: "Class 9", numericClass: 9, subjectCode: "140", subjectName: "Civics & Citizenship", groupType: "HUMANITIES", maleStudents: 14, femaleStudents: 14, totalStudents: 28 },
  { className: "Class 9", numericClass: 9, subjectCode: "134", subjectName: "Agriculture Studies", groupType: "HUMANITIES", maleStudents: 14, femaleStudents: 14, totalStudents: 28 },
  // Business Studies Group
  { className: "Class 9", numericClass: 9, subjectCode: "127", subjectName: "General Science", groupType: "BUSINESS_STUDIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 9", numericClass: 9, subjectCode: "146", subjectName: "Accounting", groupType: "BUSINESS_STUDIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 9", numericClass: 9, subjectCode: "143", subjectName: "Business Entrepreneurship", groupType: "BUSINESS_STUDIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 9", numericClass: 9, subjectCode: "152", subjectName: "Finance & Banking", groupType: "BUSINESS_STUDIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 9", numericClass: 9, subjectCode: "134", subjectName: "Agriculture Studies", groupType: "BUSINESS_STUDIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },

  // ===================== CLASS 10 =====================
  // Compulsory
  { className: "Class 10", numericClass: 10, subjectCode: "101", subjectName: "Bangla 1st Paper", groupType: "COMPULSORY", maleStudents: 52, femaleStudents: 53, totalStudents: 105 },
  { className: "Class 10", numericClass: 10, subjectCode: "102", subjectName: "Bangla 2nd Paper", groupType: "COMPULSORY", maleStudents: 52, femaleStudents: 53, totalStudents: 105 },
  { className: "Class 10", numericClass: 10, subjectCode: "107", subjectName: "English 1st Paper", groupType: "COMPULSORY", maleStudents: 52, femaleStudents: 53, totalStudents: 105 },
  { className: "Class 10", numericClass: 10, subjectCode: "108", subjectName: "English 2nd Paper", groupType: "COMPULSORY", maleStudents: 52, femaleStudents: 53, totalStudents: 105 },
  { className: "Class 10", numericClass: 10, subjectCode: "109", subjectName: "Mathematics", groupType: "COMPULSORY", maleStudents: 52, femaleStudents: 53, totalStudents: 105 },
  { className: "Class 10", numericClass: 10, subjectCode: "154", subjectName: "Information & Communication Tech (ICT)", groupType: "COMPULSORY", maleStudents: 52, femaleStudents: 53, totalStudents: 105 },
  { className: "Class 10", numericClass: 10, subjectCode: "111", subjectName: "Islam & Moral Education", groupType: "COMPULSORY", maleStudents: 52, femaleStudents: 53, totalStudents: 105 },
  // Science Group
  { className: "Class 10", numericClass: 10, subjectCode: "136", subjectName: "Physics", groupType: "SCIENCE", maleStudents: 27, femaleStudents: 28, totalStudents: 55 },
  { className: "Class 10", numericClass: 10, subjectCode: "137", subjectName: "Chemistry", groupType: "SCIENCE", maleStudents: 27, femaleStudents: 28, totalStudents: 55 },
  { className: "Class 10", numericClass: 10, subjectCode: "138", subjectName: "Biology", groupType: "SCIENCE", maleStudents: 27, femaleStudents: 28, totalStudents: 55 },
  { className: "Class 10", numericClass: 10, subjectCode: "126", subjectName: "Higher Mathematics", groupType: "SCIENCE", maleStudents: 27, femaleStudents: 28, totalStudents: 55 },
  { className: "Class 10", numericClass: 10, subjectCode: "150", subjectName: "Bangladesh & Global Studies", groupType: "SCIENCE", maleStudents: 27, femaleStudents: 28, totalStudents: 55 },
  // Humanities Group
  { className: "Class 10", numericClass: 10, subjectCode: "127", subjectName: "General Science", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  { className: "Class 10", numericClass: 10, subjectCode: "153", subjectName: "History of Bangladesh & World Civ.", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  { className: "Class 10", numericClass: 10, subjectCode: "110", subjectName: "Geography & Environment", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  { className: "Class 10", numericClass: 10, subjectCode: "140", subjectName: "Civics & Citizenship", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  { className: "Class 10", numericClass: 10, subjectCode: "134", subjectName: "Agriculture Studies", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  // Business Studies Group
  { className: "Class 10", numericClass: 10, subjectCode: "127", subjectName: "General Science", groupType: "BUSINESS_STUDIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 10", numericClass: 10, subjectCode: "146", subjectName: "Accounting", groupType: "BUSINESS_STUDIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 10", numericClass: 10, subjectCode: "143", subjectName: "Business Entrepreneurship", groupType: "BUSINESS_STUDIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 10", numericClass: 10, subjectCode: "152", subjectName: "Finance & Banking", groupType: "BUSINESS_STUDIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 10", numericClass: 10, subjectCode: "134", subjectName: "Agriculture Studies", groupType: "BUSINESS_STUDIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },

  // ===================== CLASS 11 =====================
  // Compulsory
  { className: "Class 11", numericClass: 11, subjectCode: "101", subjectName: "Bangla 1st Paper", groupType: "COMPULSORY", maleStudents: 48, femaleStudents: 46, totalStudents: 94 },
  { className: "Class 11", numericClass: 11, subjectCode: "102", subjectName: "Bangla 2nd Paper", groupType: "COMPULSORY", maleStudents: 48, femaleStudents: 46, totalStudents: 94 },
  { className: "Class 11", numericClass: 11, subjectCode: "107", subjectName: "English 1st Paper", groupType: "COMPULSORY", maleStudents: 48, femaleStudents: 46, totalStudents: 94 },
  { className: "Class 11", numericClass: 11, subjectCode: "108", subjectName: "English 2nd Paper", groupType: "COMPULSORY", maleStudents: 48, femaleStudents: 46, totalStudents: 94 },
  { className: "Class 11", numericClass: 11, subjectCode: "275", subjectName: "Information & Communication Technology", groupType: "COMPULSORY", maleStudents: 48, femaleStudents: 46, totalStudents: 94 },
  // Science Group
  { className: "Class 11", numericClass: 11, subjectCode: "174", subjectName: "Physics 1st Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 22, totalStudents: 46 },
  { className: "Class 11", numericClass: 11, subjectCode: "175", subjectName: "Physics 2nd Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 22, totalStudents: 46 },
  { className: "Class 11", numericClass: 11, subjectCode: "176", subjectName: "Chemistry 1st Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 22, totalStudents: 46 },
  { className: "Class 11", numericClass: 11, subjectCode: "177", subjectName: "Chemistry 2nd Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 22, totalStudents: 46 },
  { className: "Class 11", numericClass: 11, subjectCode: "178", subjectName: "Biology 1st Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 22, totalStudents: 46 },
  { className: "Class 11", numericClass: 11, subjectCode: "179", subjectName: "Biology 2nd Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 22, totalStudents: 46 },
  { className: "Class 11", numericClass: 11, subjectCode: "265", subjectName: "Higher Mathematics 1st Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 22, totalStudents: 46 },
  { className: "Class 11", numericClass: 11, subjectCode: "266", subjectName: "Higher Mathematics 2nd Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 22, totalStudents: 46 },
  // Humanities Group
  { className: "Class 11", numericClass: 11, subjectCode: "109", subjectName: "Economics 1st Paper", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  { className: "Class 11", numericClass: 11, subjectCode: "110", subjectName: "Economics 2nd Paper", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  { className: "Class 11", numericClass: 11, subjectCode: "269", subjectName: "Civics & Good Governance 1st Paper", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  { className: "Class 11", numericClass: 11, subjectCode: "270", subjectName: "Civics & Good Governance 2nd Paper", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  { className: "Class 11", numericClass: 11, subjectCode: "267", subjectName: "Islamic History & Culture 1st Paper", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  { className: "Class 11", numericClass: 11, subjectCode: "268", subjectName: "Islamic History & Culture 2nd Paper", groupType: "HUMANITIES", maleStudents: 13, femaleStudents: 13, totalStudents: 26 },
  // Business Studies Group
  { className: "Class 11", numericClass: 11, subjectCode: "253", subjectName: "Accounting 1st Paper", groupType: "BUSINESS_STUDIES", maleStudents: 11, femaleStudents: 11, totalStudents: 22 },
  { className: "Class 11", numericClass: 11, subjectCode: "254", subjectName: "Accounting 2nd Paper", groupType: "BUSINESS_STUDIES", maleStudents: 11, femaleStudents: 11, totalStudents: 22 },
  { className: "Class 11", numericClass: 11, subjectCode: "277", subjectName: "Business Organization & Management 1st", groupType: "BUSINESS_STUDIES", maleStudents: 11, femaleStudents: 11, totalStudents: 22 },
  { className: "Class 11", numericClass: 11, subjectCode: "278", subjectName: "Business Organization & Management 2nd", groupType: "BUSINESS_STUDIES", maleStudents: 11, femaleStudents: 11, totalStudents: 22 },
  { className: "Class 11", numericClass: 11, subjectCode: "292", subjectName: "Finance, Banking & Insurance 1st Paper", groupType: "BUSINESS_STUDIES", maleStudents: 11, femaleStudents: 11, totalStudents: 22 },
  { className: "Class 11", numericClass: 11, subjectCode: "293", subjectName: "Finance, Banking & Insurance 2nd Paper", groupType: "BUSINESS_STUDIES", maleStudents: 11, femaleStudents: 11, totalStudents: 22 },

  // ===================== CLASS 12 =====================
  // Compulsory
  { className: "Class 12", numericClass: 12, subjectCode: "101", subjectName: "Bangla 1st Paper", groupType: "COMPULSORY", maleStudents: 46, femaleStudents: 46, totalStudents: 92 },
  { className: "Class 12", numericClass: 12, subjectCode: "102", subjectName: "Bangla 2nd Paper", groupType: "COMPULSORY", maleStudents: 46, femaleStudents: 46, totalStudents: 92 },
  { className: "Class 12", numericClass: 12, subjectCode: "107", subjectName: "English 1st Paper", groupType: "COMPULSORY", maleStudents: 46, femaleStudents: 46, totalStudents: 92 },
  { className: "Class 12", numericClass: 12, subjectCode: "108", subjectName: "English 2nd Paper", groupType: "COMPULSORY", maleStudents: 46, femaleStudents: 46, totalStudents: 92 },
  { className: "Class 12", numericClass: 12, subjectCode: "275", subjectName: "Information & Communication Technology", groupType: "COMPULSORY", maleStudents: 46, femaleStudents: 46, totalStudents: 92 },
  // Science Group
  { className: "Class 12", numericClass: 12, subjectCode: "174", subjectName: "Physics 1st Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 24, totalStudents: 48 },
  { className: "Class 12", numericClass: 12, subjectCode: "175", subjectName: "Physics 2nd Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 24, totalStudents: 48 },
  { className: "Class 12", numericClass: 12, subjectCode: "176", subjectName: "Chemistry 1st Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 24, totalStudents: 48 },
  { className: "Class 12", numericClass: 12, subjectCode: "177", subjectName: "Chemistry 2nd Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 24, totalStudents: 48 },
  { className: "Class 12", numericClass: 12, subjectCode: "178", subjectName: "Biology 1st Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 24, totalStudents: 48 },
  { className: "Class 12", numericClass: 12, subjectCode: "179", subjectName: "Biology 2nd Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 24, totalStudents: 48 },
  { className: "Class 12", numericClass: 12, subjectCode: "265", subjectName: "Higher Mathematics 1st Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 24, totalStudents: 48 },
  { className: "Class 12", numericClass: 12, subjectCode: "266", subjectName: "Higher Mathematics 2nd Paper", groupType: "SCIENCE", maleStudents: 24, femaleStudents: 24, totalStudents: 48 },
  // Humanities Group
  { className: "Class 12", numericClass: 12, subjectCode: "109", subjectName: "Economics 1st Paper", groupType: "HUMANITIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 12", numericClass: 12, subjectCode: "110", subjectName: "Economics 2nd Paper", groupType: "HUMANITIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 12", numericClass: 12, subjectCode: "269", subjectName: "Civics & Good Governance 1st Paper", groupType: "HUMANITIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 12", numericClass: 12, subjectCode: "270", subjectName: "Civics & Good Governance 2nd Paper", groupType: "HUMANITIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 12", numericClass: 12, subjectCode: "267", subjectName: "Islamic History & Culture 1st Paper", groupType: "HUMANITIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  { className: "Class 12", numericClass: 12, subjectCode: "268", subjectName: "Islamic History & Culture 2nd Paper", groupType: "HUMANITIES", maleStudents: 12, femaleStudents: 12, totalStudents: 24 },
  // Business Studies Group
  { className: "Class 12", numericClass: 12, subjectCode: "253", subjectName: "Accounting 1st Paper", groupType: "BUSINESS_STUDIES", maleStudents: 10, femaleStudents: 10, totalStudents: 20 },
  { className: "Class 12", numericClass: 12, subjectCode: "254", subjectName: "Accounting 2nd Paper", groupType: "BUSINESS_STUDIES", maleStudents: 10, femaleStudents: 10, totalStudents: 20 },
  { className: "Class 12", numericClass: 12, subjectCode: "277", subjectName: "Business Organization & Management 1st", groupType: "BUSINESS_STUDIES", maleStudents: 10, femaleStudents: 10, totalStudents: 20 },
  { className: "Class 12", numericClass: 12, subjectCode: "278", subjectName: "Business Organization & Management 2nd", groupType: "BUSINESS_STUDIES", maleStudents: 10, femaleStudents: 10, totalStudents: 20 },
  { className: "Class 12", numericClass: 12, subjectCode: "292", subjectName: "Finance, Banking & Insurance 1st Paper", groupType: "BUSINESS_STUDIES", maleStudents: 10, femaleStudents: 10, totalStudents: 20 },
  { className: "Class 12", numericClass: 12, subjectCode: "293", subjectName: "Finance, Banking & Insurance 2nd Paper", groupType: "BUSINESS_STUDIES", maleStudents: 10, femaleStudents: 10, totalStudents: 20 },
];

/**
 * Compiles the complete BANBEIS master census dataset using stored settings & live records.
 */
export function getBanbeisMasterCensus(): BanbeisMasterCensus {
  const schoolInfo = getStoredSchoolInfo();

  // Try to load any real payroll records if stored
  const payrollRecords = getStoredPayroll();
  let teachers = DEFAULT_BANBEIS_TEACHERS;

  if (payrollRecords && payrollRecords.length > 0) {
    teachers = payrollRecords.map((p, idx) => ({
      slNo: idx + 1,
      empId: p.empId || `EMP-${100 + idx + 1}`,
      name: p.name,
      gender: p.name.includes("Mrs.") || p.name.includes("Rokeya") || p.name.includes("Farhana") || p.name.includes("Sharmin") || p.name.includes("Begum") ? "Female" : "Male",
      designation: p.designation,
      department: p.department === "ACADEMIC" ? "Academic" : p.department === "ADMINISTRATION" ? "Administration" : "Support Staff",
      subject: p.designation.includes("(") ? p.designation.split("(")[1].replace(")", "") : "General Curriculum",
      highestDegree: p.designation.toLowerCase().includes("principal") ? "M.A. / M.Sc., B.Ed" : "Masters Degree",
      bEdStatus: p.department === "ACADEMIC" ? "Yes" : "No",
      mpoStatus: "MPO Enlisted",
      joiningDate: "2016-01-01",
      mobile: "017XXXXXXXX",
    }));
  }

  return {
    generatedAt: new Date().toISOString(),
    academicYear: schoolInfo.academicYear || "2026",
    institution: schoolInfo,
    classStats: DEFAULT_BANBEIS_CLASS_STATS,
    demographics: DEFAULT_BANBEIS_DEMOGRAPHICS,
    teachers,
    examStats: DEFAULT_BANBEIS_EXAM_STATS,
    infrastructure: DEFAULT_INFRASTRUCTURE,
    students: DEFAULT_BANBEIS_STUDENT_ROSTER,
    subjectWiseStats: DEFAULT_BANBEIS_SUBJECT_WISE_STATS,
  };
}

/**
 * Downloads a complete multi-sheet Excel file (.xlsx) formatted for BANBEIS Annual Census.
 */
export function downloadBanbeisFullWorkbook(census: BanbeisMasterCensus) {
  const wb = XLSX.utils.book_new();

  // 1. Institution Profile Sheet
  const instRows = [
    ["BANGLADESH BUREAU OF EDUCATIONAL INFORMATION AND STATISTICS (BANBEIS)"],
    ["ANNUAL EDUCATIONAL INSTITUTION CENSUS & MASTER SURVEY"],
    ["Generated On", new Date().toLocaleString()],
    [],
    ["FIELD NAME", "INSTITUTION VALUE / DETAILS", "BANBEIS CODE / REMARKS"],
    ["Institution Name (English)", census.institution.name, "Mandatory"],
    ["Institution Name (Bangla)", census.institution.nameBn || "N/A", "বাংলা নাম"],
    ["EIIN (Educational Institute Identification No)", census.institution.eiin, "National EIIN"],
    ["Institution Code", census.institution.institutionCode || "N/A", "BISE Code"],
    ["Center Code", census.institution.centerCode || "N/A", "Exam Center"],
    ["Institute Category / Type", census.institution.instituteType || "SCHOOL_AND_COLLEGE", "NCTB Standard"],
    ["Education Board Affiliation", census.institution.board || "Dhaka", "Intermediate & Secondary"],
    ["Established Year", census.institution.establishedYear || "1994", "Official Founding Year"],
    ["Motto / Slok", census.institution.motto || "N/A", "Institutional Motto"],
    ["Division", census.institution.division || "Dhaka", "Division"],
    ["District", census.institution.district || "Dhaka", "District"],
    ["Thana / Upazila", census.institution.thana || "Mirpur", "Thana Code"],
    ["Postal Code", census.institution.postalCode || "1216", "Post Code"],
    ["Campus Street Address", census.institution.address || "Mirpur, Dhaka", "Physical Location"],
    ["Official Email", census.institution.email || "info@institution.edu.bd", "Verified Email"],
    ["Official Telephone / Mobile", census.institution.phone || census.institution.mobile || "+880 1712-345678", "Contact Hotline"],
    ["Official Website", census.institution.website || "https://institution.edu.bd", "Web Portal"],
    ["Head of Institution Title", census.institution.headTitle || "Principal", "Administrative Head"],
    ["Head of Institution Name", census.institution.headName || "Dr. Rafiqul Islam", "Full Name"],
    ["Head Contact Mobile", census.institution.headPhone || "+880 1711-223344", "Direct Contact"],
    ["Exam Controller Title", census.institution.controllerTitle || "Exam Controller & Vice Principal", "Academic Controller"],
    ["Exam Controller Name", census.institution.controllerName || "Mohammad Shah Alam", "Controller Full Name"],
    ["Active Academic Session", census.academicYear, "Census Year"],
    ["Operational Medium", census.institution.medium || "BOTH", "Bangla / English Version"],
    ["Operational Shifts", (census.institution.shifts || ["Morning", "Day"]).join(", "), "Shifts"],
    ["Classes Operational", census.institution.classRange || "Class 6 to Class 12", "Grades Taught"],
  ];
  const wsInst = XLSX.utils.aoa_to_sheet(instRows);
  wsInst["!cols"] = [{ wch: 35 }, { wch: 50 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsInst, "1_Institution_Profile");

  // 2. Class Enrollment Stats Sheet
  const enrollHeader = [
    "Class",
    "Numeric Class",
    "Total Students",
    "Male Students",
    "Female Students",
    "% of Girls",
    "No. of Sections",
    "General Group",
    "Science Group",
    "Humanities Group",
    "Business Studies Group",
  ];
  const enrollRows = census.classStats.map((c) => [
    c.className,
    c.numericClass,
    c.totalStudents,
    c.maleStudents,
    c.femaleStudents,
    c.femalePercentage,
    c.sectionsCount,
    c.generalCount,
    c.scienceCount,
    c.humanitiesCount,
    c.businessCount,
  ]);
  // Total Row
  const totalStudents = census.classStats.reduce((acc, c) => acc + c.totalStudents, 0);
  const totalMale = census.classStats.reduce((acc, c) => acc + c.maleStudents, 0);
  const totalFemale = census.classStats.reduce((acc, c) => acc + c.femaleStudents, 0);
  const totalFemalePct = totalStudents > 0 ? ((totalFemale / totalStudents) * 100).toFixed(2) + "%" : "0%";
  const totalSections = census.classStats.reduce((acc, c) => acc + c.sectionsCount, 0);
  enrollRows.push([
    "TOTAL (All Classes)",
    0,
    totalStudents,
    totalMale,
    totalFemale,
    totalFemalePct,
    totalSections,
    census.classStats.reduce((acc, c) => acc + c.generalCount, 0),
    census.classStats.reduce((acc, c) => acc + c.scienceCount, 0),
    census.classStats.reduce((acc, c) => acc + c.humanitiesCount, 0),
    census.classStats.reduce((acc, c) => acc + c.businessCount, 0),
  ]);

  const wsEnroll = XLSX.utils.aoa_to_sheet([enrollHeader, ...enrollRows]);
  wsEnroll["!cols"] = enrollHeader.map((h) => ({ wch: Math.max(h.length + 3, 14) }));
  XLSX.utils.book_append_sheet(wb, wsEnroll, "2_Student_Enrollment");

  // 3. Demographics & Stipends Sheet
  const demoHeader = [
    "Class",
    "Muslim Students",
    "Hindu Students",
    "Buddhist Students",
    "Christian Students",
    "Other Religion",
    "Stipend Recipients (উপবৃত্তি)",
    "Special Needs / Disabled (প্রতিবন্ধী)",
    "Orphan / Single Guardian",
  ];
  const demoRows = census.demographics.map((d) => [
    d.className,
    d.muslimCount,
    d.hinduCount,
    d.buddhistCount,
    d.christianCount,
    d.otherReligionCount,
    d.stipendCount,
    d.specialNeedsCount,
    d.orphanCount,
  ]);
  demoRows.push([
    "TOTAL",
    census.demographics.reduce((acc, d) => acc + d.muslimCount, 0),
    census.demographics.reduce((acc, d) => acc + d.hinduCount, 0),
    census.demographics.reduce((acc, d) => acc + d.buddhistCount, 0),
    census.demographics.reduce((acc, d) => acc + d.christianCount, 0),
    census.demographics.reduce((acc, d) => acc + d.otherReligionCount, 0),
    census.demographics.reduce((acc, d) => acc + d.stipendCount, 0),
    census.demographics.reduce((acc, d) => acc + d.specialNeedsCount, 0),
    census.demographics.reduce((acc, d) => acc + d.orphanCount, 0),
  ]);
  const wsDemo = XLSX.utils.aoa_to_sheet([demoHeader, ...demoRows]);
  wsDemo["!cols"] = demoHeader.map((h) => ({ wch: Math.max(h.length + 3, 16) }));
  XLSX.utils.book_append_sheet(wb, wsDemo, "3_Demographics_Stipend");

  // 4. Teacher & Staff Roster Sheet
  const teacherHeader = [
    "SL No",
    "Teacher/Staff ID",
    "Full Name",
    "Gender",
    "Designation",
    "Department",
    "Teaching Subject",
    "Highest Degree",
    "B.Ed / M.Ed",
    "MPO Enlistment Status",
    "Joining Date",
    "Mobile Number",
  ];
  const teacherRows = census.teachers.map((t) => [
    t.slNo,
    t.empId,
    t.name,
    t.gender,
    t.designation,
    t.department,
    t.subject,
    t.highestDegree,
    t.bEdStatus,
    t.mpoStatus,
    t.joiningDate,
    t.mobile,
  ]);
  const wsTeacher = XLSX.utils.aoa_to_sheet([teacherHeader, ...teacherRows]);
  wsTeacher["!cols"] = teacherHeader.map((h) => ({ wch: Math.max(h.length + 3, 16) }));
  XLSX.utils.book_append_sheet(wb, wsTeacher, "4_Teachers_Staff_Roster");

  // 5. Exam Performance Sheet
  const examHeader = [
    "Examination Name",
    "Session / Year",
    "Total Appeared",
    "Male Appeared",
    "Female Appeared",
    "Total Passed",
    "Total Failed",
    "Pass Rate (%)",
    "GPA 5.00 Count",
    "Grade A (4.00-4.99)",
    "Grade A- (3.50-3.99)",
    "Grade B (3.00-3.49)",
    "Grade C (2.00-2.99)",
    "Grade D (1.00-1.99)",
  ];
  const examRows = census.examStats.map((e) => [
    e.examName,
    e.academicYear,
    e.totalAppeared,
    e.maleAppeared ?? "-",
    e.femaleAppeared ?? "-",
    e.totalPassed,
    e.totalFailed,
    e.passPercentage,
    e.gpa5Count,
    e.gradeA,
    e.gradeAMinus,
    e.gradeB,
    e.gradeC,
    e.gradeD,
  ]);
  const wsExam = XLSX.utils.aoa_to_sheet([examHeader, ...examRows]);
  wsExam["!cols"] = examHeader.map((h) => ({ wch: Math.max(h.length + 3, 16) }));
  XLSX.utils.book_append_sheet(wb, wsExam, "5_Exam_Results_Stats");

  // 6. Infrastructure & ICT Census Sheet
  const infraRows = [
    ["BANBEIS PHYSICAL INFRASTRUCTURE, ICT & SANITATION CENSUS"],
    ["Generated On", new Date().toLocaleString()],
    [],
    ["INFRASTRUCTURE / FACILITY PARAMETER", "CENSUS SPECIFICATION & COUNT", "STATUS / REMARKS"],
    ["Campus Total Land Area", census.infrastructure.campusLandAcres, "Owned Land"],
    ["Number of Academic & Admin Buildings", census.infrastructure.totalBuildings, "Pucca Structures"],
    ["Total Usable Rooms", census.infrastructure.totalRooms, "Rooms"],
    ["Designated Classrooms", census.infrastructure.classroomsCount, "Active Classrooms"],
    ["Multimedia Projector Classrooms", census.infrastructure.multimediaClassrooms, "Government & Own Fund"],
    ["Dedicated Computer / ICT Labs", census.infrastructure.computerLabs, "Labs"],
    ["Total Functional Computers & Laptops", census.infrastructure.totalFunctionalComputers, "Workstations"],
    ["Science Laboratories (Physics, Chemistry, Bio)", census.infrastructure.scienceLabsCount, "Equipped Labs"],
    ["Library Book Holdings", census.infrastructure.libraryBookCount, "Cataloged Books"],
    ["Main Electricity Grid Supply", census.infrastructure.electricityConnection, "Connected"],
    ["Rooftop Solar PV Installation", census.infrastructure.solarPanelAvailable, "Clean Energy"],
    ["High-Speed Broadband Internet", census.infrastructure.internetBroadbandSpeed, "Optical Fiber"],
    ["Safe Drinking Water Source", census.infrastructure.safeDrinkingWaterType, "Tested Safe"],
    ["Sanitary Toilets for Boys", census.infrastructure.separateBoysToilets, "Male Urinals & Toilets"],
    ["Sanitary Toilets for Girls", census.infrastructure.separateGirlsToilets, "Female Toilets with Pad Bin"],
    ["Teachers & Staff Washrooms", census.infrastructure.teachersWashrooms, "Faculty Washrooms"],
    ["Campus Sports Ground / Playground", census.infrastructure.playgroundAvailable, "Outdoor Sports"],
    ["Campus Perimeter Boundary Wall", census.infrastructure.boundaryWallStatus, "Physical Security"],
  ];
  const wsInfra = XLSX.utils.aoa_to_sheet(infraRows);
  wsInfra["!cols"] = [{ wch: 45 }, { wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsInfra, "6_Infrastructure_ICT");

  // 7. Student Master Roster Sheet
  const studentHeader = [
    "Roll No",
    "Student ID / Reg",
    "Full Name",
    "Gender",
    "Religion",
    "Class",
    "Section",
    "Group",
    "Shift",
    "Guardian Name",
    "Guardian Mobile (SMS)",
    "Permanent Address",
    "Stipend Eligible",
    "Enrollment Status",
  ];
  const studentRows = census.students.map((s) => [
    s.classRoll,
    s.studentIdNo,
    s.fullName,
    s.gender,
    s.religion,
    s.className,
    s.sectionName,
    s.groupType,
    s.shift,
    s.guardianName,
    s.guardianPhone,
    s.address,
    s.stipendEligible,
    s.status,
  ]);
  const wsStudent = XLSX.utils.aoa_to_sheet([studentHeader, ...studentRows]);
  wsStudent["!cols"] = studentHeader.map((h) => ({ wch: Math.max(h.length + 3, 16) }));
  XLSX.utils.book_append_sheet(wb, wsStudent, "7_Student_Master_Roster");

  // 8. Class 9-12 Subject-wise Student Census Sheet
  const subjectHeader = [
    "Class",
    "Numeric Class",
    "Subject Code",
    "Subject Name",
    "Group / Stream",
    "Male Students",
    "Female Students",
    "Total Students",
  ];
  const subjectRows = (census.subjectWiseStats || []).map((s) => [
    s.className,
    s.numericClass,
    s.subjectCode,
    s.subjectName,
    s.groupType,
    s.maleStudents,
    s.femaleStudents,
    s.totalStudents,
  ]);
  const totalSubMale = (census.subjectWiseStats || []).reduce((acc, s) => acc + s.maleStudents, 0);
  const totalSubFemale = (census.subjectWiseStats || []).reduce((acc, s) => acc + s.femaleStudents, 0);
  const totalSubAll = (census.subjectWiseStats || []).reduce((acc, s) => acc + s.totalStudents, 0);
  subjectRows.push([
    "TOTAL (All Subjects)",
    0,
    "-",
    "Grand Aggregate",
    "ALL",
    totalSubMale,
    totalSubFemale,
    totalSubAll,
  ]);
  const wsSubject = XLSX.utils.aoa_to_sheet([subjectHeader, ...subjectRows]);
  wsSubject["!cols"] = subjectHeader.map((h) => ({ wch: Math.max(h.length + 3, 16) }));
  XLSX.utils.book_append_sheet(wb, wsSubject, "8_Subjectwise_Students_9_12");

  // Output filename: BANBEIS_Census_EIIN_[eiin]_[year].xlsx
  const safeEiin = census.institution.eiin || "108254";
  const fileName = `BANBEIS_Annual_Census_EIIN_${safeEiin}_Year_${census.academicYear}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Downloads single sheet as Excel (.xlsx).
 */
export function downloadBanbeisSingleSheetExcel(
  sheetName: string,
  headers: string[],
  rows: any[][],
  fileNamePrefix: string,
  eiin?: string
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 3, 16) }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  const fileName = `BANBEIS_${fileNamePrefix}_EIIN_${eiin || "108254"}_2026.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Downloads a single table as CSV.
 */
export function downloadBanbeisCSV(headers: string[], rows: any[][], fileNamePrefix: string, eiin?: string) {
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent =
    "\uFEFF" + // UTF-8 BOM for Excel Bengali character rendering
    [
      headers.map(escapeCsv).join(","),
      ...rows.map((r) => r.map(escapeCsv).join(",")),
    ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BANBEIS_${fileNamePrefix}_EIIN_${eiin || "108254"}_2026.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads complete BANBEIS census as official JSON payload.
 */
export function downloadBanbeisJSON(census: BanbeisMasterCensus) {
  const jsonString = JSON.stringify(census, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeEiin = census.institution.eiin || "108254";
  a.download = `BANBEIS_Census_Payload_EIIN_${safeEiin}_Year_${census.academicYear}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
