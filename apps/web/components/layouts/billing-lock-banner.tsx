/**
 * @file components/layouts/billing-lock-banner.tsx
 * @description When a Zerpa payment has failed: a warning, then (from day 14) a read-only banner with a pay link.
 * Only people who can see billing get the details; everyone else just finds that saving is blocked.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, TriangleAlert } from "lucide-react";
import { getPlan, type ZerpaBilling } from "@/lib/api/books";
import { cn } from "@/lib/utils";

export function BillingLockBanner() {
  const [b, setB] = useState<ZerpaBilling | null>(null);
  useEffect(() => {
    getPlan().then((p) => setB(p.billing)).catch(() => undefined);
  }, []);
  if (!b || !["past_due", "read_only", "suspended"].includes(b.status)) return null;
  const locked = b.readOnly;
  return (
    <div role="alert" className={cn("flex flex-wrap items-center gap-3 border-b px-6 py-2.5 text-sm", locked ? "bg-danger/5 border-danger/30" : "bg-warning-bg border-warning-ring")}>
      {locked ? <Lock size={16} className="shrink-0 text-danger" /> : <TriangleAlert size={16} className="shrink-0 text-warning" />}
      <p className="flex-1 min-w-0">
        {b.suspended
          ? "Your Zerpa account is suspended until the outstanding payment is made. You can still export your data."
          : locked
            ? "Your Zerpa account is read-only until the outstanding payment is made. You can view and export, but not make changes."
            : `Your last Zerpa payment didn't go through. The account becomes read-only on ${b.readOnlyOn ?? "day 14"} if it stays unpaid.`}
      </p>
      {b.payUrl ? (
        <a href={b.payUrl} className="shrink-0 font-medium text-primary hover:underline">Pay now</a>
      ) : (
        <Link href="/settings/plan" className="shrink-0 font-medium text-primary hover:underline">Pay now</Link>
      )}
    </div>
  );
}
