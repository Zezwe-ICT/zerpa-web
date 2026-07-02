/**
 * @file app/(internal)/billing/page.tsx
 * @description Billing index — redirects to the Invoices list, the default
 * landing tab for the Billing section.
 */
import { redirect } from "next/navigation";

export default function BillingPage() {
  redirect("/billing/invoices");
}
