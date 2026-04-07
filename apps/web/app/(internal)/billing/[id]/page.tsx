import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { InvoiceDetailClient } from "@/components/modules/billing/invoice-detail-client";
import { getInvoiceById } from "@/lib/data/invoices";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    return notFound();
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/billing">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={14} />
            Back to Billing
          </Button>
        </Link>
      </div>

      <InvoiceDetailClient invoice={invoice} />
    </PageContainer>
  );
}
