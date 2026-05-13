/**
 * @file app/(internal)/clients/page.tsx
 * @description Internal clients list page. Displays all tenant companies that
 * have signed up to ZERPA, with vertical badge, status, contact info and links.
 * Currently uses mock data pending the clients API endpoint.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Building2, Mail, Phone, Globe } from "lucide-react";

export const metadata = {
  title: "Clients - Zerpa",
  description: "Manage your client accounts",
};

const MOCK_CLIENTS = [
  {
    id: "c-001",
    name: "Dignity Funeral Home",
    vertical: "Funeral",
    email: "admin@dignityfuneralhome.co.za",
    phone: "+27 11 123 4567",
    domain: "dignityfuneralhome.co.za",
    status: "ACTIVE",
    since: "2024-01-15",
  },
  {
    id: "c-002",
    name: "AutoShop Workshop",
    vertical: "Automotive",
    email: "admin@autoshop.co.za",
    phone: "+27 21 987 6543",
    domain: "autoshop.co.za",
    status: "ACTIVE",
    since: "2024-03-01",
  },
  {
    id: "c-003",
    name: "The Restaurant Group",
    vertical: "Restaurant",
    email: "manager@restaurants.co.za",
    phone: "+27 31 456 7890",
    domain: "restaurants.co.za",
    status: "ACTIVE",
    since: "2024-06-10",
  },
  {
    id: "c-004",
    name: "Serenity Spa & Wellness",
    vertical: "Spa",
    email: "owner@spa.co.za",
    phone: "+27 41 321 0987",
    domain: "spa.co.za",
    status: "ACTIVE",
    since: "2024-09-20",
  },
];

const verticalColors: Record<string, string> = {
  Funeral: "bg-funeral-bg text-funeral",
  Automotive: "bg-info-bg text-info",
  Restaurant: "bg-warning-bg text-warning",
  Spa: "bg-success-bg text-success",
};

export default function ClientsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        subtitle={`${MOCK_CLIENTS.length} active client accounts`}
      />

      <div className="grid grid-cols-1 gap-4">
        {MOCK_CLIENTS.map((client) => (
          <div
            key={client.id}
            className="rounded-[12px] border border-border bg-background p-5 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-[8px] bg-surface border border-border flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-muted-fg" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{client.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-[4px] ${verticalColors[client.vertical]}`}>
                    {client.vertical}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-2">
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-1.5 text-xs text-muted-fg hover:text-primary"
                  >
                    <Mail size={12} />
                    {client.email}
                  </a>
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-1.5 text-xs text-muted-fg hover:text-primary"
                  >
                    <Phone size={12} />
                    {client.phone}
                  </a>
                  <span className="flex items-center gap-1.5 text-xs text-muted-fg">
                    <Globe size={12} />
                    {client.domain}
                  </span>
                </div>
                <p className="text-xs text-muted-fg mt-2">
                  Client since {new Date(client.since).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
            <StatusBadge status={client.status} />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
