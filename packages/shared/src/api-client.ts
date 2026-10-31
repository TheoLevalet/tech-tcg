import { z } from "zod";
import { healthResponseSchema, type HealthResponse } from "./health.ts";
import { userProfileSchema, type UserProfile } from "./profile.ts";

const errorBodySchema = z.object({ error: z.string() });

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(`API ${status} : ${code}`);
    this.name = "ApiError";
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getIdToken: () => Promise<string | null>;
  fetch?: typeof fetch;
}

export interface ApiClient {
  health(): Promise<HealthResponse>;
  getMe(): Promise<UserProfile | null>;
  updateMe(pseudo: string): Promise<UserProfile>;
}

export function createApiClient({
  baseUrl,
  getIdToken,
  fetch = (input, init) => globalThis.fetch(input, init),
}: ApiClientOptions): ApiClient {
  async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    const token = await getIdToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    const body: unknown = await response.json().catch(() => undefined);

    if (!response.ok) {
      const parsed = errorBodySchema.safeParse(body);
      throw new ApiError(response.status, parsed.success ? parsed.data.error : "unknown");
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError(response.status, "invalid_response");
    return parsed.data;
  }

  return {
    health: () => request("/health", healthResponseSchema),

    async getMe() {
      try {
        return await request("/me", userProfileSchema);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },

    updateMe: (pseudo) =>
      request("/me", userProfileSchema, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo }),
      }),
  };
}
