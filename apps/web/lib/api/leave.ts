/**
 * @file lib/api/leave.ts
 * @description Leave types, balances, requests, approval and the team calendar.
 */
import { apiRequest } from "./client";

export interface LeaveType { id: string; key: string; name: string; daysPerYear: number; paid: boolean; color: string | null; isActive: boolean }
export interface LeaveBalance { type: LeaveType; year: number; entitled: number; taken: number; pending: number; tracked: boolean; remaining: number | null }
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export interface LeaveRequest {
  id: string;
  user: { id: string; name: string };
  type: LeaveType;
  startDate: string;
  endDate: string;
  halfDay: boolean;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  decidedBy: string | null;
  decisionNote: string | null;
  isMine: boolean;
  canDecide: boolean;
  createdAt: string;
}
export interface LeaveCalendar {
  from: string;
  to: string;
  leave: Array<{ id: string; user: { id: string; name: string }; type: string; color: string | null; startDate: string; endDate: string; status: "approved" | "pending"; halfDay: boolean }>;
  holidays: Array<{ date: string; name: string }>;
}

export const listLeaveTypes = () => apiRequest<LeaveType[]>("/leave/types");
export const getMyBalances = (year?: number) => apiRequest<{ balances: LeaveBalance[] }>(`/leave/balances${year ? `?year=${year}` : ""}`);
export const listLeaveRequests = (scope: "mine" | "team") => apiRequest<LeaveRequest[]>(`/leave/requests?scope=${scope}`);
export const requestLeave = (body: { typeId: string; startDate: string; endDate: string; halfDay?: boolean; reason?: string }) =>
  apiRequest<LeaveRequest>("/leave/requests", { method: "POST", body });
export const decideLeave = (id: string, action: "approve" | "reject" | "cancel", note?: string) =>
  apiRequest<LeaveRequest>(`/leave/requests/${id}/decision`, { method: "POST", body: { action, note } });
export const getLeaveCalendar = (from: string, to: string) => apiRequest<LeaveCalendar>(`/leave/calendar?from=${from}&to=${to}`);
