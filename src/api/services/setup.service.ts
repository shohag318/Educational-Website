import { API_ENDPOINTS } from "@/config-global";
import { apiClient } from "@/api/client";
import type { ApiResponse, AcademicClass, Subject, ClassSubjectMapping } from "@/types";

export class SetupService {
  getClasses() {
    return apiClient.get<ApiResponse<AcademicClass[]>>(API_ENDPOINTS.classes);
  }

  saveClass(payload: unknown) {
    return apiClient.post<ApiResponse<AcademicClass>>(API_ENDPOINTS.classes, payload);
  }

  updateClass(payload: unknown) {
    return apiClient.put<ApiResponse<AcademicClass>>(API_ENDPOINTS.classes, payload);
  }

  patchClass(payload: unknown) {
    return apiClient.patch<ApiResponse<AcademicClass>>(API_ENDPOINTS.classes, payload);
  }

  deleteClass(id: string) {
    return apiClient.delete<ApiResponse<unknown>>(API_ENDPOINTS.classes, { id });
  }

  deleteSection(sectionId: string) {
    return apiClient.delete<ApiResponse<unknown>>(API_ENDPOINTS.classes, { sectionId });
  }

  getSubjects(classId?: string) {
    return apiClient.get<ApiResponse<Subject[]>>(API_ENDPOINTS.subjects, { classId });
  }

  getClassSubjects(classId?: string, groupType?: string) {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.classSubjects, { classId, groupType });
  }

  saveClassSubjects(payload: unknown) {
    return apiClient.post<ApiResponse<ClassSubjectMapping>>(API_ENDPOINTS.classSubjects, payload);
  }
}

export const setupService = new SetupService();
