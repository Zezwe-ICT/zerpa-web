/**
 * Portal invoices — scoped to the authenticated company, not vertical alone.
 */
"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ClientInvoiceList } from "@/components/modules/billing/client-invoice-list";
import { useAuth } from "@/lib/auth/context";
import { apiRequest } from "@/lib/api/client";
import type { Invoice } from "@zerpa/shared-types";

export default function PortalInvoicesPage({
  basePath,
  title = "Invoices",
}: {
  basePath: string;
  title?: string;
}) {
  const { company } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company?.id) return;
    apiRequest<Invoice[]>("/billing/invoices", {
      headers: { "X-Company-Id": company.id },
    })
      .then(setInvoices)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load invoices"));
  }, [company?.id]);

  return (
    <PageContainer>
      <div className="mb-8">
        <PageHeader title={title} subtitle={`Billing for ${company?.name ?? "your company"}`} />
      </div>
      {error && <p className="text-sm text-danger mb-4">{error}</p>}
      <ClientInvoiceList invoices={invoices} basePath={basePath} />
    </PageContainer>
  );
}
