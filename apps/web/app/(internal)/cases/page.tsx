"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Calendar, FileText, Plus, Search, X } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import { createFuneralCase, listFuneralCases, transitionFuneralCase } from "@/lib/api/verticals";
import { FUNERAL_CASE_MACHINE, nextAdvanceState } from "@/lib/workflows";
import { toast } from "sonner";

const SERVICE_TYPES = [
  "Burial",
  "Cremation",
  "Repatriation",
  "Memorial service",
  "Graveside service",
];

const PACKAGES = [
  "Basic cremation",
  "Standard burial",
  "Full service burial",
  "Premium service",
  "Repatriation package",
];

export default function CasesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // New case form
  const [deceasedName, setDeceasedName] = useState("");
  const [serviceType, setServiceType] = useState("Burial");
  const [packageName, setPackageName] = useState("Standard burial");
  const [venue, setVenue] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    try {
      setRows(await listFuneralCases());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!deceasedName.trim()) return toast.error("Deceased name is required");
    setSubmitting(true);
    try {
      await createFuneralCase({
        deceasedName: deceasedName.trim(),
        serviceType,
        packageName,
        venue: venue || undefined,
        serviceDate: serviceDate || undefined,
        notes: notes || undefined,
      });
      toast.success("Case created");
      setShowForm(false);
      setDeceasedName("");
      setVenue("");
      setServiceDate("");
      setNotes("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.deceasedName?.toLowerCase().includes(q) && !r.number?.toLowerCase().includes(q)) return false;
      }
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [rows, search, filterStatus]);

  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status))], [rows]);
  const activeCount = rows.filter((r) => !["completed", "cancelled"].includes(r.status)).length;
  const thisWeek = rows.filter((r) => {
    if (!r.serviceDate) return false;
    const d = new Date(r.serviceDate);
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 86400000);
    return d >= now && d <= weekAhead;
  }).length;
  const missingDocs = rows.filter((r) => (r.checklist || []).some((c: any) => !c.collected)).length;

  return (
    <PageContainer>
      <PageHeader
        title="Funeral Cases"
        subtitle="Case intake through service completion"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/schedule">
                <Calendar size={14} className="mr-1" />
                Schedule
              </Link>
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={14} className="mr-1" />
              New case
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard title="Active cases" value={String(activeCount)} icon={Briefcase} />
        <StatsCard title="Services this week" value={String(thisWeek)} icon={Calendar} />
        <StatsCard title="Missing documents" value={String(missingDocs)} icon={FileText} />
      </div>

      {/* New case form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[12px] border border-border bg-surface p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">New funeral case</h3>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowForm(false)}>
              <X size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Deceased name *</Label>
              <Input
                className="mt-1 h-9"
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                placeholder="Full name of the deceased"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Service type</Label>
              <select
                className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background h-9"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                {SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Package</Label>
              <select
                className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background h-9"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
              >
                {PACKAGES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Service date</Label>
              <Input
                type="date"
                className="mt-1 h-9"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Venue</Label>
              <Input
                className="mt-1 h-9"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Westpark Cemetery"
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input
                className="mt-1 h-9"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Creating…" : "Create case"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <Input
            placeholder="Search by name or number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm pl-8"
          />
        </div>
        <select
          className="border border-border rounded-[8px] px-3 py-1 text-sm bg-background h-8"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterStatus) && (
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setFilterStatus(""); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Cases list */}
      {loading && <p className="text-sm text-muted-fg text-center py-8">Loading cases…</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-fg">
          <Briefcase size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No cases found</p>
          <p className="text-sm mt-1">Create a new case to get started.</p>
        </div>
      )}
      <div className="space-y-3">
        {filtered.map((row) => {
          const next = nextAdvanceState(FUNERAL_CASE_MACHINE, row.status);
          const checklistTotal = (row.checklist || []).length;
          const checklistDone = (row.checklist || []).filter((c: any) => c.collected).length;
          return (
            <div key={row.id} className="rounded-[12px] border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/cases/${row.id}`} className="font-mono text-xs text-primary hover:underline font-medium">
                      {row.number}
                    </Link>
                    <StatusBadge status={row.status.toUpperCase()} />
                  </div>
                  <p className="font-semibold text-foreground mt-1">{row.deceasedName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-fg">
                    {row.serviceType && <span>{row.serviceType}</span>}
                    {row.packageName && <span>{row.packageName}</span>}
                    {row.serviceDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {row.serviceDate}
                      </span>
                    )}
                    {row.venue && <span>{row.venue}</span>}
                  </div>
                  {checklistTotal > 0 && (
                    <p className="text-xs text-muted-fg mt-1">
                      Docs: {checklistDone}/{checklistTotal} collected
                      {checklistDone < checklistTotal && (
                        <span className="text-danger ml-1">({checklistTotal - checklistDone} missing)</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/cases/${row.id}`}>Open</Link>
                  </Button>
                  {next && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await transitionFuneralCase(row.id, next);
                          toast.success(`Case → ${next}`);
                          await reload();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Blocked");
                        }
                      }}
                    >
                      → {next}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
