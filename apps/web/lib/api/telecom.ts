import { apiRequest } from "@/lib/api/client";
import type {
  TelecomSubscriber,
  TelecomServiceOrder,
  TelecomRicaRecord,
  TelecomOutage,
} from "@zerpa/shared-types";

export type TelecomService = {
  id: string;
  subscriberId: string;
  orderId?: string | null;
  serviceType: string;
  status: string;
  circuitId?: string;
  phoneNumber?: string;
  simIccid?: string;
  cpeSerial?: string;
  activatedAt?: string | null;
};

export type TelecomPlan = {
  id: string;
  code: string;
  name: string;
  serviceType: string;
  onceOffFee: number;
  monthlyFee: number;
  currency: string;
  fnoCode?: string;
  active: boolean;
  description?: string;
};

export type CoverageZone = {
  id: string;
  label: string;
  areaKey: string;
  fnoCode: string;
  status: string;
  planCodes: string[];
};

export function listSubscribers() {
  return apiRequest<TelecomSubscriber[]>("/telecom/subscribers");
}

export function getSubscriber(id: string) {
  return apiRequest<
    TelecomSubscriber & {
      accountName?: string;
      orders?: TelecomServiceOrder[];
      services?: Array<{ id: string; serviceType: string; status: string; circuitId?: string }>;
      ricaDetail?: TelecomRicaRecord & {
        idDocumentId?: string | null;
        proofOfAddressDocumentId?: string | null;
        idDocumentHasFile?: boolean;
        proofOfAddressHasFile?: boolean;
      };
      invoices?: Array<{ id: string; invoiceNumber: string; total: number; status: string }>;
      documents?: Array<{ id: string; name: string; category: string; hasFile?: boolean }>;
    }
  >(`/telecom/subscribers/${id}`);
}

export function createSubscriber(payload: {
  accountId: string;
  serviceAddress?: string;
  coverageStatus?: string;
}) {
  return apiRequest<TelecomSubscriber>("/telecom/subscribers", { method: "POST", body: payload });
}

export function submitRica(
  subscriberId: string,
  payload: {
    idDocumentType: string;
    idNumber: string;
    proofOfAddressUploaded?: boolean;
    idDocumentName?: string;
    proofOfAddressName?: string;
    idDocumentId?: string;
    proofOfAddressDocumentId?: string;
  },
) {
  return apiRequest<TelecomRicaRecord>(`/telecom/subscribers/${subscriberId}/rica`, {
    method: "POST",
    body: {
      idDocumentType: payload.idDocumentType,
      idNumberMasked: payload.idNumber.replace(/.(?=.{4})/g, "*"),
      proofOfAddressUploaded: payload.proofOfAddressUploaded,
      idDocumentName: payload.idDocumentName,
      proofOfAddressName: payload.proofOfAddressName,
      idDocumentId: payload.idDocumentId,
      proofOfAddressDocumentId: payload.proofOfAddressDocumentId,
    },
  });
}

export function reviewRica(id: string, decision: "approved" | "rejected") {
  return apiRequest<TelecomRicaRecord>(`/telecom/rica/${id}/review`, {
    method: "POST",
    body: { decision },
  });
}

export function listOrders() {
  return apiRequest<TelecomServiceOrder[]>("/telecom/orders");
}

export function getOrder(id: string) {
  return apiRequest<
    TelecomServiceOrder & {
      subscriberRicaStatus?: string;
      serviceAddress?: string;
      fnoBoardStatus?: string;
    }
  >(`/telecom/orders/${id}`);
}

export function updateOrder(
  id: string,
  payload: Partial<{
    blockers: string[];
    upstreamOrderRef: string;
    installDate: string | null;
    fnoBoardStatus: "awaiting" | "submitted" | "delayed" | "ready" | "";
  }>,
) {
  return apiRequest<TelecomServiceOrder>(`/telecom/orders/${id}`, { method: "PATCH", body: payload });
}

