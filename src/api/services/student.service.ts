import { API_ENDPOINTS } from "@/config-global";
import { apiClient } from "@/api/client";
import type { ApiResponse, Student } from "@/types";

export class StudentService {
  getStudents(params?: Record<string, string | number | boolean | undefined | null>) {
    return apiClient.get<ApiResponse<Student[]>>(API_ENDPOINTS.students, params);
  }

  saveStudent(payload: unknown) {
    return apiClient.post<ApiResponse<Student>>(API_ENDPOINTS.students, payload);
  }

  updateStudent(payload: unknown) {
    return apiClient.put<ApiResponse<Student>>(API_ENDPOINTS.students, payload);
  }

  deleteStudent(id: string) {
    return apiClient.delete<ApiResponse<unknown>>(API_ENDPOINTS.students, { id });
  }

  bulkImport(payload: unknown) {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.studentsBulk, payload);
  }

  promote(payload: unknown) {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.studentsPromote, payload);
  }
}

export const studentService = new StudentService();
