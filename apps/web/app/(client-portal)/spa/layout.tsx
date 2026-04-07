import { ClientPortalNav } from "@/components/layouts/client-portal-nav";

const SPA_NAV_ITEMS = [
  { label: "Dashboard", href: "/spa/dashboard" },
  { label: "Bookings", href: "/spa/bookings" },
  { label: "Therapists", href: "/spa/therapists" },
  { label: "Services", href: "/spa/services" },
  { label: "Invoices", href: "/spa/invoices" },
];

export default function SpaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClientPortalNav vertical="SPA" navItems={SPA_NAV_ITEMS} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
