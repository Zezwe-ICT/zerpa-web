/**
 * @file app/(internal)/billing/create/page.tsx
 * @description Create new invoice page. Renders the CreateInvoiceForm inside
 * the internal shell. On successful creation, redirects back to /billing.
 */
"use client";

import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { CreateInvoiceForm } from "@/components/modules/billing/create-invoice-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateInvoicePage() {
  const router = useRouter();

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

      <div className="mb-6">
        <PageHeader
          title="Create Invoice"
          subtitle="Create a new invoice for a client. Save as draft to edit later."
        />
      </div>

      <CreateInvoiceForm
        onSuccess={(invoice) => {
          router.push(`/billing/${invoice.id}`);
        }}
      />
    </PageContainer>
  );
}
