"use client";

export const AUTH_SESSION_KEY = "smart_academy_session";
export const AUTH_SESSION_EVENT = "smart_academy_session_changed";

export interface AuthSession {
  role: "SUPER_ADMIN" | "INSTITUTION_ADMIN";
  adminId: string;
  institutionCode: string;
  institutionName: string;
  isInstitutionLogin: boolean;
  loginAt: string;
  accessibleModules?: string[];
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EVENT, { detail: session }));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EVENT, { detail: null }));
}

export function isInstitutionLoggedIn(): boolean {
  const session = getAuthSession();
  return Boolean(session?.isInstitutionLogin || session?.role === "INSTITUTION_ADMIN");
}
