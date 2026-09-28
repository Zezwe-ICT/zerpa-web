"use client";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Plus, Search, Users, X } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import { createReservation, listReservations, transitionReservation } from "@/lib/api/verticals";
import { RESERVATION_MACHINE, nextAdvanceState } from "@/lib/workflows";
import { toast } from "sonner";

export default function ReservationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Form fields
  const [partySize, setPartySize] = useState("2");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [occasion, setOccasion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    try {
      setRows(await listReservations());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return toast.error("Guest name required");
    setSubmitting(true);
    try {
      await createReservation({
        partySize: parseInt(partySize, 10),
        allergies: allergies || undefined,
        notes: [notes, occasion ? `Occasion: ${occasion}` : "", guestPhone ? `Phone: ${guestPhone}` : ""].filter(Boolean).join(" | ") || undefined,
      });
      toast.success("Reservation created");
      setShowForm(false);
      setGuestName("");
      setGuestPhone("");
      setAllergies("");
      setNotes("");
      setOccasion("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.number?.toLowerCase().includes(q) && !r.notes?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, filterStatus]);

  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status as string))], [rows]);
  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const today = rows.filter((r) => r.reservationDate === new Date().toISOString().slice(0, 10)).length;
  const totalCovers = rows.filter((r) => r.status !== "cancelled").reduce((s: number, r) => s + (r.partySize || 0), 0);

  return (
    <PageContainer>
      <PageHeader
        title="Reservations"
        subtitle="Table bookings and guest management"
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} className="mr-1" />
            New reservation
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard title="Confirmed" value={String(confirmed)} icon={Calendar} />
        <StatsCard title="Today" value={String(today)} icon={Clock} />
        <StatsCard title="Total covers" value={String(totalCovers)} icon={Users} />
      </div>

      {/* New reservation form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[12px] border border-border bg-surface p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">New reservation</h3>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowForm(false)}><X size={14} /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Guest name *</Label>
              <Input className="mt-1 h-9 text-sm" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input className="mt-1 h-9 text-sm" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+27 82 000 0000" />
            </div>
            <div>
              <Label className="text-xs">Party size</Label>
              <Input type="number" min="1" max="50" className="mt-1 h-9 text-sm" value={partySize} onChange={(e) => setPartySize(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Occasion</Label>
              <select className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background h-9" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                <option value="">None</option>
                <option>Birthday</option>
                <option>Anniversary</option>
                <option>Business dinner</option>
                <option>Proposal</option>
                <option>Date night</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" className="mt-1 h-9 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" className="mt-1 h-9 text-sm" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Dietary / allergies</Label>
              <Input className="mt-1 h-9 text-sm" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Nut allergy, vegan, halal…" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input className="mt-1 h-9 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="High chair needed, outside preferred…" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating…" : "Create reservation"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm pl-8" />
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
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setFilterStatus(""); }}>Clear</Button>
        )}
      </div>

      {loading && <p className="text-sm text-muted-fg text-center py-8">Loading reservations…</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-fg">
          <Calendar size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No reservations found</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((row) => {
          const next = nextAdvanceState(RESERVATION_MACHINE, row.status);
          const notesText = row.notes || "";
          const parts = notesText.split(" | ");
          const phone = parts.find((p: string) => p.startsWith("Phone: "))?.replace("Phone: ", "") || "";
          const occasion = parts.find((p: string) => p.startsWith("Occasion: "))?.replace("Occasion: ", "") || "";
          const notes = parts.filter((p: string) => !p.startsWith("Phone: ") && !p.startsWith("Occasion: ")).join(" ");
          return (
            <div key={row.id} className="rounded-[12px] border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs text-muted-fg">{row.number}</span>
                    <StatusBadge status={row.status.toUpperCase()} />
                    {occasion && <span className="text-xs text-primary">{occasion}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Users size={14} />
                      Party of {row.partySize}
                    </span>
                    {phone && <span className="text-xs text-muted-fg">{phone}</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-fg">
                    {row.reservationDate && <span className="flex items-center gap-1"><Clock size={10} />{row.reservationDate}</span>}
                    {row.allergies && <span className="text-warning">⚠ {row.allergies}</span>}
                    {notes && <span>{notes}</span>}
                  </div>
                </div>
                {next && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await transitionReservation(row.id, next);
                        toast.success(`Reservation → ${next}`);
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
          );
        })}
      </div>
    </PageContainer>
  );
}
