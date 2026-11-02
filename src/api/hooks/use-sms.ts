"use client";

import { smsService } from "@/api/services";
import { useAsyncResource } from "./use-async-resource";

export function useSmsDispatch(params?: Record<string, string | number | boolean | undefined | null>) {
  return useAsyncResource(() => smsService.getDispatch(params), [JSON.stringify(params || {})]);
}
