export interface InstitutionProfileValues {
  name: string;
  eiin: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function validateInstitutionProfile(values: InstitutionProfileValues): string | null {
  if (!values.name?.trim()) return "Institution name is required";
  if (!values.eiin?.trim()) return "EIIN is required";
  return null;
}
