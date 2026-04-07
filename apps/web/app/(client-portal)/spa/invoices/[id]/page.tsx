import { PageContainer } from "@/components/layouts/page-container";
import { ClientInvoiceDetail } from "@/components/modules/billing/client-invoice-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/data/invoices";

interface SpaInvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SpaInvoiceDetailPageProps) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    return { title: "Invoice not found" };
  }

  return {
    title: `${invoice.invoiceNumber}`,
    description: `Invoice ${invoice.invoiceNumber}`,
  };
}

export default async function SpaInvoiceDetailPage({
  params,
}: SpaInvoiceDetailPageProps) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice || invoice.tenantVertical !== "SPA") {
    return notFound();
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/spa/invoices">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={14} />
            Back to Invoices
          </Button>
        </Link>
      </div>

      <ClientInvoiceDetail invoice={invoice} />
    </PageContainer>
  );
}
