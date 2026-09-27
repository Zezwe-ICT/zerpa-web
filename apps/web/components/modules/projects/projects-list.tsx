/**
 * @file components/modules/projects/projects-list.tsx
 * @description Projects as cards (progress, hours against budget, due date) and a new-project form.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CalendarDays, FolderKanban, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/context";
import { getBillingCustomers } from "@/lib/data/billing-customers";
import { createProject, hours, listProjects, type BillingType, type Project } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import type { BillingCustomer } from "@zerpa/shared-types";

const STATUS_TABS = [
  { key: "active", label: "Active" },
  { key: "on_hold", label: "On hold" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
];

const BLANK = { name: "", accountId: "", description: "", startDate: "", dueDate: "", billingType: "hourly" as BillingType, hourlyRate: "", fixedPrice: "", budgetHours: "" };

export function ProjectsList() {
  const router = useRouter();
  const { company } = useAuth();
  const { can } = usePermissions();
  const [status, setStatus] = useState("active");
  const [rows, setRows] = useState<Project[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [customers, setCustomers] = useState<BillingCustomer[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRows(null);
    listProjects(status).then(setRows).catch(() => setRows([]));
  }, [status]);
  useEffect(() => {
    if (adding && company?.id && customers.length === 0) getBillingCustomers(company.id).then(setCustomers).catch(() => undefined);
  }, [adding, company?.id, customers.length]);

  async function save() {
    setBusy(true);
    try {
      const p = await createProject({
        name: form.name.trim(),
        accountId: form.accountId || null,
        description: form.description.trim() || undefined,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        billingType: form.billingType,
        hourlyRate: Number(form.hourlyRate) || 0,
        fixedPrice: Number(form.fixedPrice) || 0,
        budgetHours: Number(form.budgetHours) || 0,
      });
      toast.success(`${p.name} created`);
      router.push(`/projects/${p.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create the project");
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Projects"
          subtitle="Plan the work on a board, log time on tasks, and invoice the hours."
          action={
            can("records.edit") && !adding ? (
              <Button className="gap-2" onClick={() => setAdding(true)}>
                <Plus size={16} /> New project
              </Button>
            ) : undefined
          }
        />
      </div>

      {adding && (
        <div className="rounded-[12px] border border-border bg-background p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">New project</h2>
            <button type="button" onClick={() => setAdding(false)} aria-label="Close" className="text-muted-fg hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pj-name">Project name *</Label>
              <Input id="pj-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Office 365 migration" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pj-customer">Customer</Label>
              <select id="pj-customer" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className="h-10 w-full rounded-[8px] border border-input bg-background px-3 text-sm">
                <option value="">Internal project</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pj-start">Start</Label>
              <Input id="pj-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pj-due">Due</Label>
              <Input id="pj-due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <fieldset>
            <legend className="text-sm font-medium mb-2">How do you bill it?</legend>
            <div className="flex flex-wrap gap-2">
              {([["hourly", "By the hour"], ["fixed", "Fixed price"], ["non_billable", "Not billed"]] as const).map(([key, label]) => (
                <label key={key} className={cn("flex items-center gap-2 rounded-[8px] border px-3 py-2 text-sm cursor-pointer", form.billingType === key ? "border-primary bg-primary-tint" : "border-border")}>
                  <input type="radio" name="billingType" checked={form.billingType === key} onChange={() => setForm({ ...form, billingType: key })} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {form.billingType === "hourly" && (
              <div className="space-y-1.5">
                <Label htmlFor="pj-rate">Hourly rate (excl. VAT)</Label>
                <Input id="pj-rate" type="number" min={0} step="0.01" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} placeholder="650" />
              </div>
            )}
            {form.billingType === "fixed" && (
              <div className="space-y-1.5">
                <Label htmlFor="pj-fixed">Fixed price (excl. VAT)</Label>
                <Input id="pj-fixed" type="number" min={0} step="0.01" value={form.fixedPrice} onChange={(e) => setForm({ ...form, fixedPrice: e.target.value })} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="pj-budget">Budget (hours)</Label>
              <Input id="pj-budget" type="number" min={0} step="0.5" value={form.budgetHours} onChange={(e) => setForm({ ...form, budgetHours: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pj-desc">Description</Label>
            <Textarea id="pj-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy || form.name.trim().length < 2}>{busy ? "Creating…" : "Create project"}</Button>
            <Button variant="outline" onClick={() => setAdding(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex gap-1 rounded-[8px] border border-border p-1 mb-4 w-fit" role="tablist">
        {STATUS_TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={status === t.key} onClick={() => setStatus(t.key)} className={cn("rounded-[6px] px-3 py-1.5 text-sm font-medium", status === t.key ? "bg-primary-tint text-primary" : "text-muted-fg hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {rows === null ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-[12px] bg-surface" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-10 text-center">
          <FolderKanban className="mx-auto mb-3 text-muted-fg" size={22} />
          <p className="font-semibold">No projects here</p>
          <p className="text-sm text-muted-fg mt-1">Create a project for a rollout, a migration or any job with several steps.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p, i) => {
            const budgetUse = p.budgetHours ? Math.round((p.loggedMinutes / 60 / p.budgetHours) * 100) : null;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}>
                <Link href={`/projects/${p.id}`} className="block rounded-[12px] border border-border bg-background p-5 hover:border-primary transition-colors h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-fg truncate">{p.accountName ?? "Internal"}</p>
                    </div>
                    {p.status !== "active" && <span className="text-[11px] rounded-full border border-border px-2 py-0.5 text-muted-fg capitalize">{p.status.replace("_", " ")}</span>}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-fg mb-1">
                      <span>{p.doneCount} of {p.taskCount} tasks</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-fg">
                    <span className={cn(budgetUse !== null && budgetUse > 100 && "text-danger font-medium")}>
                      {hours(p.loggedMinutes)} logged{p.budgetHours ? ` of ${p.budgetHours}h` : ""}
                    </span>
                    {p.dueDate && (
                      <span className={cn("flex items-center gap-1", p.overdue && "text-danger font-medium")}>
                        <CalendarDays size={12} /> {p.overdue ? "Overdue · " : "Due "}{formatDate(p.dueDate)}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
