"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Plus, X, Mail, Phone } from "lucide-react";
import { createContact, createLead, getLeads } from "@/lib/data/crm";
import { useAuth } from "@/lib/auth/context";
import type { Lead } from "@zerpa/shared-types";

const VERTICALS = [
  { value: "FUNERAL", label: "Funeral" },
  { value: "AUTOMOTIVE", label: "Automotive" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "SPA", label: "Spa" },
] as const;

const VERTICAL_COLORS: Record<string, string> = {
  FUNERAL: "bg-funeral-bg text-funeral",
  AUTOMOTIVE: "bg-info-bg text-info",
  RESTAURANT: "bg-warning-bg text-warning",
  SPA: "bg-success-bg text-success",
};

const EMPTY_FORM = {
  company: "",
  vertical: "FUNERAL" as typeof VERTICALS[number]["value"],
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
};

export default function CustomersPage() {
  const { company } = useAuth();
  const [customers, setCustomers] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!company?.id) return;
    setLoading(true);
    getLeads("CLOSED_WON", company.id)
      .then(setCustomers)
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [company?.id]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company?.id) return;
    setSubmitting(true);
    setError(null);

    try {
      const contact = await createContact({
        tenantId: company.id,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        company: form.company,
      });

      const lead = await createLead({
        tenantId: company.id,
        contactId: contact.id,
        contact,
        company: form.company,
        vertical: form.vertical,
        status: "CLOSED_WON",
        estimatedValue: 0,
        notes: form.notes || undefined,
      });

      setCustomers((prev) => [lead, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add customer."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-8">
        <PageHeader
          title="Customers"
          subtitle={
            loading
              ? "Loading..."
              : `${customers.length} customer${customers.length !== 1 ? "s" : ""} on record`
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

      {/* Add customer form */}
      {showForm && (
        <div className="rounded-[12px] border border-border bg-background p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-base">Add Customer</h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
                setForm(EMPTY_FORM);
              }}
              className="text-muted-fg hover:text-foreground transition"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="company">Company / Business Name *</Label>
                <Input
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="e.g. Dignity Funeral Home"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vertical">Vertical *</Label>
                <select
                  id="vertical"
                  name="vertical"
                  value={form.vertical}
                  onChange={handleChange}
                  className="w-full h-10 rounded-[8px] border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {VERTICALS.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Contact First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Contact Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@company.co.za"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+27 11 123 4567"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any notes about this customer..."
                rows={2}
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger-bg rounded-[8px] px-4 py-3">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Add Customer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                  setForm(EMPTY_FORM);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Customers list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-fg">Loading customers...</p>
        </div>
      ) : customers.length === 0 && !showForm ? (
        <div className="rounded-[12px] border border-border bg-background p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 size={22} className="text-muted-fg" />
          </div>
          <p className="font-semibold text-foreground mb-1">No customers yet</p>
          <p className="text-sm text-muted-fg mb-5">
            Add your existing customers to keep track of them here.
          </p>
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Your First Customer
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-[12px] border border-border bg-background p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[8px] bg-surface border border-border flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-muted-fg" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground">
                      {customer.company}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-[4px] ${
                        VERTICAL_COLORS[customer.vertical] ??
                        "bg-muted text-muted-fg"
                      }`}
                    >
                      {customer.vertical}
                    </span>
                  </div>

                  {customer.contact && (
                    <div className="flex flex-wrap gap-4 mt-2">
                      <span className="text-xs text-muted-fg">
                        {customer.contact.firstName} {customer.contact.lastName}
                        {customer.contact.jobTitle &&
                          ` · ${customer.contact.jobTitle}`}
                      </span>
                      {customer.contact.email && (
                        <a
                          href={`mailto:${customer.contact.email}`}
                          className="flex items-center gap-1.5 text-xs text-muted-fg hover:text-primary transition"
                        >
                          <Mail size={12} />
                          {customer.contact.email}
                        </a>
                      )}
                      {customer.contact.phone && (
                        <a
                          href={`tel:${customer.contact.phone}`}
                          className="flex items-center gap-1.5 text-xs text-muted-fg hover:text-primary transition"
                        >
                          <Phone size={12} />
                          {customer.contact.phone}
                        </a>
                      )}
                    </div>
                  )}

                  {customer.notes && (
                    <p className="text-xs text-muted-fg mt-2 max-w-lg">
                      {customer.notes}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-xs font-medium px-2 py-1 rounded-full bg-success-bg text-success flex-shrink-0">
                Customer
              </span>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
