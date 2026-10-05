/**
 * @file lib/data/billing-customers.ts
 * @description Customers for quotes, invoices and the Customers page. Live mode reads
 * CRM accounts (/crm/accounts) — the same records invoices, payments and the customer
 * portal are linked to. Mock mode keeps the seed list plus won leads for demos.
 */
import type { BillingCustomer, Lead } from "@zerpa/shared-types";
import { CONFIG } from "@/lib/config";
import { apiRequest } from "@/lib/api/client";
import { getLeads } from "./crm";

interface ApiAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  vatNumber: string;
  billingAddress: string;
  paymentTermsDays: number;
  notes: string;
  createdAt: string;
  erasedAt?: string | null;
}

function accountToCustomer(a: ApiAccount): BillingCustomer {
  return {
    id: a.id,
    name: a.name,
    contactPerson: a.contactPerson || undefined,
    contactEmail: a.email || undefined,
    contactPhone: a.phone || undefined,
    vatNumber: a.vatNumber || undefined,
    postalAddress: a.billingAddress || undefined,
    paymentTermsDays: a.paymentTermsDays,
    erasedAt: a.erasedAt ?? null,
  };
}

export interface NewCustomer {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  vatNumber?: string;
  billingAddress?: string;
  paymentTermsDays?: number;
  notes?: string;
}

/** Creates a customer (CRM account, plus a contact when a person's name is given). */
export async function createBillingCustomer(data: NewCustomer): Promise<BillingCustomer> {
  if (CONFIG.useMock) {
    return {
      id: `cust-${Date.now()}`,
      name: data.name,
      contactPerson: [data.firstName, data.lastName].filter(Boolean).join(" ") || undefined,
      contactEmail: data.email,
      contactPhone: data.phone,
      vatNumber: data.vatNumber,
      paymentTermsDays: data.paymentTermsDays ?? 30,
    };
  }
  return accountToCustomer(await apiRequest<ApiAccount>("/crm/accounts", { method: "POST", body: data }));
}

/** Seed customers matching the ids used across the billing mock fixtures. */
const SEED_CUSTOMERS: BillingCustomer[] = [
  {
    id: "tenant-001",
    name: "Dignity Funeral Home",
    vertical: "FUNERAL",
    contactPerson: "Nomsa Mokoena",
    contactEmail: "nomsa@dignity.co.za",
    contactPhone: "082 000 1234",
    vatNumber: "4987654321",
    postalAddress: "45 Main Road\nSoweto\n1804",
    deliveryAddress: "45 Main Road\nSoweto\n1804",
    paymentTermsDays: 30,
  },
  {
    id: "auto-001",
    name: "Auto Excellence Workshop",
    vertical: "AUTOMOTIVE",
    contactPerson: "Sipho Ndlovu",
    contactEmail: "sipho@autoexcellence.co.za",
    contactPhone: "083 111 2222",
    paymentTermsDays: 30,
  },
  {
    id: "restaurant-001",
    name: "Golden Fork Restaurant",
    vertical: "RESTAURANT",
    contactPerson: "Thandi Nkosi",
    contactEmail: "thandi@goldenfork.co.za",
    contactPhone: "084 333 4444",
    paymentTermsDays: 30,
  },
  {
    id: "spa-001",
    name: "Serenity Spa",
    vertical: "SPA",
    contactPerson: "Lerato Dlamini",
    contactEmail: "lerato@serenityspa.co.za",
    contactPhone: "085 555 6666",
    paymentTermsDays: 30,
  },
];

function leadToBillingCustomer(lead: Lead): BillingCustomer {
  const contact = lead.contact;
  const contactPerson = contact
    ? `${contact.firstName} ${contact.lastName}`.trim()
    : undefined;
  return {
    id: lead.id,
    name: lead.company,
    vertical: lead.vertical,
    contactPerson: contactPerson || undefined,
    contactEmail: contact?.email,
    contactPhone: contact?.phone,
    paymentTermsDays: 30,
  };
}

/**
 * Live: the company's CRM accounts. Mock: won leads merged with the seed list.
 */
export async function getBillingCustomers(
  tenantId?: string
): Promise<BillingCustomer[]> {
  if (!CONFIG.useMock) {
    const accounts = await apiRequest<ApiAccount[]>("/crm/accounts");
    return (accounts ?? []).map(accountToCustomer);
  }
  let live: BillingCustomer[] = [];
  try {
    const leads = await getLeads("CLOSED_WON", tenantId);
    live = leads.map(leadToBillingCustomer);
  } catch {
    live = [];
  }

  const byId = new Map<string, BillingCustomer>();
  for (const c of [...SEED_CUSTOMERS, ...live]) {
    byId.set(c.id, { ...byId.get(c.id), ...c });
  }
  return Array.from(byId.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function getBillingCustomerById(
  id: string,
  tenantId?: string
): Promise<BillingCustomer | null> {
  const all = await getBillingCustomers(tenantId);
  return all.find((c) => c.id === id) ?? null;
}
