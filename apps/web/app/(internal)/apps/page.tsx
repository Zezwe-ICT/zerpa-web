/**
 * @file app/(internal)/apps/page.tsx
 * @description Odoo-style Apps page: browse every Zerpa app by category, switch apps on or off.
 * Removing an app only hides it — records stay and come back when the app is switched on again.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppCard } from "@/components/modules/apps/app-card";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/client";
import {
  APPS_CHANGED,
  changeCompanyApps,
  dependentsOf,
  getCompanyApps,
  withDependencies,
  type CatalogApp,
  type CompanyApps,
} from "@/lib/api/apps";
import { cn } from "@/lib/utils";

type Filter = "all" | "installed" | "available";
type Pending = { mode: "install" | "uninstall"; app: CatalogApp; affected: CatalogApp[] };

export default function AppsPage() {
  const { company } = useAuth();
  const [data, setData] = useState<CompanyApps | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<string>("all");
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!company?.id) return;
    getCompanyApps(company.id)
      .then(setData)
      .catch((e) => toast.error(e instanceof ApiError ? e.message : "Could not load apps"));
  }, [company?.id]);

  const byKey = useMemo(() => new Map((data?.apps ?? []).map((a) => [a.key, a])), [data]);
  const installed = useMemo(() => new Set(data?.installed ?? []), [data]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.apps ?? []).filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (filter === "installed" && !installed.has(a.key)) return false;
      if (filter === "available" && installed.has(a.key)) return false;
      if (!q) return true;
      return [a.name, a.tagline, a.description].some((s) => s.toLowerCase().includes(q));
    });
  }, [data, query, filter, category, installed]);

  function ask(mode: Pending["mode"], app: CatalogApp) {
    if (!data) return;
    const keys =
      mode === "install"
        ? withDependencies([app.key], data.apps).filter((k) => !installed.has(k))
        : dependentsOf([app.key], data.installed, data.apps);
    const affected = keys.filter((k) => k !== app.key).map((k) => byKey.get(k)!).filter(Boolean);
    // Nothing else is touched and it's an install: no need to confirm.
    if (mode === "install" && affected.length === 0) {
      void apply(mode, app);
      return;
    }
    setPending({ mode, app, affected });
  }

  async function apply(mode: Pending["mode"], app: CatalogApp) {
    if (!company?.id) return;
    setBusy(true);
    try {
      const next = await changeCompanyApps(company.id, { [mode]: [app.key] });
      setData(next);
      window.dispatchEvent(new CustomEvent(APPS_CHANGED));
      const names = (mode === "install" ? next.added : next.removed)?.map((k) => byKey.get(k)?.name ?? k) ?? [];
      toast.success(
        mode === "install"
          ? `${names.join(", ") || app.name} added to your menu`
          : `${names.join(", ") || app.name} removed from your menu. Your records are kept.`,
      );
      setPending(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update apps");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <PageContainer>
        <PageHeader title="Apps" subtitle="Loading apps…" />
      </PageContainer>
    );
  }

  const categories = data.categories.filter((c) => visible.some((a) => a.category === c.key));

  return (
    <PageContainer>
      <PageHeader
        title="Apps"
        subtitle={`${data.installed.length} of ${data.apps.length} apps switched on. Add what your business needs — removing an app hides it but keeps your records.`}
      />

      {!data.canManage && (
        <p className="mb-4 rounded-[10px] border border-border bg-surface p-3 text-sm text-muted-fg">
          Only an owner or admin can add or remove apps. You can still browse what&apos;s available.
        </p>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps, e.g. bookings, tickets, invoices"
            className="pl-8"
            aria-label="Search apps"
          />
        </div>
        <div className="flex gap-1 rounded-[8px] border border-border p-1 text-xs" role="tablist">
          {(["all", "installed", "available"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-[6px] px-3 py-1.5 font-medium capitalize",
                filter === f ? "bg-primary text-primary-fg" : "text-muted-fg hover:text-foreground",
              )}
            >
              {f === "installed" ? "Switched on" : f}
            </button>
          ))}
        </div>
        <select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-[6px] border border-border bg-background px-3 text-sm"
        >
          <option value="all">All categories</option>
          {data.categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 && <p className="text-sm text-muted-fg">No apps match your search.</p>}

      <div className="space-y-8">
        {categories.map((cat) => (
          <section key={cat.key} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-fg">{cat.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible
                .filter((a) => a.category === cat.key)
                .map((app) => {
                  const on = installed.has(app.key);
                  const needs = on
                    ? []
                    : withDependencies([app.key], data.apps)
                        .filter((k) => k !== app.key && !installed.has(k))
                        .map((k) => byKey.get(k)?.name ?? k);
                  return (
                    <AppCard
                      key={app.key}
                      app={app}
                      active={on}
                      needs={needs}
                      action={
                        data.canManage ? (
                          on ? (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => ask("uninstall", app)}>
                              Remove
                            </Button>
                          ) : (
                            <Button size="sm" disabled={busy} onClick={() => ask("install", app)}>
                              Add
                            </Button>
                          )
                        ) : on ? (
                          <span className="text-xs font-medium text-primary">On</span>
                        ) : null
                      }
                    />
                  );
                })}
            </div>
          </section>
        ))}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && !busy && setPending(null)}>
        {pending && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pending.mode === "install" ? `Add ${pending.app.name}?` : `Remove ${pending.app.name}?`}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                {pending.mode === "install" ? (
                  <p>
                    {pending.app.name} needs {pending.affected.map((a) => a.name).join(", ")}, so we&apos;ll add{" "}
                    {pending.affected.length === 1 ? "it" : "them"} too.
                  </p>
                ) : (
                  <>
                    {pending.affected.length > 0 && (
                      <p>
                        {pending.affected.map((a) => a.name).join(", ")}{" "}
                        {pending.affected.length === 1 ? "depends" : "depend"} on {pending.app.name} and will be
                        removed as well.
                      </p>
                    )}
                    <p>
                      It disappears from the menu for everyone in {company?.name}. <strong>No records are deleted</strong>{" "}
                      — add the app again any time to get everything back.
                    </p>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel disabled={busy} onClick={() => setPending(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction disabled={busy} onClick={() => apply(pending.mode, pending.app)}>
                {busy ? "Saving…" : pending.mode === "install" ? "Add apps" : "Remove"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </PageContainer>
  );
}
