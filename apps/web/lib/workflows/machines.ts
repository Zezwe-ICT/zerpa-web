/** Mirror of API workflow machines for client-side UX gating. Keep in sync with:
 *  - zerpa-api/apps/msp/api.py TICKET_TRANSITIONS
 *  - zerpa-api/apps/telecom/api.py ORDER_TRANSITIONS
 *  - zerpa-api/apps/funeral/api.py CASE_TRANSITIONS
 *  - zerpa-api/apps/spa/api.py SPA_TRANSITIONS
 *  - zerpa-api/apps/restaurant/api.py RES_TRANSITIONS
 *  - zerpa-api/apps/automotive/api.py JOB_TRANSITIONS
 */
export const TICKET_MACHINE: Record<string, string[]> = {
  new: ["triaged", "cancelled"],
  triaged: ["in_progress", "waiting_customer", "cancelled"],
  in_progress: ["waiting_customer", "resolved", "cancelled"],
  waiting_customer: ["in_progress", "resolved", "cancelled"],
  resolved: ["closed", "in_progress"],
  closed: [],
  cancelled: [],
};

export const SERVICE_ORDER_MACHINE: Record<string, string[]> = {
  lead: ["qualified", "cancelled"],
  qualified: ["quoted", "cancelled"],
  quoted: ["rica_pending", "cancelled"],
  rica_pending: ["provisioning", "cancelled"],
  provisioning: ["installing", "failed", "cancelled"],
  installing: ["active", "failed", "cancelled"],
  active: ["suspended", "cancelled"],
  suspended: ["active", "cancelled"],
  failed: [],
  cancelled: [],
};

export const FUNERAL_CASE_MACHINE: Record<string, string[]> = {
  intake: ["active", "closed"],
  active: ["pending_burial", "completed", "closed"],
  pending_burial: ["completed", "closed"],
  completed: ["closed"],
  closed: [],
};

export const SPA_BOOKING_MACHINE: Record<string, string[]> = {
  booked: ["checked_in", "cancelled", "no_show"],
  checked_in: ["in_service", "cancelled"],
  in_service: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export const RESERVATION_MACHINE: Record<string, string[]> = {
  booked: ["seated", "cancelled", "no_show"],
  seated: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export const JOB_CARD_MACHINE: Record<string, string[]> = {
  booked: ["checked_in", "cancelled"],
  checked_in: ["diagnosing", "cancelled"],
  diagnosing: ["awaiting_approval", "cancelled"],
  awaiting_approval: ["in_progress", "cancelled"],
  in_progress: ["qa", "cancelled"],
  qa: ["ready", "in_progress"],
  ready: ["collected", "invoiced"],
  invoiced: ["collected"],
  collected: [],
  cancelled: [],
};

/** Prefer first allowed next state for single-button Advance UX. */
export function nextAdvanceState(machine: Record<string, string[]>, from: string): string | null {
  const allowed = (machine[from] ?? []).filter((s) => !["cancelled", "no_show", "closed"].includes(s));
  return allowed[0] ?? null;
}
