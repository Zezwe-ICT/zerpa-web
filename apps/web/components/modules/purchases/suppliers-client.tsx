/**
 * @file components/modules/purchases/suppliers-client.tsx
 * @description Suppliers list with what you owe each, an add/edit form, and a quick-add
 * used from the bill screen.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSupplier, getSupplier, listSuppliers, updateSupplier, type Supplier } from "@/lib/api/purchases";
import { ApiError } from "@/lib/api/client";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils/currency";

const EMPTY = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  vatNumber: "",
  paymentTermsDays: "30",
  bankName: "",
  bankBranchCode: "",
  bankAccountNumber: "",
  notes: "",
};
type FormState = typeof EMPTY;

function toBody(f: FormState): Partial<Supplier> {
  return {
    name: f.name.trim(),
    contactPerson: f.contactPerson.trim() || null,
    email: f.email.trim() || null,
    phone: f.phone.trim() || null,
    vatNumber: f.vatNumber.trim() || null,
    paymentTermsDays: Number(f.paymentTermsDays) || 0,
    bankName: f.bankName.trim() || null,
    bankBranchCode: f.bankBranchCode.trim() || null,
    bankAccountNumber: f.bankAccountNumber.trim() || null,
    notes: f.notes.trim() || null,
  };
}

function SupplierFields({ form, set, compact = false }: { form: FormState; set: (f: FormState) => void; compact?: boolean }) {
  const field = (key: keyof FormState, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`sup-${key}`}>{label}</Label>
      <Input id={`sup-${key}`} value={form[key]} onChange={(e) => set({ ...form, [key]: e.target.value })} {...props} />
    </div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">{field("name", "Supplier name *", { placeholder: "e.g. Scoop Distribution", autoFocus: true })}</div>
      {field("vatNumber", "VAT number", { placeholder: "4123456789", inputMode: "numeric" })}
      {field("paymentTermsDays", "Pay within (days)", { type: "number", min: 0, max: 365 })}
      {!compact && (
        <>
          {field("contactPerson", "Contact person")}
          {field("email", "Email for remittances", { type: "email" })}
          {field("phone", "Phone")}
          {field("bankName", "Bank")}
          {field("bankAccountNumber", "Account number", { inputMode: "numeric", autoComplete: "off" })}
          {field("bankBranchCode", "Branch code", { inputMode: "numeric" })}
        </>
      )}
    </div>
  );
}

/** Small "+ New" button next to a supplier picker. */
export function SupplierQuickAdd({ onCreated }: { onCreated: (s: Supplier) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const s = await createSupplier(toBody(form));
      onCreated(s);
      toast.success(`${s.name} added`);
      setOpen(false);
      setForm(EMPTY);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add the supplier");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Plus size={14} className="mr-1" /> New
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New supplier</DialogTitle>
            <DialogDescription>Just the basics. Add bank details later on the Suppliers page.</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 space-y-3">
            <SupplierFields form={form} set={setForm} compact />
            {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy || form.name.trim().length < 2}>{busy ? "Adding…" : "Add supplier"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SuppliersList() {
  const { can } = usePermissions();
  const canManage = can("billing.manage");
  const [rows, setRows] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listSuppliers()
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load suppliers"));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return !q || !rows ? rows : rows.filter((s) => [s.name, s.contactPerson, s.email, s.vatNumber].some((v) => v?.toLowerCase().includes(q)));
  }, [rows, query]);

  async function startEdit(id: string) {
    const s = await getSupplier(id);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      vatNumber: s.vatNumber ?? "",
      paymentTermsDays: String(s.paymentTermsDays),
      bankName: s.bankName ?? "",
      bankBranchCode: s.bankBranchCode ?? "",
      bankAccountNumber: s.bankAccountNumber ?? "",
      notes: s.notes ?? "",
    });
    setEditing(id);
  }

  async function save() {
    setBusy(true);
    try {
      const saved = editing === "new" ? await createSupplier(toBody(form)) : await updateSupplier(editing!, toBody(form));
      setRows(await listSuppliers());
      toast.success(`${saved.name} saved`);
      setEditing(null);
      setForm(EMPTY);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save the supplier");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Suppliers"
          subtitle={rows ? `${rows.length} supplier${rows.length === 1 ? "" : "s"}` : "Loading…"}
          action={
            canManage && !editing ? (
              <Button className="gap-2" onClick={() => { setForm(EMPTY); setEditing("new"); }}>
                <Plus size={16} /> Add supplier
              </Button>
            ) : undefined
          }
        />
      </div>

      {editing && (
        <div className="rounded-[12px] border border-border bg-background p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">{editing === "new" ? "Add supplier" : "Edit supplier"}</h2>
            <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="text-muted-fg hover:text-foreground"><X size={16} /></button>
          </div>
          <SupplierFields form={form} set={setForm} />
          <p className="text-xs text-muted-fg">Bank account numbers are encrypted and only shown in full to people who can pay bills.</p>
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy || form.name.trim().length < 2}>{busy ? "Saving…" : "Save supplier"}</Button>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}

      {(rows?.length ?? 0) > 6 && (
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search suppliers" className="mb-4 max-w-sm" aria-label="Search suppliers" />
      )}

      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : visible === null ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-surface" />
      ) : visible.length === 0 && !editing ? (
        <div className="rounded-[12px] border border-border bg-background p-10 text-center">
          <Truck className="mx-auto mb-3 text-muted-fg" size={22} />
          <p className="font-semibold">No suppliers yet</p>
          <p className="text-sm text-muted-fg mt-1">Add the businesses you buy from, then capture their invoices as bills.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((s) => (
            <div key={s.id} className="rounded-[12px] border border-border bg-background p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-fg mt-0.5">
                  {[s.contactPerson, s.email, s.vatNumber ? `VAT ${s.vatNumber}` : null, `Pay within ${s.paymentTermsDays} days`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {(s.owed ?? 0) > 0 && (
                  <span className="text-sm">
                    <span className="text-muted-fg">You owe </span>
                    <span className="font-mono font-semibold">{formatCurrency(s.owed!)}</span>
                  </span>
                )}
                {canManage && (
                  <Button size="sm" variant="outline" onClick={() => startEdit(s.id)}>
                    <Pencil size={14} className="mr-1.5" /> Edit
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
