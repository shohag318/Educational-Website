import { API_ENDPOINTS } from "@/config-global";
import { apiClient } from "@/api/client";
import type { ApiResponse, Institution } from "@/types";

export class AuthService {
  getPortalInfo(code?: string) {
    return apiClient.get<ApiResponse<Institution> & { institution?: Institution; list?: Institution[] }>(
      API_ENDPOINTS.authPortalInfo,
      { code }
    );
  }

  portalLogin(payload: { institutionCode: string; adminId: string; password: string }) {
    return apiClient.post<ApiResponse<unknown>>(API_ENDPOINTS.authPortalLogin, payload);
  }
}

export const authService = new AuthService();
