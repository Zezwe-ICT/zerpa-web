/**
 * Company profile and team invites used by onboarding and settings.
 */
import { apiRequest } from "./client";

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export const COMPANY_SIZES = ["Just me", "2-10", "11-25", "26-100", "101-250", "250+"] as const;

export interface CompanyAddress {
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  industryLabel: string;
  legalName: string;
  registrationNumber: string;
  vatRegistered: boolean;
  vatNumber: string;
  email: string;
  phone: string;
  website: string;
  companySize: string;
  address: CompanyAddress;
  missing: string[];
  options?: { provinces: string[]; companySizes: string[] };
}

export interface TeamInvite {
  id: string;
  email: string;
  fullName: string;
  role: string;
  roleLabel: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
  createdAt: string;
  inviteUrl?: string;
}

export interface PublicInvite extends TeamInvite {
  companyName: string;
  invitedBy: string;
  accountExists: boolean;
}

const hdr = (companyId?: string) => (companyId ? { "X-Company-Id": companyId } : undefined);

export const getCompanyProfile = (companyId: string) =>
  apiRequest<CompanyProfile>(`/companies/${companyId}/profile`, { headers: hdr(companyId) });

export const updateCompanyProfile = (companyId: string, body: Partial<CompanyProfile> & { address?: Partial<CompanyAddress> }) =>
  apiRequest<CompanyProfile>(`/companies/${companyId}/profile`, {
    method: "PATCH",
    body,
    headers: hdr(companyId),
  });

export const listInvites = (companyId: string) =>
  apiRequest<TeamInvite[]>(`/companies/${companyId}/invites`, { headers: hdr(companyId) });

export const createInvite = (
  companyId: string,
  body: { email: string; fullName?: string; role: string },
) =>
  apiRequest<TeamInvite>(`/companies/${companyId}/invites`, {
    method: "POST",
    body,
    headers: hdr(companyId),
  });

export const revokeInvite = (companyId: string, inviteId: string) =>
  apiRequest<void>(`/companies/${companyId}/invites/${inviteId}`, {
    method: "DELETE",
    headers: hdr(companyId),
  });

export const getPublicInvite = (token: string) =>
  apiRequest<PublicInvite>(`/invites/${encodeURIComponent(token)}`);

export const acceptInvite = (
  token: string,
  body: { password: string; fullName?: string; phone?: string; acceptTerms?: true },
) =>
  apiRequest<{
    token: string;
    refreshToken?: string;
    user: { id: string; email: string; fullName: string };
    companies: Array<{ id: string; name: string; slug: string; vertical?: string; role: string; ownerUserId: string }>;
    company?: { id: string; name: string; slug: string; vertical?: string; role: string; ownerUserId: string };
  }>(`/invites/${encodeURIComponent(token)}/accept`, { method: "POST", body });
