/**
 * @file app/(internal)/help/tickets/[id]/page.tsx
 * @description One help request and its replies.
 */
"use client";

import { useParams } from "next/navigation";
import { HelpTicket } from "@/components/modules/help/help-client";

export default function HelpTicketPage() {
  const params = useParams();
  return <HelpTicket id={params.id as string} />;
}
