/**
 * @file app/(public)/onboarding/page.tsx
 * @description Company onboarding page for newly registered users who have no
 * company yet. Lets them create their first company (name, vertical, phone)
 * before being redirected to the dashboard.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Plus, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { createCompany } from "@/lib/api/companies";
import type { CompanyResponse } from "@/lib/api/companies";
import { ApiError } from "@/lib/api/client";

const VERTICALS = [
  { value: "", label: "Select industry (optional)" },
  { value: "FUNERAL", label: "Funeral Home" },
  { value: "AUTO", label: "Automotive" },
  { value: "RESTAURANT", label: "Restaurant / Hospitality" },
  { value: "SPA", label: "Spa / Wellness" },
  { value: "TECH", label: "Technology / ICT" },
  { value: "TELECOM", label: "Telecommunications" },
  { value: "FINANCE", label: "Finance / Accounting" },
  { value: "RETAIL", label: "Retail" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "HEALTH", label: "Healthcare" },
  { value: "OTHER", label: "Other" },
];

interface CompanyEntry {
  id: string;
  name: string;
  vertical: string;
}

function newEntry(): CompanyEntry {
  return { id: Math.random().toString(36).slice(2), name: "", vertical: "" };
}

type Mode = "select" | "create";

export default function OnboardingPage() {
  const { user, companies, isLoading, isAuthenticated, setCompany, selectCompany, addCompany } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("select");
  const [entries, setEntries] = useState<CompanyEntry[]>([newEntry()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && companies.length === 0) setMode("create");
  }, [isLoading, isAuthenticated, companies.length]);

  function updateEntry(id: string, field: keyof Omit<CompanyEntry, "id">, value: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const valid = entries.filter((e) => e.name.trim());
    if (valid.length === 0) { toast.error("Add at least one company name."); return; }
    setSubmitting(true);

    const created: CompanyResponse[] = [];
    try {
      for (const entry of valid) {
        const res = await createCompany({
          name: entry.name.trim(),
          vertical: entry.vertical || undefined,
        });
        created.push(res);
        await addCompany({ name: res.name, vertical: res.vertical });
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create company");
      setSubmitting(false);
      return;
    }

    if (created.length === 1) {
      setCompany({ id: created[0].id, name: created[0].name, slug: created[0].slug });
      router.push("/dashboard");
    } else {
      router.push("/select-company");
    }
    setSubmitting(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-muted-fg text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4">
      <div className="w-full max-w-lg space-y-8">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-primary text-primary-fg flex items-center justify-center font-bold text-xl">
              Z
            </div>
            <span className="font-display text-xl font-normal">Zerpa</span>
          </div>
        </div>

        {/* SELECT: existing companies */}
        {mode === "select" && companies.length > 0 && (
          <div className="bg-background rounded-[12px] border border-border p-8 space-y-6">
            <div className="text-center">
              <h1 className="section-title">Your Companies</h1>
              <p className="text-sm text-muted-fg mt-1">
                Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}. Select a company to continue.
              </p>
            </div>

            <div className="space-y-3">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCompany(c.id)}
                  className="w-full flex items-center justify-between p-4 rounded-[10px] border border-border hover:border-primary hover:bg-surface transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] bg-surface border border-border flex items-center justify-center">
                      <Building2 size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      {c.vertical && (
                        <p className="text-xs text-muted-fg capitalize">
                          {c.vertical.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-fg group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setEntries([newEntry()]); setMode("create"); }}
              >
                <Plus size={16} className="mr-2" />
                Add New Company
              </Button>
            </div>
          </div>
        )}

        {/* CREATE: add one or more companies */}
        {mode === "create" && (
          <div className="bg-background rounded-[12px] border border-border p-8 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-[10px] bg-surface border border-border flex items-center justify-center">
                <Building2 size={22} className="text-primary" />
              </div>
              <div className="text-center">
                <h1 className="section-title">Add your companies</h1>
                <p className="text-sm text-muted-fg mt-1">
                  {companies.length > 0
                    ? "Add one or more companies to your account."
                    : `Welcome${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}. Enter the companies you own or manage.`}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {entries.map((entry, idx) => (
                <div key={entry.id} className="rounded-[10px] border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-fg uppercase tracking-wide">
                      Company {idx + 1}
                    </span>
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="text-muted-fg hover:text-red-500 transition-colors"
                        aria-label="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`name-${entry.id}`}>Company Name</Label>
                    <Input
                      id={`name-${entry.id}`}
                      placeholder="e.g. Zezwe ICT, Hawkz Telecoms..."
                      value={entry.name}
                      onChange={(e) => updateEntry(entry.id, "name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`vertical-${entry.id}`}>
                      Industry <span className="text-muted-fg font-normal">(optional)</span>
                    </Label>
                    <select
                      id={`vertical-${entry.id}`}
                      value={entry.vertical}
                      onChange={(e) => updateEntry(entry.id, "vertical", e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {VERTICALS.map((v) => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setEntries((prev) => [...prev, newEntry()])}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] border border-dashed border-border text-sm text-muted-fg hover:border-primary hover:text-primary transition-colors"
              >
                <Plus size={15} />
                Add another company
              </button>

              <div className="flex gap-3 pt-1">
                {companies.length > 0 && (
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setMode("select")}>
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  size="lg"
                  disabled={submitting || !entries.some((e) => e.name.trim())}
                >
                  {submitting
                    ? "Creating..."
                    : entries.filter((e) => e.name.trim()).length > 1
                    ? `Create ${entries.filter((e) => e.name.trim()).length} Companies`
                    : "Create Company"}
                </Button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-muted-fg">
          You can update company details from Settings at any time.
        </p>
      </div>
    </div>
  );
}
