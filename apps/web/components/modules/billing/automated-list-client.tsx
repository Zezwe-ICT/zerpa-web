/**
 * @file components/modules/billing/automated-list-client.tsx
 * @description Automated Invoices list — summary cards and a table of recurring
 * invoice configs with pause/resume, edit and delete actions.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Repeat, PlayCircle, PauseCircle, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { ActionMenu } from "./action-menu";
import {
  getAutomatedConfigs,
  toggleAutomatedConfigActive,
  deleteAutomatedConfig,
} from "@/lib/data/automated-invoices";
import type {
  AutomatedInvoiceConfig,
  AutomationRecurrence,
} from "@zerpa/shared-types";

const RECURRENCE_LABELS: Record<AutomationRecurrence, string> = {
  monthly_indefinite: "Monthly (Indefinite)",
  monthly_fixed_term: "Monthly (Fixed Term)",
  once: "Once Only",
};

export function AutomatedListClient() {
  const router = useRouter();
  const [configs, setConfigs] = useState<AutomatedInvoiceConfig[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    getAutomatedConfigs()
      .then(setConfigs)
      .catch(() => setConfigs([]))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  const activeCount = configs.filter((c) => c.isActive).length;
  const pausedCount = configs.filter((c) => !c.isActive).length;
  const now = new Date();
  const runningThisMonth = configs.filter((c) => {
    if (!c.isActive) return false;
    const d = new Date(c.nextRunDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const nextRun = configs
    .filter((c) => c.isActive)
    .map((c) => c.nextRunDate)
    .sort()[0];

  async function handleToggle(c: AutomatedInvoiceConfig) {
    try {
      await toggleAutomatedConfigActive(c.id, !c.isActive);
      toast.success(c.isActive ? "Automation paused" : "Automation resumed");
      reload();
    } catch {
      toast.error("Could not update automation");
    }
  }

  async function handleDelete(c: AutomatedInvoiceConfig) {
    try {
      await deleteAutomatedConfig(c.id);
      toast.success("Automation deleted");
      reload();
    } catch {
      toast.error("Could not delete");
    }
  }

  return (
    <>
      <PageHeader
        title="Automated Invoices"
        subtitle="Recurring invoice schedules per customer"
        action={
          <Link href="/billing/automated/new">
            <Button size="sm">
              <Plus size={14} className="mr-1.5" />
              New Automation
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Active Configs" value={activeCount} icon={PlayCircle} iconColor="green" />
        <StatsCard label="Running This Month" value={runningThisMonth} icon={Repeat} iconColor="blue" />
        <StatsCard label="Paused" value={pausedCount} icon={PauseCircle} iconColor="amber" />
        <StatsCard
          label="Next Generation"
          value={nextRun ? formatDate(nextRun) : "—"}
          icon={CalendarClock}
          iconColor="violet"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-fg">Loading automations…</p>
        </div>
      ) : configs.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-12 text-center text-muted-fg">
          No automations yet. Create one to bill a customer on a recurring schedule.
        </div>
      ) : (
        <div className="rounded-[12px] border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <Th>Config Name</Th>
                  <Th>Customer</Th>
                  <Th>Recurrence</Th>
                  <Th className="text-center">Day</Th>
                  <Th>Next Run</Th>
                  <Th>Mode</Th>
                  <Th>Status</Th>
                  <Th className="text-center">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {configs.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-surface transition-colors cursor-pointer"
                    onClick={() => router.push(`/billing/automated/${c.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-muted-fg">{c.customerName}</td>
                    <td className="px-4 py-3 text-muted-fg">
                      {RECURRENCE_LABELS[c.recurrence]}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{c.dayOfMonth}</td>
                    <td className="px-4 py-3 text-muted-fg">{formatDate(c.nextRunDate)}</td>
                    <td className="px-4 py-3 text-muted-fg">
                      {c.generationMode === "auto_send" ? "Auto-send" : "Draft"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs",
                          c.isActive
                            ? "bg-success-bg text-success"
                            : "bg-surface-2 text-muted-fg"
                        )}
                      >
                        {c.isActive ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionMenu
                        items={[
                          {
                            label: "View / Edit",
                            onClick: () => router.push(`/billing/automated/${c.id}`),
                          },
                          {
                            label: c.isActive ? "Pause" : "Resume",
                            onClick: () => handleToggle(c),
                          },
                          {
                            label: "Delete",
                            onClick: () => handleDelete(c),
                            danger: true,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg",
        className
      )}
    >
      {children}
    </th>
  );
}
