"use client";

import { authService } from "@/api/services";
import { useAsyncResource } from "./use-async-resource";

export function usePortalInfo(code?: string) {
  return useAsyncResource(() => authService.getPortalInfo(code), [code]);
}
