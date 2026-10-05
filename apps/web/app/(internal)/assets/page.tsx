"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  Filter,
  Plus,
  Search,
  Server,
  Wifi,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAssets, createAsset, updateAsset } from "@/lib/api/msp";
import type { MspAsset } from "@zerpa/shared-types";
import { toast } from "sonner";

const ASSET_TYPES = [
  "server", "workstation", "laptop", "firewall", "switch", "router",
  "access_point", "nas", "ups", "printer", "phone", "tablet", "other",
];

const STATUS_OPTIONS = ["active", "retired", "in_repair"] as const;

const TYPE_ICONS: Record<string, LucideIcon> = {
  server: Server,
  firewall: Server,
  switch: Wifi,
  router: Wifi,
  access_point: Wifi,
};

function AssetIcon({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type] ?? Box;
  return <Icon size={14} className="text-muted-fg flex-shrink-0" />;
}

function statusColor(s: string) {
  if (s === "active") return "text-success";
  if (s === "in_repair") return "text-warning";
  return "text-muted-fg";
}

function warrantyLabel(d?: string | null) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: "Expired", color: "text-danger" };
  if (diff <= 30) return { label: `${diff}d left`, color: "text-warning" };
  if (diff <= 90) return { label: `${diff}d left`, color: "text-primary" };
  return { label: new Date(d).toLocaleDateString("en-ZA"), color: "text-muted-fg" };
}

