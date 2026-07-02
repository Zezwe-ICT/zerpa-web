/**
 * @file app/(internal)/billing/automated/[id]/page.tsx
 * @description Automation config detail / editor route.
 */
"use client";

import { useParams } from "next/navigation";
import { AutomatedConfigEditor } from "@/components/modules/billing/automated-config-editor";

export default function AutomatedDetailPage() {
  const params = useParams();
  return <AutomatedConfigEditor configId={params.id as string} />;
}
