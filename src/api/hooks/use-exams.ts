"use client";

import { examService } from "@/api/services";
import { useAsyncResource } from "./use-async-resource";

export function useExams() {
  return useAsyncResource(() => examService.getExams(), []);
}

export function useExamSubjects(examId?: string) {
  return useAsyncResource(
    () => (examId ? examService.getExamSubjects(examId) : Promise.resolve({ success: true, data: [] })),
    [examId]
  );
}

export function useExamRoutine() {
  return useAsyncResource(() => examService.getRoutine(), []);
}
