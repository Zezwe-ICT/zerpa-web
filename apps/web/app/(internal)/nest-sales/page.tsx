import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { formatDate } from "@/lib/utils/dates";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getNestSales } from "@/lib/data/nest-sales";

export const metadata = {
  title: "Nest Sales - Dashboard",
  description: "Track Nest Sales onboarding",
};

export default async function NestSalesPage() {
  const sales = await getNestSales();

  const statuses = {
    PENDING: sales.filter((s) => s.status === "PENDING"),
    SETUP: sales.filter((s) => s.status === "SETUP"),
    ACTIVE: sales.filter((s) => s.status === "ACTIVE"),
    SUSPENDED: sales.filter((s) => s.status === "SUSPENDED"),
  };

  return (
    <PageContainer>
      <div className="mb-8">
        <PageHeader
          title="Nest Sales"
          subtitle="Monitor all Nest Sales onboarding and provisioning"
        />
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(statuses).map(([status, items]) => (
          <div key={status} className="rounded-[8px] border border-border p-4">
            <p className="text-sm text-muted-fg font-medium mb-1">{status}</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
        ))}
      </div>

      {/* Sales Table */}
      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold">Tenant</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Setup Fee</th>
              <th className="px-4 py-3 text-left font-semibold">Monthly</th>
              <th className="px-4 py-3 text-left font-semibold">Trial</th>
              <th className="px-4 py-3 text-left font-semibold">Billing Start</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-fg">
                  No Nest Sales found
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-border hover:bg-muted/30 transition"
                >
                  <td className="px-4 py-3 font-medium">
                    {sale.tenant?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sale.status} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <CurrencyDisplay amount={sale.setupFeeAmount} />
                    {sale.setupFeePaid && (
                      <span className="block text-xs text-success">✓ Paid</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">
                    <CurrencyDisplay amount={sale.monthlyAmount} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-fg">
                    {formatDate(sale.trialStartAt, "dd MMM")} —{" "}
                    {formatDate(sale.trialEndsAt, "dd MMM")}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {formatDate(sale.billingStartAt, "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/nest-sales/${sale.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye size={14} />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
