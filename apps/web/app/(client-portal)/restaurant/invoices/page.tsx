/**
 * @file app/(client-portal)/restaurant/invoices/page.tsx
 * @description Restaurant client portal — invoices list. Force-dynamic; fetches all
 * invoices and filters to RESTAURANT vertical. Renders ClientInvoiceList with invoice
 * number, amount, status and a link to each invoice detail page.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ClientInvoiceList } from "@/components/modules/billing/client-invoice-list";
import { getInvoices } from "@/lib/data/invoices";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Invoices - Client Portal",
  description: "View your invoices",
};

export default async function RestaurantInvoicesPage() {
  const invoices = await getInvoices();
  const clientInvoices = invoices.filter(
    (inv) => inv.tenantVertical === "RESTAURANT"
  );

  return (
    <PageContainer>
      <div className="mb-8">
        <PageHeader
          title="Invoices"
          subtitle="View and manage your billing statements"
        />
      </div>

      <ClientInvoiceList
        invoices={clientInvoices}
        basePath="/restaurant/invoices"
      />
    </PageContainer>
  );
}
