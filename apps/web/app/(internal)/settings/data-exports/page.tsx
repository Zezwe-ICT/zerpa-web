/**
 * @file app/(internal)/settings/data-exports/page.tsx
 * @description Data & Exports: download the business's records as CSV (owners and admins).
 * Files open in Excel; cells that look like formulas are neutralised on the server.
 */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadFromApi } from "@/lib/api/account";

const EXPORTS = [
  { id: "customers", label: "Customers", description: "Names, contact details, VAT numbers and payment terms" },
  { id: "invoices", label: "Invoices", description: "Every invoice with totals, VAT, amount paid and balance" },
  { id: "payments", label: "Payments", description: "Payments received, with method and reference" },
  { id: "quotes", label: "Quotes", description: "Every quote with status and who accepted it" },
  { id: "leads", label: "Leads", description: "Your sales pipeline" },
];

export default function DataExportsPage() {
  const [busy, setBusy] = useState<string | null>(null);

  async function download(id: string) {
    setBusy(id);
    try {
      await downloadFromApi(`/exports/${id}`, `zerpa-${id}-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="section-title">Data &amp; Exports</h2>
        <p className="text-sm text-muted-fg mt-1">
          Download your business&apos;s records as CSV files for your accountant, a backup, or moving to another system.
          Owners and admins only.
        </p>
      </div>

      <div className="rounded-[12px] border border-border bg-background divide-y divide-border">
        {EXPORTS.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-fg mt-0.5">{item.description}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => download(item.id)} disabled={busy === item.id}>
              <Download size={14} className="mr-1.5" />
              {busy === item.id ? "Preparing…" : "Export CSV"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
