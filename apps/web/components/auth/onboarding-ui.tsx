/**
 * @file components/auth/onboarding-ui.tsx
 * @description Shared building blocks for signup and onboarding: the overall journey
 * tracker, labelled form fields with inline errors, and small validators.
 */
"use client";

import { Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** The whole signup journey, shown on every screen so people always know where they are. */
export const JOURNEY = [
  { key: "account", label: "Your login", blurb: "Name, email and password" },
  { key: "business", label: "Business", blurb: "Name, industry and contact details" },
  { key: "apps", label: "Apps", blurb: "Choose the tools your business needs" },
  { key: "details", label: "Details", blurb: "Address and tax details for invoices" },
  { key: "review", label: "Review", blurb: "Check everything before we create it" },
  { key: "workspace", label: "Workspace", blurb: "What you track, stages, team" },
] as const;

export function JourneySteps({ current }: { current: number }) {
  const step = JOURNEY[current];
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">
          Step {current + 1} of {JOURNEY.length} · {step.label}
        </span>
        <span className="text-muted-fg">{step.blurb}</span>
      </div>
      <ol className="flex gap-1.5" aria-label="Signup progress">
        {JOURNEY.map((s, i) => (
          <li
            key={s.key}
            aria-current={i === current ? "step" : undefined}
            title={s.label}
            className={cn("h-1.5 flex-1 rounded-full", i <= current ? "bg-primary" : "bg-border")}
          />
        ))}
      </ol>
      <ol className="hidden sm:flex justify-between text-[11px] text-muted-fg">
        {JOURNEY.map((s, i) => (
          <li
            key={s.key}
            className={cn("flex items-center gap-1", i === current && "text-foreground font-medium")}
          >
            {i < current && <Check size={11} className="text-primary" />}
            {s.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Field({
  id,
  label,
  required,
  hint,
  why,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  /** Short explanation of why we ask, shown behind an info marker. */
  why?: string;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required ? (
            <span className="text-danger ml-0.5" aria-hidden>
              *
            </span>
          ) : (
            <span className="ml-1.5 text-xs font-normal text-muted-fg">optional</span>
          )}
        </label>
        {why && (
          <span className="group relative inline-flex">
            <Info size={14} className="text-muted-fg" aria-label={why} tabIndex={0} />
            <span
              role="tooltip"
              className="pointer-events-none absolute right-0 top-5 z-10 hidden w-60 rounded-md border border-border bg-background p-2 text-xs text-muted-fg shadow-sm group-hover:block group-focus-within:block"
            >
              {why}
            </span>
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-fg">{hint}</p>
      )}
    </div>
  );
}

/** Class for native selects so they match the Input component. */
export const selectClass =
  "w-full h-10 rounded-[6px] border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring";

export const errorRing = (hasError: boolean) => (hasError ? "border-danger focus:ring-danger/40" : undefined);

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Accepts 0821234567, 082 123 4567, +27 82 123 4567 and 27821234567. */
export function isSaPhone(v: string) {
  const digits = v.replace(/[\s()-]/g, "");
  return /^(\+?27|0)\d{9}$/.test(digits);
}

export function normaliseWebsite(v: string) {
  const t = v.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Moves focus to the first field with an error so people don't have to hunt for it. */
export function focusFirstError(errors: Record<string, string | null | undefined>) {
  const first = Object.keys(errors).find((k) => errors[k]);
  if (first) document.getElementById(first)?.focus();
}
