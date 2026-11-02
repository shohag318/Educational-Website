import type { AcademicClass, ClassSection, ClassSubjectMapping } from "@/types";

export type ClassFormValues = Pick<AcademicClass, "name" | "numericValue"> & {
  shift?: string;
};

export type SectionFormValues = Pick<ClassSection, "name" | "groupType"> & {
  capacity?: number;
};

export type ClassSubjectFormValues = Pick<ClassSubjectMapping, "classId" | "groupType" | "subjectId" | "subjectType">;

export function validateClassForm(values: ClassFormValues): string | null {
  if (!values.name?.trim()) return "Class name is required";
  if (!values.numericValue) return "Numeric class value is required";
  return null;
}
