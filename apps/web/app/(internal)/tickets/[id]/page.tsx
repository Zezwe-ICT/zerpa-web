import { TicketDetailClient } from "@/components/modules/msp/ticket-detail-client";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TicketDetailClient id={id} />;
}
