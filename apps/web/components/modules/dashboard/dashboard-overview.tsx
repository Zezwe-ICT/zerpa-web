/**
 * @file components/modules/dashboard/dashboard-overview.tsx
 * @description The dashboard's live cards: cash flow, money owed by age, quotes won, sales
 * pipeline, things to do and recent activity. Charts are Bklit UI (components/charts); lists
 * animate with Motion. Cards the person can't see (no billing access) are left out.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import {
  AlarmClock,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  Users,
  FileText,
  Receipt,
  Send,
  UserPlus,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { AreaChart, Area } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { RingChart } from "@/components/charts/ring-chart";
import { Ring } from "@/components/charts/ring";
import { RingCenter } from "@/components/charts/ring-center";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { ChartTooltip, TooltipContent } from "@/components/charts/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { getDashboardOverview, type ActivityItem, type DashboardOverview } from "@/lib/api/dashboard";
import { getMyActivities, type Activity } from "@/lib/api/chatter";
import { cn } from "@/lib/utils";

const rand = (n: number, decimals = 0) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
const monthFmt = new Intl.DateTimeFormat("en-ZA", { month: "short" });
const monthLongFmt = new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" });
const RAND_FORMAT = { style: "currency", currency: "ZAR", maximumFractionDigits: 0 } as const;

// Placeholder shapes so charts can play their loading animation before data arrives.
const SKELETON_MONTHS = Array.from({ length: 6 }, (_, i) => ({
  date: new Date(2026, i, 1),
  invoiced: 40 + ((i * 37) % 50),
  collected: 30 + ((i * 23) % 40),
}));

function Card({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[12px] border border-border bg-background p-5 zerpa-chart", className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="section-title">{title}</h2>
          {subtitle && <div className="text-xs text-muted-fg mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyNote({ children, href, cta }: { children: React.ReactNode; href: string; cta: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center bg-background/70 backdrop-blur-[1px] rounded-[8px]">
      <p className="text-sm text-muted-fg max-w-xs">{children}</p>
      <Button asChild size="sm" variant="outline">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}

function CashFlowCard({ data }: { data: DashboardOverview | null }) {
  const rows = useMemo(
    () => data?.cashFlow?.map((m) => ({ date: new Date(`${m.month}T00:00:00`), ...m })) ?? SKELETON_MONTHS,
    [data],
  );
  const loading = !data;
  const totals = data?.cashFlow?.reduce(
    (acc, m) => ({ invoiced: acc.invoiced + m.invoiced, collected: acc.collected + m.collected }),
    { invoiced: 0, collected: 0 },
  );
  const empty = !!totals && totals.invoiced === 0 && totals.collected === 0;

  return (
    <Card
      title="Cash flow"
      subtitle="Invoiced and collected, last 6 months"
      action={
        <div className="flex gap-3 text-xs text-muted-fg">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[var(--chart-1)]" />Invoiced</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[var(--chart-3)]" />Collected</span>
        </div>
      }
    >
      <div className="flex gap-8 mb-2">
        <div>
          <p className="text-xs text-muted-fg">Invoiced</p>
          <p className="text-xl font-semibold mono"><NumberFlow value={totals?.invoiced ?? 0} format={RAND_FORMAT} locales="en-ZA" /></p>
        </div>
        <div>
          <p className="text-xs text-muted-fg">Collected</p>
          <p className="text-xl font-semibold mono"><NumberFlow value={totals?.collected ?? 0} format={RAND_FORMAT} locales="en-ZA" /></p>
        </div>
      </div>
      <div className="relative">
        <AreaChart
          data={rows}
          status={loading ? "loading" : "ready"}
          loadingLabel="Loading cash flow…"
          aspectRatio="2.6 / 1"
          margin={{ top: 16, right: 16, bottom: 32, left: 16 }}
          formatXLabel={(d) => monthFmt.format(d)}
        >
          <Grid horizontal />
          <Area dataKey="invoiced" fill="var(--chart-1)" fillOpacity={0.25} />
          <Area dataKey="collected" fill="var(--chart-3)" fillOpacity={0.25} />
          <XAxis numTicks={6} />
          <ChartTooltip
            showDatePill={false}
            content={({ point }) => (
              <TooltipContent
                title={monthLongFmt.format(point.date as Date)}
                rows={[
                  { color: "var(--chart-1)", label: "Invoiced", value: rand(Number(point.invoiced)) },
                  { color: "var(--chart-3)", label: "Collected", value: rand(Number(point.collected)) },
                ]}
              />
            )}
          />
        </AreaChart>
        {empty && (
          <EmptyNote href="/billing/invoices/new" cta="Create an invoice">
            Your cash flow appears here once you send invoices and receive payments.
          </EmptyNote>
        )}
      </div>
    </Card>
  );
}

const AGE_SHORT: Record<string, string> = { not_due: "Not due", "1_30": "1–30", "31_60": "31–60", "61_90": "61–90", "90_plus": "90+" };

function ReceivablesCard({ data }: { data: DashboardOverview | null }) {
  const r = data?.receivables;
  const rows = r?.buckets.map((b) => ({ name: AGE_SHORT[b.key], label: b.label, amount: b.amount, count: b.count })) ?? [];
  return (
    <Card
      title="Money owed to you"
      subtitle={r ? <>By days overdue · <span className="text-danger font-medium">{rand(r.overdueTotal)} overdue</span></> : "Loading…"}
      action={
        <Link href="/dunning" className="text-xs text-primary hover:underline flex items-center gap-1">
          Collections <ArrowRight size={12} />
        </Link>
      }
    >
      <p className="text-xl font-semibold mono mb-2"><NumberFlow value={r?.total ?? 0} format={RAND_FORMAT} locales="en-ZA" /></p>
      <div className="relative">
        <BarChart
          data={rows}
          status={r ? "ready" : "loading"}
          aspectRatio="2.2 / 1"
          margin={{ top: 12, right: 8, bottom: 32, left: 8 }}
          barGap={0.35}
        >
          <Grid horizontal />
          <Bar dataKey="amount" fill="var(--chart-2)" lineCap={4} />
          <BarXAxis showAllLabels />
          <ChartTooltip
            showDatePill={false}
            content={({ point }) => (
              <TooltipContent
                title={String(point.label)}
                rows={[
                  { color: "var(--chart-2)", label: "Owed", value: rand(Number(point.amount)) },
                  { color: "var(--chart-2)", label: "Invoices", value: Number(point.count) },
                ]}
              />
            )}
          />
        </BarChart>
        {r && r.total === 0 && (
          <EmptyNote href="/billing/invoices" cta="View invoices">
            Nobody owes you anything right now.
          </EmptyNote>
        )}
      </div>
    </Card>
  );
}

function QuotesCard({ data }: { data: DashboardOverview | null }) {
  const q = data?.quotes;
  const total = q ? q.won + q.lost + q.open : 0;
  const rings = q && total
    ? [
        { label: "Accepted", value: q.won, maxValue: total, color: "var(--chart-3)" },
        { label: "Waiting", value: q.open, maxValue: total, color: "var(--chart-1)" },
        { label: "Lost", value: q.lost, maxValue: total, color: "var(--chart-2)" },
      ]
    : [];
  return (
    <Card title="Quotes" subtitle="Sent in the last 90 days">
      {!q ? (
        <div className="h-48 animate-pulse rounded-[8px] bg-surface" />
      ) : total === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm text-muted-fg">Send a quote and see how many your customers accept.</p>
          <Button asChild size="sm" variant="outline"><Link href="/billing/quotes/new">New quote</Link></Button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <RingChart data={rings} size={176} strokeWidth={12} ringGap={5} baseInnerRadius={44}>
            {rings.map((_, i) => <Ring key={i} index={i} />)}
            <RingCenter
              defaultLabel={q.winRate === null ? "Quotes sent" : "Win rate"}
              defaultValue={q.winRate ?? total}
              defaultSuffix={q.winRate === null ? undefined : "%"}
            />
          </RingChart>
          <ul className="space-y-2 text-sm flex-1 min-w-0">
            {rings.map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0"><span className="size-2 rounded-full flex-none" style={{ background: r.color }} /><span className="truncate">{r.label}</span></span>
                <span className="mono font-medium">{r.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function PipelineCard({ data, className }: { data: DashboardOverview | null; className?: string }) {
  const p = data?.pipeline;
  const stages = p?.stages.filter((s) => s.count > 0) ?? [];
  return (
    <Card
      className={className}
      title="Sales pipeline"
      subtitle={p ? `${p.openCount} open lead${p.openCount === 1 ? "" : "s"} · ${rand(p.openValue)} estimated` : "Loading…"}
      action={
        <Link href="/crm/leads" className="text-xs text-primary hover:underline flex items-center gap-1">
          Leads <ArrowRight size={12} />
        </Link>
      }
    >
      {!p ? (
        <div className="h-48 animate-pulse rounded-[8px] bg-surface" />
      ) : stages.length < 2 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm text-muted-fg">
            {p.openCount ? "Move leads through your stages to see your funnel." : "Add leads to see your sales funnel."}
          </p>
          <Button asChild size="sm" variant="outline"><Link href="/crm/leads/new">Add a lead</Link></Button>
        </div>
      ) : (
        <FunnelChart
          data={stages.map((s) => ({ label: s.label, value: s.count, displayValue: `${s.count}` }))}
          color="var(--chart-1)"
          layers={3}
          showPercentage={false}
          showValues
          showLabels
          style={{ height: 200 }}
        />
      )}
    </Card>
  );
}

type Todo = { key: string; icon: LucideIcon; tone: string; title: string; detail: string; href: string };

function TodoCard({ data, activities }: { data: DashboardOverview | null; activities: Activity[] }) {
  const soon = new Date();
  soon.setDate(soon.getDate() + 2);
  const items: Todo[] = [
    ...activities
      .filter((a) => new Date(`${a.dueDate}T00:00:00`) <= soon)
      .map((a) => ({
        key: `act-${a.id}`,
        icon: ACTIVITY_KIND_ICON[a.kind] ?? CheckCircle2,
        tone: a.overdue ? "text-danger bg-danger-bg" : a.dueToday ? "text-warning bg-warning-bg" : "text-info bg-info-bg",
        title: a.summary,
        detail: `${a.record?.title ?? ""} · ${a.overdue ? "overdue since " : a.dueToday ? "today" : "due "}${a.dueToday ? "" : new Date(a.dueDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`,
        href: a.record?.link ?? "/dashboard",
      })),
    ...(data?.receivables?.overdue ?? []).map((inv) => ({
      key: `inv-${inv.id}`,
      icon: Receipt,
      tone: "text-danger bg-danger-bg",
      title: `Chase ${inv.number} · ${rand(inv.amount)}`,
      detail: `${inv.customer || "Customer"} · ${inv.daysOverdue} day${inv.daysOverdue === 1 ? "" : "s"} overdue`,
      href: `/billing/invoices/${inv.id}`,
    })),
    ...(data?.quotes?.expiringSoon ?? []).map((q) => ({
      key: `quote-${q.id}`,
      icon: FileText,
      tone: "text-warning bg-warning-bg",
      title: `Follow up ${q.number} · ${rand(q.amount)}`,
      detail: `${q.customer || "Customer"} · expires ${new Date(q.expiresOn).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`,
      href: `/billing/quotes/${q.id}`,
    })),
  ];
  return (
    <Card title="To do" subtitle="Your activities, overdue invoices and quotes about to expire">
      {!data ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-[8px] bg-surface" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-3 py-6 justify-center text-sm text-muted-fg">
          <CheckCircle2 size={18} className="text-success" /> You&apos;re all caught up.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {items.map((t, i) => (
              <motion.li
                key={t.key}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Link href={t.href} className="flex items-center gap-3 py-2.5 group">
                  <span className={cn("rounded-[8px] p-2 flex-none", t.tone)}><t.icon size={14} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate group-hover:text-primary">{t.title}</span>
                    <span className="block text-xs text-muted-fg truncate">{t.detail}</span>
                  </span>
                  <ArrowRight size={14} className="text-muted-fg opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  );
}

const ACTIVITY_KIND_ICON: Record<Activity["kind"], LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  todo: CheckCircle2,
  follow_up: AlarmClock,
};

const ACTIVITY_ICONS: Record<ActivityItem["kind"], { icon: LucideIcon; tone: string }> = {
  payment: { icon: Wallet, tone: "text-success bg-success-bg" },
  quote_accepted: { icon: CheckCircle2, tone: "text-success bg-success-bg" },
  quote_declined: { icon: XCircle, tone: "text-danger bg-danger-bg" },
  invoice_sent: { icon: Send, tone: "text-info bg-info-bg" },
  lead: { icon: UserPlus, tone: "text-primary bg-primary-tint" },
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days} d ago` : new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function ActivityCard({ data }: { data: DashboardOverview | null }) {
  return (
    <Card title="Recent activity">
      {!data ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-[8px] bg-surface" />)}</div>
      ) : data.activity.length === 0 ? (
        <p className="text-sm text-muted-fg py-6 text-center">Payments, accepted quotes and new leads will show up here.</p>
      ) : (
        <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border">
          {data.activity.map((a, i) => {
            const { icon: Icon, tone } = ACTIVITY_ICONS[a.kind];
            return (
              <motion.li
                key={`${a.kind}-${a.at}-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                className="relative"
              >
                <Link href={a.link} className="flex gap-3 group">
                  <span className={cn("relative z-10 rounded-full p-2 flex-none ring-4 ring-background", tone)}><Icon size={14} /></span>
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className="block text-sm font-medium truncate group-hover:text-primary">{a.title}</span>
                    <span className="block text-xs text-muted-fg truncate">
                      {[a.detail, a.amount ? rand(a.amount, 2) : null, timeAgo(a.at)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export function DashboardOverviewCards() {
  const { company, isLoading, isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !company?.id) return;
    getMyActivities().then(setActivities).catch(() => setActivities([]));
    setData(null);
    getDashboardOverview()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the dashboard"));
  }, [company?.id, isAuthenticated, isLoading]);

  if (error) {
    return <p className="text-sm text-danger bg-danger-bg rounded-[8px] px-4 py-3">{error}</p>;
  }
  const canBill = !data || data.cashFlow !== null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6 min-w-0">
        {canBill && <CashFlowCard data={data} />}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {canBill && <ReceivablesCard data={data} />}
          {canBill && <QuotesCard data={data} />}
          <PipelineCard data={data} className={canBill ? "md:col-span-2" : undefined} />
        </div>
      </div>
      <div className="space-y-6 min-w-0">
        <TodoCard data={canBill ? data : data && { ...data, receivables: null, quotes: null }} activities={activities} />
        <ActivityCard data={data} />
      </div>
    </div>
  );
}
