/**
 * @file app/(internal)/settings/data-exports/page.tsx
 * @description Data & Exports settings — download account data as CSV. Export
 * wiring is a placeholder until the backend export endpoints exist.
 */
"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const EXPORTS = [
  { id: "invoices", label: "Invoices", description: "All invoices with line items and payment status" },
  { id: "quotes", label: "Quotes", description: "All quotations and their current status" },
  { id: "customers", label: "Customers", description: "Customer records and contact details" },
  { id: "leads", label: "Leads", description: "CRM pipeline leads and activity" },
];

export default function DataExportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="section-title">Data &amp; Exports</h2>
        <p className="text-sm text-muted-fg mt-1">
          Download your account data as CSV files.
        </p>
      </div>

      <div className="rounded-[12px] border border-border bg-background divide-y divide-border">
        {EXPORTS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div>
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-fg mt-0.5">{item.description}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.info("CSV export will be available once the backend is live.")
              }
            >
              <Download size={14} className="mr-1.5" />
              Export CSV
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
