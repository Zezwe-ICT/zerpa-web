"use client";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Plus, Search, X } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import { createSpaBooking, listSpaBookings, transitionSpaBooking } from "@/lib/api/verticals";
import { SPA_BOOKING_MACHINE, nextAdvanceState } from "@/lib/workflows";
import { toast } from "sonner";

const SERVICES = [
  "Swedish massage 60 min",
  "Swedish massage 90 min",
  "Deep tissue 60 min",
  "Deep tissue 90 min",
  "Hot stone massage",
  "Aromatherapy massage",
  "Facial – Classic 60 min",
  "Facial – Deep cleanse 75 min",
  "Manicure",
  "Pedicure",
  "Manicure & Pedicure combo",
  "Body wrap",
  "Body scrub",
];

const THERAPISTS = [
  "Thandi Dlamini",
  "Zanele Mokoena",
  "Nomsa Khumalo",
  "Any available",
];

export default function BookingsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // New booking form
  const [serviceName, setServiceName] = useState(SERVICES[0]);
  const [therapistName, setTherapistName] = useState(THERAPISTS[0]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("10:00");
  const [consentCaptured, setConsentCaptured] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    try {
      setRows(await listSpaBookings());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) return toast.error("Client name required");
    setSubmitting(true);
    try {
      await createSpaBooking({
        serviceName,
        therapistName: therapistName === "Any available" ? undefined : therapistName,
        consentCaptured,
      });
      toast.success("Booking created");
      setShowForm(false);
      setClientName("");
      setClientPhone("");
      setNotes("");
      setConsentCaptured(false);
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
        if (
          !r.serviceName?.toLowerCase().includes(q) &&
          !r.number?.toLowerCase().includes(q) &&
          !r.therapistName?.toLowerCase().includes(q)
        ) return false;
      }
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [rows, search, filterStatus]);

  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status as string))], [rows]);
  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const today = rows.filter((r) => r.bookingDate === new Date().toISOString().slice(0, 10)).length;
  const missingConsent = rows.filter((r) => !r.consentCaptured && r.status !== "cancelled").length;

  return (
    <PageContainer>
      <PageHeader
        title="Bookings"
        subtitle="Spa appointments and treatment flow"
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} className="mr-1" />
            New booking
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard title="Confirmed" value={String(confirmed)} icon={Calendar} />
        <StatsCard title="Today" value={String(today)} icon={Clock} />
        <StatsCard title="Consent pending" value={String(missingConsent)} icon={X} />
      </div>

      {/* New booking form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[12px] border border-border bg-surface p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">New booking</h3>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowForm(false)}>
              <X size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Client name *</Label>
              <Input className="mt-1 h-9 text-sm" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Full name" required />
            </div>
            <div>
              <Label className="text-xs">Client phone</Label>
              <Input className="mt-1 h-9 text-sm" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+27 82 000 0000" />
            </div>
            <div>
              <Label className="text-xs">Service *</Label>
              <select
                className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background h-9"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              >
                {SERVICES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Therapist</Label>
              <select
                className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background h-9"
                value={therapistName}
                onChange={(e) => setTherapistName(e.target.value)}
              >
                {THERAPISTS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" className="mt-1 h-9 text-sm" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" className="mt-1 h-9 text-sm" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input className="mt-1 h-9 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, preferences…" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={consentCaptured} onChange={(e) => setConsentCaptured(e.target.checked)} className="w-4 h-4" />
            Consent form captured from client
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating…" : "Create booking"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
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

      {/* Bookings list */}
      {loading && <p className="text-sm text-muted-fg text-center py-8">Loading bookings…</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-fg">
          <Calendar size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No bookings found</p>
          <p className="text-sm mt-1">Create a new booking to get started.</p>
        </div>
      )}
      <div className="space-y-3">
        {filtered.map((row) => {
          const next = nextAdvanceState(SPA_BOOKING_MACHINE, row.status);
          return (
            <div key={row.id} className="rounded-[12px] border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs text-muted-fg">{row.number}</span>
                    <StatusBadge status={row.status.toUpperCase()} />
                    {!row.consentCaptured && row.status !== "cancelled" && (
                      <span className="text-xs text-warning bg-warning/10 px-1.5 py-0.5 rounded">Consent pending</span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground">{row.serviceName}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-fg mt-1">
                    {row.therapistName && <span>with {row.therapistName}</span>}
                    {row.bookingDate && <span className="flex items-center gap-1"><Calendar size={10} />{row.bookingDate}</span>}
                    {row.bookingTime && <span>{row.bookingTime}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {next && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await transitionSpaBooking(row.id, next);
                          toast.success(`Booking → ${next}`);
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
