/**
 * Company switcher for the internal top bar / shell.
 * Plain disclosure menu — avoids Radix Select Slot issues with action items.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";

export function CompanySwitcher() {
  const { company, companies, selectCompany } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!company) {
    return (
      <Link
        href="/select-company"
        className="inline-flex h-8 items-center rounded-[6px] border border-border bg-background px-3 text-xs font-medium hover:bg-surface"
      >
        Select company
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 max-w-[240px] items-center gap-2 rounded-[6px] border border-border bg-background px-3 text-xs font-medium hover:bg-surface"
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="truncate">{company.name}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-fg transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
        >
          <div className="px-3 py-2 text-xs font-semibold text-muted-fg">Workspace</div>
          <div className="h-px bg-border" />
          <div className="max-h-72 overflow-y-auto p-1">
            {companies.map((c) => {
              const selected = c.id === company.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    selected && "bg-accent/60"
                  )}
                  onClick={() => {
                    selectCompany(c.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mt-0.5 h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    {c.vertical && (
                      <span className="mt-0.5 block text-xs uppercase tracking-wide text-muted-fg">
                        {c.vertical.replace(/_/g, " ")}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="h-px bg-border" />
          <div className="p-1">
            {companies.length > 1 && (
              <button
                type="button"
                className="flex w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  setOpen(false);
                  router.push("/select-company");
                }}
              >
                View all companies
              </button>
            )}
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                setOpen(false);
                router.push("/onboarding");
              }}
            >
              <Plus className="h-4 w-4" />
              Add company
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
