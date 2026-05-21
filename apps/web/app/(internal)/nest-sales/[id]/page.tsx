"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getNestSaleById, getProvisioningChecklist } from "@/lib/data/nest-sales";
import { NestSaleDetailClient } from "@/components/modules/nest-sales/nest-sale-detail-client";
import { PageContainer } from "@/components/layouts/page-container";

export default function NestSaleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [sale, setSale] = useState<Awaited<ReturnType<typeof getNestSaleById>>>(undefined);
  const [checklist, setChecklist] = useState<Awaited<ReturnType<typeof getProvisioningChecklist>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getNestSaleById(id), getProvisioningChecklist(id)])
      .then(([saleData, checklistData]) => {
        setSale(saleData);
        setChecklist(checklistData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-fg">Loading...</p>
        </div>
      </PageContainer>
    );
  }

  if (!sale) {
    return (
      <PageContainer>
        <p className="text-muted-fg">Sale not found.</p>
      </PageContainer>
    );
  }

  return <NestSaleDetailClient sale={sale} initialChecklist={checklist} />;
}
