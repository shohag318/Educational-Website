import type { CombinedSubjectRule, GradingSystem, AssessmentTemplate } from "@/types";

export type GradingFormValues = Pick<
  GradingSystem,
  "name" | "maxGpa" | "fourthSubjectThreshold" | "passGpa" | "isDefault"
>;

export type CombinedRuleFormValues = Pick<
  CombinedSubjectRule,
  "name" | "primarySubjectId" | "secondarySubjectId" | "combinedPassMark" | "combinedFullMarks" | "passMode" | "gradeMode"
>;

export type TemplateFormValues = Pick<AssessmentTemplate, "name" | "classId" | "description">;

export function validateCombinedRule(values: CombinedRuleFormValues): string | null {
  if (!values.primarySubjectId || !values.secondarySubjectId) return "Select both subjects";
  if (values.primarySubjectId === values.secondarySubjectId) return "Subjects must be different";
  if (values.combinedFullMarks <= 0) return "Full marks must be greater than 0";
  return null;
}
