/**
 * @file app/(internal)/crm/leads/page.tsx
 * @description CRM leads pipeline page. Server-fetches all leads via getLeads()
 * and renders them in the LeadsListClient component with stage filtering.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LeadsListClient } from "@/components/modules/crm/leads-list-client";

export const metadata = {
  title: "Leads - CRM",
  description: "Manage your sales pipeline",
};

export default function LeadsPage() {
  return (
    <PageContainer>
      <div className="mb-8">
        <PageHeader
          title="Leads"
          subtitle="Manage your sales pipeline and track opportunities"
        />
      </div>

      <LeadsListClient />
    </PageContainer>
  );
}
