/**
 * @file app/(internal)/billing/credit-notes/[id]/page.tsx
 * @description Credit note detail route.
 */
"use client";

import { useParams } from "next/navigation";
import { CreditNoteDetail } from "@/components/modules/billing/credit-notes-client";

export default function CreditNoteDetailPage() {
  const params = useParams();
  return <CreditNoteDetail id={params.id as string} />;
}
