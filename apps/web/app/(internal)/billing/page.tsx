import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { BillingListClient } from "@/components/modules/billing/billing-list-client";
import { getInvoices } from "@/lib/data/invoices";
import { Plus } from "lucide-react";

export default async function BillingPage() {
  const invoices = await getInvoices();

  return (
    <PageContainer>
      <PageHeader
        title="Billing"
        subtitle="Manage invoices for all Zerpa clients"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Bulk Actions
            </Button>
            <Button size="sm">
              <Plus size={14} className="mr-1.5" />
              New Invoice
            </Button>
          </div>
        }
      />

      <BillingListClient initialInvoices={invoices} />
    </PageContainer>
  );
}
