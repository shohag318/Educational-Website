"use client";

import { marksService } from "@/api/services";
import { useAsyncResource } from "./use-async-resource";

export function useMarks(params?: Record<string, string | number | boolean | undefined | null>) {
  return useAsyncResource(() => marksService.getMarks(params), [JSON.stringify(params || {})]);
}
