import { CONFIG } from "@/lib/config";
import {
  getMockLeads,
  getMockLeadById,
  getMockContacts,
  getMockContactById,
} from "@/lib/mock/leads";
import type { Lead, Contact } from "@zerpa/shared-types";

// ─── Leads ──────────────────────────────────────────────

export async function getLeads(
  status?: string
): Promise<Lead[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const leads = await getMockLeads();
    return status
      ? leads.filter((l) => l.status === status)
      : leads;
  }

  // TODO: Implement API call
  // const response = await fetch("/api/crm/leads", { headers: apiHeaders });
  // return response.json();
  return [];
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    return getMockLeadById(id);
  }

  // TODO: Implement API call
  // const response = await fetch(`/api/crm/leads/${id}`, { headers: apiHeaders });
  // if (!response.ok) return undefined;
  // return response.json();
  return undefined;
}

export async function getLeadsByVertical(vertical: string): Promise<Lead[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const leads = await getMockLeads();
    return leads.filter((l) => l.vertical === vertical);
  }

  // TODO: Implement API call
  return [];
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 500));
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      contactId: data.contactId || "",
      company: data.company || "",
      vertical: data.vertical || "FUNERAL",
      status: "NEW",
      estimatedValue: data.estimatedValue || 0,
      currency: "ZAR",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    return newLead;
  }

  // TODO: Implement API call
  throw new Error("Not implemented");
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const lead = await getMockLeadById(id);
    if (!lead) throw new Error("Lead not found");

    return {
      ...lead,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }

  // TODO: Implement API call
  throw new Error("Not implemented");
}

export async function updateLeadStatus(
  id: string,
  status: string
): Promise<Lead> {
  return updateLead(id, { status: status as any });
}

// ─── Contacts ───────────────────────────────────────────

export async function getContacts(): Promise<Contact[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    return getMockContacts();
  }

  // TODO: Implement API call
  return [];
}

export async function getContactById(id: string): Promise<Contact | undefined> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    return getMockContactById(id);
  }

  // TODO: Implement API call
  return undefined;
}

export async function createContact(data: Partial<Contact>): Promise<Contact> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 500));
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    return newContact;
  }

  // TODO: Implement API call
  throw new Error("Not implemented");
}

export async function updateContact(
  id: string,
  data: Partial<Contact>
): Promise<Contact> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const contact = await getMockContactById(id);
    if (!contact) throw new Error("Contact not found");

    return {
      ...contact,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }

  // TODO: Implement API call
  throw new Error("Not implemented");
}