export function createOrder(payload: {
  subscriberId: string;
  productName?: string;
  planId?: string;
  monthlyFee?: number;
  onceOffFee?: number;
}) {
  return apiRequest<TelecomServiceOrder>("/telecom/orders", { method: "POST", body: payload });
}

export function transitionOrder(id: string, to: string) {
  return apiRequest<TelecomServiceOrder>(`/telecom/orders/${id}/transition`, {
    method: "POST",
    body: { to },
  });
}

export function provisionOrder(
  id: string,
  opts: { adapter?: string; cpeSerial?: string; simIccid?: string } = {},
) {
  return apiRequest<{ orderId: string; service: TelecomService; adapter: string; circuitId?: string }>(
    `/telecom/orders/${id}/provision`,
    {
      method: "POST",
      body: {
        adapter: opts.adapter || "radius_stub",
        cpeSerial: opts.cpeSerial,
        simIccid: opts.simIccid,
      },
    },
  );
}

export function listFnoBoard() {
  return apiRequest<
    Array<TelecomServiceOrder & { serviceAddress?: string; fnoBoardStatus?: string }>
  >("/telecom/fno-board");
}

export function listPlans() {
  return apiRequest<TelecomPlan[]>("/telecom/plans?active=1");
}

export function createPlan(payload: {
  code: string;
  name: string;
  serviceType?: string;
  onceOffFee?: number;
  monthlyFee: number;
  fnoCode?: string;
  description?: string;
}) {
  return apiRequest<TelecomPlan>("/telecom/plans", { method: "POST", body: payload });
}

export function listCoverage() {
  return apiRequest<CoverageZone[]>("/telecom/coverage");
}

export function createCoverage(payload: {
  label: string;
  areaKey?: string;
  fnoCode: string;
  status?: string;
  planCodes?: string[];
}) {
  return apiRequest<CoverageZone>("/telecom/coverage", { method: "POST", body: payload });
}

export function lookupCoverage(address: string) {
  return apiRequest<{
    address: string;
    coverageStatus: string;
    fnos: Array<{ fnoCode: string; status: string; label: string }>;
    plans: TelecomPlan[];
  }>(`/telecom/coverage/lookup?address=${encodeURIComponent(address)}`);
}

export function listServices() {
  return apiRequest<TelecomService[]>("/telecom/services");
}

export function activateService(id: string) {
  return apiRequest<{ service: TelecomService; invoiceId?: string }>(`/telecom/services/${id}/activate`, {
    method: "POST",
    body: {},
  });
}

export function changeServicePlan(id: string, planId: string, daysRemaining = 15) {
  return apiRequest<{
    service: TelecomService;
    plan: { id: string; code: string; name: string; monthlyFee: number };
    proration: {
      daysRemaining: number;
      deltaMonthly: number;
      proratedAmount: number;
      debitInvoiceId?: string | null;
      creditInvoiceId?: string | null;
    };
  }>(`/telecom/services/${id}/change-plan`, {
    method: "POST",
    body: { planId, daysRemaining },
  });
}

export function cancelService(id: string, daysRemaining = 10) {
  return apiRequest<{
    service: TelecomService;
    proration: { daysRemaining: number; creditAmount: number; creditInvoiceId?: string | null };
  }>(`/telecom/services/${id}/cancel`, {
    method: "POST",
    body: { daysRemaining },
  });
}

export type InstallJob = {
  id: string;
  number: string;
  productName: string;
  status: string;
  serviceAddress: string;
  installDate?: string | null;
  installChecklist: Array<{ id: string; label: string; done: boolean }>;
  installNotes: string;
  checklistProgress: number;
  checklistComplete: boolean;
  serviceId?: string | null;
  cpeSerial?: string;
  simIccid?: string;
  circuitId?: string;
};

export function listInstalls() {
  return apiRequest<InstallJob[]>("/telecom/installs");
}

