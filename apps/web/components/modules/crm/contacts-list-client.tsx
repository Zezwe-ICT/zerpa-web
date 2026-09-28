"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit2, Mail, Phone, Search, User } from "lucide-react";
import Link from "next/link";
import type { Contact } from "@zerpa/shared-types";
import { getContacts } from "@/lib/data/crm";
import { useAuth } from "@/lib/auth/context";

export function ContactsListClient() {
  const { company } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("");

  useEffect(() => {
    if (!company?.id) return;
    setLoadingContacts(true);
    getContacts(company.id)
      .then(setContacts)
      .catch(() => setContacts([]))
      .finally(() => setLoadingContacts(false));
  }, [company?.id]);

  const companies = useMemo(
    () => [...new Set(contacts.map((c) => c.company).filter(Boolean) as string[])].sort(),
    [contacts],
  );

  const filtered = contacts.filter((contact) => {
    if (filterCompany && contact.company !== filterCompany) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        contact.firstName.toLowerCase().includes(q) ||
        contact.lastName.toLowerCase().includes(q) ||
        contact.company?.toLowerCase().includes(q) ||
        contact.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loadingContacts) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-fg">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {contacts.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-2 text-sm">
          <div className="rounded-[10px] border border-border bg-surface px-4 py-3 min-w-[100px]">
            <p className="text-xs text-muted-fg">Total contacts</p>
            <p className="text-2xl font-bold">{contacts.length}</p>
          </div>
          <div className="rounded-[10px] border border-border bg-surface px-4 py-3 min-w-[100px]">
            <p className="text-xs text-muted-fg">Companies</p>
            <p className="text-2xl font-bold">{companies.length}</p>
          </div>
          <div className="rounded-[10px] border border-border bg-surface px-4 py-3 min-w-[100px]">
            <p className="text-xs text-muted-fg">With email</p>
            <p className="text-2xl font-bold">{contacts.filter((c) => c.email).length}</p>
          </div>
        </div>
      )}

      {/* Header with actions */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <input
            type="text"
            placeholder="Search by name, email or company…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-border rounded-[8px] text-sm bg-background h-9"
          />
        </div>
        {companies.length > 0 && (
          <select
            className="border border-border rounded-[8px] px-3 py-1.5 text-sm bg-background h-9"
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
          >
            <option value="">All companies</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {(searchTerm || filterCompany) && (
          <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setFilterCompany(""); }}>
            Clear
          </Button>
        )}
        <Link href="/crm/contacts/new">
          <Button size="sm">
            <Plus size={14} className="mr-1" />
            New Contact
          </Button>
        </Link>
      </div>

      {/* Contacts Table */}
      {filtered.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-border p-12 text-center">
          <User size={28} className="mx-auto mb-3 text-muted-fg opacity-50" />
          <p className="font-medium text-foreground">No contacts found</p>
          <p className="text-sm text-muted-fg mt-1">
            {searchTerm || filterCompany ? "Try clearing the filters." : "Add your first contact to start."}
          </p>
          {!searchTerm && !filterCompany && (
            <Link href="/crm/contacts/new">
              <Button size="sm" className="mt-4">Add Contact</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-[12px] border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-fg uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-fg uppercase tracking-wide">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-fg uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-fg uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-fg uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-fg uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-t border-border hover:bg-surface/60 transition"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/crm/contacts/${contact.id}`} className="hover:text-primary">
                      {contact.firstName} {contact.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-fg">{contact.company || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-fg">{contact.jobTitle || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className="text-primary hover:underline inline-flex items-center gap-1">
                        <Mail size={12} />
                        {contact.email}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`} className="text-primary hover:underline inline-flex items-center gap-1">
                        <Phone size={12} />
                        {contact.phone}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Link href={`/crm/contacts/${contact.id}`}>
                        <Button variant="outline" size="sm"><Eye size={14} /></Button>
                      </Link>
                      <Link href={`/crm/contacts/${contact.id}/edit`}>
                        <Button variant="outline" size="sm"><Edit2 size={14} /></Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
