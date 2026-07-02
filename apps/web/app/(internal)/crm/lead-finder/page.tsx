/**
 * @file app/(internal)/crm/lead-finder/page.tsx
 * @description Lead Finder route — map-based prospecting into CRM leads.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { LeadFinderClient } from "@/components/modules/crm/lead-finder-client";

export default function LeadFinderPage() {
  return (
    <PageContainer>
      <LeadFinderClient />
    </PageContainer>
  );
}
