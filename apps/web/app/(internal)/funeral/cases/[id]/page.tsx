/**
 * @file app/(internal)/funeral/cases/[id]/page.tsx
 * @description Internal funeral case detail page. Server-fetches a case by id;
 * 404s when not found. Shows deceased info, family contacts, services breakdown,
 * financial summary and action buttons (Approve, Cancel, Download Report).
 */
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { formatDate } from "@/lib/utils/dates";
import { ArrowLeft, Check, X, Download } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFuneralCaseById } from "@/lib/data/funeral";

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CaseDetailPageProps) {
  const { id } = await params;
  const funeralCase = await getFuneralCaseById(id);

  if (!funeralCase) {
    return { title: "Case not found" };
  }

  return {
    title: `${funeralCase.caseNumber} - Cases`,
    description: `Case for ${funeralCase.deceasedFirstName} ${funeralCase.deceasedLastName}`,
  };
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;
  const funeralCase = await getFuneralCaseById(id);

  if (!funeralCase) {
    notFound();
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/funeral/cases">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={14} />
            Back to Cases
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Main Content (2 cols) */}
        <div className="col-span-2 space-y-6">
          {/* Deceased Info */}
          <div className="rounded-[12px] border border-border bg-background p-6">
            <h2 className="section-title mb-4">Deceased Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                  Full Name
                </p>
                <p className="text-lg font-medium">
                  {funeralCase.deceasedFirstName} {funeralCase.deceasedLastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                  ID Number
                </p>
                <p className="text-lg font-mono">
                  {funeralCase.deceasedIdNumber || "—"}
                </p>
              </div>
              {funeralCase.dateOfBirth && (
                <div>
                  <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                    Date of Birth
                  </p>
                  <p className="text-lg">
                    {formatDate(funeralCase.dateOfBirth, "dd MMMM yyyy")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                  Date of Death
                </p>
                <p className="text-lg">
                  {formatDate(funeralCase.dateOfDeath, "dd MMMM yyyy")}
                </p>
              </div>
              {funeralCase.causeOfDeath && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                    Cause of Death
                  </p>
                  <p className="text-lg">{funeralCase.causeOfDeath}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Details */}
          <div className="rounded-[12px] border border-border bg-background p-6">
            <h2 className="section-title mb-4">Service Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                  Service Type
                </p>
                <p className="text-lg font-medium">
                  {funeralCase.serviceType === "BURIAL"
                    ? "Burial"
                    : funeralCase.serviceType === "CREMATION"
                      ? "Cremation"
                      : "Repatriation"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                  Funeral Date & Time
                </p>
                <p className="text-lg">
                  {formatDate(funeralCase.funeralDate, "dd MMM yyyy")} at{" "}
                  {funeralCase.funeralTime}
                </p>
              </div>
              {funeralCase.packageId && (
                <div>
                  <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                    Package
                  </p>
                  <p className="text-lg font-medium">
                    {funeralCase.packageId === "pkg-basic"
                      ? "Basic"
                      : funeralCase.packageId === "pkg-standard"
                        ? "Standard"
                        : "Premium"}
                  </p>
                </div>
              )}
              {funeralCase.packagePrice && (
                <div>
                  <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                    Price
                  </p>
                  <p className="text-lg font-mono font-semibold">
                    <CurrencyDisplay amount={funeralCase.packagePrice} />
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Next of Kin */}
          <div className="rounded-[12px] border border-border bg-background p-6">
            <h2 className="section-title mb-4">Next of Kin</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                  Name
                </p>
                <p className="text-lg font-medium">
                  {funeralCase.nextOfKinName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                  Relationship
                </p>
                <p className="text-lg">{funeralCase.nextOfKinRelationship}</p>
              </div>
              <div>
                <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                  Phone
                </p>
                <a href={`tel:${funeralCase.nextOfKinPhone}`} className="text-lg text-primary hover:underline">
                  {funeralCase.nextOfKinPhone}
                </a>
              </div>
              {funeralCase.nextOfKinEmail && (
                <div>
                  <p className="text-xs text-muted-fg font-semibold uppercase mb-1">
                    Email
                  </p>
                  <a href={`mailto:${funeralCase.nextOfKinEmail}`} className="text-lg text-primary hover:underline">
                    {funeralCase.nextOfKinEmail}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Compliance Docs */}
          {funeralCase.complianceDocs && (
            <div className="rounded-[12px] border border-border bg-background p-6">
              <h2 className="section-title mb-4">Compliance Documents</h2>
              <div className="space-y-2">
                {funeralCase.complianceDocs.deathCertificate && (
                  <div className="flex items-center justify-between p-2 rounded-[6px] bg-muted/30">
                    <span className="font-medium text-sm">Death Certificate</span>
                    {funeralCase.complianceDocs.deathCertificate.uploaded ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <X size={16} className="text-muted-fg" />
                    )}
                  </div>
                )}
                {funeralCase.complianceDocs.burialOrder && (
                  <div className="flex items-center justify-between p-2 rounded-[6px] bg-muted/30">
                    <span className="font-medium text-sm">Burial Order</span>
                    {funeralCase.complianceDocs.burialOrder.uploaded ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <X size={16} className="text-muted-fg" />
                    )}
                  </div>
                )}
                {funeralCase.complianceDocs.cremationPermit && (
                  <div className="flex items-center justify-between p-2 rounded-[6px] bg-muted/30">
                    <span className="font-medium text-sm">Cremation Permit</span>
                    {funeralCase.complianceDocs.cremationPermit.uploaded ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <X size={16} className="text-muted-fg" />
                    )}
                  </div>
                )}
                {funeralCase.complianceDocs.policeClearance && (
                  <div className="flex items-center justify-between p-2 rounded-[6px] bg-muted/30">
                    <span className="font-medium text-sm">Police Clearance</span>
                    {funeralCase.complianceDocs.policeClearance.uploaded ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <X size={16} className="text-muted-fg" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right - Sidebar (1 col) */}
        <div className="rounded-[12px] border border-border bg-background p-5 h-fit sticky top-24 space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <span className="text-xs text-muted-fg uppercase tracking-wide font-semibold">
              Status
            </span>
            <StatusBadge status={funeralCase.status} className="inline-block" />
          </div>

          {/* Divider */}
          <div className="border-t border-border my-2" />

          {/* Payment Info */}
          <dl className="space-y-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-fg">Package Price</dt>
              <dd className="font-mono font-semibold">
                {funeralCase.packagePrice ? (
                  <CurrencyDisplay amount={funeralCase.packagePrice} />
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-fg">Deposit Paid</dt>
              <dd className="font-mono font-semibold">
                {funeralCase.depositPaid ? (
                  <CurrencyDisplay amount={funeralCase.depositPaid} />
                ) : (
                  <span className="text-danger">R0</span>
                )}
              </dd>
            </div>
            {funeralCase.packagePrice && (
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="text-muted-fg">Balance Due</dt>
                <dd className="font-mono font-semibold">
                  <CurrencyDisplay
                    amount={(funeralCase.packagePrice || 0) - (funeralCase.depositPaid || 0)}
                  />
                </dd>
              </div>
            )}
          </dl>

          {/* Divider */}
          <div className="border-t border-border my-4" />

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Download size={14} className="mr-2" />
              Download Docs
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
