import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { CreateInvoiceForm } from "@/components/modules/billing/create-invoice-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Create Invoice - Billing",
  description: "Create a new invoice",
};

export default function CreateInvoicePage() {
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
          // In production, redirect to the invoice detail page
          // For now, just close the form
          console.log("Invoice created:", invoice);
        }}
      />
    </PageContainer>
  );
}
