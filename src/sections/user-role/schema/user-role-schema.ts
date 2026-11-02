export interface UserAccountValues {
  name: string;
  username: string;
  roleId: string;
}

export function validateUserAccount(values: UserAccountValues): string | null {
  if (!values.name?.trim()) return "Name is required";
  if (!values.username?.trim()) return "Username is required";
  if (!values.roleId) return "Role is required";
  return null;
}