export function updateInstall(
  orderId: string,
  payload: Partial<{
    installChecklist: InstallJob["installChecklist"];
    installNotes: string;
    cpeSerial: string;
    simIccid: string;
  }>,
) {
  return apiRequest<InstallJob>(`/telecom/orders/${orderId}/install`, {
    method: "PATCH",
    body: payload,
  });
}

export type PublicCoverageResult = {
  company: { name: string; slug: string };
  address: string;
  coverageStatus: string;
  fnos: Array<{ fnoCode: string; status: string; label: string; planCodes?: string[] }>;
  plans: Array<{
    code: string;
    name: string;
    serviceType: string;
    monthlyFee: number;
    onceOffFee: number;
    currency: string;
    fnoCode?: string;
  }>;
  plansByFno?: Record<string, PublicCoverageResult["plans"]>;
};

export async function lookupPublicCoverage(slug: string, address: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const res = await fetch(
    `${base}/public/telecom/${encodeURIComponent(slug)}/coverage?address=${encodeURIComponent(address)}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Coverage lookup failed (${res.status})`);
  }
  return res.json() as Promise<PublicCoverageResult>;
}

export async function joinPublicWaitlist(
  slug: string,
  payload: { address: string; email?: string; phone?: string; name?: string },
) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const res = await fetch(`${base}/public/telecom/${encodeURIComponent(slug)}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Waitlist failed (${res.status})`);
  }
  return res.json() as Promise<{ id: string; status: string; deduplicated?: boolean }>;
}

export function listCoverageWaitlist(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<
    Array<{
      id: string;
      areaKey: string;
      address: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      status: string;
      notifiedAt?: string | null;
    }>
  >(`/telecom/waitlist${q}`);
}

export type NumberPortRequest = {
  id: string;
  subscriberId: string;
  serviceId?: string | null;
  number: string;
  donorNetwork: string;
  status: string;
  ricaRef: string;
  notes: string;
  submittedAt?: string | null;
  completedAt?: string | null;
};

export function listNumberPorts(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<NumberPortRequest[]>(`/telecom/ports${q}`);
}

export function createNumberPort(payload: {
  subscriberId: string;
  number: string;
  donorNetwork?: string;
  serviceId?: string;
  ricaRef?: string;
}) {
  return apiRequest<NumberPortRequest>("/telecom/ports", { method: "POST", body: payload });
}

export function transitionNumberPort(id: string, to: string) {
  return apiRequest<NumberPortRequest>(`/telecom/ports/${id}/transition`, {
    method: "POST",
    body: { to },
  });
}

export function recordServiceUsage(serviceId: string, payload: { usedMb: number; includedMb?: number; applyFup?: boolean }) {
  return apiRequest<{
    usage: { id: string; usedMb: number; includedMb: number; fupBreached: boolean };
    overageInvoiceId?: string | null;
    fupBreached: boolean;
  }>(`/telecom/services/${serviceId}/usage`, { method: "POST", body: payload });
}

export function topUpService(serviceId: string, payload: { mb: number; amount?: number }) {
  return apiRequest<{ invoiceId?: string; usage: { includedMb: number } }>(
    `/telecom/services/${serviceId}/top-up`,
    { method: "POST", body: payload },
  );
}

export function getTelecomSettings() {
  return apiRequest<{ whmcsUrl: string; cpanelUrl: string; hostingNotes: string }>("/telecom/settings");
}

export function updateTelecomSettings(payload: Partial<{ whmcsUrl: string; cpanelUrl: string; hostingNotes: string }>) {
  return apiRequest<{ whmcsUrl: string; cpanelUrl: string; hostingNotes: string }>("/telecom/settings", {
    method: "PATCH",
    body: payload,
  });
}

