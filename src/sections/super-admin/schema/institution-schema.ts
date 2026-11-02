import type { Institution } from "@/types";

export type InstitutionFormValues = Pick<Institution, "code" | "name" | "status"> & {
  adminId?: string;
  adminPassword?: string;
  nameBn?: string;
};

export function validateInstitution(values: InstitutionFormValues): string | null {
  if (!values.code?.trim()) return "EIIN / code is required";
  if (!values.name?.trim()) return "Institution name is required";
  return null;
}
