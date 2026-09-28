/**
 * @file app/(public)/partner/[token]/page.tsx
 * @description A Zerpa partner's private page (no login): their signup link, who they referred, and commission.
 */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiRequest, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

interface Portal {
  name: string; link: string; code: string; commissionPct: number; commissionMonths: number;
  referrals: Array<{ company: string; at: string; status: string }>;
  statement: Array<{ month: string; amount: number; paid: boolean }>;
  owed: number; accruing: number; paid: number;
}
const STATUS: Record<string, string> = { paying: "bg-success-bg text-success border-success-ring", trial: "bg-info-bg text-info border-info-ring" };
const monthFmt = new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" });

export default function PartnerPage() {
  const { token } = useParams<{ token: string }>();
  const [d, setD] = useState<Portal | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    apiRequest<Portal>(`/partner-portal/${token}`).then(setD).catch((e) => setError(e instanceof ApiError ? e.message : "We couldn't load this page."));
  }, [token]);

  if (error) return <main className="max-w-xl mx-auto px-4 py-20 text-center"><p className="font-semibold">{error}</p></main>;
  if (!d) return <main className="grid place-items-center min-h-[60vh]"><Loader2 className="animate-spin text-muted-fg" /></main>;
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Image src="/icon.png" alt="Zerpa" width={32} height={32} className="rounded-[8px]" />
        <div><p className="text-xs text-muted-fg">Zerpa partner</p><h1 className="page-title">{d.name}</h1></div>
      </div>
      <section className="rounded-[12px] border border-border bg-background p-5 space-y-3">
        <p className="text-sm">Share your link. You earn <strong>{d.commissionPct}%</strong> of what each business pays Zerpa for their first {d.commissionMonths} months.</p>
        <div className="flex gap-2">
          <code className="flex-1 min-w-0 truncate rounded-[8px] bg-surface px-3 py-2 text-sm">{d.link}</code>
          <Button variant="outline" className="gap-1.5" onClick={() => navigator.clipboard.writeText(d.link).then(() => toast.success("Link copied"))}><Copy size={14} /> Copy</Button>
        </div>
      </section>
      <div className="grid gap-3 grid-cols-3">
        {[["Owed to you", d.owed], ["This month so far", d.accruing], ["Paid to date", d.paid]].map(([k, v]) => (
          <div key={k as string} className="rounded-[12px] border border-border bg-background p-4"><p className="text-xs text-muted-fg">{k}</p><p className="font-mono text-lg font-semibold mt-1">{formatCurrency(v as number)}</p></div>
        ))}
      </div>
      <section className="rounded-[12px] border border-border bg-background">
        <h2 className="section-title px-5 pt-4">Businesses you referred ({d.referrals.length})</h2>
        {d.referrals.length === 0 ? <p className="px-5 py-4 text-sm text-muted-fg">None yet. When someone signs up with your link they appear here.</p> : (
          <ul className="divide-y divide-border mt-2">
            {d.referrals.map((r, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="flex-1">{r.company}</span>
                <span className="text-xs text-muted-fg">{formatDate(r.at)}</span>
                <span className={cn("rounded-full border px-2 py-0.5 text-xs", STATUS[r.status] ?? "bg-surface-2 text-muted-fg border-border")}>{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {d.statement.length > 0 && (
        <section className="rounded-[12px] border border-border bg-background">
          <h2 className="section-title px-5 pt-4">Commission by month</h2>
          <ul className="divide-y divide-border mt-2">
            {d.statement.map((m) => (
              <li key={m.month} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="flex-1">{monthFmt.format(new Date(`${m.month}-01T12:00:00`))}</span>
                <span className="font-mono">{formatCurrency(m.amount)}</span>
                <span className={cn("text-xs w-20 text-right", m.paid ? "text-success" : "text-muted-fg")}>{m.paid ? "Paid" : "Not paid yet"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-xs text-muted-fg text-center">Keep this link private: anyone with it can see this page. Ask Zerpa for a new link if it has been shared.</p>
    </main>
  );
}
