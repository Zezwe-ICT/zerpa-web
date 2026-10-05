/**
 * @file app/(internal)/purchases/bills/[id]/page.tsx
 * @description Supplier bill detail route.
 */
"use client";

import { useParams } from "next/navigation";
import { BillEditor } from "@/components/modules/purchases/bills-client";

export default function BillDetailPage() {
  const params = useParams();
  return <BillEditor billId={params.id as string} />;
}