export default function AssetsPage() {
  const [rows, setRows] = useState<MspAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedSite, setExpandedSite] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editWarranty, setEditWarranty] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState(ASSET_TYPES[0]);
  const [newSerial, setNewSerial] = useState("");
  const [newAccountId, setNewAccountId] = useState("");
  const [newSite, setNewSite] = useState("");

  async function reload() {
    try {
      setRows(await listAssets());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  // Derived
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterType && r.assetType !== filterType) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.assetType.toLowerCase().includes(q) ||
          (r.serialNumber || "").toLowerCase().includes(q) ||
          (r.accountId || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, search, filterType, filterStatus]);

  const bySite = useMemo(() => {
    const map: Record<string, MspAsset[]> = {};
    filtered.forEach((r) => {
      const key = r.siteId || "No site";
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const types = useMemo(() => [...new Set(rows.map((r) => r.assetType))].sort(), [rows]);

  const activeCount = rows.filter((r) => r.status === "active").length;
  const repairCount = rows.filter((r) => r.status === "in_repair").length;
  const expiredWarranty = rows.filter((r) => r.warrantyEnds && new Date(r.warrantyEnds) < new Date()).length;

  function startEdit(r: MspAsset) {
    setEditingId(r.id);
    setEditStatus(r.status);
    setEditWarranty(r.warrantyEnds || "");
    setEditNotes(r.notes || "");
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const updated = await updateAsset(id, {
        status: editStatus,
        warrantyEnds: editWarranty || null,
      });
      if (updated.history) setHistory((prev) => ({ ...prev, [id]: updated.history! }));
      toast.success("Asset updated");
      setEditingId(null);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newAccountId.trim()) return toast.error("Name and account ID are required");
    setSaving(true);
    try {
      await createAsset({
        name: newName.trim(),
        assetType: newType,
        serialNumber: newSerial.trim() || undefined,
        accountId: newAccountId.trim(),
      });
      toast.success("Asset created");
      setShowCreate(false);
      setNewName(""); setNewSerial(""); setNewAccountId(""); setNewSite("");
      setNewType(ASSET_TYPES[0]);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  const hasFilters = search || filterType || filterStatus;

  return (
    <PageContainer>
      <PageHeader
        title="Assets"
        subtitle="Tracked client devices and configuration items"
        action={
          !showCreate ? (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} className="mr-1" />
              New asset
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard label="Total" value={String(rows.length)} icon={Box as LucideIcon} />
          <StatsCard label="Active" value={String(activeCount)} icon={CheckCircle2 as LucideIcon} iconColor="green" />
          <StatsCard label="In repair" value={String(repairCount)} icon={AlertCircle as LucideIcon} iconColor="amber" />
          <StatsCard label="Warranty expired" value={String(expiredWarranty)} icon={Clock as LucideIcon} iconColor="red" />
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-[12px] border border-border bg-background p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">New asset</h3>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowCreate(false)}><X size={14} /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Asset name *</Label>
              <Input className="mt-1 h-9 text-sm" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Firewall-HQ" required />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <select className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background h-9" value={newType} onChange={(e) => setNewType(e.target.value)}>
                {ASSET_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Serial number</Label>
              <Input className="mt-1 h-9 text-sm" value={newSerial} onChange={(e) => setNewSerial(e.target.value)} placeholder="SN-0001" />
            </div>
            <div>
              <Label className="text-xs">Account ID / Client *</Label>
              <Input className="mt-1 h-9 text-sm" value={newAccountId} onChange={(e) => setNewAccountId(e.target.value)} placeholder="client-account-id" required />
            </div>
            <div>
              <Label className="text-xs">Site</Label>
              <Input className="mt-1 h-9 text-sm" value={newSite} onChange={(e) => setNewSite(e.target.value)} placeholder="Head office" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Creating…" : "Create asset"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
            <input
              type="text"
              placeholder="Search by name, type or serial…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 h-9 border border-border rounded-[8px] text-sm bg-background"
            />
          </div>
          <select className="border border-border rounded-[8px] px-3 text-sm bg-background h-9" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All types</option>
            {types.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
          <select className="border border-border rounded-[8px] px-3 text-sm bg-background h-9" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          {hasFilters && (
            <Button size="sm" variant="outline" onClick={() => { setSearch(""); setFilterType(""); setFilterStatus(""); }}>
              <X size={12} className="mr-1" /> Clear
            </Button>
          )}
        </div>
      )}

      {loading && <p className="text-sm text-muted-fg py-6">Loading assets…</p>}

      {!loading && rows.length === 0 && (
        <div className="rounded-[12px] border border-dashed border-border p-12 text-center space-y-3">
          <Server size={28} className="mx-auto text-muted-fg opacity-50" />
          <p className="font-medium">No assets yet</p>
          <p className="text-sm text-muted-fg">Add assets manually or use the CSV import in your settings.</p>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} className="mr-1" />Add first asset</Button>
        </div>
      )}

      {/* Grouped by site */}
      <div className="space-y-3">
        {bySite.map(([site, assets]) => {
          const isOpen = expandedSite[site] !== false; // default open
          return (
            <div key={site} className="rounded-[12px] border border-border overflow-hidden">
              {/* Site header */}
              <button
                type="button"
                onClick={() => setExpandedSite((prev) => ({ ...prev, [site]: !isOpen }))}
                className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown size={14} className="text-muted-fg" /> : <ChevronRight size={14} className="text-muted-fg" />}
                  <span className="font-semibold text-sm">{site}</span>
                  <span className="text-xs text-muted-fg">({assets.length})</span>
                </div>
                <div className="flex gap-2 text-xs text-muted-fg">
                  <span className="text-success">{assets.filter((a) => a.status === "active").length} active</span>
                  {assets.filter((a) => a.status === "in_repair").length > 0 && (
                    <span className="text-warning">{assets.filter((a) => a.status === "in_repair").length} repair</span>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="divide-y divide-border">
                  {assets.map((asset) => {
                    const isEditing = editingId === asset.id;
                    const wLabel = warrantyLabel(asset.warrantyEnds);
                    const hist = history[asset.id] || [];
                    const showHist = historyId === asset.id;

                    return (
                      <div key={asset.id} className="px-4 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <AssetIcon type={asset.assetType} />
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{asset.name}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-fg mt-0.5">
                                <span>{asset.assetType.replace("_", " ")}</span>
                                {asset.serialNumber && <span className="font-mono">{asset.serialNumber}</span>}
                                {wLabel && (
                                  <span className={wLabel.color}>
                                    Warranty: {wLabel.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-medium ${statusColor(asset.status)}`}>
                              {asset.status.replace("_", " ")}
                            </span>
                            <Button size="sm" variant="outline" onClick={() => isEditing ? setEditingId(null) : startEdit(asset)}>
                              <Edit2 size={12} />
                            </Button>
                          </div>
                        </div>

                        {/* Inline editor */}
                        {isEditing && (
                          <div className="rounded-[8px] border border-border bg-surface p-3 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Status</Label>
                                <select
                                  className="mt-1 w-full border border-border rounded-[6px] px-3 py-1.5 text-sm bg-background"
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                >
                                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs">Warranty ends</Label>
                                <Input type="date" className="mt-1 h-8 text-sm" value={editWarranty} onChange={(e) => setEditWarranty(e.target.value)} />
                              </div>
                              <div>
                                <Label className="text-xs">Notes</Label>
                                <Input className="mt-1 h-8 text-sm" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal notes" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveEdit(asset.id)} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                              {hist.length > 0 || !showHist ? (
                                <Button size="sm" variant="ghost" className="ml-auto text-xs text-muted-fg" onClick={() => setHistoryId(showHist ? null : asset.id)}>
                                  {showHist ? "Hide history" : "View history"}
                                </Button>
                              ) : null}
                            </div>
                            {showHist && hist.length > 0 && (
                              <div className="pt-2 border-t border-border space-y-1">
                                <p className="text-xs font-semibold text-muted-fg">Change history</p>
                                {hist.map((h) => (
                                  <p key={h.id} className="text-xs text-muted-fg">
                                    <span className="font-medium text-foreground">{h.field}</span>: {h.before || "—"} → {h.after || "—"}
                                    {h.at && <span className="ml-2 opacity-60">{new Date(h.at).toLocaleDateString("en-ZA")}</span>}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
