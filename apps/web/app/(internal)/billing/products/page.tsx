/**
 * @file app/(internal)/billing/products/page.tsx
 * @description Products & Services catalogue — the central list of everything
 * billed for. Feeds the line-item product autocomplete and automation configs.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { ProductsClient } from "@/components/modules/billing/products-client";

export default function ProductsPage() {
  return (
    <PageContainer>
      <ProductsClient />
    </PageContainer>
  );
}
