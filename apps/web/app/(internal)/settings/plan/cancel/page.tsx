/**
 * @file app/(internal)/settings/plan/cancel/page.tsx
 * @description Cancel or pause the Zerpa plan: tell us why, see an option that fits the reason, then decide.
 * Nothing is deleted: cancelling moves the company to the Free plan and keeps its data.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CalendarClock, Download, PauseCircle, PhoneCall, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cancelPlan, getCancelReasons, getPlan, type CancelChoice, type CancelReason, type CompanyPlan } from "@/lib/api/books";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const OFFER_COPY = {
  downgrade: { icon: TrendingDown, title: "Move to the Free plan instead", body: "Keep one app and up to 3 users for R 0, with all your records. You can upgrade again any time.", cta: "Move to Free" },
  pause: { icon: PauseCircle, title: "Pause instead of cancelling", body: "Take 1 to 3 months off. Nothing is charged, you can still sign in, and everything is here when you're back.", cta: "Pause my plan" },
  call: { icon: PhoneCall, title: "Let us fix it with you", body: "Someone from the Zerpa team calls you within a working day, sets things up with you, or tells you honestly if Zerpa can't do it.", cta: "Yes, call me" },
} as const;

export default function CancelPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<CompanyPlan | null>(null);
  const [reasons, setReasons] = useState<CancelReason[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState<CancelChoice | null>(null);

  useEffect(() => {
    getPlan().then(setPlan).catch(() => undefined);
    getCancelReasons().then(setReasons).catch((e) => toast.error(e instanceof ApiError ? e.message : "Only an admin can change the plan"));
  }, []);

  const picked = reasons.find((r) => r.key === reason);
  const offer = picked?.offer ? OFFER_COPY[picked.offer] : null;

  async function decide(choice: CancelChoice) {
    setBusy(choice);
    try {
      const r = await cancelPlan({ reason, choice, detail: detail.trim(), competitor: competitor.trim(), pauseMonths: months });
      if (choice === "call" && r.ticketId) {
        toast.success("Thanks. We'll call you within a working day.");
        router.push(`/help/tickets/${r.ticketId}`);
        return;
      }
      toast.success(choice === "pause" ? `Paused until ${r.pausedUntil}` : choice === "downgrade" ? "You're on the Free plan now" : "Your plan is cancelled. Your data is still here.");
      router.push("/settings/plan");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update the plan");
      setBusy(null);
    }
  }

  return (
    <PageContainer>
      <Link href="/settings/plan" className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4 w-fit"><ArrowLeft size={14} /> Plan</Link>
      <div className="max-w-2xl">
        <div className="mb-6">
          <PageHeader title="Cancel or pause" subtitle={plan ? `You're on ${plan.label}. Nothing is deleted either way.` : "Nothing is deleted either way."} />
        </div>
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="why" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium mb-2">What&apos;s the main reason?</legend>
                {reasons.map((r) => (
                  <label key={r.key} className={cn("flex items-center gap-3 rounded-[10px] border px-4 py-3 text-sm cursor-pointer transition-colors", reason === r.key ? "border-primary bg-primary-tint" : "border-border hover:bg-surface")}>
                    <input type="radio" name="reason" value={r.key} checked={reason === r.key} onChange={() => setReason(r.key)} className="accent-[var(--color-primary)]" />
                    {r.label}
                  </label>
                ))}
              </fieldset>
              {reason === "switching" && (
                <Input value={competitor} onChange={(e) => setCompetitor(e.target.value)} placeholder="Which tool are you moving to? (optional)" aria-label="Which tool" />
              )}
              {reason && (
                <Textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)}
                  placeholder={reason === "missing_feature" ? "What do you need that Zerpa doesn't do?" : "Anything else we should know? (optional)"} aria-label="Details" />
              )}
              <Button disabled={!reason} onClick={() => setStep(2)}>Continue</Button>
            </motion.div>
          ) : (
            <motion.div key="decide" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-5">
              {offer && picked?.offer && (
                <div className="rounded-[14px] border border-primary-ring bg-primary-tint p-5">
                  <div className="flex items-start gap-3">
                    <offer.icon size={22} className="text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold">{offer.title}</p>
                      <p className="text-sm text-muted-fg">{offer.body}</p>
                      {picked.offer === "pause" && (
                        <div className="flex gap-2 pt-1" role="radiogroup" aria-label="How long">
                          {[1, 2, 3].map((m) => (
                            <button key={m} type="button" role="radio" aria-checked={months === m} onClick={() => setMonths(m)}
                              className={cn("rounded-full border px-3 py-1 text-sm", months === m ? "border-primary bg-background text-primary" : "border-border text-muted-fg")}>
                              {m} month{m > 1 ? "s" : ""}
                            </button>
                          ))}
                        </div>
                      )}
                      <Button className="mt-2" disabled={!!busy} onClick={() => decide(picked.offer!)}>{busy === picked.offer ? "Saving…" : offer.cta}</Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="rounded-[14px] border border-border p-5 space-y-3">
                <p className="font-semibold">Cancel my plan</p>
                <ul className="text-sm text-muted-fg space-y-1.5">
                  <li className="flex gap-2"><CalendarClock size={15} className="shrink-0 mt-0.5" /> You move to the Free plan straight away: one app and up to 3 users.</li>
                  <li className="flex gap-2"><Download size={15} className="shrink-0 mt-0.5" /> Your records stay. You can <Link href="/settings/data-exports" className="underline underline-offset-2">export everything</Link> at any time.</li>
                </ul>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={!!busy} onClick={() => decide("cancel")}>{busy === "cancel" ? "Cancelling…" : "Cancel my plan"}</Button>
                  <Button variant="ghost" disabled={!!busy} onClick={() => setStep(1)}>Back</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  );
}
