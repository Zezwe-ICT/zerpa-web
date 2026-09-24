import PortalInvoicesPage from "@/components/modules/billing/portal-invoices-page";

export const dynamic = "force-dynamic";

export default function RestaurantInvoicesPage() {
  return <PortalInvoicesPage basePath="/restaurant/invoices" />;
}
