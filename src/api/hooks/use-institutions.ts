"use client";

import { superAdminService } from "@/api/services";
import { useAsyncResource } from "./use-async-resource";

export function useInstitutions() {
  return useAsyncResource(() => superAdminService.getInstitutions(), []);
}
