// src/lib/clientTenant.ts
// Central Client-side Tenant Context & Dynamic LocalStorage Isolation

"use client";

import { getAuthSession } from "./authSession";
import { getStoredSchoolInfo } from "./settingsStore";

export const TENANT_SWITCH_EVENT = "smart_academy_tenant_switched";

/**
 * Returns the currently active institution's EIIN / Code on the client side.
 */
export function getActiveTenantCode(): string {
  if (typeof window === "undefined") return "108254";
  try {
    const session = getAuthSession();
    if (session?.institutionCode && session.institutionCode.trim()) {
      return session.institutionCode.trim();
    }
    const schoolInfo = getStoredSchoolInfo();
    if (schoolInfo?.eiin && schoolInfo.eiin.trim()) {
      return schoolInfo.eiin.trim();
    }
  } catch {
    // fallback
  }
  return "108254";
}

/**
 * Generates an isolated LocalStorage key strictly partitioned by Institution Code.
 * E.g., `getScopedStorageKey("nctb_accountant_income")` -> `"nctb_accountant_income_108299"`
 */
export function getScopedStorageKey(baseKey: string, overrideCode?: string): string {
  const code = overrideCode || getActiveTenantCode();
  return `${baseKey}_${code}`;
}

/**
 * Dispatches event notifying all active tabs & views that the active institution has changed.
 */
export function notifyTenantSwitched(newCode: string, newName?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TENANT_SWITCH_EVENT, {
      detail: { code: newCode, name: newName },
    })
  );
}
