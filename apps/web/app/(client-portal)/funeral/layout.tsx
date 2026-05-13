/**
 * @file app/(client-portal)/funeral/layout.tsx
 * @description Layout for the Funeral Home client portal vertical. Wraps pages
 * in ClientPortalNav with links to Dashboard, Active Cases and Invoices.
 */
import { ClientPortalNav } from "@/components/layouts/client-portal-nav";
import type { Vertical } from "@zerpa/shared-types";

const FUNERAL_NAV_ITEMS = [
  { label: "Dashboard", href: "/funeral/dashboard" },
  { label: "Cases", href: "/funeral/cases" },
  { label: "Schedule", href: "/funeral/schedule" },
  { label: "Suppliers", href: "/funeral/suppliers" },
  { label: "Compliance", href: "/funeral/compliance" },
  { label: "Invoices", href: "/funeral/invoices" },
];

export default function FuneralLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClientPortalNav vertical="FUNERAL" navItems={FUNERAL_NAV_ITEMS} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
