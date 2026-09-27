/**
 * @file components/modules/purchases/bills-client.tsx
 * @description Supplier bills: list with what you owe, and a bill screen to capture, approve,
 * pay and attach the supplier's invoice. Line items and VAT work like invoices.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, CheckCircle2, Plus, Save, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { BillingLineItem, PaymentMethod } from "@zerpa/shared-types";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatsCard } from "@/components/ui/stats-card";
import { LineItemEditor } from "@/components/modules/billing/line-item-editor";
import { TotalsPanel } from "@/components/modules/billing/totals-panel";
import { Attachments } from "@/components/modules/documents/attachments";
import { SupplierQuickAdd } from "./suppliers-client";
import {
  createBill,
  getBill,
  getPayablesSummary,
  listBills,
  listSuppliers,
  payBill,
  updateBill,
  type BillStatus,
  type Supplier,
  type SupplierBill,
} from "@/lib/api/purchases";
import { ApiError } from "@/lib/api/client";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<BillStatus, string> = {
  DRAFT: "bg-surface-2 text-muted-fg border-border",
  APPROVED: "bg-info-bg text-info border-info-ring",
  PARTIALLY_PAID: "bg-warning-bg text-warning border-warning-ring",
  PAID: "bg-success-bg text-success border-success-ring",
  VOID: "bg-surface-2 text-muted-fg border-border line-through",
};
const STATUS_LABEL: Record<BillStatus, string> = {
  DRAFT: "Draft",
  APPROVED: "To pay",
  PARTIALLY_PAID: "Part-paid",
  PAID: "Paid",
  VOID: "Void",
};

export function BillStatusBadge({ status, overdue }: { status: BillStatus; overdue?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs",
        overdue ? "bg-danger-bg text-danger border-danger-ring" : STATUS_STYLE[status],
      )}
    >
      {overdue ? "Overdue" : STATUS_LABEL[status]}
    </span>
  );
}

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const today = () => new Date().toISOString().split("T")[0];

// ── List ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "open", label: "To pay" },
  { key: "DRAFT", label: "Drafts" },
  { key: "PAID", label: "Paid" },
  { key: "", label: "All" },
];

export function BillsList() {
  const { can } = usePermissions();
  const [tab, setTab] = useState("open");
  const [rows, setRows] = useState<SupplierBill[] | null>(null);
  const [summary, setSummary] = useState<{ owed: number; overdue: number; dueThisWeek: number; drafts: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getPayablesSummary().then(setSummary).catch(() => undefined);
  }, []);
  useEffect(() => {
    setRows(null);
    listBills(tab || undefined)
      .then(setRows)
      .catch((e) => setError(errorText(e, "Could not load bills")));
  }, [tab]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !rows) return rows;
    return rows.filter((b) => [b.supplierName, b.billNumber, b.reference].some((v) => v?.toLowerCase().includes(q)));
  }, [rows, query]);

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Bills"
          subtitle="What you owe suppliers. Approved bills count towards your input VAT."
          action={
            can("billing.manage") ? (
              <Button asChild className="gap-2">
                <Link href="/purchases/bills/new">
                  <Plus size={16} /> New bill
                </Link>
              </Button>
            ) : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard label="You owe" value={summary ? formatCurrency(summary.owed) : "—"} sub="Approved bills not yet paid" icon={Wallet} iconColor="blue" />
        <StatsCard label="Overdue" value={summary ? formatCurrency(summary.overdue) : "—"} sub="Past the due date" icon={Wallet} iconColor="red" />
        <StatsCard label="Due this week" value={summary ? formatCurrency(summary.dueThisWeek) : "—"} sub={summary?.drafts ? `${summary.drafts} draft${summary.drafts === 1 ? "" : "s"} to approve` : "Next 7 days"} icon={Wallet} iconColor="amber" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 rounded-[8px] border border-border p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key || "all"}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-[6px] px-3 py-1.5 text-sm font-medium",
                tab === t.key ? "bg-primary-tint text-primary" : "text-muted-fg hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search supplier or bill number" className="max-w-xs" aria-label="Search bills" />
      </div>

      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : visible === null ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-surface" />
      ) : visible.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-10 text-center">
          <p className="font-semibold">{tab === "open" ? "Nothing to pay right now" : "No bills here"}</p>
          <p className="text-sm text-muted-fg mt-1">
            Capture supplier invoices as bills to track what you owe and claim the VAT back.
          </p>
        </div>
      ) : (
        <div className="rounded-[12px] border border-border bg-background overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-fg border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Supplier</th>
                <th className="px-4 py-3 font-semibold">Bill no.</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-right">Owed</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((b) => (
                <tr key={b.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link href={`/purchases/bills/${b.id}`} className="font-medium text-primary hover:underline">
                      {b.supplierName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{b.billNumber || "—"}</td>
                  <td className="px-4 py-3">{formatDate(b.billDate)}</td>
                  <td className="px-4 py-3">{b.dueDate ? formatDate(b.dueDate) : "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(b.total)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(b.balanceDue)}</td>
                  <td className="px-4 py-3"><BillStatusBadge status={b.status} overdue={b.overdue} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}

// ── Editor / detail ─────────────────────────────────────────────────────

export function BillEditor({ billId }: { billId?: string }) {
  const router = useRouter();
  const { can } = usePermissions();
  const canManage = can("billing.manage");
  const [bill, setBill] = useState<SupplierBill | null>(null);
  const [loading, setLoading] = useState(Boolean(billId));
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ supplierId: "", billNumber: "", reference: "", billDate: today(), dueDate: "", notes: "" });
  const [items, setItems] = useState<BillingLineItem[]>([]);
  const [pay, setPay] = useState({ amount: "", paidOn: today(), method: "eft" as PaymentMethod, reference: "" });

  const editable = !bill || bill.status === "DRAFT";

  function hydrate(b: SupplierBill) {
    setBill(b);
    setForm({
      supplierId: b.supplierId,
      billNumber: b.billNumber ?? "",
      reference: b.reference ?? "",
      billDate: b.billDate,
      dueDate: b.dueDate ?? "",
      notes: b.notes ?? "",
    });
    setItems(b.lineItems);
    setPay((p) => ({ ...p, amount: String(b.balanceDue) }));
  }

  useEffect(() => {
    listSuppliers(true).then(setSuppliers).catch(() => setSuppliers([]));
  }, []);
  useEffect(() => {
    if (!billId) return;
    getBill(billId)
      .then(hydrate)
      .catch(() => {
        toast.error("Bill not found");
        router.push("/purchases/bills");
      })
      .finally(() => setLoading(false));
  }, [billId, router]);

  function onSupplier(id: string, picked?: Supplier) {
    const s = picked ?? suppliers.find((x) => x.id === id);
    setForm((f) => {
      const next = { ...f, supplierId: id };
      if (s && f.billDate) {
        const due = new Date(f.billDate);
        due.setDate(due.getDate() + s.paymentTermsDays);
        next.dueDate = due.toISOString().split("T")[0];
      }
      return next;
    });
  }

  async function save(approve = false) {
    if (!form.supplierId) {
      toast.error("Choose a supplier");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one line from the supplier's invoice");
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, dueDate: form.dueDate || null, lineItems: items, ...(approve ? { status: "APPROVED" as const } : {}) };
      let saved: SupplierBill;
      if (bill) {
        saved = await updateBill(bill.id, body);
      } else {
        saved = await createBill(body);
        router.replace(`/purchases/bills/${saved.id}`);
      }
      hydrate(saved);
      toast.success(approve ? "Bill approved" : "Bill saved");
    } catch (e) {
      toast.error(errorText(e, "Could not save the bill"));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: BillStatus) {
    if (!bill) return;
    try {
      hydrate(await updateBill(bill.id, { status }));
      toast.success(status === "VOID" ? "Bill voided" : status === "DRAFT" ? "Back to draft" : "Bill approved");
    } catch (e) {
      toast.error(errorText(e, "Could not update the bill"));
    }
  }

  async function recordPayment() {
    if (!bill) return;
    try {
      hydrate(await payBill(bill.id, { amount: Number(pay.amount), paidOn: pay.paidOn, method: pay.method, reference: pay.reference || undefined }));
      setPay((p) => ({ ...p, reference: "" }));
      toast.success("Payment recorded");
    } catch (e) {
      toast.error(errorText(e, "Could not record the payment"));
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <p className="text-muted-fg">Loading bill…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <button onClick={() => router.push("/purchases/bills")} className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4">
        <ArrowLeft size={14} /> Back to bills
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">{bill ? `${bill.supplierName}${bill.billNumber ? ` · ${bill.billNumber}` : ""}` : "New bill"}</h1>
          {bill && (
            <p className="text-sm text-muted-fg mt-1">
              Dated {formatDate(bill.billDate)}
              {bill.dueDate ? ` · Due ${formatDate(bill.dueDate)}` : ""}
            </p>
          )}
        </div>
        {bill && <BillStatusBadge status={bill.status} overdue={bill.overdue} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <fieldset disabled={!editable || !canManage} className="rounded-[12px] border border-border bg-background p-5 space-y-4 disabled:opacity-90">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <div className="flex gap-2">
                  <select
                    id="supplier"
                    value={form.supplierId}
                    onChange={(e) => onSupplier(e.target.value)}
                    className="h-10 flex-1 rounded-[8px] border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Choose a supplier…</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {editable && canManage && (
                    <SupplierQuickAdd
                      onCreated={(s) => {
                        setSuppliers((list) => [...list, s].sort((a, b) => a.name.localeCompare(b.name)));
                        onSupplier(s.id, s);
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billNumber">Supplier&apos;s invoice number</Label>
                <Input id="billNumber" value={form.billNumber} onChange={(e) => setForm({ ...form, billNumber: e.target.value })} placeholder="As printed on their invoice" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reference">Your reference / PO</Label>
                <Input id="reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billDate">Invoice date</Label>
                <Input id="billDate" type="date" value={form.billDate} onChange={(e) => setForm({ ...form, billDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label>Lines (as on the supplier&apos;s invoice)</Label>
            {editable && canManage ? (
              <LineItemEditor items={items} onChange={setItems} />
            ) : (
              <div className="rounded-[12px] border border-border bg-background divide-y divide-border text-sm">
                {items.map((li, i) => (
                  <div key={li.id ?? i} className="flex justify-between gap-3 px-4 py-2.5">
                    <span>{li.quantity} × {li.description}</span>
                    <span className="font-mono">{formatCurrency(li.lineTotal ?? 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} value={form.notes} disabled={!editable || !canManage} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="space-y-4">
          <TotalsPanel items={items} discountType="none" discountValue={0} />

          {canManage && (editable || (bill && ["DRAFT", "APPROVED"].includes(bill.status) && bill.amountPaid === 0)) && (
            <div className="rounded-[12px] border border-border bg-background p-5 space-y-2">
              {editable && (
                <>
                  <Button className="w-full" onClick={() => save(true)} disabled={saving}>
                    <CheckCircle2 size={14} className="mr-1.5" /> {saving ? "Saving…" : "Save and approve"}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => save(false)} disabled={saving}>
                    <Save size={14} className="mr-1.5" /> Save as draft
                  </Button>
                </>
              )}
              {bill?.status === "APPROVED" && bill.amountPaid === 0 && (
                <Button variant="outline" className="w-full" onClick={() => setStatus("DRAFT")}>Back to draft to edit</Button>
              )}
              {bill && ["DRAFT", "APPROVED"].includes(bill.status) && bill.amountPaid === 0 && (
                <Button variant="ghost" className="w-full text-danger hover:text-danger hover:bg-danger-bg" onClick={() => setStatus("VOID")}>
                  <Ban size={14} className="mr-1.5" /> Void bill
                </Button>
              )}
            </div>
          )}

          {bill && ["APPROVED", "PARTIALLY_PAID", "PAID"].includes(bill.status) && (
            <div className="rounded-[12px] border border-border bg-background p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Payments</span>
                <span className="font-mono text-sm">{formatCurrency(bill.amountPaid)} / {formatCurrency(bill.total)}</span>
              </div>
              {(bill.payments ?? []).length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {bill.payments!.map((p) => (
                    <li key={p.id} className="flex justify-between border-b border-border pb-1.5 last:border-0">
                      <span className="text-muted-fg">{formatDate(p.paidOn)} · {p.method.toUpperCase()}{p.reference ? ` · ${p.reference}` : ""}</span>
                      <span className="font-mono">{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {canManage && bill.balanceDue > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" step="0.01" min={0} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} aria-label="Payment amount" />
                    <Input type="date" value={pay.paidOn} onChange={(e) => setPay({ ...pay, paidOn: e.target.value })} aria-label="Payment date" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value as PaymentMethod })} className="h-10 rounded-[8px] border border-input bg-background px-2 text-sm" aria-label="Payment method">
                      <option value="eft">EFT</option>
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                    <Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} placeholder="Reference" />
                  </div>
                  <Button variant="outline" className="w-full" onClick={recordPayment}>
                    <Plus size={14} className="mr-1.5" /> Record payment
                  </Button>
                </div>
              )}
            </div>
          )}

          {bill ? (
            <Attachments relatedType="supplier_bill" relatedId={bill.id} category="supplier_invoice" label="Supplier's invoice" emptyText="Attach the PDF or a photo of the supplier's invoice. SARS needs it to back up the VAT you claim." canUpload={canManage} />
          ) : (
            <p className="rounded-[12px] border border-border p-4 text-xs text-muted-fg">Save the bill, then attach the supplier&apos;s invoice.</p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
