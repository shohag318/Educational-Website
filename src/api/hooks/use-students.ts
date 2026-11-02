"use client";

import { studentService } from "@/api/services";
import { useAsyncResource } from "./use-async-resource";

export function useStudents(params?: Record<string, string | number | boolean | undefined | null>) {
  return useAsyncResource(() => studentService.getStudents(params), [JSON.stringify(params || {})]);
}
