/**
 * @file app/(internal)/billing/quotes/page.tsx
 * @description Quotes list route.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { QuotesListClient } from "@/components/modules/billing/quotes-list-client";

export default function QuotesPage() {
  return (
    <PageContainer>
      <QuotesListClient />
    </PageContainer>
  );
}
