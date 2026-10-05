/**
 * @file components/modules/approvals/approvals-client.tsx
 * @description Ask for approval (purchases and other spend), decide on the team's requests, and
 * set the quote total that needs approval before sending.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, ClipboardCheck, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  decideApproval,
  getQuoteApprovalLimit,
  listApprovals,
  requestApproval,
  setQuoteApprovalLimit,
  type ApprovalRequest,
  type ApprovalStatus,
} from "@/lib/api/approvals";
import { ApiError } from "@/lib/api/client";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const STATUS: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: "Waiting", className: "bg-warning-bg text-warning border-warning-ring" },
  approved: { label: "Approved", className: "bg-success-bg text-success border-success-ring" },
  rejected: { label: "Not approved", className: "bg-danger-bg text-danger border-danger-ring" },
  cancelled: { label: "Cancelled", className: "bg-surface-2 text-muted-fg border-border" },
};
const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export function ApprovalsPage() {
  const { can, loaded, role } = usePermissions();
  const canDecide = can("billing.manage");
  const [scope, setScope] = useState<"all" | "mine">("mine");
  const [rows, setRows] = useState<ApprovalRequest[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ category: "purchase", title: "", amount: "", description: "" });
  const [limit, setLimit] = useState<string>("");
  const [savedLimit, setSavedLimit] = useState<number>(0);

  useEffect(() => {
    if (loaded && canDecide) setScope("all");
  }, [loaded, canDecide]);
  useEffect(() => {
    setRows(null);
    listApprovals(scope).then(setRows).catch(() => setRows([]));
  }, [scope]);
  useEffect(() => {
    if (canDecide) getQuoteApprovalLimit().then((n) => { setSavedLimit(n); setLimit(n ? String(n) : ""); }).catch(() => undefined);
  }, [canDecide]);

  const pending = useMemo(() => (rows ?? []).filter((r) => r.canDecide), [rows]);

  async function submit() {
    try {
      const r = await requestApproval({
        category: form.category,
        title: form.title.trim(),
        amount: form.amount ? Number(form.amount) : undefined,
        description: form.description.trim() || undefined,
      });
      setRows((list) => [r, ...(list ?? [])]);
      setForm({ category: "purchase", title: "", amount: "", description: "" });
      setAdding(false);
      toast.success("Sent for approval");
    } catch (e) {
      toast.error(errorText(e, "Could not send the request"));
    }
  }

  async function decide(r: ApprovalRequest, action: "approve" | "reject" | "cancel") {
    let note: string | undefined;
    if (action === "reject") {
      note = window.prompt("Why not? They'll see this.") ?? undefined;
      if (!note) return;
    }
    try {
      const updated = await decideApproval(r.id, action, note);
      setRows((list) => (list ?? []).map((x) => (x.id === r.id ? updated : x)));
    } catch (e) {
      toast.error(errorText(e, "Could not update the request"));
    }
  }

  async function saveLimit() {
    const n = Number(limit) || 0;
    try {
      await setQuoteApprovalLimit(n);
      setSavedLimit(n);
      toast.success(n ? `Quotes over ${formatCurrency(n)} now need approval` : "Quotes no longer need approval");
    } catch (e) {
      toast.error(errorText(e, "Could not save the limit"));
    }
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Approvals"
          subtitle={canDecide && pending.length ? `${pending.length} waiting for you` : "Ask a manager before you spend or send something big"}
          action={!adding ? <Button className="gap-2" onClick={() => setAdding(true)}><Plus size={16} /> Ask for approval</Button> : undefined}
        />
      </div>

      {canDecide && (
        <div className="rounded-[12px] border border-border bg-background p-4 mb-6 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="quote-limit">Quotes that need approval before sending</Label>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-fg">Over R</span>
              <Input id="quote-limit" type="number" min={0} step="100" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="No limit" className="w-36" />
              <span className="text-muted-fg">incl. VAT</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={saveLimit} disabled={(Number(limit) || 0) === savedLimit}>Save</Button>
          <p className="text-xs text-muted-fg basis-full">{savedLimit ? `Now: quotes over ${formatCurrency(savedLimit)} are held until someone approves them.` : "Now: any quote can be sent straight away."}</p>
        </div>
      )}

      {adding && (
        <div className="rounded-[12px] border border-border bg-background p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Ask for approval</h2>
            <button type="button" onClick={() => setAdding(false)} aria-label="Close" className="text-muted-fg hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ap-cat">For</Label>
              <select id="ap-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 w-full rounded-[8px] border border-input bg-background px-3 text-sm">
                <option value="purchase">A purchase</option>
                <option value="discount">A discount</option>
                <option value="general">Something else</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ap-title">What do you need? *</Label>
              <Input id="ap-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Replacement laptop for Sipho" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-amount">Amount (R)</Label>
              <Input id="ap-amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ap-desc">Why</Label>
              <Textarea id="ap-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A line or two helps it get approved quickly" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={form.title.trim().length < 3}>Send for approval</Button>
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {canDecide && (
        <div className="flex gap-1 rounded-[8px] border border-border p-1 mb-4 w-fit" role="tablist">
          {([["all", "Team"], ["mine", "Mine"]] as const).map(([key, label]) => (
            <button key={key} role="tab" aria-selected={scope === key} onClick={() => setScope(key)} className={cn("rounded-[6px] px-3 py-1.5 text-sm font-medium", scope === key ? "bg-primary-tint text-primary" : "text-muted-fg hover:text-foreground")}>{label}</button>
          ))}
        </div>
      )}

      {rows === null ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-surface" />
      ) : rows.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-10 text-center">
          <ClipboardCheck className="mx-auto mb-3 text-muted-fg" size={22} />
          <p className="font-semibold">No requests yet</p>
          <p className="text-sm text-muted-fg mt-1">Ask before you buy something or offer a big discount. Large quotes ask here automatically.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <motion.li key={r.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }} className="rounded-[12px] border border-border bg-background p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {r.link ? <Link href={r.link} className="hover:underline text-primary">{r.title}</Link> : r.title}
                  </p>
                  <p className="text-xs text-muted-fg mt-0.5">
                    {r.categoryLabel} · {r.isMine ? "You" : r.requestedBy.name} · {formatDate(r.createdAt)}
                    {r.decidedBy ? ` · ${r.status === "approved" ? "Approved" : "Decided"} by ${r.decidedBy}` : ""}
                  </p>
                  {r.description && <p className="text-sm mt-2">{r.description}</p>}
                  {r.decisionNote && <p className="text-sm mt-2 rounded-[8px] bg-surface px-3 py-2"><span className="text-muted-fg">{r.decidedBy}: </span>{r.decisionNote}</p>}
                </div>
                {r.amount !== null && <span className="font-mono font-semibold">{formatCurrency(r.amount)}</span>}
                <span className={cn("rounded-full border px-2 py-0.5 font-mono text-xs", STATUS[r.status].className)}>{STATUS[r.status].label}</span>
              </div>
              {r.status === "pending" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {r.canDecide && (!r.isMine || role === "OWNER") && (
                    <>
                      <Button size="sm" onClick={() => decide(r, "approve")}><Check size={14} className="mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => decide(r, "reject")}>Reject</Button>
                    </>
                  )}
                  {r.isMine && <Button size="sm" variant="ghost" onClick={() => decide(r, "cancel")}>Cancel request</Button>}
                </div>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
