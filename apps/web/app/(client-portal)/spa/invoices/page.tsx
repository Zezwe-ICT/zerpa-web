import PortalInvoicesPage from "@/components/modules/billing/portal-invoices-page";

export const dynamic = "force-dynamic";

export default function SpaInvoicesPage() {
  return <PortalInvoicesPage basePath="/spa/invoices" />;
}
