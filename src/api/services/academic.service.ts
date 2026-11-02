import { API_ENDPOINTS } from "@/config-global";
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types";
import type { AcademicYear, CombinedSubjectRule, GradingSystem, AssessmentTemplate } from "@/types";

export class AcademicService {
  getYears(activeOnly?: boolean) {
    return apiClient.get<ApiResponse<AcademicYear[]>>(API_ENDPOINTS.academicYears, {
      activeOnly: activeOnly ? "true" : undefined,
    });
  }

  createYear(payload: unknown) {
    return apiClient.post<ApiResponse<AcademicYear>>(API_ENDPOINTS.academicYears, payload);
  }

  updateYear(payload: unknown) {
    return apiClient.put<ApiResponse<AcademicYear>>(API_ENDPOINTS.academicYears, payload);
  }

  deleteYear(id: string, permanent?: boolean) {
    return apiClient.delete<ApiResponse<unknown>>(API_ENDPOINTS.academicYears, {
      id,
      permanent: permanent ? "true" : undefined,
    });
  }

  getGrading() {
    return apiClient.get<ApiResponse<GradingSystem[]>>(API_ENDPOINTS.rulesGrading);
  }

  saveGrading(payload: unknown) {
    return apiClient.post<ApiResponse<GradingSystem>>(API_ENDPOINTS.rulesGrading, payload);
  }

  getCombinedRules(examId?: string) {
    return apiClient.get<ApiResponse<CombinedSubjectRule[]>>(API_ENDPOINTS.rulesCombined, { examId });
  }

  saveCombinedRule(payload: unknown) {
    return apiClient.post<ApiResponse<CombinedSubjectRule>>(API_ENDPOINTS.rulesCombined, payload);
  }

  deleteCombinedRule(id: string) {
    return apiClient.delete<ApiResponse<unknown>>(API_ENDPOINTS.rulesCombined, { id });
  }

  getTemplates() {
    return apiClient.get<ApiResponse<AssessmentTemplate[]>>(API_ENDPOINTS.rulesTemplates);
  }

  saveTemplate(payload: unknown) {
    return apiClient.post<ApiResponse<AssessmentTemplate>>(API_ENDPOINTS.rulesTemplates, payload);
  }

  deleteTemplate(id: string) {
    return apiClient.delete<ApiResponse<unknown>>(API_ENDPOINTS.rulesTemplates, { id });
  }

  applyTemplate(payload: unknown) {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.rulesTemplatesApply, payload);
  }
}

export const academicService = new AcademicService();
