import { ClientPortalNav } from "@/components/layouts/client-portal-nav";

const AUTOMOTIVE_NAV_ITEMS = [
  { label: "Dashboard", href: "/automotive/dashboard" },
  { label: "Job Cards", href: "/automotive/job-cards" },
  { label: "Vehicles", href: "/automotive/vehicles" },
  { label: "Inventory", href: "/automotive/inventory" },
  { label: "Invoices", href: "/automotive/invoices" },
];

export default function AutomotiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClientPortalNav vertical="AUTOMOTIVE" navItems={AUTOMOTIVE_NAV_ITEMS} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
