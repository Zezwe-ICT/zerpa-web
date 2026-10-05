"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, Edit2, Mail, Phone, User } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getContactById } from "@/lib/data/crm";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import type { Contact } from "@zerpa/shared-types";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { company } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    getContactById(company.id, params.id as string)
      .then((c) => setContact(c || null))
      .catch(() => toast.error("Contact not found"))
      .finally(() => setLoading(false));
  }, [company?.id, params.id]);

  if (loading) return <PageContainer><p className="text-sm text-muted-fg py-8">Loading…</p></PageContainer>;
  if (!contact) return <PageContainer><p className="text-sm text-danger py-8">Contact not found.</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        subtitle={[contact.jobTitle, contact.company].filter(Boolean).join(" at ")}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/crm/contacts")}>
              <ArrowLeft size={14} className="mr-1" />
              Back
            </Button>
            <Button size="sm" asChild>
              <Link href={`/crm/contacts/${contact.id}/edit`}>
                <Edit2 size={14} className="mr-1" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-2xl space-y-4">
        {/* Contact info card */}
        <div className="rounded-[12px] border border-border bg-background p-6 space-y-4">
          <h2 className="section-title">Contact details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {contact.email && (
              <div>
                <dt className="text-xs text-muted-fg flex items-center gap-1 mb-1"><Mail size={11} /> Email</dt>
                <dd><a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a></dd>
              </div>
            )}
            {contact.phone && (
              <div>
                <dt className="text-xs text-muted-fg flex items-center gap-1 mb-1"><Phone size={11} /> Phone</dt>
                <dd><a href={`tel:${contact.phone}`} className="text-primary hover:underline">{contact.phone}</a></dd>
              </div>
            )}
            {contact.company && (
              <div>
                <dt className="text-xs text-muted-fg flex items-center gap-1 mb-1"><Briefcase size={11} /> Company</dt>
                <dd>{contact.company}</dd>
              </div>
            )}
            {contact.jobTitle && (
              <div>
                <dt className="text-xs text-muted-fg flex items-center gap-1 mb-1"><User size={11} /> Title</dt>
                <dd>{contact.jobTitle}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted-fg mb-1">Added</dt>
              <dd>{new Date(contact.createdAt).toLocaleDateString("en-ZA")}</dd>
            </div>
          </dl>
        </div>

        {/* Notes */}
        {contact.notes && (
          <div className="rounded-[12px] border border-border bg-background p-6">
            <h2 className="section-title mb-2">Notes</h2>
            <p className="text-sm text-foreground-2 whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}

        {/* Create lead CTA */}
        <div className="rounded-[12px] border border-dashed border-border p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Create a lead for this contact</p>
            <p className="text-xs text-muted-fg">Start tracking a sales opportunity</p>
          </div>
          <Button size="sm" asChild>
            <Link href={`/crm/leads/new?contactId=${contact.id}`}>New lead</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
