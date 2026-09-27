"use client";

import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarClock,
  Clock,
  FileText,
  FolderHeart,
  FolderKanban,
  Package,
  Phone,
  Receipt,
  ReceiptText,
  Server,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserCheck,
  Users,
  Wallet,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { CatalogApp } from "@/lib/api/apps";
import { cn } from "@/lib/utils";

export const APP_ICONS: Record<string, LucideIcon> = {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarClock,
  Clock,
  FileText,
  FolderHeart,
  FolderKanban,
  Package,
  Phone,
  Receipt,
  ReceiptText,
  Server,
  ShieldCheck,
  Ticket,
  UserCheck,
  Users,
  Wallet,
  Workflow,
  Wrench,
};

export function AppIcon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const Icon = APP_ICONS[name] ?? Package;
  return <Icon size={size} strokeWidth={1.5} className={className} />;
}

/** One app tile. `action` renders on the right (a checkbox in onboarding, Install/Remove on the Apps page). */
export function AppCard({
  app,
  active,
  needs,
  action,
  onClick,
}: {
  app: CatalogApp;
  active: boolean;
  /** Names of apps this one brings along, shown so nothing is added by surprise. */
  needs?: string[];
  action?: React.ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={cn(
        "flex w-full gap-3 rounded-[10px] border p-3 text-left",
        active ? "border-primary bg-primary/5" : "border-border",
        onClick && !active && "hover:border-foreground/20",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]",
          active ? "bg-primary text-primary-fg" : "bg-surface text-muted-fg",
        )}
      >
        <AppIcon name={app.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium">{app.name}</span>
          {app.recommended && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <Sparkles size={10} /> Recommended
            </span>
          )}
        </span>
        <span className="block text-xs text-muted-fg">{app.recommended && app.reason ? app.reason : app.tagline}</span>
        {needs && needs.length > 0 && (
          <span className="mt-1 block text-[11px] text-muted-fg">Also adds: {needs.join(", ")}</span>
        )}
      </span>
      {action && <span className="shrink-0 self-center">{action}</span>}
    </Tag>
  );
}
