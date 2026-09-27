/**
 * @file components/modules/billing/credit-notes-client.tsx
 * @description Credit notes list and read-only detail (with refunds). Credit notes are issued
 * from an invoice ("Credit note" on the invoice page), never edited afterwards.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Chatter } from "@/components/chatter/chatter";
import type { Invoice, PaymentMethod } from "@zerpa/shared-types";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { listCreditNotes, recordRefund } from "@/lib/api/credit-notes";
import { getBillingInvoiceById } from "@/lib/data/invoices";
import { downloadFile } from "@/lib/api/books";
import { ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";

export function CreditNotesList() {
  const [rows, setRows] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCreditNotes()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load credit notes"));
  }, []);

  const refundsDue = (rows ?? []).reduce((a, r) => a + (r.refundDue ?? 0), 0);

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Credit notes"
          subtitle={
            rows === null
              ? "Loading…"
              : `${rows.length} credit note${rows.length === 1 ? "" : "s"}${refundsDue > 0 ? ` · ${formatCurrency(refundsDue)} to refund to customers` : ""}`
          }
        />
      </div>
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : rows === null ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-surface" />
      ) : rows.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-10 text-center">
          <Undo2 className="mx-auto mb-3 text-muted-fg" size={22} />
          <p className="font-semibold">No credit notes yet</p>
          <p className="text-sm text-muted-fg mt-1 max-w-md mx-auto">
            To correct an issued invoice, open it and choose <strong>Credit note</strong>. You can credit the whole
            invoice, some lines, or an amount.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/billing/invoices">Go to invoices</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-[12px] border border-border bg-background overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-fg border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Number</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Against</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link href={`/billing/credit-notes/${r.id}`} className="font-medium text-primary hover:underline">
                      {r.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.tenantName || "—"}</td>
                  <td className="px-4 py-3">
                    {r.creditOfId ? (
                      <Link href={`/billing/invoices/${r.creditOfId}`} className="hover:underline">
                        {r.creditOfNumber}
                      </Link>
                    ) : (
                      <span className="text-muted-fg">Account credit</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDate(r.issuedDate)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(Math.abs(r.total))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                    {(r.refundDue ?? 0) > 0 && (
                      <span className="ml-2 text-xs text-warning">{formatCurrency(r.refundDue!)} to refund</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}

export function CreditNoteDetail({ id }: { id: string }) {
  const router = useRouter();
  const [credit, setCredit] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("eft");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBillingInvoiceById(id)
      .then((row) => {
        setCredit(row);
        if (row?.refundDue) setAmount(String(row.refundDue));
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function refund() {
    if (!credit) return;
    setBusy(true);
    try {
      const updated = await recordRefund(credit.id, { amount: Number(amount), method, reference: reference || undefined });
      setCredit(updated);
      setReference("");
      toast.success("Refund recorded");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not record the refund");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <p className="text-muted-fg">Loading credit note…</p>
      </PageContainer>
    );
  }
  if (!credit || credit.type !== "CREDIT") {
    return (
      <PageContainer>
        <p className="text-sm text-danger">Credit note not found.</p>
      </PageContainer>
    );
  }

  const total = Math.abs(credit.total);
  return (
    <PageContainer>
      <button
        onClick={() => router.push("/billing/credit-notes")}
        className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} /> Back to credit notes
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Credit note {credit.invoiceNumber}</h1>
          <p className="text-sm text-muted-fg mt-1">
            {credit.tenantName} · {formatDate(credit.issuedDate)}
            {credit.creditOfId && (
              <>
                {" · against "}
                <Link href={`/billing/invoices/${credit.creditOfId}`} className="text-primary hover:underline">
                  {credit.creditOfNumber}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={credit.status} />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadFile(`/billing/invoices/${credit.id}/pdf`, `${credit.invoiceNumber}.pdf`).catch((e) =>
                toast.error(e instanceof Error ? e.message : "Could not download the PDF"),
              )
            }
          >
            <FileText size={14} className="mr-1.5" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {credit.reason && (
            <div className="rounded-[12px] border border-border bg-background p-4 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Reason</span>
              <p className="mt-1">{credit.reason}</p>
            </div>
          )}
          <div className="rounded-[12px] border border-border bg-background overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-fg border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Unit price</th>
                  <th className="px-4 py-3 font-semibold text-right">VAT</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {credit.lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="px-4 py-3">{li.description}</td>
                    <td className="px-4 py-3 text-right">{li.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(li.unitPrice)}</td>
                    <td className="px-4 py-3 text-right">{li.taxRate}%</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(li.lineTotal ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-border px-4 py-3 text-sm space-y-1 text-right">
              <p>Subtotal <span className="font-mono ml-4">{formatCurrency(Math.abs(credit.subtotal))}</span></p>
              <p>VAT <span className="font-mono ml-4">{formatCurrency(Math.abs(credit.taxAmount))}</span></p>
              <p className="font-semibold">Credit total <span className="font-mono ml-4">{formatCurrency(total)}</span></p>
            </div>
          </div>
          <Chatter recordType="invoice" recordId={credit.id} />
        </div>

        <div className="space-y-4">
          <div className="rounded-[12px] border border-border bg-background p-5 space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-fg">How it was used</span>
            <div className="flex justify-between"><span>Taken off the invoice</span><span className="font-mono">{formatCurrency(credit.appliedAmount ?? 0)}</span></div>
            <div className="flex justify-between"><span>Refunded</span><span className="font-mono">{formatCurrency(credit.refundedAmount ?? 0)}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-2">
              <span>Refund still owed</span><span className="font-mono">{formatCurrency(credit.refundDue ?? 0)}</span>
            </div>
          </div>

          {(credit.refundDue ?? 0) > 0 && (
            <div className="rounded-[12px] border border-warning-ring bg-warning-bg p-5 space-y-3">
              <p className="text-sm">
                The customer had already paid, so you owe them {formatCurrency(credit.refundDue!)}. Record the refund
                once you&apos;ve paid it back.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" step="0.01" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Refund amount" />
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="h-10 rounded-[8px] border border-input bg-background px-2 text-sm"
                  aria-label="Refund method"
                >
                  <option value="eft">EFT</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference (optional)" />
              <Button className="w-full" onClick={refund} disabled={busy || !(Number(amount) > 0)}>
                {busy ? "Saving…" : "Record refund"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
