import { API_ENDPOINTS } from "@/config-global";
import { apiClient } from "@/api/client";
import type { ApiResponse, Institution } from "@/types";

export class SuperAdminService {
  getInstitutions() {
    return apiClient.get<ApiResponse<Institution[]>>(API_ENDPOINTS.institutions);
  }

  createInstitution(payload: unknown) {
    return apiClient.post<ApiResponse<Institution>>(API_ENDPOINTS.institutions, payload);
  }

  updateInstitution(id: string, payload: unknown) {
    return apiClient.put<ApiResponse<Institution>>(API_ENDPOINTS.institution(id), payload);
  }

  patchInstitution(id: string, payload: unknown) {
    return apiClient.patch<ApiResponse<Institution>>(API_ENDPOINTS.institution(id), payload);
  }

  deleteInstitution(id: string) {
    return apiClient.delete<ApiResponse<unknown>>(API_ENDPOINTS.institution(id));
  }
}

export const superAdminService = new SuperAdminService();
