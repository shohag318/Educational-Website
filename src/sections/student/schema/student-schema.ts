import type { Student } from "@/types";

export type StudentFormValues = Pick<
  Student,
  "studentIdNo" | "firstName" | "lastName" | "guardianName" | "guardianPhone"
> & {
  gender?: string;
  religion?: string;
  address?: string;
};

export function validateStudentForm(values: StudentFormValues): string | null {
  if (!values.studentIdNo?.trim()) return "Student ID is required";
  if (!values.firstName?.trim()) return "First name is required";
  if (!values.guardianPhone?.trim()) return "Guardian phone is required";
  return null;
}
