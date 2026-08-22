import { API_BASE_URL } from "../config";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface ApiClientOptions {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
}

export function createApiClient(options: ApiClientOptions) {
  async function request<T>(
    path: string,
    init?: RequestInit & { auth?: boolean }
  ): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");

    if (init?.auth !== false) {
      const token = options.getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });

    if (response.status === 401) {
      options.onUnauthorized();
      throw new ApiError(401, "Unauthorized");
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new ApiError(response.status, text || response.statusText);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    get: <T>(path: string) => request<T>(path, { method: "GET" }),
    post: <T>(path: string, body?: unknown, opts?: { auth?: boolean }) =>
      request<T>(path, {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
        auth: opts?.auth,
      }),
    patch: <T>(path: string, body?: unknown, opts?: { auth?: boolean }) =>
      request<T>(path, {
        method: "PATCH",
        body: body !== undefined ? JSON.stringify(body) : undefined,
        auth: opts?.auth,
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
