/**
 * @file components/modules/leave/leave-client.tsx
 * @description Leave: your balances, request leave (working days counted without weekends and SA
 * public holidays), your requests, and for managers the requests to decide and who's off.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarOff, Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  decideLeave,
  getLeaveCalendar,
  getMyBalances,
  listLeaveRequests,
  listLeaveTypes,
  requestLeave,
  type LeaveBalance,
  type LeaveCalendar,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
} from "@/lib/api/leave";
import { ApiError } from "@/lib/api/client";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const STATUS: Record<LeaveStatus, { label: string; className: string }> = {
  pending: { label: "Waiting", className: "bg-warning-bg text-warning border-warning-ring" },
  approved: { label: "Approved", className: "bg-success-bg text-success border-success-ring" },
  rejected: { label: "Declined", className: "bg-danger-bg text-danger border-danger-ring" },
  cancelled: { label: "Cancelled", className: "bg-surface-2 text-muted-fg border-border" },
};
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

function countWorkingDays(start: string, end: string, holidays: Set<string>, halfDay: boolean) {
  if (!start || !end || end < start) return 0;
  let n = 0;
  const d = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (d <= last) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && !holidays.has(iso(d))) n += 1;
    d.setDate(d.getDate() + 1);
  }
  return halfDay ? (n ? 0.5 : 0) : n;
}

function span(start: string, end: string) {
  return start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`;
}

export function LeavePage() {
  const { can, loaded, role } = usePermissions();
  const canManage = can("team.manage");
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[] | null>(null);
  const [mine, setMine] = useState<LeaveRequest[] | null>(null);
  const [team, setTeam] = useState<LeaveRequest[]>([]);
  const [calendar, setCalendar] = useState<LeaveCalendar | null>(null);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ typeId: "", startDate: "", endDate: "", halfDay: false, reason: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const [t, b, m] = await Promise.all([listLeaveTypes(), getMyBalances(), listLeaveRequests("mine")]);
    setTypes(t.filter((x) => x.isActive));
    setBalances(b.balances);
    setMine(m);
  }
  useEffect(() => {
    load().catch(() => setMine([]));
    const now = new Date();
    const from = iso(now);
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);
    getLeaveCalendar(from, iso(in30)).then(setCalendar).catch(() => undefined);
    const y = now.getFullYear();
    getLeaveCalendar(`${y}-01-01`, `${y + 1}-12-31`).then((c) => setHolidays(new Set(c.holidays.map((h) => h.date)))).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (loaded && canManage) listLeaveRequests("team").then(setTeam).catch(() => undefined);
  }, [loaded, canManage]);

  const days = useMemo(
    () => countWorkingDays(form.startDate, form.endDate || form.startDate, holidays, form.halfDay),
    [form, holidays],
  );
  const selectedBalance = balances?.find((b) => b.type.id === form.typeId);
  const toDecide = team.filter((r) => r.canDecide);

  async function submit() {
    setBusy(true);
    try {
      await requestLeave({ ...form, endDate: form.endDate || form.startDate, reason: form.reason || undefined });
      toast.success("Leave requested");
      setAdding(false);
      setForm({ typeId: form.typeId, startDate: "", endDate: "", halfDay: false, reason: "" });
      await load();
    } catch (e) {
      toast.error(errorText(e, "Could not request leave"));
    } finally {
      setBusy(false);
    }
  }

  async function decide(r: LeaveRequest, action: "approve" | "reject" | "cancel") {
    let note: string | undefined;
    if (action === "reject") {
      note = window.prompt("Why can't they take it? They'll see this.") ?? undefined;
      if (!note) return;
    }
    try {
      const updated = await decideLeave(r.id, action, note);
      setTeam((list) => list.map((x) => (x.id === r.id ? updated : x)));
      setMine((list) => (list ?? []).map((x) => (x.id === r.id ? updated : x)));
      if (action === "cancel") load();
    } catch (e) {
      toast.error(errorText(e, "Could not update the request"));
    }
  }

  const upcomingHolidays = (calendar?.holidays ?? []).slice(0, 3);

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Leave"
          subtitle={canManage && toDecide.length ? `${toDecide.length} request${toDecide.length === 1 ? "" : "s"} waiting for you` : "Your balances and requests. Weekends and public holidays aren't counted."}
          action={!adding ? <Button className="gap-2" onClick={() => setAdding(true)}><Plus size={16} /> Request leave</Button> : undefined}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {(balances ?? []).filter((b) => b.tracked).map((b, i) => {
          const usedPct = b.entitled ? Math.min(((b.taken + b.pending) / b.entitled) * 100, 100) : 0;
          return (
            <motion.div key={b.type.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }} className="rounded-[12px] border border-border bg-background p-4">
              <p className="text-xs text-muted-fg">{b.type.name}</p>
              <p className="text-2xl font-semibold mt-1">{b.remaining}<span className="text-sm font-normal text-muted-fg"> of {b.entitled} days left</span></p>
              <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: b.type.color ?? "var(--color-primary)" }} initial={{ width: 0 }} animate={{ width: `${usedPct}%` }} transition={{ duration: 0.6 }} />
              </div>
              <p className="text-[11px] text-muted-fg mt-1.5">{b.taken} taken{b.pending ? ` · ${b.pending} waiting` : ""}</p>
            </motion.div>
          );
        })}
      </div>

      {adding && (
        <div className="rounded-[12px] border border-border bg-background p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Request leave</h2>
            <button type="button" onClick={() => setAdding(false)} aria-label="Close" className="text-muted-fg hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="lv-type">Type *</Label>
              <select id="lv-type" value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })} className="h-10 w-full rounded-[8px] border border-input bg-background px-3 text-sm">
                <option value="">Choose…</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lv-start">First day *</Label>
              <Input id="lv-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate && form.endDate < e.target.value ? e.target.value : form.endDate })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lv-end">Last day</Label>
              <Input id="lv-end" type="date" min={form.startDate} value={form.endDate} disabled={form.halfDay} onChange={(e) => setForm({ ...form, endDate: e.target.value })} placeholder="Same day" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.halfDay} onChange={(e) => setForm({ ...form, halfDay: e.target.checked, endDate: e.target.checked ? "" : form.endDate })} />
            Half a day
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="lv-reason">Note for your manager</Label>
            <Input id="lv-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Optional" />
          </div>
          <div className="rounded-[10px] bg-surface p-3 text-sm">
            {form.startDate ? (
              <>
                <strong>{days} working day{days === 1 ? "" : "s"}</strong>
                {selectedBalance?.tracked && selectedBalance.remaining !== null && (
                  <span className={cn("ml-2", days > selectedBalance.remaining && "text-danger font-medium")}>
                    · {selectedBalance.remaining} left{days > selectedBalance.remaining ? ". That's more than you have." : ""}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-fg">Choose your dates to see how many days it uses.</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={busy || !form.typeId || !form.startDate || days <= 0}>{busy ? "Sending…" : "Send request"}</Button>
            <Button variant="outline" onClick={() => setAdding(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {canManage && toDecide.length > 0 && (
            <section>
              <h2 className="section-title mb-3">To approve</h2>
              <ul className="space-y-2">
                {toDecide.map((r) => (
                  <li key={r.id} className="rounded-[12px] border border-warning-ring bg-background p-4 flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{r.user.name} · {r.type.name}</p>
                      <p className="text-xs text-muted-fg">{span(r.startDate, r.endDate)} · {r.days} day{r.days === 1 ? "" : "s"}{r.reason ? ` · ${r.reason}` : ""}</p>
                    </div>
                    {(!r.isMine || role === "OWNER") ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => decide(r, "approve")}><Check size={14} className="mr-1" /> Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => decide(r, "reject")}>Decline</Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-fg">Someone else approves your own leave.</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="section-title mb-3">My requests</h2>
            {mine === null ? (
              <div className="h-24 animate-pulse rounded-[12px] bg-surface" />
            ) : mine.length === 0 ? (
              <div className="rounded-[12px] border border-border bg-background p-8 text-center">
                <CalendarOff className="mx-auto mb-2 text-muted-fg" size={20} />
                <p className="text-sm text-muted-fg">No leave requested yet.</p>
              </div>
            ) : (
              <ul className="rounded-[12px] border border-border bg-background divide-y divide-border">
                {mine.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="size-2 rounded-full flex-none" style={{ background: r.type.color ?? "var(--color-primary)" }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{r.type.name} · {span(r.startDate, r.endDate)}</p>
                      <p className="text-xs text-muted-fg">
                        {r.days} day{r.days === 1 ? "" : "s"}
                        {r.decisionNote ? ` · ${r.decidedBy}: ${r.decisionNote}` : ""}
                      </p>
                    </div>
                    <span className={cn("rounded-full border px-2 py-0.5 font-mono text-xs", STATUS[r.status].className)}>{STATUS[r.status].label}</span>
                    {(r.status === "pending" || (r.status === "approved" && r.startDate > iso(new Date()))) && (
                      <Button size="sm" variant="ghost" onClick={() => decide(r, "cancel")}>Cancel</Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[12px] border border-border bg-background p-4">
            <h2 className="section-title mb-2">Who&apos;s off · next 30 days</h2>
            {!calendar ? (
              <div className="h-16 animate-pulse rounded-[8px] bg-surface" />
            ) : calendar.leave.length === 0 ? (
              <p className="text-sm text-muted-fg">Everyone&apos;s in.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {calendar.leave.sort((a, b) => a.startDate.localeCompare(b.startDate)).map((l) => (
                  <li key={l.id} className="flex items-start gap-2">
                    <span className="mt-1.5 size-2 rounded-full flex-none" style={{ background: l.color ?? "var(--color-primary)" }} />
                    <span className="min-w-0">
                      <span className="font-medium">{l.user.name}</span>
                      <span className="block text-xs text-muted-fg">{span(l.startDate, l.endDate)} · {l.type}{l.status === "pending" ? " · waiting" : ""}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {upcomingHolidays.length > 0 && (
            <div className="rounded-[12px] border border-border bg-background p-4">
              <h2 className="section-title mb-2">Public holidays coming up</h2>
              <ul className="space-y-1 text-sm">
                {upcomingHolidays.map((h) => (
                  <li key={h.date} className="flex justify-between gap-2"><span>{h.name}</span><span className="text-muted-fg">{formatDate(h.date)}</span></li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
