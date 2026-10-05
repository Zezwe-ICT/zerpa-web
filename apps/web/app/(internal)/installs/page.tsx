"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Search, Wifi } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/ui/stats-card";
import {
  activateService,
  listInstalls,
  updateInstall,
  type InstallJob,
} from "@/lib/api/telecom";
import { toast } from "sonner";

export default function InstallsPage() {
  const [rows, setRows] = useState<InstallJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [serials, setSerials] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filterComplete, setFilterComplete] = useState<"all" | "incomplete" | "complete">("all");

  async function reload() {
    try {
      setRows(await listInstalls());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load installs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((job) => {
      if (filterComplete === "complete" && !job.checklistComplete) return false;
      if (filterComplete === "incomplete" && job.checklistComplete) return false;
      if (search) {
        const q = search.toLowerCase();
        const addr = (job.serviceAddress || "").toLowerCase();
        const product = (job.productName || "").toLowerCase();
        if (!addr.includes(q) && !product.includes(q) && !job.number.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, filterComplete]);

  const total = rows.length;
  const complete = rows.filter((j) => j.checklistComplete).length;
  const pending = rows.filter((j) => !j.checklistComplete).length;

  return (
    <PageContainer>
      <PageHeader
        title="Field installs"
        subtitle="Mobile-friendly checklist and CPE capture before activate"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total installs" value={String(total)} icon={Wifi} />
        <StatsCard title="Checklist done" value={String(complete)} icon={CheckCircle2} />
        <StatsCard title="In progress" value={String(pending)} icon={Clock} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <Input placeholder="Search by address or product…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm pl-8" />
        </div>
        {(["all", "incomplete", "complete"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filterComplete === f ? "default" : "outline"}
            onClick={() => setFilterComplete(f)}
          >
            {f === "all" ? "All" : f === "incomplete" ? "In progress" : "Complete"}
          </Button>
        ))}
        {search && (
          <Button size="sm" variant="outline" onClick={() => setSearch("")}>Clear</Button>
        )}
      </div>

      {loading && <p className="text-sm text-muted-fg text-center py-8">Loading installs…</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-fg">
          <Wifi size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No installs found</p>
          <p className="text-sm mt-1">Orders move here when field installation is scheduled.</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((job) => {
          const done = job.installChecklist.filter((c) => c.done).length;
          const total = job.installChecklist.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div key={job.id} className={`rounded-[12px] border p-4 space-y-3 ${job.checklistComplete ? "border-success/30 bg-success/5" : "border-border"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-muted-fg">{job.number}</p>
                  <p className="font-medium">{job.productName}</p>
                  <p className="text-sm text-muted-fg">{job.serviceAddress || "No address"}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground tabular-nums">{pct}%</p>
                  <p className="text-xs text-muted-fg">{done}/{total} items</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? "bg-success" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Checklist */}
              <ul className="space-y-2">
                {job.installChecklist.map((item, idx) => (
                  <li key={item.id || idx} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!item.done}
                      className="rounded"
                      onChange={async (e) => {
                        const next = job.installChecklist.map((c, i) =>
                          i === idx ? { ...c, done: e.target.checked } : c,
                        );
                        try {
                          await updateInstall(job.id, { installChecklist: next });
                          await reload();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Update failed");
                        }
                      }}
                    />
                    <span className={item.done ? "line-through text-muted-fg" : ""}>{item.label}</span>
                  </li>
                ))}
              </ul>

              {/* CPE serial + activate */}
              <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-border">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs text-muted-fg">CPE serial</label>
                  <Input
                    value={serials[job.id] ?? job.cpeSerial ?? ""}
                    onChange={(e) => setSerials((s) => ({ ...s, [job.id]: e.target.value }))}
                    placeholder="Scan or type serial"
                    className="h-8 text-sm mt-1"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await updateInstall(job.id, {
                        cpeSerial: serials[job.id] || job.cpeSerial || "",
                      });
                      toast.success("CPE serial saved");
                      await reload();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Save failed");
                    }
                  }}
                >
                  Save CPE
                </Button>
                {job.serviceId && (
                  <Button
                    size="sm"
                    disabled={!job.checklistComplete}
                    title={job.checklistComplete ? "Activate service" : "Complete checklist first"}
                    onClick={async () => {
                      try {
                        await activateService(job.serviceId!);
                        toast.success("Service activated");
                        await reload();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Activate blocked");
                      }
                    }}
                  >
                    Activate service
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
