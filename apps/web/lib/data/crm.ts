import { CONFIG } from "@/lib/config";
import { apiRequest } from "@/lib/api/client";
import {
  getMockLeads,
  getMockLeadById,
  getMockContacts,
  getMockContactById,
} from "@/lib/mock/leads";
import type { Lead, Contact, LeadActivity } from "@zerpa/shared-types";

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

interface ApiLeadActivity {
  id: string;
  type: LeadActivity["type"];
  date: string;
  summary: string;
  notes?: string;
  agentName?: string | null;
}

interface ApiLead {
  id: string;
  tenantId?: string;
  contactId?: string;
  assignedTo?: string | null;
  ownerId?: string | null;
  stage?: string;
  status?: string;
  vertical?: string | null;
  priority?: number;
  estimatedValue?: number | null;
  notes?: string | null;
  nextStep?: string | null;
  quoteId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  contact?: ApiContact;
  company?: string;
  title?: string;
  activities?: ApiLeadActivity[];
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
  const now = new Date().toISOString();
  return {
    id: l.id,
    contactId: l.contactId || "",
    contact,
    company: l.company ?? contact?.company ?? "",
    vertical: (l.vertical as Lead["vertical"]) ?? "GENERIC",
    status: (l.status ?? l.stage ?? "NEW") as Lead["status"],
    estimatedValue: Number(l.estimatedValue ?? 0),
    currency: "ZAR",
    assignedAgentId: l.ownerId ?? l.assignedTo ?? undefined,
    nextStep: l.nextStep ?? null,
    quoteId: l.quoteId ?? null,
    notes: l.notes ?? undefined,
    createdAt: l.createdAt ?? now,
    updatedAt: l.updatedAt ?? now,
    activities: (l.activities ?? []).map((row) => ({
      id: row.id,
      leadId: l.id,
      type: row.type,
      date: row.date,
      summary: row.summary,
      notes: row.notes,
      agentName: row.agentName ?? undefined,
    })),
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
      `/crm/leads${qs ? `?${qs}` : ""}`
    );
    return (leads ?? []).map(mapApiLead);
  } catch {
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
    const lead = await apiRequest<ApiLead>(`/crm/leads/${id}`);
    return mapApiLead(lead);
  } catch (error) {
    console.error("Failed to fetch lead:", error);
    return undefined;
  }
}

export async function saveLeadNote(
  id: string,
  body: { kind: string; summary: string; notes?: string; nextStep?: string }
) {
  return apiRequest(`/timeline`, {
    method: "POST",
    body: {
      recordType: "lead",
      recordId: id,
      kind: body.kind.toLowerCase(),
      subject: body.summary,
      body: body.notes || body.summary,
      nextStep: body.nextStep,
    },
  });
}

export async function updateLeadWork(id: string, body: { nextStep?: string; ownerId?: string | null }) {
  const lead = await apiRequest<ApiLead>(`/crm/leads/${id}`, { method: "PATCH", body });
  return mapApiLead(lead);
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

  const lead = await apiRequest<ApiLead>("/crm/leads", {
    method: "POST",
    body: {
      companyName: data.company || "New lead",
      title: data.title || data.notes?.slice(0, 80) || data.company || "Lead",
      stage: data.status,
      contactId: data.contactId,
      estimatedValue: data.estimatedValue,
      notes: data.notes,
      vertical: data.vertical,
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

  const changed = Object.keys(data).filter((k) => k !== "tenantId");
  if (changed.length === 1 && data.status) {
    return updateLeadStatus(id, data.status);
  }
  // Django exposes only a stage route for existing leads; other fields are read-only after create.
  throw new Error("Only the lead stage can be changed on this API yet");
}

export async function updateLeadStatus(
  id: string,
  status: string,
  tenantId?: string
): Promise<Lead> {
  if (CONFIG.useMock) return updateLead(id, { status: status as Lead["status"], tenantId });
  const lead = await apiRequest<ApiLead>(`/crm/leads/${id}/stage`, { method: "POST", body: { stage: status } });
  return mapApiLead(lead);
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
