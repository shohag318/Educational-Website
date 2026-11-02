import type { AcademicYear } from "@/types";

export type SessionFormValues = Pick<AcademicYear, "yearName" | "isCurrent"> & {
  startDate?: string;
  endDate?: string;
  copyFromYearId?: string;
};

export function validateSessionForm(values: SessionFormValues): string | null {
  if (!values.yearName?.trim()) return "Session year is required";
  return null;
}
