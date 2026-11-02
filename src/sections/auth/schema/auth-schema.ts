export interface PortalLoginValues {
  institutionCode: string;
  adminId: string;
  password: string;
}

export function validatePortalLogin(values: PortalLoginValues): string | null {
  if (!values.institutionCode?.trim()) return "Institution code is required";
  if (!values.adminId?.trim()) return "Admin ID is required";
  if (!values.password?.trim()) return "Password is required";
  return null;
}
