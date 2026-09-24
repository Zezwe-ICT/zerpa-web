/**
 * @file app/(public)/pay/[token]/page.tsx
 * @description Public invoice payment page. Anyone with the link can see the invoice and pay it
 * by card / instant EFT (PayFast), pay-by-bank (Ozow) or manual EFT with the invoice number as reference.
 */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Building2, CheckCircle2, Copy, CreditCard, Landmark, Loader2, Lock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { ApiError } from "@/lib/api/client";
import { getPublicInvoice, startCheckout, submitProviderForm, type PublicInvoice } from "@/lib/api/payments";

export default function PayInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const [returned, setReturned] = useState<string | null>(null);
  const [data, setData] = useState<PublicInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState<string | null>(null);

  useEffect(() => {
    setReturned(new URLSearchParams(window.location.search).get("status"));
  }, []);

  useEffect(() => {
    if (!token) return;
    getPublicInvoice(token)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "We couldn't load this invoice."));
  }, [token]);

  // Back from the provider: poll until the payment notification lands (up to ~2 minutes).
  const waiting = returned === "return" && !!data && data.invoice.balanceDue > 0;
  useEffect(() => {
    if (!waiting) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      getPublicInvoice(token).then(setData).catch(() => undefined);
      if (tries >= 24) clearInterval(timer);
    }, 5000);
    return () => clearInterval(timer);
  }, [waiting, token]);

  async function pay(method: string) {
    setRedirecting(method);
    try {
      const form = await startCheckout(token, method);
      submitProviderForm(form.action, form.fields);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not start the payment. Please try again.");
      setRedirecting(null);
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.message(text);
    }
  }

  if (error) {
    return (
      <Shell>
        <div className="text-center space-y-2 py-10">
          <XCircle size={36} className="mx-auto text-danger" />
          <h1 className="text-lg font-semibold">This payment link doesn&apos;t work</h1>
          <p className="text-sm text-muted-fg">{error} Ask the business that sent it for a new link.</p>
        </div>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <p className="py-16 text-center text-sm text-muted-fg">Loading invoice…</p>
      </Shell>
    );
  }

  const { company, invoice, methods, eft } = data;
  const paid = invoice.status === "PAID" || invoice.balanceDue <= 0;

  return (
    <Shell companyName={company.name}>
      {returned === "return" && !paid && (
        <Banner tone="info">
          Thanks! We&apos;re waiting for confirmation from your bank. This page updates once the payment clears —
          usually within a few minutes.
        </Banner>
      )}
      {returned === "cancelled" && !paid && (
        <Banner tone="warn">The payment was cancelled. Nothing was taken from your account. You can try again below.</Banner>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-fg">Invoice {invoice.invoiceNumber}</p>
          <h1 className="text-2xl font-bold mt-1">
            {paid ? "Paid in full" : `${formatCurrency(invoice.balanceDue, invoice.currency)} due`}
          </h1>
          <p className="text-sm text-muted-fg mt-1">
            {invoice.customerName ? `For ${invoice.customerName} · ` : ""}
            {invoice.issuedDate ? `Issued ${formatDate(invoice.issuedDate)}` : ""}
            {invoice.dueDate && !paid ? ` · Due ${formatDate(invoice.dueDate)}` : ""}
          </p>
        </div>
        {paid && <CheckCircle2 size={36} className="text-primary" />}
      </div>

      {!paid && data.canPay && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">How would you like to pay?</h2>
          {methods.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => pay(m.key)}
              disabled={!!redirecting}
              className="flex w-full items-center gap-3 rounded-[10px] border border-border p-4 text-left hover:border-primary disabled:opacity-60"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
                {m.key === "payfast" ? <CreditCard size={18} /> : <Landmark size={18} />}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block text-xs text-muted-fg">
                  Secure checkout by {m.provider}
                  {m.test ? " · test mode, no real money is taken" : ""}
                </span>
              </span>
              {redirecting === m.key ? (
                <Loader2 size={16} className="animate-spin text-muted-fg" />
              ) : (
                <span className="text-sm font-medium text-primary">
                  Pay {formatCurrency(invoice.balanceDue, invoice.currency)}
                </span>
              )}
            </button>
          ))}

          {eft && (
            <div className="rounded-[10px] border border-border p-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Building2 size={16} className="text-primary" /> Pay by EFT from your bank
              </p>
              <dl className="grid grid-cols-[8rem_1fr] gap-y-1.5 text-sm">
                {[
                  ["Bank", eft.bankName],
                  ["Account holder", eft.accountHolder],
                  ["Account number", eft.bankAccountNumber],
                  ["Branch code", eft.bankBranchCode],
                  ["Account type", eft.bankAccountType],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="text-muted-fg">{label}</dt>
                      <dd className="font-mono">{value}</dd>
                    </div>
                  ))}
                <dt className="text-muted-fg">Reference</dt>
                <dd className="flex items-center gap-2 font-mono font-semibold">
                  {eft.reference}
                  <button
                    type="button"
                    onClick={() => copy(eft.reference, "Reference")}
                    className="text-primary"
                    aria-label="Copy reference"
                  >
                    <Copy size={14} />
                  </button>
                </dd>
              </dl>
              <p className="text-xs text-muted-fg">
                Use <strong>{eft.reference}</strong> as your reference so the payment is matched to this invoice.
                {eft.proofOfPaymentEmail ? ` Send proof of payment to ${eft.proofOfPaymentEmail}.` : ""} EFTs can take
                1–2 working days to clear.
              </p>
            </div>
          )}

          {methods.length === 0 && !eft && (
            <p className="text-sm text-muted-fg">
              Online payment isn&apos;t set up for this business yet. Please contact {company.name}
              {company.email ? ` at ${company.email}` : ""} to arrange payment.
            </p>
          )}
        </section>
      )}

      <section className="rounded-[10px] border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-fg">
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium text-right">Qty</th>
              <th className="p-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="p-3">{li.description}</td>
                <td className="p-3 text-right">{li.quantity}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(li.lineTotal, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="border-t border-border p-3 space-y-1 text-sm">
          <Row label="Subtotal" value={formatCurrency(invoice.subtotal, invoice.currency)} />
          {invoice.discountAmount > 0 && (
            <Row label="Discount" value={`− ${formatCurrency(invoice.discountAmount, invoice.currency)}`} />
          )}
          <Row label="VAT" value={formatCurrency(invoice.taxAmount, invoice.currency)} />
          <Row label="Total" value={formatCurrency(invoice.total, invoice.currency)} strong />
          {invoice.amountPaid > 0 && (
            <>
              <Row label="Paid" value={`− ${formatCurrency(invoice.amountPaid, invoice.currency)}`} />
              <Row label="Balance due" value={formatCurrency(invoice.balanceDue, invoice.currency)} strong />
            </>
          )}
        </dl>
      </section>

      {invoice.notes && <p className="text-xs text-muted-fg whitespace-pre-line">{invoice.notes}</p>}
    </Shell>
  );
}

function Shell({ children, companyName }: { children: React.ReactNode; companyName?: string }) {
  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        {companyName && <p className="text-center text-sm font-semibold">{companyName}</p>}
        <div className="rounded-[16px] border border-border bg-background p-6 sm:p-8 space-y-6">{children}</div>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-fg">
          <Lock size={12} /> Payments are processed securely by the payment provider. Powered by Zerpa.
        </p>
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  return (
    <div
      className={
        tone === "info"
          ? "rounded-[10px] border border-info-ring bg-info-bg p-3 text-sm text-info"
          : "rounded-[10px] border border-border bg-surface p-3 text-sm"
      }
    >
      {children}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : "text-muted-fg"}`}>
      <dt>{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}
