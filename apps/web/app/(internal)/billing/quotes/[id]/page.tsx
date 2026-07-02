/**
 * @file app/(internal)/billing/quotes/[id]/page.tsx
 * @description Quote detail / editor route.
 */
"use client";

import { useParams } from "next/navigation";
import { QuoteEditor } from "@/components/modules/billing/quote-editor";

export default function QuoteDetailPage() {
  const params = useParams();
  return <QuoteEditor quoteId={params.id as string} />;
}
