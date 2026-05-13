import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ClientInvoiceList } from "@/components/modules/billing/client-invoice-list";
import { getInvoices } from "@/lib/data/invoices";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Invoices - Client Portal",
  description: "View your invoices",
};

export default async function AutomotiveInvoicesPage() {
  const invoices = await getInvoices();
  const clientInvoices = invoices.filter(
    (inv) => inv.tenantVertical === "AUTOMOTIVE"
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
        basePath="/automotive/invoices"
      />
    </PageContainer>
  );
}
