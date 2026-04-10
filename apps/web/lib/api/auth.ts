import { apiRequest } from "./client";

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/sign-in", {
    method: "POST",
    body: payload,
  });
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}
