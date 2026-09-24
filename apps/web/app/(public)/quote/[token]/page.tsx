/**
 * @file app/(public)/quote/[token]/page.tsx
 * @description Public quote page. The customer reads the quote and accepts it by typing their
 * name and ticking the terms box, or declines with an optional reason. No login needed.
 */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Clock, CreditCard, FileText, Loader2, Lock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, formatDatetime } from "@/lib/utils/dates";
import { ApiError } from "@/lib/api/client";
import { getPublicQuote, respondToQuote, type PublicQuote } from "@/lib/api/payments";

type Mode = "idle" | "accept" | "decline";

export default function PublicQuotePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    getPublicQuote(token)
      .then((d) => {
        setData(d);
        setName(d.quote.contactPerson || "");
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "We couldn't load this quote."));
  }, [token]);

  async function submit() {
    setBusy(true);
    try {
      const next =
        mode === "accept"
          ? await respondToQuote(token, { action: "accept", name: name.trim(), email: email.trim() || undefined, agree: true })
          : await respondToQuote(token, { action: "decline", reason: reason.trim() || undefined });
      setData(next);
      setMode("idle");
      if (mode === "accept" && next.deposit?.payUrl && !next.deposit.paid) {
        window.location.href = next.deposit.payUrl;
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <Shell>
        <div className="text-center space-y-2 py-10">
          <XCircle size={36} className="mx-auto text-danger" />
          <h1 className="text-lg font-semibold">This quote link doesn&apos;t work</h1>
          <p className="text-sm text-muted-fg">{error} Ask the business that sent it for a new link.</p>
        </div>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <p className="py-16 text-center text-sm text-muted-fg">Loading quote…</p>
      </Shell>
    );
  }

  const { company, quote, response, deposit } = data;
  const accepted = quote.status === "accepted" || quote.status === "converted";
  const canAccept = name.trim().length >= 2 && agree;

  return (
    <Shell companyName={company.name}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-fg">Quote {quote.quoteNumber}</p>
          <h1 className="text-2xl font-bold mt-1">{quote.subject || `Quote for ${quote.customerName}`}</h1>
          <p className="text-sm text-muted-fg mt-1">
            From {company.name} to {quote.customerName}
            {quote.issueDate ? ` · ${formatDate(quote.issueDate)}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-fg">Total incl. VAT</p>
          <p className="text-2xl font-bold font-mono">{formatCurrency(quote.total, quote.currency)}</p>
        </div>
      </div>

      {accepted && (
        <Status tone="good" icon={<CheckCircle2 size={18} />}>
          Accepted{response.name ? ` by ${response.name}` : ""}
          {response.at ? ` on ${formatDatetime(response.at)}` : ""}. {company.name} will be in touch about next steps.
        </Status>
      )}
      {accepted && deposit?.payUrl && (
        <div className="rounded-[10px] border border-border p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {deposit.paid ? "Deposit paid — thank you" : `Deposit due: ${formatCurrency(deposit.amount, quote.currency)}`}
            </p>
            <p className="text-xs text-muted-fg">
              {deposit.percent}% deposit · invoice {deposit.invoiceNumber}
            </p>
          </div>
          {!deposit.paid && (
            <Button asChild>
              <a href={deposit.payUrl}>
                <CreditCard size={14} className="mr-1.5" /> Pay deposit
              </a>
            </Button>
          )}
        </div>
      )}
      {quote.status === "declined" && (
        <Status tone="neutral" icon={<XCircle size={18} />}>
          You declined this quote{response.at ? ` on ${formatDate(response.at)}` : ""}. Contact {company.name} if you&apos;d
          like an updated quote.
        </Status>
      )}
      {quote.status === "expired" && (
        <Status tone="neutral" icon={<Clock size={18} />}>
          This quote expired on {formatDate(quote.expiryDate)}. Ask {company.name} for an updated quote.
        </Status>
      )}
      {quote.status === "void" && (
        <Status tone="neutral" icon={<XCircle size={18} />}>
          {company.name} has withdrawn this quote.
        </Status>
      )}
      {data.canRespond && deposit && (
        <p className="rounded-[10px] border border-border bg-surface p-3 text-sm">
          A <strong>{deposit.percent}% deposit of {formatCurrency(deposit.amount, quote.currency)}</strong> is payable when
          you accept. You&apos;ll be able to pay it online straight away.
        </p>
      )}
      {data.canRespond && quote.expiryDate && (
        <p className="flex items-center gap-2 text-sm text-muted-fg">
          <Clock size={14} /> Valid until {formatDate(quote.expiryDate)}
        </p>
      )}

      {quote.scopeOfWork && (
        <Section title="Scope of work">
          <p className="text-sm whitespace-pre-line">{quote.scopeOfWork}</p>
        </Section>
      )}

      <section className="rounded-[10px] border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-fg">
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium text-right">Qty</th>
              <th className="p-3 font-medium text-right">Price</th>
              <th className="p-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((li, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="p-3">
                  {li.description}
                  {li.discountPercent > 0 && (
                    <span className="block text-xs text-muted-fg">{li.discountPercent}% discount</span>
                  )}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  {li.quantity}
                  {li.unit ? ` ${li.unit}` : ""}
                </td>
                <td className="p-3 text-right font-mono whitespace-nowrap">{formatCurrency(li.unitPrice, quote.currency)}</td>
                <td className="p-3 text-right font-mono whitespace-nowrap">{formatCurrency(li.lineTotal, quote.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="border-t border-border p-3 space-y-1 text-sm">
          <Row label="Subtotal" value={formatCurrency(quote.subtotal, quote.currency)} />
          {quote.discountAmount > 0 && <Row label="Discount" value={`− ${formatCurrency(quote.discountAmount, quote.currency)}`} />}
          <Row label="VAT" value={formatCurrency(quote.taxAmount, quote.currency)} />
          <Row label="Total" value={formatCurrency(quote.total, quote.currency)} strong />
        </dl>
      </section>

      {quote.paymentTerms && (
        <Section title="Payment terms">
          <p className="text-sm whitespace-pre-line">{quote.paymentTerms}</p>
        </Section>
      )}
      {quote.termsAndConditions && (
        <Section title="Terms and conditions">
          <p className="text-xs text-muted-fg whitespace-pre-line max-h-64 overflow-y-auto">{quote.termsAndConditions}</p>
        </Section>
      )}
      {quote.notes && <p className="text-xs text-muted-fg whitespace-pre-line">{quote.notes}</p>}

      {data.canRespond && mode === "idle" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="flex-1" onClick={() => setMode("accept")}>
            <CheckCircle2 size={16} className="mr-2" /> Accept quote
          </Button>
          <Button size="lg" variant="outline" onClick={() => setMode("decline")}>
            Decline
          </Button>
        </div>
      )}

      {data.canRespond && mode === "accept" && (
        <div className="rounded-[10px] border border-primary/40 bg-primary/5 p-4 space-y-3">
          <h2 className="text-sm font-semibold">
            Accept {formatCurrency(quote.total, quote.currency)}
            {deposit ? ` · ${formatCurrency(deposit.amount, quote.currency)} deposit due now` : ""}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="acceptName" className="text-xs font-medium">
                Your full name *
              </label>
              <Input id="acceptName" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="acceptEmail" className="text-xs font-medium">
                Your email (optional)
              </label>
              <Input
                id="acceptEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              I accept this quote{quote.termsAndConditions ? " and its terms and conditions" : ""} on behalf of{" "}
              {quote.customerName}, and I&apos;m authorised to do so.
            </span>
          </label>
          <p className="text-xs text-muted-fg">
            Typing your name and ticking the box counts as your signature. We record the date, time and your
            connection details with your acceptance.
          </p>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={!canAccept || busy}>
              {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5" />}
              {deposit ? "Accept, sign and pay deposit" : "Accept and sign"}
            </Button>
            <Button variant="ghost" onClick={() => setMode("idle")} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {data.canRespond && mode === "decline" && (
        <div className="rounded-[10px] border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold">Decline this quote</h2>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={`Optional: let ${company.name} know why, e.g. price, timing, found another supplier`}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={submit} disabled={busy}>
              {busy ? "Sending…" : "Decline quote"}
            </Button>
            <Button variant="ghost" onClick={() => setMode("idle")} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, companyName }: { children: React.ReactNode; companyName?: string }) {
  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {companyName && (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold">
            <FileText size={14} className="text-primary" /> {companyName}
          </p>
        )}
        <div className="rounded-[16px] border border-border bg-background p-6 sm:p-8 space-y-6">{children}</div>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-fg">
          <Lock size={12} /> Secure link. Powered by Zerpa.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-fg">{title}</h2>
      {children}
    </section>
  );
}

function Status({ tone, icon, children }: { tone: "good" | "neutral"; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className={
        tone === "good"
          ? "flex items-start gap-2 rounded-[10px] border border-primary/40 bg-primary/5 p-3 text-sm"
          : "flex items-start gap-2 rounded-[10px] border border-border bg-surface p-3 text-sm"
      }
    >
      <span className={tone === "good" ? "text-primary" : "text-muted-fg"}>{icon}</span>
      <span>{children}</span>
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
