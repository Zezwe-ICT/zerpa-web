import { formatDistanceToNow, format, isPast } from "date-fns";

export function formatDate(date: string | Date, pattern: string = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern);
}

export function formatDatetime(
  date: string | Date,
  pattern: string = "dd MMM yyyy HH:mm"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern);
}

export function relativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isOverdue(dueDate: string | Date): boolean {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return isPast(d);
}

export function daysUntilDue(dueDate: string | Date): number {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
