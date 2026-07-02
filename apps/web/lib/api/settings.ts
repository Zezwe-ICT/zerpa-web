/**
 * @file lib/api/settings.ts
 * @description Settings API client functions
 */

import { apiRequest } from "./client";

export interface UserSettings {
  notifications: {
    invoiceReminders: boolean;
    leadUpdates: boolean;
    systemAlerts: boolean;
    paymentReceived: boolean;
    newLeads: boolean;
  };
  twoFactorEnabled: boolean;
  sessionTimeout: number;
}

export interface CompanySettings {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  owner: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  joinedAt: string;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  config?: Record<string, any>;
}

/**
 * Get current user's notification settings
 */
export async function getUserSettings(): Promise<UserSettings> {
  return apiRequest<UserSettings>("/users/settings");
}

/**
 * Update user notification settings
 */
export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  return apiRequest<UserSettings>("/users/settings", {
    method: "PATCH",
    body: settings,
  });
}

/**
 * Get company settings
 */
export async function getCompanySettings(
  companyId: string
): Promise<CompanySettings> {
  return apiRequest<CompanySettings>(`/companies/${companyId}/settings`);
}

/**
 * Update company settings
 */
export async function updateCompanySettings(
  companyId: string,
  settings: Partial<CompanySettings>
): Promise<CompanySettings> {
  return apiRequest<CompanySettings>(`/companies/${companyId}/settings`, {
    method: "PATCH",
    body: settings,
  });
}

/**
 * Get team members for a company
 */
export async function getTeamMembers(companyId: string): Promise<TeamMember[]> {
  return apiRequest<TeamMember[]>(`/companies/${companyId}/team-members`);
}

/**
 * Add team member to company
 */
export async function addTeamMember(
  companyId: string,
  email: string,
  role: "ADMIN" | "STAFF" = "STAFF"
): Promise<TeamMember> {
  return apiRequest<TeamMember>(`/companies/${companyId}/team-members`, {
    method: "POST",
    body: { email, role },
  });
}

/**
 * Remove team member from company
 */
export async function removeTeamMember(
  companyId: string,
  memberId: string
): Promise<void> {
  return apiRequest<void>(`/companies/${companyId}/team-members/${memberId}`, {
    method: "DELETE",
  });
}

/**
 * Get integrations for a company
 */
export async function getIntegrations(
  companyId: string
): Promise<IntegrationConfig[]> {
  return apiRequest<IntegrationConfig[]>(`/companies/${companyId}/integrations`);
}

/**
 * Connect an integration
 */
export async function connectIntegration(
  companyId: string,
  integrationId: string,
  config: Record<string, any>
): Promise<IntegrationConfig> {
  return apiRequest<IntegrationConfig>(
    `/companies/${companyId}/integrations/${integrationId}`,
    {
      method: "POST",
      body: config,
    }
  );
}

/**
 * Disconnect an integration
 */
export async function disconnectIntegration(
  companyId: string,
  integrationId: string
): Promise<void> {
  return apiRequest<void>(
    `/companies/${companyId}/integrations/${integrationId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Generate API key
 */
export async function generateApiKey(
  companyId: string,
  name: string
): Promise<{ id: string; key: string; name: string; createdAt: string }> {
  return apiRequest(
    `/companies/${companyId}/api-keys`,
    {
      method: "POST",
      body: { name },
    }
  );
}

/**
 * List API keys
 */
export async function listApiKeys(
  companyId: string
): Promise<Array<{ id: string; name: string; createdAt: string; lastUsed?: string }>> {
  return apiRequest(
    `/companies/${companyId}/api-keys`
  );
}

/**
 * Revoke API key
 */
export async function revokeApiKey(
  companyId: string,
  keyId: string
): Promise<void> {
  return apiRequest(
    `/companies/${companyId}/api-keys/${keyId}`,
    { method: "DELETE" }
  );
}
