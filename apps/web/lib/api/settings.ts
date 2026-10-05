/**
 * @file lib/api/settings.ts
 * @description Settings helpers. Most settings endpoints are not on Django yet —
 * we persist preferences locally so Settings pages don't 404-spam the overlay.
 */

import { apiRequest } from "./client";
import { CONFIG } from "@/lib/config";

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

const USER_SETTINGS_KEY = "zerpa_user_settings_v1";

const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: {
    invoiceReminders: true,
    leadUpdates: true,
    systemAlerts: true,
    paymentReceived: true,
    newLeads: true,
  },
  twoFactorEnabled: false,
  sessionTimeout: 60,
};

function readLocalUserSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_USER_SETTINGS;
  try {
    const raw = localStorage.getItem(USER_SETTINGS_KEY);
    if (!raw) return DEFAULT_USER_SETTINGS;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

function writeLocalUserSettings(settings: UserSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
}

export async function getUserSettings(): Promise<UserSettings> {
  // Django has no /users/settings yet
  return readLocalUserSettings();
}

export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  const next: UserSettings = {
    ...readLocalUserSettings(),
    ...settings,
    notifications: {
      ...readLocalUserSettings().notifications,
      ...(settings.notifications || {}),
    },
  };
  writeLocalUserSettings(next);
  return next;
}

export async function getCompanySettings(
  companyId: string
): Promise<CompanySettings> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("zerpa_company");
      if (raw) {
        const c = JSON.parse(raw) as { id?: string; name?: string; slug?: string; vertical?: string };
        if (c.id === companyId) {
          return {
            id: c.id,
            name: c.name || "Company",
            slug: c.slug || "",
            vertical: c.vertical || "GENERIC",
            owner: "",
            createdAt: new Date().toISOString(),
          };
        }
      }
    } catch {
      /* fall through */
    }
  }
  return {
    id: companyId,
    name: "Company",
    slug: "",
    vertical: "GENERIC",
    owner: "",
    createdAt: new Date().toISOString(),
  };
}

export async function updateCompanySettings(
  companyId: string,
  settings: Partial<CompanySettings>
): Promise<CompanySettings> {
  const current = await getCompanySettings(companyId);
  return { ...current, ...settings, id: companyId };
}

export async function getTeamMembers(companyId: string): Promise<TeamMember[]> {
  // List is not implemented on Django (POST-only invite endpoint).
  void companyId;
  return [];
}

export async function addTeamMember(
  companyId: string,
  email: string,
  role: "ADMIN" | "STAFF" = "STAFF",
  fullName?: string,
  password?: string
): Promise<TeamMember> {
  const res = await apiRequest<{
    membership?: { id: string; role: string; user?: { email: string; fullName: string } };
  }>(`/companies/${companyId}/team-members`, {
    method: "POST",
    body: { email, role, fullName: fullName || email.split("@")[0], password },
  });
  return {
    id: res.membership?.id || `member-${Date.now()}`,
    email: res.membership?.user?.email || email,
    fullName: res.membership?.user?.fullName || fullName || email,
    role: (res.membership?.role as TeamMember["role"]) || role,
    joinedAt: new Date().toISOString(),
  };
}

export async function removeTeamMember(
  companyId: string,
  memberId: string
): Promise<void> {
  void companyId;
  void memberId;
  throw new Error("Removing team members is not available on this API yet");
}

export async function getIntegrations(
  companyId: string
): Promise<IntegrationConfig[]> {
  void companyId;
  return [];
}

export async function connectIntegration(
  companyId: string,
  integrationId: string,
  config: Record<string, any>
): Promise<IntegrationConfig> {
  void companyId;
  void config;
  throw new Error("Integrations are not available on this API yet");
}

export async function disconnectIntegration(
  companyId: string,
  integrationId: string
): Promise<void> {
  void companyId;
  void integrationId;
  throw new Error("Integrations are not available on this API yet");
}

export async function generateApiKey(
  companyId: string,
  name: string
): Promise<{ id: string; key: string; name: string; createdAt: string }> {
  void companyId;
  void name;
  throw new Error("API keys are not available on this API yet");
}

export async function listApiKeys(
  companyId: string
): Promise<Array<{ id: string; name: string; createdAt: string; lastUsed?: string }>> {
  void companyId;
  return [];
}

export async function revokeApiKey(
  companyId: string,
  keyId: string
): Promise<void> {
  void companyId;
  void keyId;
  throw new Error("API keys are not available on this API yet");
}

/** Kept for callers that branch on mock mode */
export function settingsApiLive(): boolean {
  return CONFIG.useMock;
}
