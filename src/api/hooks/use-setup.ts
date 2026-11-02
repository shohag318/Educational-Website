"use client";

import { setupService } from "@/api/services";
import { useAsyncResource } from "./use-async-resource";

export function useClasses() {
  return useAsyncResource(() => setupService.getClasses(), []);
}

export function useSubjects(classId?: string) {
  return useAsyncResource(() => setupService.getSubjects(classId), [classId]);
}

export function useClassSubjects(classId?: string) {
  return useAsyncResource(() => setupService.getClassSubjects(classId), [classId]);
}
