/**
 * @file app/(internal)/funeral/cases/page.tsx
 * @description Internal funeral operations — active cases list. Server-fetches
 * all funeral cases via getFuneralCases() and renders a table with status,
 * scheduled date and a link to each case detail page.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFuneralCases } from "@/lib/data/funeral";

export const metadata = {
  title: "Cases - Funeral Operations",
  description: "Manage funeral cases",
};

export default async function FuneralCasesPage() {
  const cases = await getFuneralCases();

  const statuses = {
    INTAKE: cases.filter((c) => c.status === "INTAKE"),
    ACTIVE: cases.filter((c) => c.status === "ACTIVE"),
    PENDING_BURIAL: cases.filter((c) => c.status === "PENDING_BURIAL"),
    CLOSED: cases.filter((c) => c.status === "CLOSED"),
  };

  return (
    <PageContainer>
      <div className="mb-8">
        <PageHeader
          title="Cases"
          subtitle="Manage all funeral cases and service arrangements"
        />
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(statuses).map(([status, items]) => (
          <div key={status} className="rounded-[8px] border border-border p-4">
            <p className="text-sm text-muted-fg font-medium mb-1">
              {status === "PENDING_BURIAL" ? "Pending" : status}
            </p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
        ))}
      </div>

      {/* Cases Table */}
      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold">Case #</th>
              <th className="px-4 py-3 text-left font-semibold">Deceased</th>
              <th className="px-4 py-3 text-left font-semibold">Service Type</th>
              <th className="px-4 py-3 text-left font-semibold">Funeral Date</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Next of Kin</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-fg">
                  No cases found
                </td>
              </tr>
            ) : (
              cases.map((funeralCase) => (
                <tr
                  key={funeralCase.id}
                  className="border-b border-border hover:bg-muted/30 transition"
                >
                  <td className="px-4 py-3 font-mono font-semibold">
                    {funeralCase.caseNumber}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {funeralCase.deceasedFirstName} {funeralCase.deceasedLastName}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {funeralCase.serviceType === "BURIAL"
                      ? "Burial"
                      : funeralCase.serviceType === "CREMATION"
                        ? "Cremation"
                        : "Repatriation"}
                  </td>
                  <td className="px-4 py-3 text-sm flex items-center gap-2">
                    <Calendar size={14} className="text-muted-fg" />
                    {formatDate(funeralCase.funeralDate, "dd MMM HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={funeralCase.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-fg">
                    {funeralCase.nextOfKinName}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/funeral/cases/${funeralCase.id}`}>
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
