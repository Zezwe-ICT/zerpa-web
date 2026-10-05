"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { listFuneralSchedule } from "@/lib/api/verticals";
import { toast } from "sonner";

type ScheduleRow = {
  id: string;
  number: string;
  deceasedName: string;
  serviceDate?: string;
  venue?: string;
  status: string;
  serviceType?: string;
  packageName?: string;
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function FuneralSchedulePage() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [filterPeriod, setFilterPeriod] = useState<"week" | "month" | "all">("month");

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  async function reload() {
    try {
      setRows(await listFuneralSchedule());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const today = new Date();
    return rows.filter((r) => {
      if (!r.serviceDate) return filterPeriod === "all";
      const d = new Date(r.serviceDate);
      if (filterPeriod === "week") {
        const weekAhead = new Date(today.getTime() + 7 * 86400000);
        return d >= today && d <= weekAhead;
      }
      if (filterPeriod === "month") {
        const monthAhead = new Date(today.getTime() + 30 * 86400000);
        return d >= today && d <= monthAhead;
      }
      return true;
    }).sort((a, b) => (a.serviceDate || "").localeCompare(b.serviceDate || ""));
  }, [rows, filterPeriod]);

  // Calendar: events per date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleRow[]>();
    for (const r of rows) {
      if (!r.serviceDate) continue;
      const key = r.serviceDate.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [rows]);

  const days = daysInMonth(calYear, calMonth);
  const firstDay = firstDayOfMonth(calYear, calMonth);
  const todayStr = now.toISOString().slice(0, 10);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  const upcoming = rows.filter((r) => {
    if (!r.serviceDate) return false;
    const d = new Date(r.serviceDate);
    const weekAhead = new Date(now.getTime() + 7 * 86400000);
    return d >= now && d <= weekAhead;
  }).length;

  return (
    <PageContainer>
      <PageHeader
        title="Funeral schedule"
        subtitle="Upcoming services"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
              List
            </Button>
            <Button size="sm" variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}>
              <Calendar size={14} className="mr-1" />
              Calendar
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="rounded-[10px] border border-border bg-surface px-4 py-3">
          <p className="text-muted-fg text-xs">This week</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{upcoming}</p>
        </div>
        <div className="rounded-[10px] border border-border bg-surface px-4 py-3">
          <p className="text-muted-fg text-xs">Total scheduled</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{rows.filter((r) => r.serviceDate).length}</p>
        </div>
        <div className="rounded-[10px] border border-border bg-surface px-4 py-3">
          <p className="text-muted-fg text-xs">No date set</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{rows.filter((r) => !r.serviceDate).length}</p>
        </div>
      </div>

      {view === "list" && (
        <>
          {/* Period filter */}
          <div className="flex gap-2 mb-4">
            {(["week", "month", "all"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={filterPeriod === p ? "default" : "outline"}
                onClick={() => setFilterPeriod(p)}
              >
                {p === "week" ? "Next 7 days" : p === "month" ? "Next 30 days" : "All"}
              </Button>
            ))}
          </div>

          {loading && <p className="text-sm text-muted-fg text-center py-8">Loading schedule…</p>}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-fg">
              <Calendar size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No scheduled services</p>
              <p className="text-sm mt-1">
                {filterPeriod !== "all" ? "Try extending the time range." : "Set a service date on a case to schedule it."}
              </p>
            </div>
          )}
          <div className="space-y-3">
            {filtered.map((row) => (
              <Link
                key={row.id}
                href={`/cases/${row.id}`}
                className="block rounded-[12px] border border-border p-4 hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-primary">{row.number}</span>
                      <StatusBadge status={row.status.toUpperCase()} />
                    </div>
                    <p className="font-semibold text-foreground">{row.deceasedName}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-fg">
                      {row.serviceDate && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {row.serviceDate}
                        </span>
                      )}
                      {row.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {row.venue}
                        </span>
                      )}
                      {row.serviceType && <span>{row.serviceType}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {view === "calendar" && (
        <div>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <Button size="sm" variant="outline" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <h3 className="font-semibold text-lg">
              {MONTH_NAMES[calMonth]} {calYear}
            </h3>
            <Button size="sm" variant="outline" onClick={nextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="rounded-[12px] border border-border overflow-hidden">
            <div className="grid grid-cols-7 bg-surface">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-fg py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`pad-${i}`} className="border-t border-r border-border p-1 min-h-[80px] bg-surface/30" />
              ))}
              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1;
                const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const events = eventsByDate.get(dateKey) || [];
                const isToday = dateKey === todayStr;
                return (
                  <div
                    key={day}
                    className={`border-t border-r border-border p-1.5 min-h-[80px] ${isToday ? "bg-primary/5" : ""}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : "text-muted-fg"}`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {events.map((ev) => (
                        <Link
                          key={ev.id}
                          href={`/cases/${ev.id}`}
                          className="block text-[10px] bg-primary/10 text-primary rounded px-1 py-0.5 truncate hover:bg-primary/20"
                          title={ev.deceasedName}
                        >
                          {ev.deceasedName}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
