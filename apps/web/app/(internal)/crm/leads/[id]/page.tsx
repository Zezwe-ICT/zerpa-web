import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils/dates";
import { ArrowLeft, Edit2, MessageSquare, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById } from "@/lib/data/crm";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) {
    return { title: "Lead not found" };
  }

  return {
    title: `${lead.company} - Leads`,
    description: `Lead for ${lead.company}`,
  };
}

export default async function LeadDetailPage({
  params,
}: LeadDetailPageProps) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) {
    return notFound();
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/crm/leads">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={14} />
            Back to Leads
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Main Info (2 cols) */}
        <div className="col-span-2 space-y-6">
          {/* Company Header */}
          <div className="rounded-[12px] border border-border bg-background p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {lead.company}
                </h1>
                <p className="text-sm text-muted-fg mt-1">{lead.vertical}</p>
              </div>
              <Link href={`/crm/leads/${lead.id}/edit`}>
                <Button className="gap-2">
                  <Edit2 size={16} />
                  Edit
                </Button>
              </Link>
            </div>

            {/* Contact Info */}
            {lead.contact && (
              <div className="border-t border-border pt-4 mt-4 space-y-3">
                <h3 className="font-semibold text-sm">Primary Contact</h3>
                <div className="space-y-2">
                  <p className="font-medium">
                    {lead.contact.firstName} {lead.contact.lastName}
                  </p>
                  {lead.contact.jobTitle && (
                    <p className="text-sm text-muted-fg">
                      {lead.contact.jobTitle}
                    </p>
                  )}
                  <div className="flex gap-3 mt-3">
                    {lead.contact.email && (
                      <a
                        href={`mailto:${lead.contact.email}`}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Mail size={14} />
                        {lead.contact.email}
                      </a>
                    )}
                    {lead.contact.phone && (
                      <a
                        href={`tel:${lead.contact.phone}`}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Phone size={14} />
                        {lead.contact.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="rounded-[12px] border border-border bg-background p-6">
              <h3 className="font-semibold text-sm mb-3">Notes</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {lead.notes}
              </p>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="rounded-[12px] border border-border bg-background p-6">
            <h3 className="font-semibold text-sm mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-3 h-3 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Lead Created</p>
                  <p className="text-xs text-muted-fg mt-0.5">
                    {formatDate(lead.createdAt, "EEEE, d MMMM yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>
              {lead.lastActivityAt && (
                <div className="flex gap-4">
                  <div className="w-3 h-3 rounded-full bg-muted mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Last Activity</p>
                    <p className="text-xs text-muted-fg mt-0.5">
                      {formatDate(
                        lead.lastActivityAt,
                        "EEEE, d MMMM yyyy 'at' HH:mm"
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right - Sidebar Info (1 col) */}
        <div className="rounded-[12px] border border-border bg-background p-5 h-fit sticky top-24 space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <span className="text-xs text-muted-fg uppercase tracking-wide font-semibold">
              Status
            </span>
            <StatusBadge status={lead.status} className="inline-block" />
          </div>

          {/* Divider */}
          <div className="border-t border-border my-2" />

          {/* Value */}
          <dl className="space-y-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-fg">Estimated Value</dt>
              <dd className="font-mono font-semibold text-foreground text-right">
                R{lead.estimatedValue.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-fg">Vertical</dt>
              <dd className="font-medium text-foreground text-right">
                {lead.vertical}
              </dd>
            </div>
          </dl>

          {/* Divider */}
          <div className="border-t border-border my-4" />

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <MessageSquare size={14} className="mr-2" />
              Log Activity
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Phone size={14} className="mr-2" />
              Schedule Call
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
