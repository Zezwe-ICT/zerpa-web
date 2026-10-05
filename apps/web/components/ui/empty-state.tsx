/**
 * @file components/ui/empty-state.tsx
 * @description EmptyState centred placeholder displayed when a list has no data.
 * Accepts a Lucide (or similar) icon component, title, description and optional action.
 */
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
      <div className="rounded-[12px] bg-surface p-4 mb-4 border border-border">
        <Icon className="w-6 h-6 text-muted-fg" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-fg max-w-xs">{description}</p>
      {action && (
        <Button size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
