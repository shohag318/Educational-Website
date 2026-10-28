// src/components/TenantInterceptor.tsx
// Global Client-Side HTTP Interceptor that attaches the Active Institution's Tenant Code
// to all internal `/api/` fetch requests.

"use client";

import { useEffect } from "react";
import { getActiveTenantCode } from "@/lib/clientTenant";

export function TenantInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Save reference to native fetch
    const originalFetch = window.fetch;

    // Wrap window.fetch once
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      try {
        let urlStr = "";
        if (typeof input === "string") {
          urlStr = input;
        } else if (input instanceof URL) {
          urlStr = input.toString();
        } else if (input && typeof input === "object" && "url" in input) {
          urlStr = (input as Request).url;
        }

        // Only intercept internal API routes
        if (
          urlStr.startsWith("/api/") ||
          urlStr.startsWith(window.location.origin + "/api/")
        ) {
          const tenantCode = getActiveTenantCode();

          const headers = new Headers(init?.headers || {});
          if (!headers.has("x-institution-code") && !headers.has("x-eiin")) {
            headers.set("x-institution-code", tenantCode);
          }

          const newInit: RequestInit = {
            ...init,
            headers,
          };

          return originalFetch.call(this, input, newInit);
        }
      } catch (err) {
        // Fallback to original fetch if anything fails
      }

      return originalFetch.call(this, input, init);
    };

    return () => {
      // Restore on unmount if ever unmounted
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
