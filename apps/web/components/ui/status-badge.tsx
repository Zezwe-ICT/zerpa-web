"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = {
  label: string;
  className: string;
};

export const STATUS_CONFIG: Record<string, BadgeVariant> = {
  // ── Invoice statuses ──────────────────────────────────────
  DRAFT: {
    label: "Draft",
    className: "bg-surface-2 text-muted-fg border border-border font-mono text-xs",
  },
  SENT: {
    label: "Sent",
    className: "bg-info-bg text-info border border-info-ring font-mono text-xs",
  },
  PAID: {
    label: "Paid",
    className: "bg-success-bg text-success border border-success-ring font-mono text-xs",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-danger-bg text-danger border border-danger-ring font-mono text-xs",
  },
  VOID: {
    label: "Void",
    className: "bg-surface-2 text-muted-fg border border-border line-through font-mono text-xs",
  },

  // ── Lead pipeline stages ──────────────────────────────────
  NEW: {
    label: "New",
    className: "bg-surface-2 text-foreground-2 border border-border text-xs",
  },
  CONTACTED: {
    label: "Contacted",
    className: "bg-warning-bg text-warning border border-warning-ring text-xs",
  },
  QUALIFIED: {
    label: "Qualified",
    className: "bg-info-bg text-info border border-info-ring text-xs",
  },
  PROPOSAL: {
    label: "Proposal",
    className: "bg-funeral-bg text-funeral border border-[rgba(109,40,217,0.20)] text-xs",
  },
  NEGOTIATION: {
    label: "Negotiation",
    className: "bg-[rgba(234,88,12,0.08)] text-orange-700 border border-[rgba(234,88,12,0.20)] text-xs",
  },
  CLOSED_WON: {
    label: "Won",
    className: "bg-success-bg text-success border border-success-ring text-xs font-semibold",
  },
  CLOSED_LOST: {
    label: "Lost",
    className: "bg-danger-bg text-danger border border-danger-ring text-xs",
  },

  // ── Nest sale statuses ────────────────────────────────────
  PENDING: {
    label: "Pending",
    className: "bg-surface-2 text-muted-fg border border-border text-xs",
  },
  SETUP: {
    label: "In Setup",
    className: "bg-warning-bg text-warning border border-warning-ring text-xs",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-success-bg text-success border border-success-ring text-xs font-semibold",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-danger-bg text-danger border border-danger-ring text-xs",
  },

  // ── Funeral case statuses ─────────────────────────────────
  INTAKE: {
    label: "Intake",
    className: "bg-surface-2 text-foreground-2 border border-border text-xs",
  },
  PENDING_BURIAL: {
    label: "Pending Burial",
    className: "bg-warning-bg text-warning border border-warning-ring text-xs",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-surface-2 text-muted-fg border border-border text-xs",
  },

  // ── Job card statuses ─────────────────────────────────────
  CHECKED_IN: {
    label: "Checked In",
    className: "bg-surface-2 text-foreground-2 border border-border text-xs",
  },
  DIAGNOSED: {
    label: "Diagnosed",
    className: "bg-info-bg text-info border border-info-ring text-xs",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-warning-bg text-warning border border-warning-ring text-xs",
  },
  QUALITY_CHECK: {
    label: "Quality Check",
    className: "bg-info-bg text-info border border-info-ring text-xs",
  },
  READY: {
    label: "Ready",
    className: "bg-success-bg text-success border border-success-ring text-xs",
  },
  COLLECTED: {
    label: "Collected",
    className: "bg-surface-2 text-muted-fg border border-border text-xs",
  },

  // ── Restaurant order statuses ─────────────────────────────
  RECEIVED: {
    label: "Received",
    className: "bg-surface-2 text-foreground-2 border border-border text-xs",
  },
  IN_KITCHEN: {
    label: "In Kitchen",
    className: "bg-warning-bg text-warning border border-warning-ring text-xs",
  },
  SERVED: {
    label: "Served",
    className: "bg-success-bg text-success border border-success-ring text-xs",
  },

  // ── Spa booking statuses ──────────────────────────────────
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-success-bg text-success border border-success-ring text-xs",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-surface-2 text-muted-fg border border-border text-xs",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-danger-bg text-danger border border-danger-ring text-xs",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-surface-2 text-muted-fg border border-border text-xs",
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[4px]", config.className, className)}>
      {config.label}
    </span>
  );
}
