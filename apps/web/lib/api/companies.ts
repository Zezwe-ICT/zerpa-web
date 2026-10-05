import { apiRequest } from "./client";

export interface CompanyResponse {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  vertical?: string;
  size?: string;
  phone?: string;
}

export interface CreateCompanyPayload {
  name: string;
  vertical?: string;
  phone?: string;
  description?: string;
  details?: Record<string, any>;
  /** App keys chosen during onboarding; the API adds dependencies. Omit for the industry's recommended set. */
  apps?: string[];
}

export interface TeamMemberPayload {
  email: string;
  fullName: string;
  password?: string;
  role: "ADMIN" | "STAFF";
}

export interface TeamMemberResponse {
  createdUser: boolean;
  membership: {
    id: string;
    role: string;
    user: {
      id: string;
      email: string;
      fullName: string;
    };
  };
}

export interface HealthResponse {
  status: "ok" | "degraded";
  ts: number;
  database: {
    available: boolean;
    tableCount: number | null;
  };
}

export async function createCompany(payload: CreateCompanyPayload): Promise<CompanyResponse> {
  // credit the partner whose signup link brought them here, and claim the offer from the link if it is still open
  // (see components/referral-capture.tsx)
  const { takeReferral, clearReferral, takeOffer, clearOffer } = await import("@/components/referral-capture");
  const ref = takeReferral();
  const offer = takeOffer();
  const company = await apiRequest<CompanyResponse>("/companies", {
    method: "POST",
    body: { ...payload, ...(ref ? { ref } : {}), ...(offer ? { offer } : {}) },
  });
  if (ref) clearReferral();
  if (offer) clearOffer();
  return company;
}

export function addTeamMember(
  companyId: string,
  payload: TeamMemberPayload,
): Promise<TeamMemberResponse> {
  return apiRequest<TeamMemberResponse>(
    `/companies/${companyId}/team-members`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/health");
}
