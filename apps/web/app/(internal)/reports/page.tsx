"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { getMspUtilisation, getOpsReport } from "@/lib/api/verticals";
import { downloadFile, getVatReport, type VatReport } from "@/lib/api/books";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReportsPage() {
  const { company } = useAuth();
  const [report, setReport] = useState<Record<string, number | string> | null>(null);
  const [util, setUtil] = useState<Awaited<ReturnType<typeof getMspUtilisation>> | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [vat, setVat] = useState<VatReport | null>(null);

  useEffect(() => {
    getOpsReport()
      .then(setReport)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load report"));
    if (company?.vertical === "MSP") {
      getMspUtilisation()
        .then(setUtil)
        .catch(() => setUtil(null));
    }
  }, [company?.vertical]);

  const entries = report
    ? Object.entries(report).filter(([k]) => !["companyId", "vertical"].includes(k))
    : [];

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        subtitle={report?.vertical ? `${report.vertical} operations snapshot` : "Company operations snapshot"}
      />

      {util && (
        <div className="mb-8">
          <h2 className="section-title mb-3">Utilisation</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[12px] border border-border p-5">
              <p className="text-xs uppercase text-muted-fg">Utilisation</p>
              <p className="text-2xl font-semibold mt-2">
                {util.utilisationPercent != null ? `${util.utilisationPercent}%` : "—"}
              </p>
              <p className="text-xs text-muted-fg mt-1">
                {util.billableMinutes} / {util.includedMinutes} min
              </p>
            </div>
            <div className="rounded-[12px] border border-border p-5">
              <p className="text-xs uppercase text-muted-fg">MRR</p>
              <p className="text-2xl font-semibold mt-2">R{util.mrr.toLocaleString()}</p>
            </div>
            <div className="rounded-[12px] border border-border p-5">
              <p className="text-xs uppercase text-muted-fg">Open onboardings</p>
              <p className="text-2xl font-semibold mt-2">{util.openOnboardings}</p>
            </div>
            <div className="rounded-[12px] border border-border p-5">
              <p className="text-xs uppercase text-muted-fg">SLA at risk</p>
              <p className="text-2xl font-semibold mt-2">{util.slaAtRisk}</p>
              <p className="text-xs text-muted-fg mt-1">
                Tickets: {Object.entries(util.openByType || {}).map(([k, v]) => `${k} ${v}`).join(" · ") || "none"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 max-w-xl space-y-3">
        <h2 className="section-title">VAT</h2>
        <p className="text-sm text-muted-fg">Output VAT on invoices and credit notes, less input VAT on approved supplier bills and expenses, for your SARS VAT201.</p>
        <div className="flex flex-wrap gap-2">
          <input type="date" className="rounded-[8px] border border-border px-3 py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="rounded-[8px] border border-border px-3 py-2" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button
            variant="outline"
            onClick={async () => {
              try {
                setVat(await getVatReport(from, to));
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not load the VAT report");
              }
            }}
          >
            Show
          </Button>
          <Button
            onClick={async () => {
              try {
                const query = new URLSearchParams({ download: "csv" });
                if (from) query.set("from", from);
                if (to) query.set("to", to);
                await downloadFile(`/billing/vat-report?${query.toString()}`, "vat.csv");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not download the VAT report");
              }
            }}
          >
            Download CSV
          </Button>
        </div>
        {vat && (
          <div className="space-y-2">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Output VAT", vat.outputVat, "On invoices less credit notes"],
                ["Input VAT", vat.inputVat ?? 0, "On approved bills and expenses"],
                [(vat.netVat ?? vat.outputVat) >= 0 ? "VAT payable" : "VAT refundable", Math.abs(vat.netVat ?? vat.outputVat), "Output less input"],
              ].map(([label, amount, hint]) => (
                <div key={label as string} className="rounded-[10px] border border-border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-fg">{label as string}</p>
                  <p className="text-xl font-semibold mt-1 font-mono">R {(amount as number).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-fg mt-0.5">{hint as string}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-fg">
              Standard-rated supplies R {vat.standardRatedSupplies.toLocaleString("en-ZA")} · Zero-rated R {vat.zeroRatedSupplies.toLocaleString("en-ZA")}. {vat.note}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-[12px] border border-border p-5">
            <p className="text-xs uppercase tracking-wide text-muted-fg">{key.replace(/([A-Z])/g, " $1")}</p>
            <p className="text-2xl font-semibold mt-2">{typeof value === "number" ? value.toLocaleString() : String(value)}</p>
          </div>
        ))}
        {!report && <p className="text-sm text-muted-fg">Loading…</p>}
      </div>
    </PageContainer>
  );
}
