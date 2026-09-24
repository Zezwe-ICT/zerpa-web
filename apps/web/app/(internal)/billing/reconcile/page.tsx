/**
 * @file app/(internal)/billing/reconcile/page.tsx
 * @description Bank matching: upload a bank statement CSV, review suggested invoice matches for
 * each incoming payment, and record the confirmed ones as EFT payments in one go.
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileUp, Landmark } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { commitMatches, previewStatement, type OpenInvoice, type StatementLine } from "@/lib/api/payments";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type Choice = { invoiceId: string; include: boolean };

export default function ReconcilePage() {
  const [fileName, setFileName] = useState("");
  const [lines, setLines] = useState<StatementLine[] | null>(null);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setFileName(file.name);
    try {
      const res = await previewStatement(await file.text());
      setLines(res.lines);
      setOpenInvoices(res.openInvoices);
      setChoices(
        Object.fromEntries(
          res.lines
            .filter((l) => l.status === "suggested")
            .map((l) => [l.fingerprint, { invoiceId: l.invoiceId!, include: l.confidence === "high" || l.confidence === "medium" }]),
        ),
      );
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not read that file");
      setLines(null);
    } finally {
      setBusy(false);
    }
  }

  const selected = useMemo(
    () => (lines ?? []).filter((l) => choices[l.fingerprint]?.include && choices[l.fingerprint]?.invoiceId),
    [lines, choices],
  );

  async function confirm() {
    setBusy(true);
    try {
      const res = await commitMatches(
        selected.map((l) => ({
          fingerprint: l.fingerprint,
          invoiceId: choices[l.fingerprint].invoiceId,
          amount: l.amount,
          date: l.date,
          description: l.description,
        })),
      );
      const recorded = new Set(res.recorded.map((r) => r.fingerprint));
      setLines((prev) => prev?.map((l) => (recorded.has(l.fingerprint) ? { ...l, status: "already_matched" } : l)) ?? null);
      setChoices((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !recorded.has(k))));
      if (res.recorded.length) toast.success(`${res.recorded.length} payment${res.recorded.length === 1 ? "" : "s"} recorded`);
      if (res.skipped.length) toast.error(`${res.skipped.length} skipped: ${res.skipped.map((s) => s.reason).join("; ")}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not record the payments");
    } finally {
      setBusy(false);
    }
  }

  const counts = {
    suggested: (lines ?? []).filter((l) => l.status === "suggested").length,
    unmatched: (lines ?? []).filter((l) => l.status === "unmatched").length,
    done: (lines ?? []).filter((l) => l.status === "already_matched").length,
  };

  return (
    <PageContainer>
      <PageHeader
        title="Bank matching"
        subtitle="Upload your bank statement and Zerpa matches incoming payments to open invoices."
      />

      <label
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-[12px] border border-dashed border-border p-8 text-center hover:border-primary",
          busy && "opacity-60",
        )}
      >
        <FileUp size={24} className="text-primary" />
        <span className="text-sm font-medium">{fileName || "Choose a CSV bank statement"}</span>
        <span className="text-xs text-muted-fg">
          Download a CSV from your online banking (FNB, Standard Bank, Absa, Nedbank, Capitec…). We only read incoming
          payments; uploading the same statement twice won&apos;t double-count anything.
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          disabled={busy}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>

      {lines && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-fg">
            {lines.length} incoming payment{lines.length === 1 ? "" : "s"} · {counts.suggested} matched ·{" "}
            {counts.unmatched} need you · {counts.done} already recorded
          </p>

          {lines.length === 0 && (
            <p className="text-sm text-muted-fg">No incoming payments found in this file.</p>
          )}

          <div className="overflow-x-auto rounded-[12px] border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-fg">
                  <th className="p-3 w-8" />
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Bank reference</th>
                  <th className="p-3 font-medium text-right">Amount</th>
                  <th className="p-3 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const choice = choices[l.fingerprint];
                  const done = l.status === "already_matched";
                  return (
                    <tr key={l.fingerprint} className={cn("border-b border-border last:border-0", done && "opacity-60")}>
                      <td className="p-3">
                        {!done && (
                          <input
                            type="checkbox"
                            aria-label="Record this payment"
                            checked={!!choice?.include}
                            disabled={!choice?.invoiceId}
                            onChange={(e) =>
                              setChoices((p) => ({ ...p, [l.fingerprint]: { ...p[l.fingerprint], include: e.target.checked } }))
                            }
                          />
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">{formatDate(l.date)}</td>
                      <td className="p-3">
                        {l.description}
                        {l.reason && <span className="block text-xs text-muted-fg">{l.reason}</span>}
                      </td>
                      <td className="p-3 text-right font-mono whitespace-nowrap">{formatCurrency(l.amount)}</td>
                      <td className="p-3 min-w-[16rem]">
                        {done ? (
                          <span className="text-xs text-muted-fg">Already recorded</span>
                        ) : (
                          <select
                            aria-label="Invoice"
                            value={choice?.invoiceId ?? ""}
                            onChange={(e) =>
                              setChoices((p) => ({
                                ...p,
                                [l.fingerprint]: { invoiceId: e.target.value, include: Boolean(e.target.value) },
                              }))
                            }
                            className={cn(
                              "h-9 w-full rounded-[6px] border bg-background px-2 text-sm",
                              l.confidence === "check" ? "border-danger" : "border-border",
                            )}
                          >
                            <option value="">Not an invoice payment</option>
                            {openInvoices.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.invoiceNumber} · {inv.customerName || "No name"} · {formatCurrency(inv.balanceDue)} due
                              </option>
                            ))}
                          </select>
                        )}
                        {l.confidence === "check" && (
                          <span className="block text-xs text-danger mt-1">More than the balance owed — check before recording.</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/billing/invoices" className="text-sm text-muted-fg hover:text-foreground">
              Back to invoices
            </Link>
            <Button onClick={confirm} disabled={busy || selected.length === 0}>
              <Landmark size={14} className="mr-1.5" />
              Record {selected.length} payment{selected.length === 1 ? "" : "s"} (
              {formatCurrency(selected.reduce((a, l) => a + l.amount, 0))})
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
