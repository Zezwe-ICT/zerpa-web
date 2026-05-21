"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { InvoiceDetailClient } from "@/components/modules/billing/invoice-detail-client";
import { getInvoiceById } from "@/lib/data/invoices";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Invoice } from "@zerpa/shared-types";

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvoiceById(id)
      .then(setInvoice)
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-fg">Loading invoice...</p>
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
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
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-fg">Invoice not found.</p>
        </div>
      </PageContainer>
    );
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
