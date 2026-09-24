import { ClientPortalNav } from "@/components/layouts/client-portal-nav";

const TELECOM_NAV_ITEMS = [
  { label: "Dashboard", href: "/telecom/dashboard" },
  { label: "Services", href: "/telecom/services" },
  { label: "Orders", href: "/telecom/orders" },
  { label: "Invoices", href: "/telecom/invoices" },
  { label: "Pay", href: "/telecom/pay" },
  { label: "Docs", href: "/telecom/docs" },
];

export default function TelecomPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClientPortalNav vertical="TELECOM" navItems={TELECOM_NAV_ITEMS} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
