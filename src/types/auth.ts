import type { ModuleKey } from "./common";

export type AuthRole = "SUPER_ADMIN" | "INSTITUTION_ADMIN";

export interface AuthSession {
  role: AuthRole;
  adminId: string;
  institutionCode: string;
  institutionName: string;
  isInstitutionLogin: boolean;
  loginAt: string;
  accessibleModules?: string[] | ModuleKey[];
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  nameBn?: string | null;
  address?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  adminId?: string | null;
  status: string;
  slug?: string | null;
  notes?: string | null;
  smsSenderId?: string | null;
}

export interface PortalInfo {
  institution?: Institution;
  list?: Institution[];
}
