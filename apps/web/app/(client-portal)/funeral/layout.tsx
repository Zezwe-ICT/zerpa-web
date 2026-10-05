/**
 * Funeral family portal — only routes that exist.
 */
import { ClientPortalNav } from "@/components/layouts/client-portal-nav";

const FUNERAL_NAV_ITEMS = [
  { label: "Dashboard", href: "/funeral/dashboard" },
  { label: "Cases", href: "/funeral/cases" },
  { label: "Schedule", href: "/funeral/schedule" },
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
