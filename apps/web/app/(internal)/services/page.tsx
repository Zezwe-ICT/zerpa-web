"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, Plus, Search, Settings2, Wifi, WifiOff, X } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import {
  activateService,
  cancelService,
  changeServicePlan,
  dunningAction,
  listPlans,
  listServices,
  recordServiceUsage,
  topUpService,
  type TelecomService,
} from "@/lib/api/telecom";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/currency";

export default function ServicesPage() {
  const [rows, setRows] = useState<TelecomService[]>([]);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; priceMonthly: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Usage recording form
  const [usageId, setUsageId] = useState<string | null>(null);
  const [usageMb, setUsageMb] = useState("1024");

  // Top-up form
  const [topupId, setTopupId] = useState<string | null>(null);
  const [topupMb, setTopupMb] = useState("10240");

  // Plan change
  const [changePlanId, setChangePlanId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  async function reload() {
    try {
      const [svcList, planList] = await Promise.all([listServices(), listPlans()]);
      setRows(svcList);
      setPlans(planList as any[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterType && r.serviceType !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        const addr = ((r as any).subscriber?.serviceAddress || r.circuitId || "").toLowerCase();
        if (!addr.includes(q) && !(r.circuitId || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, filterStatus, filterType]);

  const active = rows.filter((r) => r.status === "active").length;
  const suspended = rows.filter((r) => r.status === "suspended").length;
  const types = useMemo(() => [...new Set(rows.map((r) => r.serviceType))], [rows]);
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status))], [rows]);

  async function handleActivate(id: string) {
    try { await activateService(id); toast.success("Service activated"); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleSuspend(subscriberId: string) {
    try { await dunningAction(subscriberId, "suspend"); toast.success("Subscriber suspended"); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleReactivate(subscriberId: string) {
    try { await dunningAction(subscriberId, "reactivate"); toast.success("Subscriber reactivated"); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this service? This schedules cancellation.")) return;
    try { await cancelService(id); toast.success("Cancellation scheduled"); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleUsageRecord(serviceId: string) {
    try {
      await recordServiceUsage(serviceId, { usedMb: parseInt(usageMb, 10) });
      toast.success("Usage recorded");
      setUsageId(null);
      await reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleTopup(serviceId: string) {
    try {
      await topUpService(serviceId, { mb: parseInt(topupMb, 10) });
      toast.success("Top-up applied");
      setTopupId(null);
      await reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handlePlanChange(serviceId: string) {
    if (!selectedPlanId) return toast.error("Select a plan");
    try {
      await changeServicePlan(serviceId, selectedPlanId);
      toast.success("Plan change scheduled");
      setChangePlanId(null);
      await reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Services"
        subtitle="Provisioned subscriber circuits and endpoints"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total services" value={String(rows.length)} icon={Activity} />
        <StatsCard title="Active" value={String(active)} icon={CheckCircle2} />
        <StatsCard title="Suspended" value={String(suspended)} icon={WifiOff} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <Input placeholder="Search by address or circuit…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm pl-8" />
        </div>
        <select
          className="border border-border rounded-[8px] px-3 py-1 text-sm bg-background h-8"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="border border-border rounded-[8px] px-3 py-1 text-sm bg-background h-8"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || filterStatus || filterType) && (
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setFilterStatus(""); setFilterType(""); }}>Clear</Button>
        )}
      </div>

      {loading && <p className="text-sm text-muted-fg text-center py-8">Loading services…</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-fg">
          <Wifi size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No services found</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((row) => {
          const isExpanded = expandedId === row.id;
          const sub = (row as any).subscriber;
          const usedMb = (row as any).usedMb ?? 0;
          const includedMb = (row as any).includedMb ?? 0;
          const usagePct = includedMb > 0 ? Math.min(100, Math.round((usedMb / includedMb) * 100)) : null;

          return (
            <div key={row.id} className={`rounded-[12px] border p-4 space-y-3 ${row.status === "suspended" ? "border-danger/30 bg-danger/5" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={row.status.toUpperCase()} />
                    <span className="text-xs text-muted-fg uppercase">{row.serviceType}</span>
                    {(row as any).planName && <span className="text-xs text-primary">{(row as any).planName}</span>}
                  </div>
                  <p className="font-mono text-xs text-muted-fg">{row.circuitId || "No circuit ID"}</p>
                  {sub?.serviceAddress && <p className="font-medium text-foreground">{sub.serviceAddress}</p>}
                  {usagePct !== null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-fg mb-1">
                        <span>Data usage</span>
                        <span>{usedMb.toLocaleString()} / {includedMb.toLocaleString()} MB ({usagePct}%)</span>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${usagePct > 90 ? "bg-danger" : usagePct > 70 ? "bg-warning" : "bg-success"}`}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : row.id)}>
                  <Settings2 size={14} />
                </Button>
              </div>

              {/* Expanded actions */}
              {isExpanded && (
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {row.status !== "active" && (
                      <Button size="sm" onClick={() => handleActivate(row.id)}>Activate</Button>
                    )}
                    {row.status === "active" && sub?.id && (
                      <Button size="sm" variant="outline" onClick={() => handleSuspend(sub.id)}>Suspend</Button>
                    )}
                    {row.status === "suspended" && sub?.id && (
                      <Button size="sm" onClick={() => handleReactivate(sub.id)}>Reactivate</Button>
                    )}
                    {row.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => setTopupId(row.id === topupId ? null : row.id)}>
                        Top-up data
                      </Button>
                    )}
                    {row.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => setUsageId(row.id === usageId ? null : row.id)}>
                        Record usage
                      </Button>
                    )}
                    {plans.length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setChangePlanId(row.id === changePlanId ? null : row.id)}>
                        Change plan
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-danger border-danger/30 hover:bg-danger/10" onClick={() => handleCancel(row.id)}>
                      Cancel service
                    </Button>
                  </div>

                  {/* Usage recording */}
                  {usageId === row.id && (
                    <div className="flex items-end gap-2 p-3 rounded-[8px] bg-surface">
                      <div>
                        <Label className="text-xs">Usage (MB)</Label>
                        <Input type="number" className="mt-1 h-8 text-sm w-28" value={usageMb} onChange={(e) => setUsageMb(e.target.value)} />
                      </div>
                      <Button size="sm" onClick={() => handleUsageRecord(row.id)}>Record</Button>
                      <Button size="sm" variant="ghost" onClick={() => setUsageId(null)}><X size={14} /></Button>
                    </div>
                  )}

                  {/* Top-up */}
                  {topupId === row.id && (
                    <div className="flex items-end gap-2 p-3 rounded-[8px] bg-surface">
                      <div>
                        <Label className="text-xs">Top-up (MB)</Label>
                        <Input type="number" className="mt-1 h-8 text-sm w-28" value={topupMb} onChange={(e) => setTopupMb(e.target.value)} />
                      </div>
                      <Button size="sm" onClick={() => handleTopup(row.id)}>Apply</Button>
                      <Button size="sm" variant="ghost" onClick={() => setTopupId(null)}><X size={14} /></Button>
                    </div>
                  )}

                  {/* Plan change */}
                  {changePlanId === row.id && (
                    <div className="flex items-end gap-2 p-3 rounded-[8px] bg-surface">
                      <div>
                        <Label className="text-xs">New plan</Label>
                        <select
                          className="mt-1 border border-border rounded-[6px] px-2 py-1.5 text-sm bg-background"
                          value={selectedPlanId}
                          onChange={(e) => setSelectedPlanId(e.target.value)}
                        >
                          <option value="">Select plan…</option>
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.priceMonthly)}/mo</option>
                          ))}
                        </select>
                      </div>
                      <Button size="sm" onClick={() => handlePlanChange(row.id)}>Change</Button>
                      <Button size="sm" variant="ghost" onClick={() => setChangePlanId(null)}><X size={14} /></Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
