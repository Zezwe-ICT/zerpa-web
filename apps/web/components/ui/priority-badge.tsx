"use client";

import { cn } from "@/lib/utils";

type PriorityVariant = "FLAGSHIP" | "PRIORITY" | "STANDARD";

const PRIORITY_CONFIG: Record<PriorityVariant, { label: string; className: string }> = {
  FLAGSHIP: {
    label: "Flagship",
    className: "bg-funeral-bg text-funeral border border-[rgba(109,40,217,0.20)] text-xs font-semibold tracking-wide uppercase font-mono",
  },
  PRIORITY: {
    label: "Priority",
    className: "bg-info-bg text-info border border-info-ring text-xs font-semibold tracking-wide uppercase font-mono",
  },
  STANDARD: {
    label: "Standard",
    className: "bg-success-bg text-success border border-success-ring text-xs tracking-wide uppercase font-mono",
  },
};

interface PriorityBadgeProps {
  priority: PriorityVariant;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[4px]", config.className, className)}>
      {config.label}
    </span>
  );
}
