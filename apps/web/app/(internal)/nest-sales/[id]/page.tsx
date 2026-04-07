import { notFound } from "next/navigation";
import { getNestSaleById, getProvisioningChecklist } from "@/lib/data/nest-sales";
import { NestSaleDetailClient } from "@/components/modules/nest-sales/nest-sale-detail-client";

interface NestSaleDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NestSaleDetailPageProps) {
  const { id } = await params;
  const sale = await getNestSaleById(id);

  if (!sale) {
    return { title: "Nest Sale not found" };
  }

  return {
    title: `${sale.tenant?.name || "Sale"} - Nest Sales`,
    description: `Nest Sale for ${sale.tenant?.name}`,
  };
}

export default async function NestSaleDetailPage({
  params,
}: NestSaleDetailPageProps) {
  const { id } = await params;
  const sale = await getNestSaleById(id);

  if (!sale) {
    notFound();
  }

  const checklist = await getProvisioningChecklist(id);

  return <NestSaleDetailClient sale={sale} initialChecklist={checklist} />;
}
