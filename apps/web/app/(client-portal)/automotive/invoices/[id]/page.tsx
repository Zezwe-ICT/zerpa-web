/**
 * @file app/(client-portal)/automotive/invoices/[id]/page.tsx
 * @description Automotive client portal — invoice detail page. Force-dynamic;
 * fetches invoice by id via getInvoiceById() and renders ClientInvoiceDetail.
 * Shows line items, totals, status and a print/download action.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { ClientInvoiceDetail } from "@/components/modules/billing/client-invoice-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/data/invoices";

export const dynamic = "force-dynamic";

interface AutomotiveInvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AutomotiveInvoiceDetailPageProps) {
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

export default async function AutomotiveInvoiceDetailPage({
  params,
}: AutomotiveInvoiceDetailPageProps) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice || invoice.tenantVertical !== "AUTOMOTIVE") {
    return notFound();
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/automotive/invoices">
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
