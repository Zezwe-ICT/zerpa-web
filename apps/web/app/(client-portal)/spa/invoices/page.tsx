/**
 * @file app/(client-portal)/spa/invoices/page.tsx
 * @description Spa client portal — invoices list. Force-dynamic; fetches all
 * invoices and filters to SPA vertical. Renders ClientInvoiceList with invoice
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

export default async function SpaInvoicesPage() {
  let invoices: import("@zerpa/shared-types").Invoice[] = [];
  try {
    invoices = await getInvoices();
  } catch {
    // fall through with empty list
  }
  const clientInvoices = invoices.filter(
    (inv) => inv.tenantVertical === "SPA"
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
        basePath="/spa/invoices"
      />
    </PageContainer>
  );
}
