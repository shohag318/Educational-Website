import { API_ENDPOINTS } from "@/config-global";
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types";

export class SmsService {
  getDispatch(params?: Record<string, string | number | boolean | undefined | null>) {
    return apiClient.get<ApiResponse<unknown>>(API_ENDPOINTS.smsDispatch, params);
  }

  sendDispatch(payload: unknown) {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.smsDispatch, payload);
  }

  sendCustom(payload: unknown) {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.smsCustom, payload);
  }

  sendAttendance(payload: unknown) {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.smsAttendance, payload);
  }
}

export const smsService = new SmsService();
