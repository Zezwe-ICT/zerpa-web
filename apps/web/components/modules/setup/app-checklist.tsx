"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api/client";
import { openSteps, type AppFacts, type ChecklistApp, type ChecklistStep } from "@/lib/setup/app-checklist";

const TITLES: Record<ChecklistApp, string> = {
  customers: "Still to do in Customers",
  invoicing: "Still to do in Invoicing",
  sales: "Still to do in Sales",
};

function countOf(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null;
}

async function loadFacts(app: ChecklistApp): Promise<AppFacts> {
  if (app === "customers") {
    const [customers, setup] = await Promise.all([
      apiRequest<unknown>("/crm/accounts").then(countOf).catch(() => null),
      apiRequest<{ customersImportedAt?: string | null; importSkippedAt?: string | null }>("/setup")
        .then((plan) => Boolean(plan.customersImportedAt || plan.importSkippedAt))
        .catch(() => null),
    ]);
    return { customers, importDone: setup };
  }

  if (app === "invoicing") {
    const [settings, paymentsOn, products, quotes] = await Promise.all([
      apiRequest<{
        companyName?: string;
        companyVatNumber?: string;
        companyPostalAddress?: string;
        companyRegistrationNumber?: string;
        logoUrl?: string;
        bankName?: string;
        bankAccountNumber?: string;
      }>("/billing/settings").catch(() => null),
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
        .catch(() => null),
      apiRequest<unknown>("/billing/products").then(countOf).catch(() => null),
      apiRequest<unknown>("/billing/quotes").then(countOf).catch(() => null),
    ]);
    return {
      details: settings
        ? Boolean(settings.companyName?.trim()) &&
          Boolean(
            settings.companyVatNumber?.trim() ||
              settings.companyPostalAddress?.trim() ||
              settings.companyRegistrationNumber?.trim(),
          )
        : null,
      logo: settings ? Boolean(settings.logoUrl?.trim()) : null,
      bank: settings ? Boolean(settings.bankName?.trim() && settings.bankAccountNumber?.trim()) : null,
      paymentsOn,
      products,
      quotes,
    };
  }

  const [pipelines, leads] = await Promise.all([
    apiRequest<Array<{ entity?: string; stages?: unknown[] }>>("/pipelines").catch(() => null),
    apiRequest<unknown>("/crm/leads").then(countOf).catch(() => null),
  ]);
  const leadPipeline = pipelines?.find((row) => row.entity === "lead");
  return {
    leadStages: pipelines ? (leadPipeline?.stages?.length ?? 0) : null,
    leads,
  };
}

export function AppChecklist({ app }: { app: ChecklistApp }) {
  const [steps, setSteps] = useState<ChecklistStep[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadFacts(app).then((facts) => {
      if (!cancelled) setSteps(openSteps(app, facts));
    });
    return () => {
      cancelled = true;
    };
  }, [app]);

  if (!steps?.length) return null;

  return (
    <section className="mb-4 rounded-[8px] border border-primary/30 bg-primary/5 px-4 py-3">
      <p className="text-sm font-medium">{TITLES[app]}</p>
      <ul className="mt-2 space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link href={step.href} className="text-sm font-medium underline">
              {step.label}
            </Link>
            <span className="block text-xs text-muted-fg">{step.hint}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
