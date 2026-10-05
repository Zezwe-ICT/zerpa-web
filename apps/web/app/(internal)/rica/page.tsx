"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, FileText, Search, ShieldCheck, X, XCircle } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import { listSubscribers, reviewRica, submitRica } from "@/lib/api/telecom";
import { uploadDocument } from "@/lib/api/documents";
import type { TelecomSubscriber } from "@zerpa/shared-types";
import { toast } from "sonner";

const ID_TYPES = [
  { value: "sa_id", label: "South African ID" },
  { value: "passport", label: "Passport" },
  { value: "asylum", label: "Asylum seeker permit" },
];

export default function RicaPage() {
  const [subs, setSubs] = useState<TelecomSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // RICA submission form
  const [showForm, setShowForm] = useState(false);
  const [subscriberId, setSubscriberId] = useState("");
  const [idDocumentType, setIdDocumentType] = useState("sa_id");
  const [idNumber, setIdNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [poaFile, setPoaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    try {
      setSubs(await listSubscribers());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subscriberId) return toast.error("Select a subscriber");
    if (idNumber.length < 4) return toast.error("Enter ID / passport number");
    if (!idFile) return toast.error("Upload the ID document");
    if (!poaFile) return toast.error("Upload proof of address");
    setSubmitting(true);
    try {
      const [idDoc, poa] = await Promise.all([
        uploadDocument(idFile),
        uploadDocument(poaFile),
      ]);
      const rica = await submitRica(subscriberId, {
        idDocumentType,
        idNumber,
        proofOfAddressUploaded: true,
        idDocumentId: idDoc.id,
        proofOfAddressDocumentId: poa.id,
      });
      toast.success(`RICA submitted · ${rica.idNumberMasked || "masked"}`);
      setShowForm(false);
      setSubscriberId("");
      setIdNumber("");
      setIdFile(null);
      setPoaFile(null);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(ricaId: string, decision: "approved" | "rejected") {
    try {
      await reviewRica(ricaId, decision);
      toast.success(decision === "approved" ? "RICA approved" : "RICA rejected");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (filterStatus && s.ricaStatus !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.serviceAddress?.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [subs, search, filterStatus]);

  const notStarted = subs.filter((s) => s.ricaStatus === "not_started").length;
  const pending = subs.filter((s) => s.ricaStatus === "pending").length;
  const approved = subs.filter((s) => s.ricaStatus === "approved").length;
  const rejected = subs.filter((s) => s.ricaStatus === "rejected").length;

  const unricaed = subs.filter((s) => !["approved"].includes(s.ricaStatus || ""));

  return (
    <PageContainer>
      <PageHeader
        title="RICA"
        subtitle="Subscriber registration — ID and proof of address required by South African law"
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <FileText size={14} className="mr-1" />
            Submit RICA
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Not started" value={String(notStarted)} icon={Clock} />
        <StatsCard title="Pending review" value={String(pending)} icon={ShieldCheck} />
        <StatsCard title="Approved" value={String(approved)} icon={CheckCircle2} />
        <StatsCard title="Rejected" value={String(rejected)} icon={XCircle} />
      </div>

      {/* RICA form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-[12px] border border-border bg-surface p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Submit RICA for subscriber</h3>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowForm(false)}><X size={14} /></Button>
          </div>
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
                {unricaed.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.serviceAddress || s.id} · {s.ricaStatus}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Document type *</Label>
              <select
                className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background"
                value={idDocumentType}
                onChange={(e) => setIdDocumentType(e.target.value)}
              >
                {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">ID / Passport number *</Label>
              <Input
                className="mt-1 h-9 text-sm"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Stored encrypted at rest"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">ID document *</Label>
              <p className="text-xs text-muted-fg mb-1">Clear scan of both sides</p>
              <input
                type="file"
                accept="image/*,.pdf"
                className="text-sm"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div>
              <Label className="text-xs">Proof of address *</Label>
              <p className="text-xs text-muted-fg mb-1">Utility bill or bank statement (not older than 3 months)</p>
              <input
                type="file"
                accept="image/*,.pdf"
                className="text-sm"
                onChange={(e) => setPoaFile(e.target.files?.[0] || null)}
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-fg">
            RICA requires a South African ID (or equivalent), an address where the service is installed, and a proof of address.
            The ID number is stored encrypted.
          </p>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Uploading…" : "Submit RICA"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <Input placeholder="Search by address or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm pl-8" />
        </div>
        <select
          className="border border-border rounded-[8px] px-3 py-1 text-sm bg-background h-8"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="not_started">Not started</option>
          <option value="pending">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
        {(search || filterStatus) && (
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setFilterStatus(""); }}>Clear</Button>
        )}
      </div>

      {loading && <p className="text-sm text-muted-fg text-center py-8">Loading subscribers…</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-fg">
          <ShieldCheck size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No subscribers found</p>
        </div>
      )}

      {/* Subscriber table */}
      {filtered.length > 0 && (
        <div className="rounded-[12px] border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="text-left px-4 py-3">Subscriber / Address</th>
                <th className="text-left px-4 py-3">RICA status</th>
                <th className="text-left px-4 py-3">ID (masked)</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const rica = (s as any).rica?.[0];
                return (
                  <tr key={s.id} className="border-t border-border hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.serviceAddress || "—"}</p>
                      <p className="text-xs text-muted-fg font-mono">{s.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={(s.ricaStatus || "not_started").toUpperCase()} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {rica?.idNumberMasked || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {rica && s.ricaStatus === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReview(rica.id, "approved")}
                          >
                            <CheckCircle2 size={12} className="mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(rica.id, "rejected")}
                          >
                            <XCircle size={12} className="mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {s.ricaStatus === "not_started" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSubscriberId(s.id); setShowForm(true); }}
                        >
                          Submit RICA
                        </Button>
                      )}
                      {s.ricaStatus === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSubscriberId(s.id); setShowForm(true); }}
                        >
                          Resubmit
                        </Button>
                      )}
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
