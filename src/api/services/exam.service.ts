import { API_ENDPOINTS } from "@/config-global";
import { apiClient } from "@/api/client";
import type { ApiResponse, Exam, ExamSubjectConfig } from "@/types";

export class ExamService {
  getExams() {
    return apiClient.get<ApiResponse<Exam[]>>(API_ENDPOINTS.exams);
  }

  saveExam(payload: unknown) {
    return apiClient.post<ApiResponse<Exam>>(API_ENDPOINTS.exams, payload);
  }

  updateExam(payload: unknown) {
    return apiClient.put<ApiResponse<Exam>>(API_ENDPOINTS.exams, payload);
  }

  deleteExam(id: string) {
    return apiClient.delete<ApiResponse<unknown>>(API_ENDPOINTS.exams, { id });
  }

  getExamSubjects(examId: string) {
    return apiClient.get<ApiResponse<ExamSubjectConfig[]>>(API_ENDPOINTS.examSubjects, { examId });
  }

  saveExamSubject(payload: unknown) {
    return apiClient.post<ApiResponse<ExamSubjectConfig>>(API_ENDPOINTS.examSubjects, payload);
  }

  updateExamSubject(payload: unknown) {
    return apiClient.put<ApiResponse<ExamSubjectConfig>>(API_ENDPOINTS.examSubjects, payload);
  }

  deleteExamSubject(configId: string) {
    return apiClient.delete<ApiResponse<unknown>>(API_ENDPOINTS.examSubjects, { configId });
  }

  getRoutine() {
    return apiClient.get<ApiResponse<unknown>>(API_ENDPOINTS.examRoutine);
  }

  saveRoutine(payload: unknown) {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.examRoutine, payload);
  }
}

export const examService = new ExamService();
