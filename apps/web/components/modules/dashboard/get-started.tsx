"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import { apiRequest } from "@/lib/api/client";

interface BillingDetails {
  companyName?: string;
  companyVatNumber?: string;
  companyPostalAddress?: string;
  companyRegistrationNumber?: string;
  logoUrl?: string;
  bankName?: string;
  bankAccountNumber?: string;
}

interface Step {
  id: string;
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

function stepsFor(input: {
  settings: BillingDetails | null;
  paymentsOn: boolean;
  customers: number;
  quotes: number | null;
  team: number;
  importDone: boolean;
}): Step[] {
  const settings = input.settings;
  const details =
    Boolean(settings?.companyName?.trim()) &&
    Boolean(settings?.companyVatNumber?.trim() || settings?.companyPostalAddress?.trim() || settings?.companyRegistrationNumber?.trim());
  const steps: Step[] = [
    {
      id: "details",
      label: "Company details",
      hint: "Name, VAT or CIPC number, and address",
      href: "/billing/settings",
      done: details,
    },
    {
      id: "logo",
      label: "Logo",
      hint: "Shown on quotes and invoices",
      href: "/billing/settings",
      done: Boolean(settings?.logoUrl?.trim()),
    },
    {
      id: "bank",
      label: "Bank details",
      hint: "Printed on invoices so customers can pay by EFT",
      href: "/billing/settings",
      done: Boolean(settings?.bankName?.trim() && settings?.bankAccountNumber?.trim()),
    },
    {
      id: "payments",
      label: "Online payments",
      hint: "PayFast, Ozow, or EFT on the pay page",
      href: "/billing/settings",
      done: input.paymentsOn,
    },
    {
      id: "customer",
      label: "First customer",
      hint: "Add the first business you invoice",
      href: "/clients",
      done: input.customers > 0,
    },
  ];
  if (input.quotes !== null) {
    steps.push({
      id: "quote",
      label: "First quote",
      hint: "Send a quote the customer can accept online",
      href: "/billing/quotes/new",
      done: input.quotes > 0,
    });
  }
  steps.push(
    {
      id: "import",
      label: "Import your data",
      hint: "Bring in a spreadsheet. Skip this if you are starting fresh.",
      href: "/settings/imports",
      done: input.importDone,
    },
    {
      id: "team",
      label: "Invite the team",
      hint: "Add someone else so you are not the only login",
      href: "/settings/security",
      done: input.team > 1,
    },
  );
  return steps;
}

export function GetStarted() {
  const { company } = useAuth();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (!company?.id) return;
    let cancelled = false;
    const companyHeader = { headers: { "X-Company-Id": company.id } };
    Promise.all([
      apiRequest<BillingDetails>("/billing/settings").catch(() => null),
      apiRequest<{
        payfast?: { enabled?: boolean; merchantId?: string; merchantKeySet?: boolean };
        ozow?: { enabled?: boolean; siteCode?: string; privateKeySet?: boolean };
      }>("/billing/payment-gateways")
        .then((g) =>
          Boolean(
            (g.payfast?.enabled && g.payfast.merchantId && g.payfast.merchantKeySet) ||
              (g.ozow?.enabled && g.ozow.siteCode && g.ozow.privateKeySet),
          ),
        )
        .catch(() => false),
      apiRequest<{ customersImportedAt?: string | null; importSkippedAt?: string | null }>("/setup")
        .then((plan) => Boolean(plan.customersImportedAt || plan.importSkippedAt))
        .catch(() => false),
      apiRequest<unknown[]>("/crm/accounts").then((rows) => rows?.length ?? 0).catch(() => 0),
      apiRequest<{ installed?: string[] }>(`/companies/${company.id}/apps`, companyHeader)
        .then((res) =>
          res.installed?.includes("invoicing")
            ? apiRequest<unknown[]>("/billing/quotes").then((rows) => rows?.length ?? 0)
            : null,
        )
        .catch(() => null),
      apiRequest<unknown[]>(`/companies/${company.id}/team-members`).then((rows) => rows.length).catch(() => 1),
    ]).then(([settings, paymentsOn, importDone, customers, quotes, team]) => {
      if (cancelled) return;
      setSteps(stepsFor({ settings, paymentsOn, customers, quotes, team, importDone }));
    });
    return () => {
      cancelled = true;
    };
  }, [company?.id, skipped]);

  if (!steps) return null;
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;

  return (
    <section className="mb-6 rounded-[12px] border border-border bg-background p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Get started</h2>
          <p className="text-xs text-muted-fg">
            {done} of {steps.length} done. Finish these and you can quote and get paid without a spreadsheet.
          </p>
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-start gap-3 rounded-[8px] border border-border px-3 py-2 hover:bg-surface"
            >
              <span className={step.done ? "mt-0.5 text-green-600" : "mt-0.5 text-muted-fg"} aria-hidden>
                {step.done ? "✓" : "○"}
              </span>
              <span>
                <span className="block text-sm font-medium">{step.label}</span>
                <span className="block text-xs text-muted-fg">{step.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!steps.find((step) => step.id === "import")?.done ? (
        <button
          type="button"
          className="mt-3 text-xs text-muted-fg underline"
          onClick={() => {
            apiRequest("/setup/import-choice", { method: "POST", body: { skipped: true } })
              .then(() => setSkipped(true))
              .catch((e) => {
                toast.error(e instanceof Error ? e.message : "Could not save that you are starting fresh");
              });
          }}
        >
          Skip importing for now
        </button>
      ) : null}
    </section>
  );
}
