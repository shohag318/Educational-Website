import { API_ENDPOINTS } from "@/config-global";
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types";

export class MarksService {
  getMarks(params?: Record<string, string | number | boolean | undefined | null>) {
    return apiClient.get<ApiResponse<unknown>>(API_ENDPOINTS.marks, params);
  }

  saveMarks(payload: unknown) {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.marks, payload);
  }

  processResult(payload: unknown) {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.processResult, payload);
  }
}

export const marksService = new MarksService();
