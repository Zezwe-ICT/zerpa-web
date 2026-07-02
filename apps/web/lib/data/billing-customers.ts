/**
 * @file lib/data/billing-customers.ts
 * @description Projects the app's customers (CLOSED_WON leads) into the
 * lightweight BillingCustomer shape used by quote/invoice/automation selectors.
 * Merges any live customers with a small seed list so the billing selectors
 * always have the sample customers referenced by the mock fixtures.
 */
import type { BillingCustomer, Lead } from "@zerpa/shared-types";
import { getLeads } from "./crm";

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
 * Returns billing customers: live CLOSED_WON leads (mapped) merged with the
 * seed list, deduped by id. Never throws — falls back to the seed list.
 */
export async function getBillingCustomers(
  tenantId?: string
): Promise<BillingCustomer[]> {
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
