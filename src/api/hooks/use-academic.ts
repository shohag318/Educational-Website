"use client";

import { academicService } from "@/api/services";
import { useAsyncResource } from "./use-async-resource";

export function useAcademicYears(activeOnly = true) {
  return useAsyncResource(() => academicService.getYears(activeOnly), [activeOnly]);
}

export function useGradingSystems() {
  return useAsyncResource(() => academicService.getGrading(), []);
}

export function useCombinedRules(examId?: string) {
  return useAsyncResource(() => academicService.getCombinedRules(examId), [examId]);
}

export function useAssessmentTemplates() {
  return useAsyncResource(() => academicService.getTemplates(), []);
}
