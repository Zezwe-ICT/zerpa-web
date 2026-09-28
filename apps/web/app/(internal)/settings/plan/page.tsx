"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PauseCircle } from "lucide-react";
import { choosePlan, getPlan, resumePlan, type CompanyPlan } from "@/lib/api/books";
import { toast } from "sonner";

export default function PlanPage() {
  const [plan, setPlan] = useState<CompanyPlan | null>(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    getPlan().then(setPlan).catch((e) => toast.error(e instanceof Error ? e.message : "Could not load the plan"));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Plan"
        subtitle="Free, Standard, or Industry Pack. A paid plan starts a 14-day trial. No card is charged."
      />
      {plan && (
        <div className="space-y-4 max-w-3xl">
          <p className="text-sm text-foreground">
            Current: <strong>{plan.label}</strong>
            {plan.trialActive && plan.trialEndsOn ? ` · trial until ${plan.trialEndsOn}` : ""}
            {" · "}
            {plan.usersUsed} users
            {plan.userLimit != null ? ` of ${plan.userLimit}` : ""}
            {" · "}
            {plan.appsUsed} apps
            {plan.appLimit != null ? ` of ${plan.appLimit}` : ""}
          </p>
          {plan.note && <p className="text-sm text-muted-fg">{plan.note}</p>}
          {plan.pausedUntil && (
            <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-info-ring bg-info-bg p-4 text-sm">
              <PauseCircle size={18} className="text-info" />
              <span className="flex-1">Your plan is paused until <strong>{plan.pausedUntil}</strong>. Nothing is charged while paused, and your data stays here.</span>
              <Button size="sm" variant="outline" onClick={async () => {
                try {
                  setPlan(await resumePlan());
                  toast.success("Welcome back. Your plan is active again.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not resume");
                }
              }}>Resume now</Button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {plan.plans.map((row) => (
              <div key={row.code} className="rounded-[12px] border border-border p-4 space-y-2">
                <p className="font-semibold">{row.label}</p>
                <p className="text-sm text-muted-fg">
                  {row.pricePerUser === 0 ? "R 0" : `R ${row.pricePerUser} per user / month`}
                </p>
                <p className="text-xs text-muted-fg">
                  {row.apps == null ? "All apps" : `${row.apps} app`} · {row.users == null ? "Unlimited users" : `${row.users} users`}
                  . Portal customers are free.
                </p>
                <Button
                  size="sm"
                  variant={plan.plan === row.code ? "outline" : "default"}
                  disabled={busy === row.code || plan.plan === row.code}
                  onClick={async () => {
                    setBusy(row.code);
                    try {
                      setPlan(await choosePlan(row.code));
                      toast.success(row.pricePerUser === 0 ? "Free plan saved" : "Trial started. No card was charged.");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not change the plan");
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  {plan.plan === row.code ? "Current" : "Choose"}
                </Button>
              </div>
            ))}
          </div>
          {plan.plan && plan.plan !== "free" && !plan.pausedUntil && (
            <p className="text-sm text-muted-fg pt-2">
              Need a break or thinking of leaving? <Link href="/settings/plan/cancel" className="text-foreground underline underline-offset-2 hover:text-primary">Cancel or pause</Link>
            </p>
          )}
        </div>
      )}
    </PageContainer>
  );
}
