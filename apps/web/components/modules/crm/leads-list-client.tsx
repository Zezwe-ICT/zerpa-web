/**
 * @file components/modules/crm/leads-list-client.tsx
 * @description Client component that renders the CRM leads pipeline table.
 * Supports status-based colour coding, search filtering, and links to individual
 * lead detail pages. Receives `initialLeads` from the server page.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils/dates";
import { Plus, Eye, Edit2 } from "lucide-react";
import Link from "next/link";
import type { Lead } from "@zerpa/shared-types";

interface LeadsListClientProps {
  initialLeads: Lead[];
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-muted text-muted-fg",
  CONTACTED: "bg-blue-50 text-blue-600",
  QUALIFIED: "bg-green-50 text-green-600",
  PROPOSAL: "bg-amber-50 text-amber-600",
  NEGOTIATION: "bg-purple-50 text-purple-600",
  CLOSED_WON: "bg-success-bg text-success",
  CLOSED_LOST: "bg-danger-bg text-danger",
};

export function LeadsListClient({ initialLeads }: LeadsListClientProps) {
  const [leads] = useState(initialLeads);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const statuses = [
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "PROPOSAL",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
  ] as const;

  const filtered =
    selectedStatus === "all"
      ? leads
      : leads.filter((lead) => lead.status === selectedStatus);

  const statusCounts: Record<string, number> = {
    all: leads.length,
    ...Object.fromEntries(
      statuses.map((status) => [
        status.toLowerCase(),
        leads.filter((lead) => lead.status === status).length,
      ])
    ),
  };

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-fg">
          {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
        </div>
        <Link href="/crm/leads/new">
          <Button className="gap-2">
            <Plus size={16} />
            New Lead
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-3 flex-wrap">
        {[
          { label: "All", value: "all" },
          { label: "New", value: "new" },
          { label: "Contacted", value: "contacted" },
          { label: "Qualified", value: "qualified" },
          { label: "Proposal", value: "proposal" },
          { label: "Negotiation", value: "negotiation" },
          { label: "Closed", value: "closed" },
        ].map((tab) => {
          const statusKey = tab.value === "all" ? "all" : tab.value;
          const count = statusCounts[statusKey] || 0;

          return (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition -mb-3 ${
                selectedStatus === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-fg hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-2 inline-block text-xs bg-muted rounded-full px-2 py-0.5">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Leads Table */}
      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold">Company</th>
              <th className="px-4 py-3 text-left font-semibold">Contact</th>
              <th className="px-4 py-3 text-left font-semibold">Vertical</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Est. Value</th>
              <th className="px-4 py-3 text-left font-semibold">Last Activity</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-fg">
                  No leads with status "{selectedStatus}"
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-border hover:bg-muted/30 transition"
                >
                  <td className="px-4 py-3 font-medium">{lead.company}</td>
                  <td className="px-4 py-3 text-sm text-muted-fg">
                    {lead.contact
                      ? `${lead.contact.firstName} ${lead.contact.lastName}`
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-block px-2 py-1 rounded-[4px] bg-muted text-muted-fg">
                      {lead.vertical}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    R{lead.estimatedValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-fg">
                    {lead.lastActivityAt
                      ? formatDate(lead.lastActivityAt, "dd MMM yyyy")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right flex gap-2 justify-end">
                    <Link href={`/crm/leads/${lead.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye size={14} />
                      </Button>
                    </Link>
                    <Link href={`/crm/leads/${lead.id}/edit`}>
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
