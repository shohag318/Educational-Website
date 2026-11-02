import { getActiveTenantCode } from "@/utils/client-tenant";
import { toQueryString } from "@/utils/query";

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { success: false, error: text } as T;
  }
}

function buildHeaders(extra?: Record<string, string>) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (typeof window !== "undefined") {
    const tenantCode = getActiveTenantCode();
    if (tenantCode && !headers["x-institution-code"] && !headers["x-eiin"]) {
      headers["x-institution-code"] = tenantCode;
    }
  }

  return headers;
}

export class ApiClient {
  async get<T>(
    url: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: RequestOptions
  ): Promise<T> {
    const res = await fetch(`${url}${toQueryString(params)}`, {
      method: "GET",
      headers: buildHeaders(options?.headers),
      signal: options?.signal,
    });
    return parseJson<T>(res);
  }

  async post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(options?.headers),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options?.signal,
    });
    return parseJson<T>(res);
  }

  async put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const res = await fetch(url, {
      method: "PUT",
      headers: buildHeaders(options?.headers),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options?.signal,
    });
    return parseJson<T>(res);
  }

  async patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const res = await fetch(url, {
      method: "PATCH",
      headers: buildHeaders(options?.headers),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options?.signal,
    });
    return parseJson<T>(res);
  }

  async delete<T>(
    url: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: RequestOptions
  ): Promise<T> {
    const res = await fetch(`${url}${toQueryString(params)}`, {
      method: "DELETE",
      headers: buildHeaders(options?.headers),
      signal: options?.signal,
    });
    return parseJson<T>(res);
  }
}

export const apiClient = new ApiClient();
