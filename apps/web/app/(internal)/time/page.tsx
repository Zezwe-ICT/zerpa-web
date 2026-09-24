"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { listTimeEntries } from "@/lib/api/msp";
import { toast } from "sonner";

export default function TimePage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    listTimeEntries().then(setRows).catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader title="Time" subtitle="Billable and non-billable technician time" />
      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="text-left px-4 py-3">Ticket</th>
              <th className="text-left px-4 py-3">Minutes</th>
              <th className="text-left px-4 py-3">Billable</th>
              <th className="text-left px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono">{row.ticketNumber || row.ticketId}</td>
                <td className="px-4 py-3">{row.minutes}</td>
                <td className="px-4 py-3">{row.billable ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{row.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
