import { apiRequest } from "./client";

export interface CompanyResponse {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
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

export function createCompany(name: string): Promise<CompanyResponse> {
  return apiRequest<CompanyResponse>("/companies", {
    method: "POST",
    body: { name },
  });
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
