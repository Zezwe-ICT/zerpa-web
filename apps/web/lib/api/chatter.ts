/**
 * @file lib/api/chatter.ts
 * @description Notes/history (timeline) and scheduled activities on any record.
 */
import { apiRequest } from "./client";

export type RecordType = "lead" | "ticket" | "customer" | "invoice" | "quote" | "supplier_bill" | "project" | "task";

export interface TimelineEntry {
  id: string;
  kind: "note" | "call" | "email" | "meeting" | "reply" | "stage" | "log";
  body: string;
  subject: string;
  audience: string;
  authorName: string;
  documentId: string | null;
  at: string;
}

export type ActivityKind = "call" | "email" | "meeting" | "todo" | "follow_up";

export interface Activity {
  id: string;
  recordType: RecordType;
  recordId: string;
  kind: ActivityKind;
  kindLabel: string;
  summary: string;
  note: string | null;
  dueDate: string;
  assignee: { id: string; name: string } | null;
  done: boolean;
  overdue: boolean;
  dueToday: boolean;
  record?: { type: RecordType; id: string; title: string; link: string };
}

export const getTimeline = (recordType: RecordType, recordId: string) =>
  apiRequest<TimelineEntry[]>(`/timeline?recordType=${recordType}&recordId=${recordId}`);
export const addNote = (recordType: RecordType, recordId: string, body: string, mentionIds: string[]) =>
  apiRequest<TimelineEntry>("/timeline", { method: "POST", body: { recordType, recordId, kind: "note", body, mentionIds } });

export const getActivities = (recordType: RecordType, recordId: string) =>
  apiRequest<Activity[]>(`/activities?recordType=${recordType}&recordId=${recordId}`);
export const getMyActivities = () => apiRequest<Activity[]>("/activities?mine=1");
export const scheduleActivity = (body: { recordType: RecordType; recordId: string; kind: ActivityKind; summary: string; dueDate: string; assigneeId?: string; note?: string }) =>
  apiRequest<Activity>("/activities", { method: "POST", body });
export const completeActivity = (id: string, feedback?: string) =>
  apiRequest<Activity>(`/activities/${id}`, { method: "PATCH", body: { done: true, feedback } });
export const snoozeActivity = (id: string, days: number) =>
  apiRequest<Activity>(`/activities/${id}`, { method: "PATCH", body: { snoozeDays: days } });
