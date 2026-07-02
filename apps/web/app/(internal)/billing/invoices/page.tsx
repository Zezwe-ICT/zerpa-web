/**
 * @file app/(internal)/billing/invoices/page.tsx
 * @description Invoices list route.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { InvoicesListClient } from "@/components/modules/billing/invoices-list-client";

export default function InvoicesPage() {
  return (
    <PageContainer>
      <InvoicesListClient />
    </PageContainer>
  );
}
