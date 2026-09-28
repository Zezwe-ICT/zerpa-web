"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, Circle, DollarSign, FileText, User } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFuneralCase, patchFuneralCase, transitionFuneralCase } from "@/lib/api/verticals";
import { FUNERAL_CASE_MACHINE, nextAdvanceState } from "@/lib/workflows";
import { toast } from "sonner";
import { ZerpaLoader } from "@/components/brand/zerpa-loader";
import { formatCurrency } from "@/lib/utils/currency";

const SERVICE_TYPES = ["Burial", "Cremation", "Repatriation", "Memorial service", "Graveside service"];

export default function FuneralCaseDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [row, setRow] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [venue, setVenue] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [packageName, setPackageName] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState(false);

  async function reload() {
    const data = await getFuneralCase(id);
    setRow(data);
    setVenue(data.venue || "");
    setServiceDate(data.serviceDate || "");
    setServiceType(data.serviceType || "Burial");
    setPackageName(data.packageName || "");
    setDepositAmount(String(data.depositAmount || ""));
    setNextOfKinName(data.nextOfKinName || "");
    setNextOfKinPhone(data.nextOfKinPhone || "");
    setNotes(data.notes || "");
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, [id]);

  if (!row) {
    return (
      <PageContainer>
        <ZerpaLoader title="Loading case" />
      </PageContainer>
    );
  }

  const next = nextAdvanceState(FUNERAL_CASE_MACHINE, row.status);
  const checklistTotal = (row.checklist || []).length;
  const checklistDone = (row.checklist || []).filter((c: any) => c.collected).length;

  async function saveDetails() {
    setSaving(true);
    try {
      await patchFuneralCase(id, {
        venue: venue || null,
        serviceDate: serviceDate || null,
        serviceType,
        packageName: packageName || null,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        nextOfKinName: nextOfKinName || null,
        nextOfKinPhone: nextOfKinPhone || null,
        notes: notes || null,
      });
      toast.success("Case updated");
      setEditing(false);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function toggleChecklist(itemId: string, collected: boolean) {
    const checklist = (row.checklist || []).map((c: any) =>
      c.id === itemId ? { ...c, collected } : c
    );
    try {
      await patchFuneralCase(id, { checklist });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function toggleDeposit() {
    try {
      await patchFuneralCase(id, { depositPaid: !row.depositPaid });
      toast.success(row.depositPaid ? "Deposit marked unpaid" : "Deposit marked paid");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={row.number}
        subtitle={row.deceasedName}
        action={
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" asChild>
              <Link href="/cases">
                <ArrowLeft size={14} className="mr-1" />
                All cases
              </Link>
            </Button>
            {next && (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await transitionFuneralCase(id, next);
                    toast.success(`Case → ${next}`);
                    await reload();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Transition blocked");
                  }
                }}
              >
                → {next}
              </Button>
            )}
          </div>
        }
      />

      {/* Status bar */}
      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={row.status.toUpperCase()} />
        {row.serviceDate && (
          <span className="text-sm text-muted-fg flex items-center gap-1">
            <Calendar size={13} />
            {row.serviceDate}
          </span>
        )}
        {row.venue && <span className="text-sm text-muted-fg">{row.venue}</span>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Case details card */}
        <div className="rounded-[12px] border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Case details</h2>
            {!editing ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={saveDetails} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); reload(); }}>Cancel</Button>
              </div>
            )}
          </div>
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Service type</Label>
                <select
                  className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  {SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Package</Label>
                <Input className="mt-1 h-9 text-sm" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Venue</Label>
                <Input className="mt-1 h-9 text-sm" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Westpark Cemetery" />
              </div>
              <div>
                <Label className="text-xs">Service date</Label>
                <Input type="date" className="mt-1 h-9 text-sm" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Deposit amount (R)</Label>
                <Input type="number" className="mt-1 h-9 text-sm" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <textarea
                  className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background min-h-[80px] resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-fg">Service type</dt>
                <dd className="font-medium">{row.serviceType || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-fg">Package</dt>
                <dd className="font-medium">{row.packageName || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-fg">Venue</dt>
                <dd className="font-medium">{row.venue || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-fg">Service date</dt>
                <dd className="font-medium">{row.serviceDate || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-fg">Deposit</dt>
                <dd className="font-medium">
                  {row.depositAmount ? formatCurrency(row.depositAmount) : "—"}
                  <span className={`ml-2 text-xs ${row.depositPaid ? "text-success" : "text-warning"}`}>
                    {row.depositPaid ? "Paid" : "Unpaid"}
                  </span>
                </dd>
              </div>
              {row.depositAmount && (
                <div className="pt-1">
                  <Button size="sm" variant="outline" onClick={toggleDeposit}>
                    <DollarSign size={12} className="mr-1" />
                    {row.depositPaid ? "Mark unpaid" : "Mark deposit paid"}
                  </Button>
                </div>
              )}
              {row.notes && (
                <div className="pt-2 border-t border-border">
                  <dt className="text-muted-fg mb-1">Notes</dt>
                  <dd className="text-foreground whitespace-pre-wrap">{row.notes}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Next of kin */}
        <div className="rounded-[12px] border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <User size={16} />
              Next of kin
            </h2>
            {!editing && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
            )}
          </div>
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input className="mt-1 h-9 text-sm" value={nextOfKinName} onChange={(e) => setNextOfKinName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input className="mt-1 h-9 text-sm" value={nextOfKinPhone} onChange={(e) => setNextOfKinPhone(e.target.value)} />
              </div>
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-fg">Name</dt>
                <dd className="font-medium">{row.nextOfKinName || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-fg">Phone</dt>
                <dd className="font-medium">{row.nextOfKinPhone || "—"}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* Compliance checklist */}
        {(row.checklist || []).length > 0 && (
          <div className="rounded-[12px] border border-border p-5 space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText size={16} />
                Compliance documents
              </h2>
              <span className="text-sm text-muted-fg">{checklistDone}/{checklistTotal} collected</span>
            </div>
            <div className="divide-y divide-border">
              {(row.checklist || []).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleChecklist(item.id, !item.collected)}
                      className="text-primary"
                    >
                      {item.collected ? (
                        <CheckCircle2 size={18} className="text-success" />
                      ) : (
                        <Circle size={18} className="text-muted-fg" />
                      )}
                    </button>
                    <span className={`text-sm ${item.collected ? "line-through text-muted-fg" : "text-foreground"}`}>
                      {item.label}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={item.collected ? "outline" : "default"}
                    onClick={() => toggleChecklist(item.id, !item.collected)}
                  >
                    {item.collected ? "Undo" : "Mark collected"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
