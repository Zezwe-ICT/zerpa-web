import { ClientPortalNav } from "@/components/layouts/client-portal-nav";

const RESTAURANT_NAV_ITEMS = [
  { label: "Dashboard", href: "/restaurant/dashboard" },
  { label: "Orders", href: "/restaurant/orders" },
  { label: "Kitchen", href: "/restaurant/kitchen" },
  { label: "Menu", href: "/restaurant/menu" },
  { label: "Invoices", href: "/restaurant/invoices" },
];

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClientPortalNav vertical="RESTAURANT" navItems={RESTAURANT_NAV_ITEMS} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
