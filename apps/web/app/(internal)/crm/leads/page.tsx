import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LeadsListClient } from "@/components/modules/crm/leads-list-client";
import { getLeads } from "@/lib/data/crm";

export const metadata = {
  title: "Leads - CRM",
  description: "Manage your sales pipeline",
};

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <PageContainer>
      <div className="mb-8">
        <PageHeader
          title="Leads"
          subtitle="Manage your sales pipeline and track opportunities"
        />
      </div>

      <LeadsListClient initialLeads={leads} />
    </PageContainer>
  );
}
