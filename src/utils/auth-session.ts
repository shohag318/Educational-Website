"use client";

export {
  AUTH_SESSION_KEY,
  AUTH_SESSION_EVENT,
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  isInstitutionLoggedIn,
} from "@/lib/authSession";

export type { AuthSession } from "@/lib/authSession";
