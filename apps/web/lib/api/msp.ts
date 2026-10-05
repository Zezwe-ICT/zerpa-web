import { apiRequest } from "@/lib/api/client";
import type { MspTicket, MspAgreement, MspAsset, MspTimeEntry } from "@zerpa/shared-types";

export function listTickets(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<MspTicket[]>(`/msp/tickets${q}`);
}

export function getTicket(id: string) {
  return apiRequest<
    MspTicket & {
      timeEntries?: MspTimeEntry[];
      parent?: { id: string; number: string; subject: string; type: string; status: string };
      children?: Array<{ id: string; number: string; subject: string; type: string; status: string }>;
      thread?: Array<{ id: string; kind: string; body: string; authorName: string | null; at: string; documentName?: string | null }>;
    }
  >(`/msp/tickets/${id}`);
}

export function addTicketReply(id: string, body: string, documentId?: string) {
  return apiRequest(`/timeline`, {
    method: "POST",
    body: { recordType: "ticket", recordId: id, kind: "reply", body, documentId },
  });
}

export function updateAsset(id: string, body: { warrantyEnds?: string | null; status?: string; siteId?: string | null }) {
  return apiRequest<MspAsset & { history?: Array<{ id: string; field: string; before: string; after: string; at: string }> }>(
    `/msp/assets/${id}`,
    { method: "PATCH", body },
  );
}

export function createTicket(payload: {
  accountId: string;
  subject: string;
  description?: string;
  priority?: string;
  type?: string;
  agreementId?: string;
  assetId?: string;
  source?: string;
  runbookUrl?: string;
  parentTicketId?: string;
}) {
  return apiRequest<MspTicket>("/msp/tickets", { method: "POST", body: payload });
}

export function updateTicket(
  id: string,
  payload: Partial<{
    runbookUrl: string;
    subject: string;
    description: string;
    type: string;
    parentTicketId: string | null;
  }>,
) {
  return apiRequest<MspTicket>(`/msp/tickets/${id}`, { method: "PATCH", body: payload });
}

export function transitionTicket(id: string, to: string) {
  return apiRequest<MspTicket>(`/msp/tickets/${id}/transition`, {
    method: "POST",
    body: { to },
  });
}

export function logTime(id: string, payload: { minutes: number; billable?: boolean; note?: string }) {
  return apiRequest<MspTimeEntry>(`/msp/tickets/${id}/time`, { method: "POST", body: payload });
}

export function listAgreements() {
  return apiRequest<MspAgreement[]>("/msp/agreements");
}

export function getAgreement(id: string) {
  return apiRequest<
    MspAgreement & {
      accountName?: string;
      hoursBurn?: {
        billableMinutes: number;
        includedMinutes: number;
        overageEstimate: number;
        includedHours: number;
        overageRate: number;
      };
      openTickets?: number;
      onboardings?: Array<{ id: string; number: string; status: string }>;
      invoices?: Array<{ id: string; invoiceNumber: string; total: number; status: string }>;
    }
  >(`/msp/agreements/${id}`);
}

export function createAgreement(payload: {
  accountId: string;
  name: string;
  slaResponseMinutes?: number;
  slaResolveMinutes?: number;
  monthlyFee?: number;
  includedHours?: number;
  overageRate?: number;
  billingCadence?: string;
  amendmentNotes?: string;
}) {
  return apiRequest<MspAgreement>("/msp/agreements", { method: "POST", body: payload });
}

export function updateAgreement(id: string, payload: Partial<{
  name: string;
  status: string;
  monthlyFee: number;
  slaResponseMinutes: number;
  slaResolveMinutes: number;
  includedHours: number;
  overageRate: number;
  billingCadence: string;
  amendmentNotes: string;
  slaProfiles: Record<string, { responseMinutes: number; resolveMinutes: number }>;
}>) {
  return apiRequest<MspAgreement>(`/msp/agreements/${id}`, { method: "PATCH", body: payload });
}

export function listAssets() {
  return apiRequest<MspAsset[]>("/msp/assets");
}

export function createAsset(payload: {
  accountId: string;
  name: string;
  assetType?: string;
  serialNumber?: string;
}) {
  return apiRequest<MspAsset>("/msp/assets", { method: "POST", body: payload });
}

export function listTimeEntries() {
  return apiRequest<Array<MspTimeEntry & { ticketNumber?: string }>>("/msp/time");
}

export function generateRecurringInvoices(agreementId?: string) {
  return apiRequest<{ created: Array<{ id: string; invoiceNumber: string; total: number }> }>(
    "/msp/billing/recurring",
    { method: "POST", body: agreementId ? { agreementId } : {} },
  );
}

export type MspDeskMode = "bridge" | "lite";

export type MspPackSettings = {
  deskMode: MspDeskMode;
  existingPsa: string;
  existingRmm: string;
  accountingSystem: string;
  rmmWebhookSecret?: string;
  emailIntakeEnabled?: boolean;
  emailIntakeSecret?: string;
  partnerCentreUrl?: string;
  notes: string;
};

