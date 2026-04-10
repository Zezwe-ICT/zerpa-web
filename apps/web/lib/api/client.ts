import { CONFIG } from "@/lib/config";

const TOKEN_KEY = "zerpa_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = path.startsWith("/api") || path.startsWith("/health")
    ? `${CONFIG.apiUrl.replace("/api/v1", "")}${path}`
    : `${CONFIG.apiUrl}${path}`;

  const res = await fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    let details: unknown;
    try {
      const data = await res.json();
      errorMessage = data.error ?? errorMessage;
      details = data.details;
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, errorMessage, details);
  }

  return res.json() as Promise<T>;
}
