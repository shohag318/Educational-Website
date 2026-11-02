import { API_ENDPOINTS } from "@/config-global";
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types";

export class ReportsService {
  getTabulation(params?: Record<string, string | number | boolean | undefined | null>) {
    return apiClient.get<ApiResponse<unknown>>(API_ENDPOINTS.reportsTabulation, params);
  }

  getAtAGlance(params?: Record<string, string | number | boolean | undefined | null>) {
    return apiClient.get<ApiResponse<unknown>>(API_ENDPOINTS.reportsAtAGlance, params);
  }

  getFailList(params?: Record<string, string | number | boolean | undefined | null>) {
    return apiClient.get<ApiResponse<unknown>>(API_ENDPOINTS.reportsFailList, params);
  }

  getMarksheet(enrollmentId: string) {
    return apiClient.get<ApiResponse<unknown>>(API_ENDPOINTS.reportsMarksheet(enrollmentId));
  }

  getMarksheetBulk(params?: Record<string, string | number | boolean | undefined | null>) {
    return apiClient.get<ApiResponse<unknown>>(API_ENDPOINTS.reportsMarksheetBulk, params);
  }

  seedDalta() {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.seedDalta);
  }
}

export const reportsService = new ReportsService();
