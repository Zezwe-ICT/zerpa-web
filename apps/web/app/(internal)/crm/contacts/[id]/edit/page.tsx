"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getContactById, updateContact } from "@/lib/data/crm";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import type { Contact } from "@zerpa/shared-types";

export default function EditContactPage() {
  const params = useParams();
  const router = useRouter();
  const { company } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!company) return;
    getContactById(company.id, params.id as string)
      .then((c) => {
        if (!c) return;
        setContact(c);
        setFirstName(c.firstName || "");
        setLastName(c.lastName || "");
        setEmail(c.email || "");
        setPhone(c.phone || "");
        setCompanyName(c.company || "");
        setJobTitle(c.jobTitle || "");
        setNotes(c.notes || "");
      })
      .catch(() => toast.error("Contact not found"))
      .finally(() => setLoading(false));
  }, [company?.id, params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact) return;
    if (!firstName.trim()) return toast.error("First name is required");
    setSubmitting(true);
    try {
      await updateContact(contact.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: companyName.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Contact updated");
      router.push(`/crm/contacts/${contact.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update contact");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageContainer><p className="text-sm text-muted-fg py-8">Loading…</p></PageContainer>;
  if (!contact) return <PageContainer><p className="text-sm text-danger py-8">Contact not found.</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        title="Edit contact"
        subtitle={`${contact.firstName} ${contact.lastName}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.push(`/crm/contacts/${contact.id}`)}>
            <ArrowLeft size={14} className="mr-1" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-[12px] border border-border bg-background p-6 space-y-4">
          <h2 className="section-title">Personal details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name *</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-[12px] border border-border bg-background p-6 space-y-4">
          <h2 className="section-title">Work details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-[12px] border border-border bg-background p-6 space-y-4">
          <h2 className="section-title">Notes</h2>
          <textarea
            className="w-full min-h-[100px] rounded-[8px] border border-border bg-background px-3 py-2 text-sm resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save changes"}</Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/crm/contacts/${contact.id}`)}>Cancel</Button>
        </div>
      </form>
    </PageContainer>
  );
}
