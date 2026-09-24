import {
  TICKET_MACHINE,
  SERVICE_ORDER_MACHINE,
  FUNERAL_CASE_MACHINE,
  SPA_BOOKING_MACHINE,
  RESERVATION_MACHINE,
  JOB_CARD_MACHINE,
  nextAdvanceState,
} from "./machines";

export {
  TICKET_MACHINE,
  SERVICE_ORDER_MACHINE,
  FUNERAL_CASE_MACHINE,
  SPA_BOOKING_MACHINE,
  RESERVATION_MACHINE,
  JOB_CARD_MACHINE,
  nextAdvanceState,
};

export function canTransition(
  machine: Record<string, string[]>,
  from: string,
  to: string,
): boolean {
  return (machine[from] ?? []).includes(to);
}
