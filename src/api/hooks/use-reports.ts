"use client";

import { reportsService } from "@/api/services";
import { useAsyncResource } from "./use-async-resource";

export function useTabulation(params?: Record<string, string | number | boolean | undefined | null>) {
  return useAsyncResource(() => reportsService.getTabulation(params), [JSON.stringify(params || {})]);
}

export function useAtAGlance(params?: Record<string, string | number | boolean | undefined | null>) {
  return useAsyncResource(() => reportsService.getAtAGlance(params), [JSON.stringify(params || {})]);
}

export function useFailList(params?: Record<string, string | number | boolean | undefined | null>) {
  return useAsyncResource(() => reportsService.getFailList(params), [JSON.stringify(params || {})]);
}
