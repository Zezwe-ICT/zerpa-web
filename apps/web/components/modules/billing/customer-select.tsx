/**
 * @file components/modules/billing/customer-select.tsx
 * @description Customer dropdown for quotes and invoices (the company's CRM accounts), with an
 * inline "add a new customer" form so nobody has to leave the document to create one.
 * Emits both the id and the resolved BillingCustomer so editors can prefill contact details.
 */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/client";
import { createBillingCustomer, getBillingCustomers } from "@/lib/data/billing-customers";
import type { BillingCustomer } from "@zerpa/shared-types";

interface CustomerSelectProps {
  value: string;
  onChange: (id: string, customer: BillingCustomer | null) => void;
  id?: string;
  required?: boolean;
  /** Shown when the saved document points at a customer that isn't in the list (e.g. older data). */
  fallbackName?: string;
}

const NEW = "__new__";
const EMPTY = { name: "", contact: "", email: "", phone: "" };

export function CustomerSelect({ value, onChange, id = "customer", required, fallbackName }: CustomerSelectProps) {
  const { company } = useAuth();
  const [customers, setCustomers] = useState<BillingCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getBillingCustomers(company?.id)
      .then(setCustomers)
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [company?.id]);

  const known = customers.some((c) => c.id === value);

  async function save() {
    if (!form.name.trim()) {
      toast.error("Enter the customer's name");
      return;
    }
    setSaving(true);
    try {
      const [firstName, ...rest] = form.contact.trim().split(/\s+/);
      const created = await createBillingCustomer({
        name: form.name.trim(),
        firstName: firstName || undefined,
        lastName: rest.join(" ") || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      setCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(created.id, created);
      setAdding(false);
      setForm(EMPTY);
      toast.success(`${created.name} added to your customers`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not add the customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <select
        id={id}
        required={required}
        value={adding ? NEW : value}
        onChange={(e) => {
          if (e.target.value === NEW) {
            setAdding(true);
            return;
          }
          setAdding(false);
          onChange(e.target.value, customers.find((c) => c.id === e.target.value) ?? null);
        }}
        className="w-full h-10 rounded-[8px] border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">{loading ? "Loading customers…" : customers.length ? "Select a customer…" : "No customers yet"}</option>
        {value && !known && !loading && <option value={value}>{fallbackName || "Customer from older record"}</option>}
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        <option value={NEW}>+ Add a new customer…</option>
      </select>

      {adding && (
        <div className="rounded-[8px] border border-border bg-surface p-3 space-y-2">
          <Input
            autoFocus
            placeholder="Business or person's name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Contact person (optional)"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              type="tel"
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={saving}>
              {saving ? "Adding…" : "Add customer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
