/**
 * @file app/(internal)/billing/invoices/[id]/page.tsx
 * @description Invoice detail / editor route.
 */
"use client";

import { useParams } from "next/navigation";
import { InvoiceEditor } from "@/components/modules/billing/invoice-editor";

export default function InvoiceDetailPage() {
  const params = useParams();
  return <InvoiceEditor invoiceId={params.id as string} />;
}
