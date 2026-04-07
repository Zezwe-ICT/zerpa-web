"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit2, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { Contact } from "@zerpa/shared-types";

interface ContactsListClientProps {
  initialContacts: Contact[];
}

export function ContactsListClient({ initialContacts }: ContactsListClientProps) {
  const [contacts] = useState(initialContacts);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = contacts.filter(
    (contact) =>
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-[8px] text-sm bg-background"
          />
        </div>
        <Link href="/crm/contacts/new">
          <Button className="gap-2">
            <Plus size={16} />
            New Contact
          </Button>
        </Link>
      </div>

      {/* Contacts Table */}
      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Company</th>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Phone</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-fg">
                  {searchTerm
                    ? "No contacts match your search"
                    : "No contacts found"}
                </td>
              </tr>
            ) : (
              filtered.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-border hover:bg-muted/30 transition"
                >
                  <td className="px-4 py-3 font-medium">
                    {contact.firstName} {contact.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-fg">
                    {contact.company || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-fg">
                    {contact.jobTitle || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Mail size={12} />
                        {contact.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Phone size={12} />
                        {contact.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right flex gap-2 justify-end">
                    <Link href={`/crm/contacts/${contact.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye size={14} />
                      </Button>
                    </Link>
                    <Link href={`/crm/contacts/${contact.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit2 size={14} />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
