"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Plus, Search, X } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import {
  createNumberPort,
  listNumberPorts,
  listSubscribers,
  transitionNumberPort,
  type NumberPortRequest,
} from "@/lib/api/telecom";
import { toast } from "sonner";

const DONOR_NETWORKS = [
  "Vodacom",
  "MTN",
  "Cell C",
  "Telkom",
  "Rain",
  "Liquid",
  "Vox",
  "Other",
];

const PORT_TRANSITIONS: Record<string, string[]> = {
  requested: ["submitted", "cancelled"],
  submitted: ["accepted", "rejected"],
  accepted: ["completed"],
  rejected: ["requested"],
  completed: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  submitted: "Submitted to NPC",
  accepted: "Accepted",
  rejected: "Rejected by NPC",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function PortingPage() {
  const [rows, setRows] = useState<NumberPortRequest[]>([]);
  const [subs, setSubs] = useState<Array<{ id: string; serviceAddress: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // New port form
  const [subscriberId, setSubscriberId] = useState("");
  const [number, setNumber] = useState("");
  const [donorNetwork, setDonorNetwork] = useState(DONOR_NETWORKS[0]);
  const [portDate, setPortDate] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    try {
      const [ports, subscribers] = await Promise.all([listNumberPorts(), listSubscribers()]);
      setRows(ports);
      setSubs(subscribers.map((s) => ({ id: s.id, serviceAddress: s.serviceAddress || s.id })));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subscriberId) return toast.error("Select a subscriber");
    if (!number.trim()) return toast.error("Enter the number to port");
    setSubmitting(true);
    try {
      await createNumberPort({
        subscriberId,
        number: number.trim(),
        donorNetwork,
        portDate: portDate || undefined,
        accountNumber: accountNumber || undefined,
      });
      toast.success("Port request created");
      setShowForm(false);
      setNumber("");
      setAccountNumber("");
      setPortDate("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransition(id: string, to: string) {
    try {
      await transitionNumberPort(id, to);
      toast.success(`Port → ${STATUS_LABELS[to] || to}`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Blocked");
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.number?.toLowerCase().includes(q) && !r.donorNetwork?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, filterStatus]);

  const pending = rows.filter((r) => !["completed", "cancelled"].includes(r.status)).length;
  const submitted = rows.filter((r) => r.status === "submitted").length;
  const completed = rows.filter((r) => r.status === "completed").length;

  return (
    <PageContainer>
      <PageHeader
        title="Number porting"
        subtitle="Track mobile and landline number ports. Port requests are managed in Zerpa — actual NPC submission is manual."
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} className="mr-1" />
            New port request
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard title="In progress" value={String(pending)} icon={Clock} />
        <StatsCard title="Submitted to NPC" value={String(submitted)} icon={Clock} />
        <StatsCard title="Completed" value={String(completed)} icon={CheckCircle2} />
      </div>

      {/* New port form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[12px] border border-border bg-surface p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">New port request</h3>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowForm(false)}><X size={14} /></Button>
          </div>
          <p className="text-xs text-muted-fg">
            Creates a port request in Zerpa. You still need to submit the LOA and NPC form to the donor network manually.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Subscriber *</Label>
              <select
                className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background"
                value={subscriberId}
                onChange={(e) => setSubscriberId(e.target.value)}
                required
              >
                <option value="">Select subscriber…</option>
                {subs.map((s) => <option key={s.id} value={s.id}>{s.serviceAddress}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Number to port *</Label>
              <Input
                className="mt-1 h-9 text-sm"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="+27 82 000 0000"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Donor network</Label>
              <select
                className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background"
                value={donorNetwork}
                onChange={(e) => setDonorNetwork(e.target.value)}
              >
                {DONOR_NETWORKS.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Requested port date</Label>
              <Input type="date" className="mt-1 h-9 text-sm" value={portDate} onChange={(e) => setPortDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Account number at donor</Label>
              <Input className="mt-1 h-9 text-sm" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Needed for LOA" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating…" : "Request port"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <Input placeholder="Search by number or network…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm pl-8" />
        </div>
        <select
          className="border border-border rounded-[8px] px-3 py-1 text-sm bg-background h-8"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(search || filterStatus) && (
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setFilterStatus(""); }}>Clear</Button>
        )}
      </div>

      {loading && <p className="text-sm text-muted-fg text-center py-8">Loading…</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-fg">
          <Clock size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No port requests</p>
          <p className="text-sm mt-1">Create one to start tracking a number port.</p>
        </div>
      )}

      {/* Port requests table */}
      {filtered.length > 0 && (
        <div className="rounded-[12px] border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="text-left px-4 py-3">Number</th>
                <th className="text-left px-4 py-3">Donor</th>
                <th className="text-left px-4 py-3">Port date</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const transitions = PORT_TRANSITIONS[r.status] || [];
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-surface/50">
                    <td className="px-4 py-3 font-mono font-medium">{r.number}</td>
                    <td className="px-4 py-3">{r.donorNetwork || "—"}</td>
                    <td className="px-4 py-3 text-muted-fg">{(r as any).portDate || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status.toUpperCase()} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {transitions.map((to) => (
                          <Button
                            key={to}
                            size="sm"
                            variant={to === "completed" ? "default" : "outline"}
                            onClick={() => handleTransition(r.id, to)}
                          >
                            → {STATUS_LABELS[to] || to}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
