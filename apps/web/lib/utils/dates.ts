import { formatDistanceToNow, format, isPast } from "date-fns";

type DateInput = string | Date | null | undefined;

/** Parses a date, or null when it's missing or invalid (e.g. an invoice with no due date). */
function toDate(date: DateInput): Date | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : new Date(date.getTime());
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(date: DateInput, pattern: string = "dd MMM yyyy"): string {
  const d = toDate(date);
  return d ? format(d, pattern) : "—";
}

export function formatDatetime(date: DateInput, pattern: string = "dd MMM yyyy HH:mm"): string {
  const d = toDate(date);
  return d ? format(d, pattern) : "—";
}

export function relativeTime(date: DateInput): string {
  const d = toDate(date);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

export function isOverdue(dueDate: DateInput): boolean {
  const d = toDate(dueDate);
  return d ? isPast(d) : false;
}

export function daysUntilDue(dueDate: DateInput): number {
  const d = toDate(dueDate);
  if (!d) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
