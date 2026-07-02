/**
 * @file components/modules/crm/lead-finder-client.tsx
 * @description Map-based lead prospecting. Searches businesses via the server
 * Lead Finder endpoint (SerpApi Google Maps), stages results in a table with
 * dedupe against existing CRM leads, and imports the selected rows as NEW leads
 * (creating a contact + lead each) using the authenticated CRM data functions.
 */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Phone,
  Globe,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { searchBusinesses } from "@/lib/data/lead-finder";
import { getLeads, createContact, createLead } from "@/lib/data/crm";
import type { ScrapedBusiness, Vertical } from "@zerpa/shared-types";

const VERTICALS: { value: Vertical; label: string }[] = [
  { value: "FUNERAL", label: "Funeral" },
  { value: "AUTOMOTIVE", label: "Automotive" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "SPA", label: "Spa" },
];

const norm = (s?: string) =>
  (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const digits = (s?: string) => (s ?? "").replace(/\D/g, "");

/**
 * Scraped businesses have no person name, but the CRM requires a non-empty
 * firstName AND lastName. Split the business name across the two fields, with a
 * placeholder fallback so single-word names still pass validation.
 */
function businessNameParts(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Business", lastName: "Lead" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "(Business)" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

interface Row extends ScrapedBusiness {
  selected: boolean;
  existing: boolean;
  imported: boolean;
}

export function LeadFinderClient() {
  const { company } = useAuth();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [vertical, setVertical] = useState<Vertical>("FUNERAL");
  // Backend requires estimatedValue > 0; applied to every imported lead.
  const [estValue, setEstValue] = useState(1000);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Existing leads for dedupe (names + phones).
  const [dedupe, setDedupe] = useState<{ names: Set<string>; phones: Set<string> }>({
    names: new Set(),
    phones: new Set(),
  });

  useEffect(() => {
    if (!company?.id) return;
    getLeads(undefined, company.id)
      .then((leads) => {
        const names = new Set<string>();
        const phones = new Set<string>();
        for (const l of leads) {
          if (l.company) names.add(norm(l.company));
          const p = digits(l.contact?.phone);
          if (p) phones.add(p);
        }
        setDedupe({ names, phones });
      })
      .catch(() => setDedupe({ names: new Set(), phones: new Set() }));
  }, [company?.id]);

  function isExisting(b: ScrapedBusiness): boolean {
    if (dedupe.names.has(norm(b.name))) return true;
    const p = digits(b.phone);
    return p.length > 0 && dedupe.phones.has(p);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Enter what to search for");
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await searchBusinesses({
        query: query.trim(),
        location: location.trim() || undefined,
        country: "za",
      });
      if (res.error) {
        setError(res.error);
        setRows([]);
        return;
      }
      // Dedupe within the batch by id, then flag existing.
      const seen = new Set<string>();
      const mapped: Row[] = [];
      for (const b of res.results) {
        if (seen.has(b.id)) continue;
        seen.add(b.id);
        const existing = isExisting(b);
        mapped.push({ ...b, existing, imported: false, selected: !existing });
      }
      setRows(mapped);
    } catch {
      setError("Search failed. Check your connection and try again.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  }

  function toggleAll(select: boolean) {
    setRows((rs) =>
      rs.map((r) => (r.imported ? r : { ...r, selected: select && !r.existing }))
    );
  }

  async function handleImport() {
    if (!company?.id) {
      toast.error("No active company selected");
      return;
    }
    const toImport = rows.filter((r) => r.selected && !r.imported);
    if (toImport.length === 0) {
      toast.error("Select at least one business to import");
      return;
    }
    setImporting(true);
    let ok = 0;
    let failed = 0;
    let firstError = "";

    for (const b of toImport) {
      try {
        const { firstName, lastName } = businessNameParts(b.name);
        const contact = await createContact({
          tenantId: company.id,
          firstName,
          lastName,
          phone: b.phone || undefined,
          company: b.name,
        });
        if (!contact?.id) {
          throw new Error("Contact created but no id was returned by the API");
        }
        const notes = [
          "Imported via Lead Finder (Google Maps).",
          b.category && `Category: ${b.category}`,
          b.address && `Address: ${b.address}`,
          b.website && `Website: ${b.website}`,
          b.rating != null && `Rating: ${b.rating} (${b.reviews ?? 0} reviews)`,
        ]
          .filter(Boolean)
          .join("\n");

        await createLead({
          tenantId: company.id,
          contactId: contact.id,
          contact,
          company: b.name,
          vertical,
          status: "NEW",
          estimatedValue: estValue > 0 ? estValue : 1,
          notes,
        });
        ok += 1;
        setRows((rs) =>
          rs.map((r) =>
            r.id === b.id ? { ...r, imported: true, selected: false } : r
          )
        );
      } catch (err) {
        failed += 1;
        if (!firstError) {
          firstError = err instanceof Error ? err.message : String(err);
        }
      }
    }

    setImporting(false);
    if (ok) toast.success(`Imported ${ok} lead${ok === 1 ? "" : "s"} into CRM`);
    if (failed) {
      toast.error(
        `${failed} failed to import${firstError ? ` — ${firstError}` : ""}`,
        { duration: 8000 }
      );
    }

    // Refresh dedupe set so re-imports are flagged.
    if (ok && company?.id) {
      getLeads(undefined, company.id).then((leads) => {
        const names = new Set<string>();
        const phones = new Set<string>();
        for (const l of leads) {
          if (l.company) names.add(norm(l.company));
          const p = digits(l.contact?.phone);
          if (p) phones.add(p);
        }
        setDedupe({ names, phones });
      });
    }
  }

  const selectedCount = rows.filter((r) => r.selected && !r.imported).length;
  const newCount = rows.filter((r) => !r.existing && !r.imported).length;

  return (
    <>
      <PageHeader
        title="Lead Finder"
        subtitle="Find businesses on Google Maps and import them as CRM leads"
      />

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="rounded-[12px] border border-border bg-background p-5 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_150px_130px_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="query">Business type / keyword</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. funeral parlour"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Soweto, Johannesburg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vertical">Tag as vertical</Label>
            <select
              id="vertical"
              value={vertical}
              onChange={(e) => setVertical(e.target.value as Vertical)}
              className="w-full h-10 rounded-[8px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {VERTICALS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estValue">Est. value (R)</Label>
            <Input
              id="estValue"
              type="number"
              min={1}
              value={estValue}
              onChange={(e) => setEstValue(parseFloat(e.target.value) || 0)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Search size={14} className="mr-1.5" />
            )}
            Search
          </Button>
        </div>
      </form>

      {/* Provider / error notice */}
      {error && (
        <div className="rounded-[8px] bg-warning-bg border border-warning-ring px-4 py-3 mb-6 flex items-start gap-2">
          <AlertCircle size={16} className="text-warning mt-0.5 flex-shrink-0" />
          <div className="text-sm text-warning">
            <p className="font-medium">Couldn&apos;t fetch results</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={20} className="animate-spin text-muted-fg" />
        </div>
      ) : rows.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-muted-fg">
              {rows.length} result{rows.length === 1 ? "" : "s"} ·{" "}
              <span className="text-foreground font-medium">{newCount}</span> new ·{" "}
              {rows.length - newCount} already in CRM
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => toggleAll(true)}
              >
                Select all new
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => toggleAll(false)}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleImport}
                disabled={importing || selectedCount === 0}
              >
                {importing ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 size={14} className="mr-1.5" />
                )}
                Import {selectedCount > 0 ? `${selectedCount} ` : ""}as leads
              </Button>
            </div>
          </div>

          <div className="rounded-[12px] border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface text-left">
                    <th className="w-10 px-3 py-3" />
                    <Th>Business</Th>
                    <Th>Category</Th>
                    <Th>Phone</Th>
                    <Th>Website</Th>
                    <Th className="text-right">Rating</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        r.imported ? "opacity-60" : "hover:bg-surface"
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={r.selected}
                          disabled={r.imported}
                          onChange={() => toggle(r.id)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-foreground">{r.name}</p>
                        {r.address && (
                          <p className="text-xs text-muted-fg flex items-center gap-1 mt-0.5">
                            <MapPin size={11} /> {r.address}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-fg">{r.category ?? "—"}</td>
                      <td className="px-3 py-3">
                        {r.phone ? (
                          <span className="flex items-center gap-1 text-foreground">
                            <Phone size={12} className="text-muted-fg" />
                            {r.phone}
                          </span>
                        ) : (
                          <span className="text-muted-fg">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {r.website ? (
                          <a
                            href={r.website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline max-w-[180px] truncate"
                          >
                            <Globe size={12} /> {r.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-muted-fg">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {r.rating != null ? (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Star size={12} className="text-warning" />
                            {r.rating}
                          </span>
                        ) : (
                          <span className="text-muted-fg">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {r.imported ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs bg-success-bg text-success">
                            Imported
                          </span>
                        ) : r.existing ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs bg-surface-2 text-muted-fg">
                            In CRM
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs bg-info-bg text-info">
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : searched && !error ? (
        <div className="rounded-[12px] border border-border bg-background p-12 text-center text-muted-fg">
          No businesses found. Try a broader keyword or a different location.
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-border bg-background p-12 text-center">
          <MapPin size={22} className="text-muted-fg mx-auto mb-3" />
          <p className="text-sm text-muted-fg">
            Search a business type and location to find prospects on Google Maps.
          </p>
        </div>
      )}
    </>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg",
        className
      )}
    >
      {children}
    </th>
  );
}
