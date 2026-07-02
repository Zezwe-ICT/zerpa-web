/**
 * @file app/(internal)/billing/automated/page.tsx
 * @description Automated invoices list route.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { AutomatedListClient } from "@/components/modules/billing/automated-list-client";

export default function AutomatedPage() {
  return (
    <PageContainer>
      <AutomatedListClient />
    </PageContainer>
  );
}
