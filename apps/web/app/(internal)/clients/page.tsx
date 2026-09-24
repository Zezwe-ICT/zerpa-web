"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, FileText, Mail, Phone, Plus, Receipt, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppChecklist } from "@/components/modules/setup/app-checklist";
import { useAuth } from "@/lib/auth/context";
import { createBillingCustomer, getBillingCustomers } from "@/lib/data/billing-customers";
import { CustomerPrivacy } from "@/components/modules/crm/customer-privacy";
import type { BillingCustomer } from "@zerpa/shared-types";

const EMPTY_FORM = {
  name: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  vatNumber: "",
  paymentTermsDays: "30",
  billingAddress: "",
  notes: "",
};

export default function CustomersPage() {
  const { company } = useAuth();
  const [customers, setCustomers] = useState<BillingCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!company?.id) return;
    setLoading(true);
    getBillingCustomers(company.id)
      .then((rows) => {
        setCustomers(rows);
        setLoadError(null);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load customers"))
      .finally(() => setLoading(false));
  }, [company?.id]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.contactPerson, c.contactEmail, c.contactPhone].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [customers, query]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function closeForm() {
    setShowForm(false);
    setError(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createBillingCustomer({
        name: form.name.trim(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        vatNumber: form.vatNumber.replace(/\s/g, "") || undefined,
        paymentTermsDays: Number(form.paymentTermsDays) || 0,
        billingAddress: form.billingAddress.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`${created.name} added`);
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add customer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Customers"
          subtitle={
            loading
              ? "Loading..."
              : `${customers.length} customer${customers.length !== 1 ? "s" : ""}. Won leads are added here automatically.`
          }
          action={
            !showForm ? (
              <Button className="gap-2" onClick={() => setShowForm(true)}>
                <Plus size={16} />
                Add Customer
              </Button>
            ) : undefined
          }
        />
      </div>

      <AppChecklist app="customers" />

      {showForm && (
        <div className="rounded-[12px] border border-border bg-background p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-base">Add Customer</h2>
            <button type="button" onClick={closeForm} className="text-muted-fg hover:text-foreground transition" aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Business or person&apos;s name *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Dignity Funeral Home"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Contact first name</Label>
                <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Nomsa" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Contact last name</Label>
                <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Mokoena" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email for invoices</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="accounts@company.co.za"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="082 123 4567" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vatNumber">VAT number</Label>
                <Input
                  id="vatNumber"
                  name="vatNumber"
                  value={form.vatNumber}
                  onChange={handleChange}
                  placeholder="4123456789"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paymentTermsDays">Pays within (days)</Label>
                <Input
                  id="paymentTermsDays"
                  name="paymentTermsDays"
                  type="number"
                  min={0}
                  max={365}
                  value={form.paymentTermsDays}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="billingAddress">Billing address</Label>
              <Textarea
                id="billingAddress"
                name="billingAddress"
                value={form.billingAddress}
                onChange={handleChange}
                placeholder="Printed on quotes and invoices"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={2} />
            </div>

            {error && <p className="text-sm text-danger bg-danger-bg rounded-[8px] px-4 py-3">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Add Customer"}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {customers.length > 5 && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers"
            className="pl-8"
            aria-label="Search customers"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-fg">Loading customers...</p>
        </div>
      ) : loadError ? (
        <p className="text-sm text-danger">{loadError}</p>
      ) : customers.length === 0 && !showForm ? (
        <div className="rounded-[12px] border border-border bg-background p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 size={22} className="text-muted-fg" />
          </div>
          <p className="font-semibold text-foreground mb-1">No customers yet</p>
          <p className="text-sm text-muted-fg mb-5">
            Add the people and businesses you quote and invoice. Leads you win are added automatically.
          </p>
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Your First Customer
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {visible.map((customer) => (
            <div
              key={customer.id}
              className="rounded-[12px] border border-border bg-background p-5 flex flex-wrap items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-10 h-10 rounded-[8px] bg-surface border border-border flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-muted-fg" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {customer.name}
                    {customer.erasedAt && (
                      <span className="ml-2 text-xs font-normal text-muted-fg">Personal details erased on request</span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-fg">
                    {customer.contactPerson && <span>{customer.contactPerson}</span>}
                    {customer.contactEmail && (
                      <a href={`mailto:${customer.contactEmail}`} className="flex items-center gap-1.5 hover:text-primary">
                        <Mail size={12} />
                        {customer.contactEmail}
                      </a>
                    )}
                    {customer.contactPhone && (
                      <a href={`tel:${customer.contactPhone}`} className="flex items-center gap-1.5 hover:text-primary">
                        <Phone size={12} />
                        {customer.contactPhone}
                      </a>
                    )}
                    {customer.vatNumber && <span>VAT {customer.vatNumber}</span>}
                    <span>Pays within {customer.paymentTermsDays ?? 30} days</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/billing/quotes/new?customer=${customer.id}`}>
                    <FileText size={14} className="mr-1.5" /> Quote
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/billing/invoices/new?customer=${customer.id}`}>
                    <Receipt size={14} className="mr-1.5" /> Invoice
                  </Link>
                </Button>
                {!customer.erasedAt && (
                  <CustomerPrivacy
                    id={customer.id}
                    name={customer.name}
                    onErased={() =>
                      setCustomers((prev) =>
                        prev.map((c) =>
                          c.id === customer.id
                            ? { ...c, contactEmail: undefined, contactPhone: undefined, contactPerson: undefined, postalAddress: undefined, erasedAt: new Date().toISOString() }
                            : c,
                        ),
                      )
                    }
                  />
                )}
              </div>
            </div>
          ))}
          {visible.length === 0 && <p className="text-sm text-muted-fg">No customers match “{query}”.</p>}
        </div>
      )}
    </PageContainer>
  );
}
