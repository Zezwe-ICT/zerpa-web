"use client";

import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { NewLeadForm } from "@/components/modules/crm/new-lead-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewLeadPage() {
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

      <div className="mb-6">
        <PageHeader
          title="New Lead"
          subtitle="Add a new lead to your sales pipeline. A contact will be created automatically."
        />
      </div>

      <NewLeadForm />
    </PageContainer>
  );
}
