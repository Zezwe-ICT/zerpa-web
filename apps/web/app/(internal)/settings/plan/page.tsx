"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CreditCard, FileText, Lock, Minus, PauseCircle, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  choosePlan, getPlan, getZerpaCharges, resumePlan, startCheckout, verifyCheckout,
  type CompanyPlan, type PlanSpec, type ZerpaCharge,
} from "@/lib/api/books";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

type Interval = "monthly" | "annual";
const R = (n: number) => formatCurrency(n, "ZAR", n % 1 ? 2 : 0);
const day = (iso: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—");

function features(p: PlanSpec) {
  const out: string[] = [];
  out.push(p.apps == null ? (p.industryPacks ? "All apps" : "All apps except industry apps") : `${p.apps} app`);
  out.push(p.users != null ? `Up to ${p.users} users` : `${p.includedUsers} users included, then ${R(p.extraUser ?? 0)} each`);
  if (p.industryPacks) out.push(`${p.industryPacks} industry pack${p.industryPacks > 1 ? "s" : ""}`);
  if (p.companies > 1) out.push(`${p.companies} companies`);
  if (p.prioritySupport) out.push("Priority support");
  out.push("Portal customers are free");
  return out;
}

function Stepper({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex items-center rounded-[6px] border border-border">
      <button type="button" aria-label="Fewer" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} className="px-2 py-1 disabled:opacity-40"><Minus size={13} /></button>
      <span className="w-8 text-center text-sm tabular-nums">{value}</span>
      <button type="button" aria-label="More" disabled={disabled} onClick={() => onChange(value + 1)} className="px-2 py-1 disabled:opacity-40"><Plus size={13} /></button>
    </div>
  );
}

function PlanPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [plan, setPlan] = useState<CompanyPlan | null>(null);
  const [charges, setCharges] = useState<ZerpaCharge[]>([]);
  const [period, setPeriod] = useState<Interval>("monthly");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const p = await getPlan();
      setPlan(p);
      setPeriod(p.interval ?? "monthly");
      getZerpaCharges().then(setCharges).catch(() => undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the plan");
    }
  }, []);

  useEffect(() => {
    const paid = params.get("paid") || params.get("reference");
    if (!paid) {
      load();
      return;
    }
    // back from Paystack: confirm the payment (the webhook may still be on its way)
    verifyCheckout(paid)
      .then(({ charge, plan: p }) => {
        setPlan(p);
        setPeriod(p.interval);
        if (charge.status === "success") toast.success(`Payment of ${R(charge.total)} received. Thank you.`);
        else if (charge.status === "failed") toast.error(`The payment did not go through${charge.failureReason ? `: ${charge.failureReason}` : ""}.`);
        else toast.message("We're waiting for Paystack to confirm your payment. This page updates when it does.");
        getZerpaCharges().then(setCharges).catch(() => undefined);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Could not check the payment");
        load();
      })
      .finally(() => router.replace("/settings/plan"));
  }, [params, load, router]);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy("");
    }
  }

  const pay = (code: string, method: "card" | "eft") =>
    run(`${code}-${method}`, async () => {
      const r = await startCheckout({ plan: code, interval: period, addons: code === plan?.plan ? plan.addons : {}, method });
      if (r.preview) {
        toast.message(r.message ?? "Preview mode: nothing was charged.");
        return;
      }
      if (method === "card" && r.authorizationUrl) {
        window.location.href = r.authorizationUrl; // Paystack's hosted checkout, then back to ?paid=<reference>
        return;
      }
      toast.success(r.message ?? "We emailed your invoice.");
      await load();
    });

  const trial = (code: string) =>
    run(code, async () => {
      const p = await choosePlan(code, { interval: period });
      setPlan(p);
      toast.success(p.note ?? (code === "free" ? "Free plan saved" : "Plan changed"));
    });

  const setAddon = (code: string, qty: number) =>
    plan?.plan &&
    run(`addon-${code}`, async () => {
      const addons = { ...plan.addons, [code]: Math.max(qty, 0) };
      setPlan(await choosePlan(plan.plan!, { addons }));
    });

  if (!plan) {
    return (
      <PageContainer>
        <PageHeader title="Plan" subtitle="Company packs with users included. Prices exclude VAT." />
      </PageContainer>
    );
  }

  const b = plan.billing;
  const current = plan.plans.find((p) => p.code === plan.plan);
  const paying = ["active", "past_due", "read_only", "suspended"].includes(b.status);
  const late = ["past_due", "read_only", "suspended"].includes(b.status);
  const ch = plan.charge;

  return (
    <PageContainer>
      <PageHeader title="Plan" subtitle="Company packs with users included. Prices exclude VAT (15%). Portal customers are always free." />
      <div className="space-y-6 max-w-5xl">
        {late && (
          <div role="alert" className={cn("flex flex-wrap items-center gap-3 rounded-[12px] border p-4 text-sm", b.readOnly ? "border-danger/30 bg-danger/5" : "border-warning-ring bg-warning-bg")}>
            {b.readOnly ? <Lock size={18} className="text-danger" /> : <TriangleAlert size={18} className="text-warning" />}
            <span className="flex-1 min-w-[240px]">
              {b.suspended
                ? <>Your account is <strong>suspended</strong> because a Zerpa payment is outstanding. You can still export your data. Paying unlocks everything straight away.</>
                : b.readOnly
                  ? <>Your account is <strong>read-only</strong> because a Zerpa payment is outstanding. Your team can view and export, but not change anything until it&apos;s paid.</>
                  : <>Your last Zerpa payment didn&apos;t go through{b.lastFailure ? ` (${b.lastFailure.reason})` : ""}. The account becomes read-only on <strong>{day(b.readOnlyOn)}</strong> if it stays unpaid.</>}
              {b.amountDue != null && <> Amount due: <strong>{R(b.amountDue)}</strong>.</>}
            </span>
            {b.payUrl && <Button size="sm" asChild><a href={b.payUrl}>Pay now</a></Button>}
            {plan.plan && plan.plan !== "free" && (
              <Button size="sm" variant={b.payUrl ? "outline" : "default"} disabled={!!busy} onClick={() => pay(plan.plan!, "card")}><CreditCard size={14} /> Pay with a card</Button>
            )}
          </div>
        )}

        {plan.pausedUntil && (
          <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-info-ring bg-info-bg p-4 text-sm">
            <PauseCircle size={18} className="text-info" />
            <span className="flex-1">Your plan is paused until <strong>{plan.pausedUntil}</strong>. Nothing is charged while paused, and your data stays here.</span>
            <Button size="sm" variant="outline" onClick={() => run("resume", async () => {
              setPlan(await resumePlan());
              toast.success("Welcome back. Your plan is active again.");
            })}>Resume now</Button>
          </div>
        )}

        <section className="rounded-[12px] border border-border p-5 grid gap-5 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-fg">Your plan</p>
            <p className="text-xl font-semibold">
              {plan.label}
              {plan.plan && plan.plan !== "free" && <span className="ml-2 text-sm font-normal text-muted-fg">{plan.interval === "annual" ? "billed annually" : "billed monthly"}</span>}
            </p>
            <p className="text-sm text-muted-fg">
              {plan.trialActive && plan.trialEndsOn ? `Free trial until ${day(plan.trialEndsOn)}. ` : ""}
              {plan.usersUsed} user{plan.usersUsed === 1 ? "" : "s"}
              {plan.userLimit != null ? ` of ${plan.userLimit}` : plan.includedUsers != null ? ` (${plan.includedUsers} included${ch?.extraUsers ? `, ${ch.extraUsers} extra at ${R(ch.extraUserPrice)} each` : ""})` : ""}
              {" · "}{plan.appsUsed} apps{plan.appLimit != null ? ` of ${plan.appLimit}` : ""}
              {plan.industryPackLimit != null && plan.plan !== "free" ? ` · industry packs ${plan.industryPacksUsed.length} of ${plan.industryPackLimit}` : ""}
            </p>
            {paying && (
              <p className="text-sm">
                {b.method === "card" ? <>Paying by card{b.card ? ` (${b.card.brand} •••• ${b.card.last4})` : ""}</> : <>Paying by EFT invoice</>}
                {b.nextChargeOn && <> · next charge {day(b.nextChargeOn)}</>}
                {b.cancelAtPeriodEnd && b.periodEnd && <> · ends {day(b.periodEnd)}</>}
              </p>
            )}
            {plan.priceLockedUntil && <p className="text-xs text-success">Founding price locked until {day(plan.priceLockedUntil)}.</p>}
            {plan.note && <p className="text-sm text-muted-fg">{plan.note}</p>}
            {!b.live && plan.plan && plan.plan !== "free" && <p className="text-xs text-muted-fg">Zerpa billing is in preview mode here, so nothing is charged.</p>}
          </div>
          {ch && plan.plan !== "free" && (
            <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-sm self-start">
              <dt className="text-muted-fg">Base{plan.interval === "annual" ? " (per month, billed yearly)" : ""}</dt><dd className="text-right tabular-nums">{R(ch.base)}</dd>
              {ch.extraUsers > 0 && <><dt className="text-muted-fg">{ch.extraUsers} extra user{ch.extraUsers > 1 ? "s" : ""}</dt><dd className="text-right tabular-nums">{R(ch.extraUsersAmount)}</dd></>}
              {ch.addons.map((a) => <div key={a.code} className="contents"><dt className="text-muted-fg">{a.label} × {a.quantity}</dt><dd className="text-right tabular-nums">{R(a.amount)}</dd></div>)}
              <dt className="text-muted-fg">VAT</dt><dd className="text-right tabular-nums">{R(ch.vat)}</dd>
              <dt className="font-semibold">Per month</dt><dd className="text-right font-semibold tabular-nums">{R(ch.total)}</dd>
            </dl>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Plans</h2>
          <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-[8px] border border-border p-0.5 text-sm">
            {(["monthly", "annual"] as Interval[]).map((i) => (
              <button key={i} type="button" role="radio" aria-checked={period === i} onClick={() => setPeriod(i)}
                className={cn("rounded-[6px] px-3 py-1.5", period === i ? "bg-primary text-primary-fg" : "text-muted-fg hover:text-foreground")}>
                {i === "monthly" ? "Monthly" : `Annual: ${plan.annualMonthsCharged} months for 12, no launch fee`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plan.plans.map((p) => {
            const q = plan.quotes[p.code]?.[period];
            const isCurrent = plan.plan === p.code;
            const annual = period === "annual";
            return (
              <div key={p.code} className={cn("rounded-[12px] border p-4 flex flex-col gap-3", p.code === "industry" ? "border-primary" : "border-border", isCurrent && "bg-surface")}>
                <div>
                  <p className="font-semibold flex items-center gap-2">{p.label}{isCurrent && <span className="text-[11px] font-normal text-primary">Current</span>}</p>
                  {p.code === "free" ? (
                    <p className="text-2xl font-semibold mt-1">R 0</p>
                  ) : (
                    <>
                      <p className="text-2xl font-semibold mt-1 tabular-nums">{R(annual ? q?.basePeriod.subtotal ?? 0 : p.base)}<span className="text-sm font-normal text-muted-fg"> / {annual ? "year" : "month"}</span></p>
                      <p className="text-xs text-muted-fg">
                        {annual ? `${R(q?.base ?? 0)} a month equivalent. No launch fee.` : `Launch fee ${R(p.launchFee)} once-off, or none on annual.`}
                      </p>
                    </>
                  )}
                </div>
                <ul className="space-y-1 text-xs text-muted-fg flex-1">
                  {features(p).map((f) => <li key={f} className="flex gap-1.5"><Check size={12} className="mt-0.5 shrink-0 text-primary" />{f}</li>)}
                </ul>
                {q && p.code !== "free" && (
                  <p className="text-xs">For your {q.users} user{q.users === 1 ? "" : "s"}: <strong className="tabular-nums">{R(q.subtotal)}</strong> a month excl VAT{q.extraUsers ? ` (${q.extraUsers} extra)` : ""}</p>
                )}
                <div className="flex flex-col gap-2">
                  {p.code === "free" ? (
                    <Button size="sm" variant="outline" disabled={isCurrent || !!busy || paying} onClick={() => trial("free")}>{isCurrent ? "Current" : "Choose Free"}</Button>
                  ) : paying && b.method === "card" ? (
                    <Button size="sm" variant={isCurrent ? "outline" : "default"} disabled={(isCurrent && plan.interval === period) || !!busy}
                      onClick={() => run(p.code, async () => {
                        const np = await choosePlan(p.code, { interval: period });
                        setPlan(np);
                        toast.success(np.note ?? "Plan changed");
                      })}>
                      {isCurrent ? (plan.interval === period ? "Current" : `Switch to ${period}`) : `Switch to ${p.label}`}
                    </Button>
                  ) : (
                    <>
                      {!isCurrent && !paying && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => trial(p.code)}>Start 14-day trial</Button>}
                      <Button size="sm" disabled={!!busy} onClick={() => pay(p.code, "card")}><CreditCard size={14} /> Pay by card</Button>
                      <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => pay(p.code, "eft")}><FileText size={14} /> Pay by EFT invoice</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {plan.plan && plan.plan !== "free" && current && (
          <section className="rounded-[12px] border border-border p-5 space-y-3">
            <div>
              <h2 className="text-base font-semibold">Add-ons</h2>
              <p className="text-sm text-muted-fg">Billed monthly on top of your plan{paying ? ", from your next charge" : ""}.</p>
            </div>
            <ul className="divide-y divide-border">
              {plan.addonCatalog.map((a) => {
                const disabled = a.code === "industry_pack" && current.industryPacks === 0;
                return (
                  <li key={a.code} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <span className="flex-1 min-w-[200px]">
                      <span className="font-medium">{a.label}</span> <span className="text-muted-fg">{R(a.price)} a month</span>
                      {disabled && <span className="block text-xs text-muted-fg">Industry packs come with Industry and Scale.</span>}
                    </span>
                    <Stepper value={plan.addons[a.code] ?? 0} disabled={disabled || busy === `addon-${a.code}`} onChange={(v) => setAddon(a.code, v)} />
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {charges.length > 0 && (
          <section className="rounded-[12px] border border-border p-5 space-y-3">
            <h2 className="text-base font-semibold">Payments to Zerpa</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-fg"><tr><th className="py-1 pr-3 font-normal">Date</th><th className="py-1 pr-3 font-normal">Invoice</th><th className="py-1 pr-3 font-normal">Method</th><th className="py-1 pr-3 font-normal">Status</th><th className="py-1 text-right font-normal">Total</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {charges.map((c) => (
                    <tr key={c.reference}>
                      <td className="py-2 pr-3">{day(c.paidAt ?? c.createdAt)}</td>
                      <td className="py-2 pr-3">{c.invoiceNumber ?? "—"}{c.launchFee > 0 && <span className="block text-xs text-muted-fg">incl. launch fee</span>}</td>
                      <td className="py-2 pr-3">{c.method === "card" ? "Card" : "EFT"}</td>
                      <td className="py-2 pr-3">
                        {c.status === "success" ? "Paid" : c.status === "failed" ? <span className="text-danger">Failed</span> : c.status === "pending" ? (c.payUrl ? <a className="text-primary underline" href={c.payUrl}>Pay now</a> : "Waiting") : "Replaced"}
                      </td>
                      <td className="py-2 text-right tabular-nums">{R(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {plan.plan && plan.plan !== "free" && !plan.pausedUntil && (
          <p className="text-sm text-muted-fg">
            Need a break or thinking of leaving? <Link href="/settings/plan/cancel" className="text-foreground underline underline-offset-2 hover:text-primary">Cancel or pause</Link>
          </p>
        )}
      </div>
    </PageContainer>
  );
}

export default function PlanPage() {
  return (
    <Suspense>
      <PlanPageInner />
    </Suspense>
  );
}
