/**
 * @file components/modules/expenses/expenses-client.tsx
 * @description Expenses: submit your own with a slip, and (for billing managers) approve,
 * reject with a reason, and reimburse the team's.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Plus, ReceiptText, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Attachments } from "@/components/modules/documents/attachments";
import {
  createExpense,
  decideExpense,
  deleteExpense,
  expenseCategories,
  listExpenses,
  type Expense,
  type ExpenseStatus,
} from "@/lib/api/expenses";
import { ApiError } from "@/lib/api/client";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const STATUS: Record<ExpenseStatus, { label: string; className: string }> = {
  SUBMITTED: { label: "Waiting", className: "bg-warning-bg text-warning border-warning-ring" },
  APPROVED: { label: "Approved", className: "bg-info-bg text-info border-info-ring" },
  REJECTED: { label: "Rejected", className: "bg-danger-bg text-danger border-danger-ring" },
  REIMBURSED: { label: "Reimbursed", className: "bg-success-bg text-success border-success-ring" },
};

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const today = () => new Date().toISOString().split("T")[0];
const BLANK = { merchant: "", category: "fuel", spentOn: today(), amount: "", vatClaimable: true, paidBy: "employee" as "employee" | "company", description: "" };

export function ExpensesPage() {
  const { can, loaded, role } = usePermissions();
  const canViewAll = can("billing.view");
  const canManage = can("billing.manage");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [rows, setRows] = useState<Expense[] | null>(null);
  const [categories, setCategories] = useState<Array<{ key: string; label: string }>>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    expenseCategories().then(setCategories).catch(() => setCategories([]));
  }, []);
  useEffect(() => {
    if (loaded && canViewAll) setScope("all");
  }, [loaded, canViewAll]);
  useEffect(() => {
    setRows(null);
    listExpenses(scope).then(setRows).catch(() => setRows([]));
  }, [scope]);

  const waiting = useMemo(() => (rows ?? []).filter((e) => e.canDecide), [rows]);
  const toReimburse = useMemo(
    () => (rows ?? []).filter((e) => e.status === "APPROVED" && e.paidBy === "employee").reduce((a, e) => a + e.amount, 0),
    [rows],
  );

  function replace(updated: Expense) {
    setRows((list) => (list ?? []).map((e) => (e.id === updated.id ? updated : e)));
  }

  async function submit() {
    setBusy(true);
    try {
      const created = await createExpense({
        merchant: form.merchant.trim(),
        category: form.category,
        spentOn: form.spentOn,
        amount: Number(form.amount),
        vatClaimable: form.vatClaimable,
        paidBy: form.paidBy,
        description: form.description.trim() || undefined,
      });
      setRows((list) => [created, ...(list ?? [])]);
      setForm({ ...BLANK, spentOn: today() });
      setAdding(false);
      setOpen(created.id);
      setJustAdded(created.id);
      toast.success("Expense submitted. Attach the slip below.");
    } catch (e) {
      toast.error(errorText(e, "Could not submit the expense"));
    } finally {
      setBusy(false);
    }
  }

  async function decide(e: Expense, action: "approve" | "reject" | "reimburse") {
    let note: string | undefined;
    if (action === "reject") {
      note = window.prompt("Why are you rejecting it? They'll see this.") ?? undefined;
      if (!note) return;
    }
    try {
      replace(await decideExpense(e.id, action, note));
      toast.success({ approve: "Approved", reject: "Rejected", reimburse: "Marked as reimbursed" }[action]);
    } catch (err) {
      toast.error(errorText(err, "Could not update the expense"));
    }
  }

  async function remove(e: Expense) {
    if (!window.confirm(`Delete the ${formatCurrency(e.amount)} expense at ${e.merchant}?`)) return;
    try {
      await deleteExpense(e.id);
      setRows((list) => (list ?? []).filter((x) => x.id !== e.id));
    } catch (err) {
      toast.error(errorText(err, "Could not delete the expense"));
    }
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Expenses"
          subtitle={
            canManage && waiting.length
              ? `${waiting.length} waiting for approval${toReimburse ? ` · ${formatCurrency(toReimburse)} to reimburse` : ""}`
              : "Submit a slip and get paid back"
          }
          action={
            !adding ? (
              <Button className="gap-2" onClick={() => setAdding(true)}>
                <Plus size={16} /> New expense
              </Button>
            ) : undefined
          }
        />
      </div>

      {adding && (
        <div className="rounded-[12px] border border-border bg-background p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">New expense</h2>
            <button type="button" onClick={() => setAdding(false)} aria-label="Close" className="text-muted-fg hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="exp-merchant">Where *</Label>
              <Input id="exp-merchant" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="e.g. Engen Rivonia" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Total on the slip (incl. VAT) *</Label>
              <Input id="exp-amount" type="number" inputMode="decimal" step="0.01" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-category">Category</Label>
              <select id="exp-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 w-full rounded-[8px] border border-input bg-background px-3 text-sm">
                {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date on the slip</Label>
              <Input id="exp-date" type="date" max={today()} value={form.spentOn} onChange={(e) => setForm({ ...form, spentOn: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exp-desc">What was it for?</Label>
              <Input id="exp-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Call-out to Acme, Sandton" />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-1">Who paid?</legend>
            <div className="flex flex-wrap gap-2">
              {([["employee", "I paid, pay me back"], ["company", "Company card or account"]] as const).map(([key, label]) => (
                <label key={key} className={cn("flex items-center gap-2 rounded-[8px] border px-3 py-2 text-sm cursor-pointer", form.paidBy === key ? "border-primary bg-primary-tint" : "border-border")}>
                  <input type="radio" name="paidBy" checked={form.paidBy === key} onChange={() => setForm({ ...form, paidBy: key })} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={form.vatClaimable} onChange={(e) => setForm({ ...form, vatClaimable: e.target.checked })} />
            <span>
              The slip is a tax invoice with the seller&apos;s VAT number
              <span className="block text-xs text-muted-fg">Then the 15% VAT on it can be claimed back.</span>
            </span>
          </label>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={busy || form.merchant.trim().length < 2 || !(Number(form.amount) > 0)}>
              {busy ? "Submitting…" : "Submit expense"}
            </Button>
            <Button variant="outline" onClick={() => setAdding(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}

      {canViewAll && (
        <div className="flex gap-1 rounded-[8px] border border-border p-1 mb-4 w-fit" role="tablist">
          {([["all", "Team"], ["mine", "Mine"]] as const).map(([key, label]) => (
            <button key={key} role="tab" aria-selected={scope === key} onClick={() => setScope(key)} className={cn("rounded-[6px] px-3 py-1.5 text-sm font-medium", scope === key ? "bg-primary-tint text-primary" : "text-muted-fg hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>
      )}

      {rows === null ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-surface" />
      ) : rows.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-10 text-center">
          <ReceiptText className="mx-auto mb-3 text-muted-fg" size={22} />
          <p className="font-semibold">No expenses yet</p>
          <p className="text-sm text-muted-fg mt-1">Spent your own money on the business? Submit it with a photo of the slip.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((e) => {
            const expanded = open === e.id;
            return (
              <div key={e.id} className={cn("rounded-[12px] border bg-background", justAdded === e.id ? "border-primary" : "border-border")}>
                <button type="button" onClick={() => setOpen(expanded ? null : e.id)} className="w-full flex flex-wrap items-center gap-3 p-4 text-left" aria-expanded={expanded}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{e.merchant} <span className="text-muted-fg font-normal">· {e.categoryLabel}</span></p>
                    <p className="text-xs text-muted-fg mt-0.5 truncate">
                      {formatDate(e.spentOn)}
                      {!e.isMine ? ` · ${e.submittedBy.name}` : ""}
                      {e.description ? ` · ${e.description}` : ""}
                    </p>
                  </div>
                  <span className="font-mono font-semibold">{formatCurrency(e.amount)}</span>
                  <span className={cn("rounded-full border px-2 py-0.5 font-mono text-xs", STATUS[e.status].className)}>{STATUS[e.status].label}</span>
                  <ChevronDown size={16} className={cn("text-muted-fg transition-transform", expanded && "rotate-180")} />
                </button>
                {expanded && (
                  <div className="border-t border-border p-4 grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-fg">VAT: </span>{e.vatClaimable ? `${formatCurrency(e.taxAmount)} claimable` : "Not claimable (no tax invoice)"}</p>
                      <p><span className="text-muted-fg">Paid by: </span>{e.paidBy === "employee" ? `${e.submittedBy.name} (to reimburse)` : "Company"}</p>
                      {e.decisionNote && <p className="rounded-[8px] bg-surface px-3 py-2"><span className="text-muted-fg">{e.decidedBy}: </span>{e.decisionNote}</p>}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {e.canDecide && (!e.isMine || role === "OWNER") && (
                          <>
                            <Button size="sm" onClick={() => decide(e, "approve")}><Check size={14} className="mr-1" /> Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => decide(e, "reject")}>Reject</Button>
                          </>
                        )}
                        {e.canDecide && e.isMine && role !== "OWNER" && (
                          <p className="text-xs text-muted-fg">Someone else approves your own expenses.</p>
                        )}
                        {canManage && e.status === "APPROVED" && e.paidBy === "employee" && (
                          <Button size="sm" variant="outline" onClick={() => decide(e, "reimburse")}>Mark as reimbursed</Button>
                        )}
                        {e.isMine && ["SUBMITTED", "REJECTED"].includes(e.status) && (
                          <Button size="sm" variant="ghost" className="text-danger hover:text-danger hover:bg-danger-bg" onClick={() => remove(e)}>
                            <Trash2 size={14} className="mr-1" /> Delete
                          </Button>
                        )}
                      </div>
                    </div>
                    <Attachments relatedType="expense" relatedId={e.id} category="expense_slip" label="Slip" emptyText="Attach a photo of the slip." canUpload={e.isMine} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