export function dunningAction(subscriberId: string, action: "suspend" | "reactivate") {
  return apiRequest<{ id: string; status: string; action: string }>(
    `/telecom/subscribers/${subscriberId}/dunning`,
    { method: "POST", body: { action } },
  );
}

export function listOutages() {
  return apiRequest<TelecomOutage[]>("/telecom/outages");
}

export function createOutage(payload: { title: string; summary?: string; impactedServiceIds?: string[] }) {
  return apiRequest<TelecomOutage>("/telecom/outages", { method: "POST", body: payload });
}

export function transitionOutage(id: string, to: string, payload?: { impactedServiceIds?: string[]; summary?: string }) {
  return apiRequest<TelecomOutage>(`/telecom/outages/${id}/transition`, {
    method: "POST",
    body: { to, ...payload },
  });
}

export type DunningQueueItem = {
  subscriberId: string;
  accountId: string;
  status: string;
  serviceAddress: string;
  ricaStatus: string;
  unpaidInvoices: Array<{ id: string; invoiceNumber: string; total: number; status: string; dueDate?: string | null }>;
  services: TelecomService[];
};

export function listDunningQueue() {
  return apiRequest<{ count: number; items: DunningQueueItem[] }>("/telecom/dunning/queue");
}

export function dunningQueueAction(subscriberId: string, action: "suspend" | "reactivate", force?: boolean) {
  return apiRequest<{ id: string; status: string; action: string }>(`/telecom/dunning/${subscriberId}`, {
    method: "POST",
    body: { action, force },
  });
}

export function initiateCollect(invoiceId: string, provider: "payfast" | "netcash" = "payfast") {
  return apiRequest<{
    paymentId: string;
    paymentRef: string;
    provider: string;
    status: string;
    redirectUrl: string;
    invoiceId: string;
  }>(`/billing/invoices/${invoiceId}/collect`, { method: "POST", body: { provider } });
}

/** Staff-only, DEBUG-only: settles a stub payment. Real payments settle via the signed provider webhook. */
export function simulatePayment(paymentRef: string) {
  return apiRequest<{ ok: boolean; invoiceId: string; status?: string }>(
    `/billing/payments/${encodeURIComponent(paymentRef)}/simulate`,
    { method: "POST", body: {} },
  );
}

export function createCreditNote(payload: {
  accountId: string;
  amount: number;
  outageId?: string;
  notes?: string;
}) {
  return apiRequest<{ id: string; invoiceNumber: string; total: number; type: string }>(
    "/billing/credits",
    { method: "POST", body: payload },
  );
}

export function runBillingSchedules() {
  return apiRequest<{ created: Array<{ id: string; invoiceNumber: string; total: number }> }>(
    "/billing/schedules/run",
    { method: "POST", body: {} },
  );
}

export type TelecomPortalSummary = {
  subscribers: Array<{ id: string; status: string; serviceAddress: string; ricaStatus: string }>;
  services: Array<{
    id: string;
    status: string;
    serviceType: string;
    circuitId: string;
    planName?: string | null;
    activatedAt?: string | null;
  }>;
  orders: Array<{
    id: string;
    number: string;
    productName: string;
    status: string;
    monthlyFee: number;
    activatedAt?: string | null;
  }>;
  invoices: Array<{ id: string; invoiceNumber: string; total: number; status: string; type: string }>;
  documents: Array<{ id: string; name: string; category: string; classification: string }>;
  outages: Array<{ id: string; title: string; status: string; summary: string; startedAt?: string | null }>;
  hosting?: { whmcsUrl: string; cpanelUrl: string; notes: string };
  kpis: {
    activeServices: number;
    suspendedServices: number;
    ordersInFlight: number;
    unpaidInvoices: number;
    openOutages: number;
  };
};

export function getTelecomPortalSummary(accountId?: string) {
  const q = accountId ? `?accountId=${encodeURIComponent(accountId)}` : "";
  return apiRequest<TelecomPortalSummary>(`/portal/telecom/summary${q}`);
}
