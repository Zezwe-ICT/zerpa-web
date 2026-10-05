"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Plus, Radio, RefreshCw, X } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import { createOutage, listOutages, listSubscribers, transitionOutage } from "@/lib/api/telecom";
import type { TelecomOutage } from "@zerpa/shared-types";
import { toast } from "sonner";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  investigating: ["identified", "resolved"],
  identified: ["monitoring", "resolved"],
  monitoring: ["resolved", "identified"],
  resolved: [],
};

const STATUS_LABELS: Record<string, string> = {
  investigating: "Investigating",
  identified: "Cause identified",
  monitoring: "Monitoring fix",
  resolved: "Resolved",
};

export default function OutagesPage() {
  const [rows, setRows] = useState<TelecomOutage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New outage form
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [impactedServiceIds, setImpactedServiceIds] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Update form for transition
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateSummary, setUpdateSummary] = useState("");

  async function reload() {
    try {
      setRows(await listOutages());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title required");
    setSubmitting(true);
    try {
      const ids = impactedServiceIds.split(",").map((s) => s.trim()).filter(Boolean);
      await createOutage({ title, summary: summary || undefined, impactedServiceIds: ids.length ? ids : undefined });
      toast.success("Outage logged");
      setShowForm(false);
      setTitle("");
      setSummary("");
      setImpactedServiceIds("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransition(id: string, to: string) {
    try {
      await transitionOutage(id, to, updateSummary ? { summary: updateSummary } : undefined);
      toast.success(`Outage → ${STATUS_LABELS[to] || to}`);
      setUpdatingId(null);
      setUpdateSummary("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transition failed");
    }
  }

  const filtered = useMemo(() => {
    if (!filterStatus) return rows;
    return rows.filter((r) => r.status === filterStatus);
  }, [rows, filterStatus]);

  const active = rows.filter((r) => r.status !== "resolved").length;
  const resolved = rows.filter((r) => r.status === "resolved").length;
  const investigating = rows.filter((r) => r.status === "investigating").length;

  return (
    <PageContainer>
      <PageHeader
        title="Outages"
        subtitle="Network and service incidents"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={reload}>
              <RefreshCw size={14} />
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={14} className="mr-1" />
              Log outage
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard title="Active" value={String(active)} icon={AlertTriangle} />
        <StatsCard title="Investigating" value={String(investigating)} icon={Loader2} />
        <StatsCard title="Resolved" value={String(resolved)} icon={CheckCircle2} />
      </div>

      {/* New outage form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[12px] border border-danger/30 bg-danger/5 p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-danger flex items-center gap-2">
              <AlertTriangle size={16} />
              Log new outage
            </h3>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowForm(false)}>
              <X size={14} />
            </Button>
          </div>
          <div>
            <Label className="text-xs">Incident title *</Label>
            <Input
              className="mt-1 h-9 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fibre outage – Sandton CBD"
              required
            />
          </div>
          <div>
            <Label className="text-xs">Summary / update</Label>
            <textarea
              className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background min-h-[80px] resize-none"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="NOC is investigating a fibre cut on the N1 route. ETA unknown."
            />
          </div>
          <div>
            <Label className="text-xs">Impacted service IDs (comma-separated)</Label>
            <Input
              className="mt-1 h-9 text-sm"
              value={impactedServiceIds}
              onChange={(e) => setImpactedServiceIds(e.target.value)}
              placeholder="svc-001, svc-002"
            />
          </div>
          <p className="text-xs text-muted-fg">
            Opening an outage creates a subscriber notice. Without an SMS or WhatsApp key configured, the notice is saved but not sent.
          </p>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting} className="bg-danger hover:bg-danger/90">
              {submitting ? "Logging…" : "Log outage"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <select
          className="border border-border rounded-[8px] px-3 py-1.5 text-sm bg-background"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All incidents</option>
          <option value="investigating">Investigating</option>
          <option value="identified">Cause identified</option>
          <option value="monitoring">Monitoring</option>
          <option value="resolved">Resolved</option>
        </select>
        {filterStatus && (
          <Button size="sm" variant="outline" onClick={() => setFilterStatus("")}>Clear</Button>
        )}
      </div>

      {loading && <p className="text-sm text-muted-fg text-center py-8">Loading outages…</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-fg">
          <CheckCircle2 size={32} className="mx-auto mb-3 opacity-40 text-success" />
          <p className="font-medium">No active outages</p>
          <p className="text-sm mt-1">All clear. Log an incident if there's a network problem.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((row) => {
          const transitions = STATUS_TRANSITIONS[row.status] || [];
          const isExpanded = expandedId === row.id;
          const isUpdating = updatingId === row.id;
          return (
            <div key={row.id} className={`rounded-[12px] border p-4 space-y-3 ${row.status === "resolved" ? "border-border opacity-70" : "border-border"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge status={row.status.toUpperCase()} />
                    <span className="text-xs text-muted-fg">{STATUS_LABELS[row.status] || row.status}</span>
                  </div>
                  <p className="font-semibold text-foreground">{row.title}</p>
                  {row.summary && (
                    <p className="text-sm text-muted-fg mt-1">{row.summary}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-muted-fg">
                    {row.noticeStatus && (
                      <span>
                        Notice: {row.noticeStatus === "skipped" ? "skipped (no SMS/WA key)" : row.noticeStatus}
                        {row.noticeCount ? ` · ${row.noticeCount} sent` : ""}
                      </span>
                    )}
                    {(row.impactedServiceIds || []).length > 0 && (
                      <span>{row.impactedServiceIds.length} service(s) impacted</span>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : row.id)}>
                  {isExpanded ? "Collapse" : "Details"}
                </Button>
              </div>

              {/* Transition buttons */}
              {transitions.length > 0 && (
                <div className="space-y-2">
                  {isUpdating ? (
                    <div className="space-y-2">
                      <Label className="text-xs">Update message (optional)</Label>
                      <Input
                        className="h-8 text-sm"
                        placeholder="e.g. Fibre cut identified on N1, repair crew dispatched"
                        value={updateSummary}
                        onChange={(e) => setUpdateSummary(e.target.value)}
                      />
                      <div className="flex gap-2 flex-wrap">
                        {transitions.map((to) => (
                          <Button
                            key={to}
                            size="sm"
                            variant={to === "resolved" ? "default" : "outline"}
                            onClick={() => handleTransition(row.id, to)}
                          >
                            → {STATUS_LABELS[to] || to}
                          </Button>
                        ))}
                        <Button size="sm" variant="ghost" onClick={() => setUpdatingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {transitions.map((to) => (
                        <Button
                          key={to}
                          size="sm"
                          variant={to === "resolved" ? "default" : "outline"}
                          onClick={() => { setUpdatingId(row.id); setUpdateSummary(""); }}
                        >
                          → {STATUS_LABELS[to] || to}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Expanded details */}
              {isExpanded && (row.impactedServiceIds || []).length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-fg mb-2">Impacted services</p>
                  <div className="flex flex-wrap gap-1">
                    {row.impactedServiceIds.map((sid: string) => (
                      <span key={sid} className="text-xs font-mono bg-surface border border-border rounded px-2 py-0.5">
                        {sid}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
