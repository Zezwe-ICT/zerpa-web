import { CONFIG } from "@/lib/config";
import { apiRequest } from "@/lib/api/client";
import {
  getMockLeads,
  getMockLeadById,
  getMockContacts,
  getMockContactById,
} from "@/lib/mock/leads";
import type { Lead, Contact } from "@zerpa/shared-types";

// ─── API response shapes ─────────────────────────────────

interface ApiContact {
  id: string;
  tenantId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiLead {
  id: string;
  tenantId: string;
  contactId: string;
  assignedTo: string | null;
  stage: string;
  vertical: string | null;
  priority: number;
  estimatedValue: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Server may populate contact inline
  contact?: ApiContact;
  // Server may include company name as an extension
  company?: string;
}

function mapApiContact(c: ApiContact): Contact {
  return {
    id: c.id,
    firstName: c.firstName ?? "",
    lastName: c.lastName ?? "",
    email: c.email ?? undefined,
    phone: c.phone ?? undefined,
    company: c.company ?? undefined,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function mapApiLead(l: ApiLead): Lead {
  const contact = l.contact ? mapApiContact(l.contact) : undefined;
  return {
    id: l.id,
    contactId: l.contactId,
    contact,
    company: l.company ?? contact?.company ?? "",
    vertical: (l.vertical as Lead["vertical"]) ?? "FUNERAL",
    status: l.stage as Lead["status"],
    estimatedValue: l.estimatedValue ?? 0,
    currency: "ZAR",
    assignedAgentId: l.assignedTo ?? undefined,
    notes: l.notes ?? undefined,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

// ─── Leads ──────────────────────────────────────────────

export async function getLeads(
  status?: string,
  tenantId?: string
): Promise<Lead[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const leads = await getMockLeads();
    return status
      ? leads.filter((l) => l.status === status)
      : leads;
  }

  try {
    const params = new URLSearchParams();
    if (tenantId) params.set("tenantId", tenantId);
    if (status) params.set("stage", status);
    const qs = params.toString();
    const leads = await apiRequest<ApiLead[]>(
      `/api/v1/crm/leads${qs ? `?${qs}` : ""}`
    );
    return (leads ?? []).map(mapApiLead);
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return [];
  }
}

export async function getLeadById(
  id: string,
  tenantId?: string
): Promise<Lead | undefined> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    return getMockLeadById(id);
  }

  try {
    const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    const lead = await apiRequest<ApiLead>(`/api/v1/crm/leads/${id}${qs}`);
    return lead ? mapApiLead(lead) : undefined;
  } catch (error) {
    console.error("Failed to fetch lead:", error);
    return undefined;
  }
}

export async function getLeadsByVertical(
  vertical: string,
  tenantId?: string
): Promise<Lead[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const leads = await getMockLeads();
    return leads.filter((l) => l.vertical === vertical);
  }

  try {
    const params = new URLSearchParams({ vertical });
    if (tenantId) params.set("tenantId", tenantId);
    const leads = await apiRequest<ApiLead[]>(
      `/api/v1/crm/leads?${params.toString()}`
    );
    return (leads ?? []).map(mapApiLead);
  } catch (error) {
    console.error("Failed to fetch leads by vertical:", error);
    return [];
  }
}

export async function createLead(
  data: Partial<Lead> & { tenantId: string }
): Promise<Lead> {
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

  const lead = await apiRequest<ApiLead>("/api/v1/crm/leads", {
    method: "POST",
    body: {
      tenantId: data.tenantId,
      contactId: data.contactId,
      stage: data.status ?? "NEW",
      vertical: data.vertical,
      estimatedValue: data.estimatedValue,
      notes: data.notes,
    },
  });
  return mapApiLead(lead);
}

export async function updateLead(
  id: string,
  data: Partial<Lead> & { tenantId?: string }
): Promise<Lead> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const lead = await getMockLeadById(id);
    if (!lead) throw new Error("Lead not found");
    return { ...lead, ...data, updatedAt: new Date().toISOString() };
  }

  const lead = await apiRequest<ApiLead>(`/api/v1/crm/leads/${id}`, {
    method: "PATCH",
    body: {
      tenantId: data.tenantId,
      stage: data.status,
      vertical: data.vertical,
      estimatedValue: data.estimatedValue,
      notes: data.notes,
      assignedTo: data.assignedAgentId,
    },
  });
  return mapApiLead(lead);
}

export async function updateLeadStatus(
  id: string,
  status: string,
  tenantId?: string
): Promise<Lead> {
  return updateLead(id, { status: status as Lead["status"], tenantId });
}

// ─── Contacts ───────────────────────────────────────────

export async function getContacts(tenantId?: string): Promise<Contact[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    return getMockContacts();
  }

  try {
    const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    const contacts = await apiRequest<ApiContact[]>(
      `/api/v1/crm/contacts${qs}`
    );
    return (contacts ?? []).map(mapApiContact);
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    return [];
  }
}

export async function getContactById(
  id: string,
  tenantId?: string
): Promise<Contact | undefined> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    return getMockContactById(id);
  }

  try {
    const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    const contact = await apiRequest<ApiContact>(
      `/api/v1/crm/contacts/${id}${qs}`
    );
    return contact ? mapApiContact(contact) : undefined;
  } catch (error) {
    console.error("Failed to fetch contact:", error);
    return undefined;
  }
}

export async function createContact(
  data: Partial<Contact> & { tenantId: string }
): Promise<Contact> {
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

  const contact = await apiRequest<ApiContact>("/api/v1/crm/contacts", {
    method: "POST",
    body: {
      tenantId: data.tenantId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
    },
  });
  return mapApiContact(contact);
}

export async function updateContact(
  id: string,
  data: Partial<Contact>
): Promise<Contact> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const contact = await getMockContactById(id);
    if (!contact) throw new Error("Contact not found");
    return { ...contact, ...data, updatedAt: new Date().toISOString() };
  }

  const contact = await apiRequest<ApiContact>(`/api/v1/crm/contacts/${id}`, {
    method: "PATCH",
    body: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
    },
  });
  return mapApiContact(contact);
}
