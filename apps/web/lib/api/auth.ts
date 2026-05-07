import { apiRequest } from "./client";

export interface AuthCompany {
  id: string;
  name: string;
  vertical?: string;
  slug?: string;
  ownerUserId?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  company?: AuthCompany;
  companies?: AuthCompany[];
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
  console.log("[AUTH] Register attempt:", { email: payload.email, fullName: payload.fullName });
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  }).catch((err) => {
    console.error("[AUTH] Register failed:", err);
    throw err;
  });
}

export function getCompanies(): Promise<{ companies: AuthCompany[] }> {
  console.log("[AUTH] Fetching user companies");
  return apiRequest<{ companies: AuthCompany[] }>("/companies", {
    method: "GET",
  }).catch((err) => {
    console.error("[AUTH] Get companies failed:", err);
    throw err;
  });
}

export interface CreateCompanyPayload {
  name: string;
  vertical?: string;
  phone?: string;
  description?: string;
  details?: Record<string, any>;
}

export function createCompany(payload: CreateCompanyPayload): Promise<AuthCompany> {
  console.log("[AUTH] Creating company:", { name: payload.name });
  return apiRequest<AuthCompany>("/companies", {
    method: "POST",
    body: payload,
  }).catch((err) => {
    console.error("[AUTH] Create company failed:", err);
    throw err;
  });
}
