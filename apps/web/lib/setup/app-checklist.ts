export type ChecklistApp = "customers" | "invoicing" | "sales";

export interface ChecklistStep {
  id: string;
  label: string;
  hint: string;
  href: string;
}

/** Null means the check failed to load, so the step stays hidden. */
export interface AppFacts {
  customers?: number | null;
  importDone?: boolean | null;
  details?: boolean | null;
  logo?: boolean | null;
  bank?: boolean | null;
  paymentsOn?: boolean | null;
  products?: number | null;
  quotes?: number | null;
  leadStages?: number | null;
  leads?: number | null;
}

function open(known: boolean | number | null | undefined, done: boolean): boolean {
  return known != null && !done;
}

export function openSteps(app: ChecklistApp, facts: AppFacts): ChecklistStep[] {
  if (app === "customers") {
    const steps: ChecklistStep[] = [];
    if (open(facts.customers, (facts.customers ?? 0) > 0)) {
      steps.push({
        id: "customer",
        label: "Add the first customer",
        hint: "The business you invoice.",
        href: "/clients",
      });
    }
    if (open(facts.importDone, Boolean(facts.importDone))) {
      steps.push({
        id: "import",
        label: "Bring in a spreadsheet",
        hint: "A customer you add by hand does not count. Skip this if you are starting fresh.",
        href: "/settings/imports",
      });
    }
    return steps;
  }

  if (app === "invoicing") {
    const steps: ChecklistStep[] = [];
    if (open(facts.details, Boolean(facts.details))) {
      steps.push({
        id: "details",
        label: "Company details",
        hint: "Name, and a VAT number, CIPC number, or address.",
        href: "/billing/settings",
      });
    }
    if (open(facts.logo, Boolean(facts.logo))) {
      steps.push({
        id: "logo",
        label: "Logo",
        hint: "Shown on quotes and invoices.",
        href: "/billing/settings",
      });
    }
    if (open(facts.bank, Boolean(facts.bank))) {
      steps.push({
        id: "bank",
        label: "Bank account",
        hint: "Printed on invoices so customers can pay by EFT.",
        href: "/billing/settings",
      });
    }
    if (open(facts.products, (facts.products ?? 0) > 0)) {
      steps.push({
        id: "product",
        label: "Something you sell",
        hint: "Saved for this company, so quote lines are not typed by hand.",
        href: "/billing/products",
      });
    }
    if (open(facts.quotes, (facts.quotes ?? 0) > 0)) {
      steps.push({
        id: "quote",
        label: "First quote",
        hint: "The customer can accept it from the link.",
        href: "/billing/quotes/new",
      });
    }
    if (open(facts.paymentsOn, Boolean(facts.paymentsOn))) {
      steps.push({
        id: "payments",
        label: "Card or instant EFT",
        hint: "PayFast or Ozow. Until those keys are saved, invoices still show the bank account.",
        href: "/billing/settings",
      });
    }
    return steps;
  }

  const steps: ChecklistStep[] = [];
  if (open(facts.leadStages, (facts.leadStages ?? 0) > 0)) {
    steps.push({
      id: "stages",
      label: "Sales stages",
      hint: "The steps a deal moves through.",
      href: "/settings/pipelines",
    });
  }
  if (open(facts.leads, (facts.leads ?? 0) > 0)) {
    steps.push({
      id: "lead",
      label: "First lead",
      hint: "Someone you might sell to.",
      href: "/crm/leads/new",
    });
  }
  return steps;
}
