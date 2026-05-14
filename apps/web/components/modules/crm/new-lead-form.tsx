"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/context";
import { createContact, createLead } from "@/lib/data/crm";

const VERTICALS = [
  { value: "FUNERAL", label: "Funeral" },
  { value: "AUTOMOTIVE", label: "Automotive" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "SPA", label: "Spa" },
] as const;

const STAGES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiation" },
] as const;

export function NewLeadForm() {
  const router = useRouter();
  const { company } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    // Contact fields
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    contactCompany: "",
    // Lead fields
    vertical: "FUNERAL" as typeof VERTICALS[number]["value"],
    stage: "NEW" as typeof STAGES[number]["value"],
    estimatedValue: "",
    notes: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company?.id) {
      setError("No active company selected. Please select a company first.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: create contact
      const contact = await createContact({
        tenantId: company.id,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        company: form.contactCompany || undefined,
      });

      // Step 2: create lead using the contact
      const lead = await createLead({
        tenantId: company.id,
        contactId: contact.id,
        vertical: form.vertical,
        status: form.stage,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : 0,
        notes: form.notes || undefined,
        company: form.contactCompany || `${form.firstName} ${form.lastName}`,
      });

      router.push(`/crm/leads/${lead.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Contact Section */}
      <div className="rounded-[12px] border border-border bg-background p-6 space-y-4">
        <h2 className="font-semibold text-base">Contact Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name *</Label>
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
            <Label htmlFor="lastName">Last Name *</Label>
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
              placeholder="john@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="012 345 6789"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contactCompany">Company / Business Name</Label>
          <Input
            id="contactCompany"
            name="contactCompany"
            value={form.contactCompany}
            onChange={handleChange}
            placeholder="Smith Funeral Home"
          />
        </div>
      </div>

      {/* Lead Section */}
      <div className="rounded-[12px] border border-border bg-background p-6 space-y-4">
        <h2 className="font-semibold text-base">Lead Details</h2>

        <div className="grid grid-cols-2 gap-4">
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
          <div className="space-y-1.5">
            <Label htmlFor="stage">Stage</Label>
            <select
              id="stage"
              name="stage"
              value={form.stage}
              onChange={handleChange}
              className="w-full h-10 rounded-[8px] border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estimatedValue">Estimated Value (ZAR)</Label>
          <Input
            id="estimatedValue"
            name="estimatedValue"
            type="number"
            min="0"
            value={form.estimatedValue}
            onChange={handleChange}
            placeholder="22200"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Any additional notes about this lead..."
            rows={3}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger-bg rounded-[8px] px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Lead"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
