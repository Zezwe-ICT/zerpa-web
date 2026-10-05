"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Car,
  CheckCircle2,
  Clock,
  Hammer,
  Minus,
  Plus,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  approveJobCard,
  createJobCard,
  listJobCards,
  transitionJobCard,
  type StaffApprovalMethod,
} from "@/lib/api/verticals";
import { JOB_CARD_MACHINE, nextAdvanceState } from "@/lib/workflows";
import { formatCurrency } from "@/lib/utils/currency";
import { toast } from "sonner";

const APPROVAL_METHODS: Array<{ value: StaffApprovalMethod; label: string }> = [
  { value: "phone", label: "Phone call" },
  { value: "in_person", label: "In person" },
  { value: "written", label: "Signed quote" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
];

const MAKES = ["Toyota", "Volkswagen", "Ford", "BMW", "Mercedes", "Hyundai", "Kia", "Nissan", "Mazda", "Chevrolet", "Other"];

interface LabourLine { id: string; description: string; hours: number; rate: number }
interface PartsLine { id: string; partNumber: string; description: string; qty: number; unitPrice: number }

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

export default function JobCardsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalMethod, setApprovalMethod] = useState<StaffApprovalMethod>("phone");
  const [approverName, setApproverName] = useState("");

  // Create form
  const [reg, setReg] = useState("");
  const [make, setMake] = useState(MAKES[0]);
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [complaint, setComplaint] = useState("");
  const [labour, setLabour] = useState<LabourLine[]>([{ id: uid(), description: "", hours: 1, rate: 650 }]);
  const [parts, setParts] = useState<PartsLine[]>([]);
  const [techName, setTechName] = useState("");

  async function reload() {
    try { setRows(await listJobCards()); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { reload(); }, []);

  const labourTotal = useMemo(() => labour.reduce((s, l) => s + l.hours * l.rate, 0), [labour]);
  const partsTotal = useMemo(() => parts.reduce((s, p) => s + p.qty * p.unitPrice, 0), [parts]);
  const estimateTotal = labourTotal + partsTotal;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (r.vehicleReg || "").toLowerCase().includes(q) ||
          (r.vehicleMake || "").toLowerCase().includes(q) ||
          (r.number || "").toLowerCase().includes(q) ||
          (r.complaint || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, search, filterStatus]);

  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status))], [rows]);
  const openCount = rows.filter((r) => !["delivered", "cancelled"].includes(r.status)).length;
  const awaitingApproval = rows.filter((r) => r.status === "awaiting_approval" && !r.approved).length;

  function addLabour() { setLabour((prev) => [...prev, { id: uid(), description: "", hours: 1, rate: 650 }]); }
  function removeLabour(id: string) { setLabour((prev) => prev.filter((l) => l.id !== id)); }
  function updateLabour(id: string, patch: Partial<LabourLine>) { setLabour((prev) => prev.map((l) => l.id === id ? { ...l, ...patch } : l)); }

  function addPart() { setParts((prev) => [...prev, { id: uid(), partNumber: "", description: "", qty: 1, unitPrice: 0 }]); }
  function removePart(id: string) { setParts((prev) => prev.filter((p) => p.id !== id)); }
  function updatePart(id: string, patch: Partial<PartsLine>) { setParts((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p)); }

  function resetCreate() {
    setReg(""); setMake(MAKES[0]); setModel(""); setYear(""); setMileage("");
    setCustomerName(""); setCustomerPhone(""); setComplaint(""); setTechName("");
    setLabour([{ id: uid(), description: "", hours: 1, rate: 650 }]);
    setParts([]);
    setShowCreate(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!reg.trim()) return toast.error("Vehicle registration is required");
    setSubmitting(true);
    try {
      await createJobCard({
        vehicleReg: reg.trim().toUpperCase(),
        vehicleMake: make,
        complaint: complaint.trim() || undefined,
        estimateAmount: estimateTotal || undefined,
      });
      toast.success("Job card created");
      resetCreate();
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Job Cards"
        subtitle="Automotive inspection, approval, labour and delivery"
        action={
          !showCreate ? (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} className="mr-1" />
              New job card
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard label="Total" value={String(rows.length)} icon={Car as LucideIcon} />
          <StatsCard label="Open" value={String(openCount)} icon={Wrench as LucideIcon} iconColor="amber" />
          <StatsCard label="Awaiting approval" value={String(awaitingApproval)} icon={Clock as LucideIcon} iconColor="red" />
          <StatsCard label="Estimate value" value={formatCurrency(rows.reduce((s, r) => s + (r.estimateAmount || 0), 0))} icon={CheckCircle2 as LucideIcon} iconColor="green" />
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-[12px] border border-border bg-background p-5 mb-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Car size={15} className="text-primary" />New job card</h3>
            <Button size="sm" variant="ghost" type="button" onClick={resetCreate}><X size={14} /></Button>
          </div>

          {/* Vehicle */}
          <div>
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wide mb-2">Vehicle</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Registration *</Label>
                <Input className="mt-1 h-9 text-sm uppercase" value={reg} onChange={(e) => setReg(e.target.value)} placeholder="CA 123 456" required />
              </div>
              <div>
                <Label className="text-xs">Make</Label>
                <select className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background h-9" value={make} onChange={(e) => setMake(e.target.value)}>
                  {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Model</Label>
                <Input className="mt-1 h-9 text-sm" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Hilux 2.4 GD-6" />
              </div>
              <div>
                <Label className="text-xs">Year</Label>
                <Input className="mt-1 h-9 text-sm" type="number" min={1980} max={2030} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2021" />
              </div>
              <div>
                <Label className="text-xs">Mileage (km)</Label>
                <Input className="mt-1 h-9 text-sm" type="number" min={0} value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="85 000" />
              </div>
            </div>
          </div>

          {/* Customer */}
          <div>
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wide mb-2">Customer</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Customer name</Label>
                <Input className="mt-1 h-9 text-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Smith" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input className="mt-1 h-9 text-sm" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+27 82 000 0000" />
              </div>
            </div>
          </div>

          {/* Complaint */}
          <div>
            <Label className="text-xs">Customer complaint / work required</Label>
            <textarea
              className="mt-1 w-full min-h-[60px] rounded-[8px] border border-border bg-background px-3 py-2 text-sm resize-none"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Describe what the customer reported or what needs to be done"
            />
          </div>

          {/* Labour lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-fg uppercase tracking-wide">Labour</p>
              <Button size="sm" variant="outline" type="button" onClick={addLabour}><Plus size={12} className="mr-1" />Add line</Button>
            </div>
            <div className="space-y-2">
              {labour.map((l) => (
                <div key={l.id} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center">
                  <Input className="h-8 text-sm" value={l.description} onChange={(e) => updateLabour(l.id, { description: e.target.value })} placeholder="Labour description" />
                  <Input className="h-8 text-sm" type="number" min={0} step={0.5} value={l.hours} onChange={(e) => updateLabour(l.id, { hours: Number(e.target.value) })} placeholder="hrs" />
                  <Input className="h-8 text-sm" type="number" min={0} value={l.rate} onChange={(e) => updateLabour(l.id, { rate: Number(e.target.value) })} placeholder="rate/h" />
                  <Button size="sm" variant="ghost" type="button" onClick={() => removeLabour(l.id)}><Minus size={12} /></Button>
                </div>
              ))}
              <p className="text-xs text-right text-muted-fg">Labour: {formatCurrency(labourTotal)}</p>
            </div>
          </div>

          {/* Parts lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-fg uppercase tracking-wide">Parts</p>
              <Button size="sm" variant="outline" type="button" onClick={addPart}><Plus size={12} className="mr-1" />Add part</Button>
            </div>
            {parts.length > 0 && (
              <div className="space-y-2">
                {parts.map((p) => (
                  <div key={p.id} className="grid grid-cols-[80px_1fr_60px_80px_32px] gap-2 items-center">
                    <Input className="h-8 text-sm font-mono" value={p.partNumber} onChange={(e) => updatePart(p.id, { partNumber: e.target.value })} placeholder="Part #" />
                    <Input className="h-8 text-sm" value={p.description} onChange={(e) => updatePart(p.id, { description: e.target.value })} placeholder="Description" />
                    <Input className="h-8 text-sm" type="number" min={1} value={p.qty} onChange={(e) => updatePart(p.id, { qty: Number(e.target.value) })} placeholder="qty" />
                    <Input className="h-8 text-sm" type="number" min={0} value={p.unitPrice} onChange={(e) => updatePart(p.id, { unitPrice: Number(e.target.value) })} placeholder="price" />
                    <Button size="sm" variant="ghost" type="button" onClick={() => removePart(p.id)}><Minus size={12} /></Button>
                  </div>
                ))}
                <p className="text-xs text-right text-muted-fg">Parts: {formatCurrency(partsTotal)}</p>
              </div>
            )}
          </div>

          {/* Technician + total */}
          <div className="flex items-end justify-between gap-4 pt-2 border-t border-border">
            <div>
              <Label className="text-xs">Assigned technician</Label>
              <Input className="mt-1 h-9 text-sm max-w-xs" value={techName} onChange={(e) => setTechName(e.target.value)} placeholder="Technician name" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-fg">Estimate total</p>
              <p className="text-xl font-bold">{formatCurrency(estimateTotal)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating…" : "Create job card"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={resetCreate}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
            <input type="text" placeholder="Search by reg, make or number…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 h-9 border border-border rounded-[8px] text-sm bg-background" />
          </div>
          <select className="border border-border rounded-[8px] px-3 text-sm bg-background h-9" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          {(search || filterStatus) && <Button size="sm" variant="outline" onClick={() => { setSearch(""); setFilterStatus(""); }}><X size={12} className="mr-1" />Clear</Button>}
        </div>
      )}

      {loading && <p className="text-sm text-muted-fg py-6">Loading job cards…</p>}

      {!loading && rows.length === 0 && !showCreate && (
        <div className="rounded-[12px] border border-dashed border-border p-12 text-center space-y-3">
          <Wrench size={28} className="mx-auto text-muted-fg opacity-50" />
          <p className="font-medium">No job cards yet</p>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} className="mr-1" />New job card</Button>
        </div>
      )}

      {/* Job cards list */}
      <div className="space-y-3">
        {filtered.map((row) => {
          const next = nextAdvanceState(JOB_CARD_MACHINE, row.status);
          const needsApproval = row.status === "awaiting_approval" && !row.approved;
          const isApproving = approvingId === row.id;

          return (
            <div key={row.id} className={`rounded-[12px] border bg-background p-4 space-y-3 ${needsApproval ? "border-warning" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs text-muted-fg">{row.number}</span>
                    <StatusBadge status={(row.status || "new").toUpperCase()} />
                    {needsApproval && <span className="text-xs font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded">Awaiting approval</span>}
                  </div>
                  <p className="font-semibold text-foreground">
                    {row.vehicleReg} · {row.vehicleMake || "Vehicle"} {row.vehicleModel || ""}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-fg mt-1">
                    {row.complaint && <span className="truncate max-w-xs">{row.complaint}</span>}
                    <span>Estimate: <span className="font-medium text-foreground">{formatCurrency(row.estimateAmount || 0)}</span></span>
                    {row.approved && row.approvedByName && (
                      <span className="text-success">Approved by {row.approvedByName} ({row.approvalMethod})</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {needsApproval ? (
                    <Button size="sm" variant="outline" onClick={() => setApprovingId(isApproving ? null : row.id)}>
                      Record approval
                    </Button>
                  ) : (
                    next && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        try { await transitionJobCard(row.id, next); await reload(); }
                        catch (e) { toast.error(e instanceof Error ? e.message : "Blocked"); }
                      }}>
                        → {next.replace("_", " ")}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Approval panel */}
              {isApproving && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <select
                    className="rounded-[6px] border border-border bg-background px-3 py-2 text-sm"
                    value={approvalMethod}
                    onChange={(e) => setApprovalMethod(e.target.value as StaffApprovalMethod)}
                  >
                    {APPROVAL_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <Input
                    className="max-w-xs h-9"
                    placeholder="Customer name who approved"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!approverName.trim()}
                    onClick={async () => {
                      try {
                        await approveJobCard(row.id, approvalMethod, approverName.trim());
                        setApprovingId(null);
                        setApproverName("");
                        toast.success(`Approval of ${formatCurrency(row.estimateAmount || 0)} recorded`);
                        await reload();
                      } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                    }}
                  >
                    Save approval
                  </Button>
                  <p className="basis-full text-xs text-muted-fg">
                    CPA s15 — work starts only after the customer approves this estimate.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