export type ClientOnboarding = {
  id: string;
  number: string;
  kind?: "onboarding" | "offboarding" | "project";
  accountId: string;
  accountName?: string | null;
  agreementId?: string | null;
  status: string;
  ownerName: string;
  targetGoLive?: string | null;
  checklist: Array<{ id: string; label: string; done: boolean; runbookUrl?: string; documentId?: string; documentName?: string }>;
  progress: number;
  blockers: string[];
  discovery?: Record<string, string>;
  popiaRetentionFlag?: boolean;
  projectTemplate?: string;
  notes: string;
};

export type ExternalWorkRef = {
  id: string;
  system: string;
  externalId: string;
  externalUrl?: string;
  subject?: string;
  status?: string;
  accountId?: string | null;
  lastSyncedAt?: string | null;
};

export function getMspSettings() {
  return apiRequest<MspPackSettings>("/msp/settings");
}

export function updateMspSettings(payload: Partial<MspPackSettings>) {
  return apiRequest<MspPackSettings>("/msp/settings", { method: "PATCH", body: payload });
}

export function listClientOnboardings() {
  return apiRequest<ClientOnboarding[]>("/msp/onboarding");
}

export function getClientOnboarding(id: string) {
  return apiRequest<ClientOnboarding>(`/msp/onboarding/${id}`);
}

export function createClientOnboarding(payload: {
  accountId: string;
  agreementId?: string;
  ownerName?: string;
  notes?: string;
  kind?: "onboarding" | "offboarding" | "project";
  projectTemplate?: string;
  discovery?: Record<string, string>;
  popiaRetentionFlag?: boolean;
}) {
  return apiRequest<ClientOnboarding>("/msp/onboarding", { method: "POST", body: payload });
}

export function updateClientOnboarding(
  id: string,
  payload: Partial<{
    checklist: ClientOnboarding["checklist"];
    blockers: string[];
    notes: string;
    ownerName: string;
    discovery: Record<string, string>;
    popiaRetentionFlag: boolean;
  }>,
) {
  return apiRequest<ClientOnboarding>(`/msp/onboarding/${id}`, { method: "PATCH", body: payload });
}

export function transitionClientOnboarding(id: string, status: string) {
  return apiRequest<ClientOnboarding>(`/msp/onboarding/${id}/transition`, {
    method: "POST",
    body: { status },
  });
}

export function listExternalWork() {
  return apiRequest<ExternalWorkRef[]>("/msp/external-work");
}

export function upsertExternalWork(payload: {
  system: string;
  externalId: string;
  externalUrl?: string;
  subject?: string;
  status?: string;
  accountId?: string;
}) {
  return apiRequest<ExternalWorkRef>("/msp/external-work", { method: "POST", body: payload });
}

export type MspPortalSummary = {
  onboarding: ClientOnboarding | null;
  onboardings: ClientOnboarding[];
  agreements: Array<{ id: string; name: string; status: string; monthlyFee: number; accountName: string }>;
  openTickets: Array<{
    id: string;
    number: string;
    subject: string;
    status: string;
    slaBreached: boolean;
    source?: string;
  }>;
  bridgedWork?: ExternalWorkRef[];
  invoices: Array<{ id: string; invoiceNumber: string; total: number; status: string }>;
};

export function getMspPortalSummary(accountId?: string) {
  const q = accountId ? `?accountId=${encodeURIComponent(accountId)}` : "";
  return apiRequest<MspPortalSummary>(`/portal/msp/summary${q}`);
}

export function getPortalTicketReplies(ticketId: string) {
  return apiRequest<Array<{ id: string; body: string; authorName: string | null; at: string }>>(
    `/portal/msp/tickets/${ticketId}/replies`,
  );
}

export function postPortalTicketReply(ticketId: string, body: string) {
  return apiRequest(`/portal/msp/tickets/${ticketId}/replies`, { method: "POST", body: { body } });
}

export function syncExternalWork(system?: string) {
  return apiRequest<{ adapter: string; synced: number; items: ExternalWorkRef[] }>(
    "/msp/external-work/sync",
    { method: "POST", body: system ? { system } : {} },
  );
}

export function importPsaTime(system?: string, days = 30) {
  return apiRequest<{ adapter: string; imported: number; entries: Array<{ id: string; minutes: number }> }>(
    "/msp/psa/time-import",
    { method: "POST", body: { system, days } },
  );
}

export type ExternalWorkRollup = {
  totals: { refs: number; accounts: number; systems: number };
  bySystem: Array<{ system: string; open: number; other: number; total: number }>;
  byAccount: Array<{
    accountId: string | null;
    accountName: string;
    total: number;
    systems: Array<{ system: string; count: number; items: ExternalWorkRef[] }>;
  }>;
};

export function getExternalWorkRollup(accountId?: string) {
  const q = accountId ? `?accountId=${encodeURIComponent(accountId)}` : "";
  return apiRequest<ExternalWorkRollup>(`/msp/external-work/rollup${q}`);
}

export type DispatcherBoard = {
  unassignedCount: number;
  openTickets: number;
  columns: Array<{
    assigneeId: string | null;
    assigneeName: string;
    openCount: number;
    slaBreached: number;
    billableMinutes: number;
    tickets: MspTicket[];
  }>;
};

export function getDispatcherBoard() {
  return apiRequest<DispatcherBoard>("/reports/msp/dispatcher");
}
