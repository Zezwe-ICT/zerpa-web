import { apiRequest } from "@/lib/api/client";

export function listFuneralCases() {
  return apiRequest<any[]>("/funeral/cases");
}
export function getFuneralCase(id: string) {
  return apiRequest<any>(`/funeral/cases/${id}`);
}
export function patchFuneralCase(id: string, payload: Record<string, unknown>) {
  return apiRequest<any>(`/funeral/cases/${id}`, { method: "PATCH", body: payload });
}
export function createFuneralCase(payload: {
  deceasedName: string;
  packageName?: string;
  notes?: string;
  serviceType?: string;
  venue?: string;
  serviceDate?: string;
}) {
  return apiRequest<any>("/funeral/cases", { method: "POST", body: payload });
}
export function transitionFuneralCase(id: string, to: string) {
  return apiRequest<any>(`/funeral/cases/${id}/transition`, { method: "POST", body: { to } });
}
export function listFuneralSchedule() {
  return apiRequest<any[]>("/funeral/schedule");
}
export function getFuneralPortalSummary() {
  return apiRequest<{
    activeCases: number;
    funeralsThisWeek: number;
    missingDocsCases: number;
    cases: any[];
    schedule: any[];
    invoices: Array<{ id: string; invoiceNumber: string; total: number; status: string }>;
  }>("/portal/funeral/summary");
}

export function listSpaBookings() {
  return apiRequest<any[]>("/spa/bookings");
}
export function createSpaBooking(payload: { serviceName: string; therapistName?: string; consentCaptured?: boolean }) {
  return apiRequest<any>("/spa/bookings", { method: "POST", body: payload });
}
export function transitionSpaBooking(id: string, to: string) {
  return apiRequest<any>(`/spa/bookings/${id}/transition`, { method: "POST", body: { to } });
}
export function getSpaPortalSummary() {
  return apiRequest<{
    upcomingCount: number;
    bookings: any[];
    invoices: Array<{ id: string; invoiceNumber: string; total: number; status: string }>;
  }>("/portal/spa/summary");
}

export function listReservations() {
  return apiRequest<any[]>("/restaurant/reservations");
}
export function createReservation(payload: { partySize?: number; allergies?: string; notes?: string }) {
  return apiRequest<any>("/restaurant/reservations", { method: "POST", body: payload });
}
export function transitionReservation(id: string, to: string) {
  return apiRequest<any>(`/restaurant/reservations/${id}/transition`, { method: "POST", body: { to } });
}
export function getRestaurantPortalSummary() {
  return apiRequest<{
    upcomingCount: number;
    reservations: any[];
    invoices: Array<{ id: string; invoiceNumber: string; total: number; status: string }>;
  }>("/portal/restaurant/summary");
}

export function listJobCards() {
  return apiRequest<any[]>("/automotive/job-cards");
}
export function createJobCard(payload: {
  vehicleReg: string;
  vehicleMake?: string;
  complaint?: string;
  estimateAmount?: number;
}) {
  return apiRequest<any>("/automotive/job-cards", { method: "POST", body: payload });
}
export function transitionJobCard(id: string, to: string) {
  return apiRequest<any>(`/automotive/job-cards/${id}/transition`, { method: "POST", body: { to } });
}

export type StaffApprovalMethod = "phone" | "in_person" | "written" | "email" | "whatsapp";

/** Records the customer's approval of the current estimate (CPA s15), captured by staff. */
export function approveJobCard(id: string, method: StaffApprovalMethod, approverName: string) {
  return apiRequest<any>(`/automotive/job-cards/${id}/approve`, { method: "POST", body: { method, approverName } });
}

/** Customer approves the estimate on their own job card from the portal. */
export function approveJobCardAsCustomer(id: string) {
  return apiRequest<any>(`/portal/automotive/job-cards/${id}/approve`, { method: "POST", body: { decision: "approved" } });
}
export function getAutomotivePortalSummary() {
  return apiRequest<{
    openJobs: number;
    awaitingApproval: number;
    jobCards: any[];
    invoices: Array<{ id: string; invoiceNumber: string; total: number; status: string }>;
  }>("/portal/automotive/summary");
}

export function listNestSales(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<any[]>(`/nest/sales${q}`);
}
export function getNestSale(id: string) {
  return apiRequest<any>(`/nest/sales/${id}`);
}
export function createNestSale(payload: Record<string, unknown> = {}) {
  return apiRequest<any>("/nest/sales", { method: "POST", body: payload });
}
export function transitionNestSale(id: string, to: string) {
  return apiRequest<any>(`/nest/sales/${id}/transition`, { method: "POST", body: { to } });
}
export function listNestChecklist(id: string) {
  return apiRequest<any[]>(`/nest/sales/${id}/checklist`);
}
export function patchNestChecklistItem(saleId: string, itemId: string, payload: { completed: boolean; completedBy?: string }) {
  return apiRequest<any>(`/nest/sales/${saleId}/checklist/${itemId}`, { method: "PATCH", body: payload });
}

export function getOpsReport() {
  return apiRequest<Record<string, number | string>>("/reports/ops");
}

export function getMspUtilisation() {
  return apiRequest<{
    billableMinutes: number;
    includedMinutes: number;
    utilisationPercent: number | null;
    mrr: number;
    activeAgreements: number;
    openOnboardings: number;
    openTickets: number;
    openByType: Record<string, number>;
    slaAtRisk: number;
    assets: number;
  }>("/reports/msp/utilisation");
}

export function previewImport(entity: string, csv: string) {
  return apiRequest<{ valid: number; issues: Array<{ line: number; error: string }> }>("/imports/preview", {
    method: "POST",
    body: { entity, csv },
  });
}

export function commitImport(entity: string, csv: string) {
  return apiRequest<{ created: number }>("/imports/commit", {
    method: "POST",
    body: { entity, csv },
  });
}
