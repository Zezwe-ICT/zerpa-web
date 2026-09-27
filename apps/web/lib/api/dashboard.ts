/**
 * @file lib/api/dashboard.ts
 * @description Dashboard overview (GET /dashboard/overview). Sections the signed-in person
 * isn't allowed to see come back as null.
 */
import { apiRequest } from "./client";

export interface CashFlowMonth {
  month: string;
  invoiced: number;
  collected: number;
}

export interface ReceivablesBucket {
  key: "not_due" | "1_30" | "31_60" | "61_90" | "90_plus";
  label: string;
  amount: number;
  count: number;
}

export interface OverdueInvoice {
  id: string;
  number: string;
  customer: string;
  amount: number;
  daysOverdue: number;
}

export interface ExpiringQuote {
  id: string;
  number: string;
  customer: string;
  amount: number;
  expiresOn: string;
}

export interface ActivityItem {
  kind: "payment" | "quote_accepted" | "quote_declined" | "invoice_sent" | "lead";
  at: string;
  amount: number | null;
  title: string;
  detail: string;
  link: string;
}

export interface DashboardOverview {
  currency: string;
  cashFlow: CashFlowMonth[] | null;
  receivables: {
    buckets: ReceivablesBucket[];
    total: number;
    overdueTotal: number;
    overdue: OverdueInvoice[];
  } | null;
  quotes: {
    won: number;
    lost: number;
    open: number;
    winRate: number | null;
    expiringSoon: ExpiringQuote[];
  } | null;
  pipeline: {
    stages: Array<{ key: string; label: string; count: number; value: number }>;
    openCount: number;
    openValue: number;
  } | null;
  activity: ActivityItem[];
}

export function getDashboardOverview() {
  return apiRequest<DashboardOverview>("/dashboard/overview");
}
