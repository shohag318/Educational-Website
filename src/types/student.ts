import type { GroupType } from "./common";

export interface Student {
  id: string;
  institutionId?: string;
  studentIdNo: string;
  firstName: string;
  lastName: string;
  gender?: string | null;
  religion?: string | null;
  address?: string | null;
  guardianName: string;
  guardianPhone: string;
  customFields?: string | null;
  isActive: boolean;
  enrollments?: StudentEnrollment[];
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  groupType: GroupType | string;
  classRoll: number;
  student?: Student;
}

export interface StudentSubjectAllocation {
  id: string;
  enrollmentId: string;
  subjectId: string;
  subjectType: string;
}
