"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, Check, ChevronLeft, ChevronRight, CreditCard, FileUp, Mail, Plus, Receipt, Rocket, Trash2, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PipelineStage, StageKind } from "@/lib/api/customization";
import { RECORD_TYPES_CHANGED } from "@/lib/api/customization";
import { applySetup, getSetupPlan, type SetupPlan, type SetupResult } from "@/lib/api/setup";
import { APPS_CHANGED, changeCompanyApps } from "@/lib/api/apps";
import { createInvite, getCompanyProfile, type TeamInvite } from "@/lib/api/onboarding";
import { apiRequest } from "@/lib/api/client";
import { commitCustomers, previewCustomers } from "@/lib/api/imports";
import { isEmail } from "@/components/auth/onboarding-ui";
import { emailHeaders } from "@/lib/api/email";

const STEPS = [
  { key: "track", label: "What you track", icon: Boxes },
  { key: "pipeline", label: "Sales stages", icon: TrendingUp },
  { key: "team", label: "Team roles", icon: Users },
  { key: "invite", label: "Invite people", icon: Mail },
  { key: "sale", label: "First quote", icon: Receipt },
  { key: "customers", label: "Customers", icon: FileUp },
  { key: "payments", label: "Card payments", icon: CreditCard },
  { key: "launch", label: "Launch", icon: Rocket },
] as const;

interface FirstSale {
  companyName: string;
  vatNumber: string;
  registrationNumber: string;
  address: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  productName: string;
  unitPrice: string;
  customerName: string;
  customerEmail: string;
}

const EMPTY_SALE: FirstSale = {
  companyName: "",
  vatNumber: "",
  registrationNumber: "",
  address: "",
  bankName: "",
  accountNumber: "",
  branchCode: "",
  productName: "",
  unitPrice: "",
  customerName: "",
  customerEmail: "",
};

function saleProblems(sale: FirstSale): string[] {
  const problems: string[] = [];
  if (sale.companyName.trim().length < 2) problems.push("Enter the name customers know you by.");
  const vat = sale.vatNumber.replace(/\s/g, "");
  const cipc = sale.registrationNumber.trim();
  if (!vat && !cipc) problems.push("Add your VAT number or your CIPC number.");
  if (vat && !/^4\d{9}$/.test(vat)) problems.push("A South African VAT number is 10 digits starting with 4.");
  if (cipc && !/^\d{4}\/\d{6}\/\d{2}$/.test(cipc)) problems.push("A CIPC number looks like 2019/123456/07.");
  if (sale.address.trim().length < 5) problems.push("Add the address that should appear on the quote.");
  if (sale.bankName.trim().length < 2) problems.push("Add the bank the customer should pay.");
  if (sale.accountNumber.replace(/\s/g, "").length < 6) problems.push("Add the account number for EFT.");
  if (!sale.productName.trim()) problems.push("Name the product or service.");
  const price = Number(sale.unitPrice);
  if (!sale.unitPrice.trim() || Number.isNaN(price) || price <= 0) problems.push("Enter a price above zero, before VAT.");
  if (sale.customerName.trim().length < 2) problems.push("Enter the customer's name.");
  if (!isEmail(sale.customerEmail)) problems.push("Enter the customer's email so they can open the quote.");
  return problems;
}

const LOST_WORDS = /cancel|lost|lapsed|declined|expired|rejected|void/i;

interface DraftType {
  label: string;
  stages: string;
}

interface DraftInvite {
  email: string;
  fullName: string;
  role: string;
}

/** Turns "New, In progress, Done, Cancelled" into stages with sensible outcomes. */
function stagesFromText(text: string): PipelineStage[] {
  const labels = text.split(",").map((s) => s.trim()).filter(Boolean);
  const lastOpenIdx = labels.map((l) => LOST_WORDS.test(l)).lastIndexOf(false);
  return labels.map((label, i) => {
    let kind: StageKind = "open";
    if (LOST_WORDS.test(label)) kind = "lost";
    else if (labels.length > 1 && i === lastOpenIdx) kind = "won";
    return { key: "", label, kind };
  });
}

async function sendInviteEmail(invite: TeamInvite, companyName: string, inviterName?: string) {
  if (!invite.inviteUrl) return;
  try {
    await fetch("/api/email/invite", {
      method: "POST",
      headers: emailHeaders(),
      body: JSON.stringify({
        to: invite.email,
        companyName,
        inviterName,
        role: invite.roleLabel,
        inviteUrl: invite.inviteUrl,
      }),
    });
  } catch {
    // Email is best-effort; the invite link is still shown / copyable.
  }
}

export function SetupWizard({
  companyId,
  companyName,
  inviterName,
  industryLabel,
  onDone,
  launchLabel = "Launch my workspace",
}: {
  companyId?: string;
  companyName?: string;
  inviterName?: string;
  industryLabel?: string;
  onDone: (result: SetupResult & { invitesSent: number; quoteUrl?: string; quoteNumber?: string }) => void;
  launchLabel?: string;
}) {
  const [plan, setPlan] = useState<SetupPlan | null>(null);
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [customTypes, setCustomTypes] = useState<DraftType[]>([]);
  const [leadStages, setLeadStages] = useState<PipelineStage[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [invites, setInvites] = useState<DraftInvite[]>([{ email: "", fullName: "", role: "STAFF" }]);
  const [sale, setSale] = useState<FirstSale>({ ...EMPTY_SALE, companyName: companyName || "" });
  const [saleSkipped, setSaleSkipped] = useState(false);
  const [showSaleErrors, setShowSaleErrors] = useState(false);
  const [importCsv, setImportCsv] = useState("name,email,phone\n");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSkipped, setImportSkipped] = useState(false);
  const [importError, setImportError] = useState("");
  const [importNote, setImportNote] = useState("");
  const [payfastId, setPayfastId] = useState("");
  const [payfastKey, setPayfastKey] = useState("");
  const [payfastPass, setPayfastPass] = useState("");
  const [ozowSite, setOzowSite] = useState("");
  const [ozowKey, setOzowKey] = useState("");
  const [payError, setPayError] = useState("");
  const [pitch, setPitch] = useState("");
  const [suggestion, setSuggestion] = useState<{
    note: string;
    apps: { key: string; name: string; reason: string }[];
    leadStages: PipelineStage[];
    roles: { key: string; label: string }[];
  } | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    getSetupPlan(companyId)
      .then((p) => {
        setPlan(p);
        setTemplates(p.templates.filter((t) => t.recommended && !t.installed).map((t) => t.key));
        setLeadStages(p.leadStages);
        setRoles(p.roles.map((r) => r.key));
        setShowAll(p.vertical === "GENERIC");
        const defaultRole = p.roles.find((r) => r.key === "STAFF")?.key || p.roles[0]?.key || "STAFF";
        setInvites([{ email: "", fullName: "", role: defaultRole }]);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load setup"));
    if (!companyId) return;
    getCompanyProfile(companyId)
      .then((profile) => {
        const address = [profile.address.street, profile.address.suburb, profile.address.city, profile.address.province, profile.address.postalCode]
          .filter(Boolean)
          .join(", ");
        setSale((prev) => ({
          ...prev,
          companyName: prev.companyName || profile.name || companyName || "",
          vatNumber: prev.vatNumber || profile.vatNumber || "",
          registrationNumber: prev.registrationNumber || profile.registrationNumber || "",
          address: prev.address || address,
        }));
      })
      .catch(() => undefined);
  }, [companyId, companyName]);

  const visibleTemplates = useMemo(
    () => (plan?.templates ?? []).filter((t) => showAll || t.recommended || templates.includes(t.key)),
    [plan, showAll, templates],
  );

  if (!plan) {
    return <p className="text-sm text-muted-fg">Preparing your industry starting point…</p>;
  }

  if (!plan.canApply) {
    return (
      <p className="text-sm text-muted-fg">
        Only an owner or admin can run setup. Ask them to open Settings → Guided setup.
      </p>
    );
  }

  const openStages = leadStages.filter((s) => s.kind === "open");
  const outcomeStages = leadStages.filter((s) => s.kind !== "open");
  const validCustomTypes = customTypes.filter((t) => t.label.trim());
  const newRoles = plan.roles.filter((r) => roles.includes(r.key) && !r.exists);
  const validInvites = invites.filter((i) => isEmail(i.email));
  const badInvites = invites.filter((i) => i.email.trim() && !isEmail(i.email));
  const roleChoices = plan.roles.length
    ? plan.roles
    : [{ key: "STAFF", label: "Team member", permissions: [], builtIn: true, exists: true }];
  const quoteProblems = saleProblems(sale);
  const quoteReady = !saleSkipped && quoteProblems.length === 0;

  const setSaleField = (key: keyof FirstSale, value: string) => {
    setSaleSkipped(false);
    setSale((prev) => ({ ...prev, [key]: value }));
  };

  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const setOpenStages = (next: PipelineStage[]) => setLeadStages([...next, ...outcomeStages]);

  async function suggestFromPitch() {
    setSuggesting(true);
    try {
      const row = await apiRequest<{
        note: string;
        apps: { key: string; name: string; reason: string }[];
        leadStages: PipelineStage[];
        roles: { key: string; label: string }[];
      }>("/setup/suggest", { method: "POST", body: { description: pitch } });
      setSuggestion(row);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not suggest a starting point");
    } finally {
      setSuggesting(false);
    }
  }

  async function useSuggestion() {
    if (!suggestion) return;
    setLeadStages(suggestion.leadStages);
    if (suggestion.roles.length) setRoles(suggestion.roles.map((role) => role.key));
    if (companyId && suggestion.apps.length) {
      try {
        await changeCompanyApps(companyId, { install: suggestion.apps.map((app) => app.key) });
        window.dispatchEvent(new CustomEvent(APPS_CHANGED));
        toast.success("Those apps are on. Stages and roles are filled in. Launch still saves the rest.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not switch those apps on");
        return;
      }
    }
    setSuggestion(null);
  }

  async function launch() {
    if (!companyId) {
      toast.error("Company is not ready yet");
      return;
    }
    setLaunching(true);
    try {
      const result = await applySetup(
        {
          industryLabel: industryLabel || undefined,
          templates,
          customTypes: validCustomTypes.map((t) => ({ label: t.label.trim(), stages: stagesFromText(t.stages) })),
          roles,
          leadStages,
        },
        companyId,
      );
      window.dispatchEvent(new CustomEvent(RECORD_TYPES_CHANGED));

      let invitesSent = 0;
      for (const row of validInvites) {
        try {
          const invite = await createInvite(companyId, {
            email: row.email.trim().toLowerCase(),
            fullName: row.fullName.trim() || undefined,
            role: row.role,
          });
          await sendInviteEmail(invite, companyName || "your company", inviterName);
          invitesSent += 1;
        } catch (e) {
          toast.error(e instanceof Error ? e.message : `Could not invite ${row.email}`);
        }
      }

      let quoteUrl: string | undefined;
      let quoteNumber: string | undefined;
      if (!saleSkipped && saleProblems(sale).length === 0) {
        try {
          const vat = sale.vatNumber.replace(/\s/g, "");
          const price = Number(sale.unitPrice);
          await apiRequest("/billing/settings", {
            method: "PUT",
            body: {
              companyName: sale.companyName.trim(),
              companyVatNumber: vat,
              companyRegistrationNumber: sale.registrationNumber.trim(),
              companyPostalAddress: sale.address.trim(),
              bankName: sale.bankName.trim(),
              accountHolder: sale.companyName.trim(),
              bankAccountNumber: sale.accountNumber.replace(/\s/g, ""),
              bankBranchCode: sale.branchCode.trim(),
            },
          });
          const product = await apiRequest<{ id: string }>("/billing/products", {
            method: "POST",
            body: {
              name: sale.productName.trim(),
              unitPrice: price,
              taxRate: 15,
              billingCycle: "once_off",
              category: "other",
            },
          });
          const account = await apiRequest<{ id: string }>("/crm/accounts", {
            method: "POST",
            body: { name: sale.customerName.trim(), email: sale.customerEmail.trim() },
          });
          const quote = await apiRequest<{ id: string }>("/billing/quotes", {
            method: "POST",
            body: {
              customerId: account.id,
              customerName: sale.customerName.trim(),
              contactEmail: sale.customerEmail.trim(),
              subject: sale.productName.trim(),
              lineItems: [{
                description: sale.productName.trim(),
                quantity: 1,
                unitPrice: price,
                taxRate: 15,
                productServiceId: product.id,
              }],
            },
          });
          const shared = await apiRequest<{ shareUrl: string | null; quoteNumber: string }>(
            `/billing/quotes/${quote.id}/share-link`,
            { method: "POST", body: {} },
          );
          quoteUrl = shared.shareUrl || undefined;
          quoteNumber = shared.quoteNumber;
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "The quote could not be created");
        }
      }

      if (importSkipped) {
        try {
          await apiRequest("/setup/import-choice", { method: "POST", body: { skipped: true } });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not save that you are starting fresh");
        }
      } else if (importFile || (importCsv.trim() && importCsv.trim() !== "name,email,phone")) {
        try {
          const imported = await commitCustomers({ csv: importCsv, file: importFile });
          if (imported.created) toast.success(`${imported.created} customer${imported.created === 1 ? "" : "s"} imported`);
          if (imported.skipped) toast.message(`${imported.skipped} already here, so they were skipped`);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not import customers");
        }
      }

      const payfastReady = Boolean(payfastId.trim() && payfastKey.trim());
      const ozowReady = Boolean(ozowSite.trim() && ozowKey.trim());
      if (payfastReady || ozowReady) {
        try {
          await apiRequest("/billing/payment-gateways", {
            method: "PUT",
            body: {
              ...(payfastReady
                ? {
                    payfast: {
                      enabled: true,
                      sandbox: true,
                      merchantId: payfastId.trim(),
                      merchantKey: payfastKey.trim(),
                      passphrase: payfastPass.trim(),
                    },
                  }
                : {}),
              ...(ozowReady
                ? {
                    ozow: {
                      enabled: true,
                      test: true,
                      siteCode: ozowSite.trim(),
                      privateKey: ozowKey.trim(),
                    },
                  }
                : {}),
            },
          });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not save card payments");
        }
      }

      onDone({ ...result, invitesSent, quoteUrl, quoteNumber });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setLaunching(false);
    }
  }

  async function goNext() {
    if (step === 4 && quoteProblems.length > 0) {
      setShowSaleErrors(true);
      return;
    }
    if (step === 4) setSaleSkipped(false);
    if (step === 5 && !importSkipped) {
      const text = importCsv.trim();
      if (!importFile && (!text || text === "name,email,phone")) {
        setImportError("Paste your customers, upload a file, or say you are starting fresh.");
        return;
      }
      try {
        const preview = await previewCustomers({ csv: importCsv, file: importFile });
        if (preview.issues.length) {
          setImportError(preview.issues.map((issue) => `Line ${issue.line}: ${issue.error}`).join(" "));
          return;
        }
        if (!preview.valid) {
          setImportError(
            preview.duplicates?.length
              ? "Those customers are already in Zerpa."
              : "No customers were found. Use a Zerpa, Sage, Xero, or Google Contacts sheet.",
          );
          return;
        }
        setImportError("");
        setImportNote(
          preview.duplicates?.length
            ? `${preview.duplicates.length} already here and will be skipped.`
            : "",
        );
      } catch (e) {
        setImportError(e instanceof Error ? e.message : "Could not read the spreadsheet");
        return;
      }
    }
    if (step === 6) {
      const startedPayfast = Boolean(payfastId.trim() || payfastKey.trim() || payfastPass.trim());
      const startedOzow = Boolean(ozowSite.trim() || ozowKey.trim());
      if (startedPayfast && !(payfastId.trim() && payfastKey.trim())) {
        setPayError("PayFast needs your merchant ID and merchant key.");
        return;
      }
      if (startedOzow && !(ozowSite.trim() && ozowKey.trim())) {
        setPayError("Ozow needs your site code and private key.");
        return;
      }
    }
    setImportError("");
    setPayError("");
    setStep(step + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-fg">
        <span>
          Part {step + 1} of {STEPS.length}: <span className="font-medium text-foreground">{STEPS[step].label}</span>
        </span>
        {step < STEPS.length - 1 && (
          <button
            type="button"
            className="text-primary hover:underline disabled:opacity-50"
            disabled={launching || badInvites.length > 0}
            onClick={launch}
          >
            Skip the rest and launch with recommended settings
          </button>
        )}
      </div>
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                  i === step ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-fg",
                )}
              >
                {i < step ? <Check size={12} /> : <Icon size={12} />}
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>

      {step === 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">What does your team need to keep track of?</h2>
            <p className="text-sm text-muted-fg">
              Your {plan.verticalLabel.toLowerCase()} basics are already built in. Tick anything extra, borrow from
              other industries, or describe your own. You can change all of this later.
            </p>
          </div>
          <div className="space-y-2 rounded-[10px] border border-border p-3">
            <label className="block text-sm font-medium" htmlFor="business-pitch">
              Describe your business
            </label>
            <textarea
              id="business-pitch"
              className="min-h-20 w-full rounded-[6px] border border-border bg-background px-3 py-2 text-sm"
              placeholder="We look after client computers, log support tickets, and bill a monthly retainer."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
            />
            <p className="text-xs text-muted-fg">
              A sentence is enough. Zerpa suggests apps, sales stages and roles from the words you use. Nothing is switched on until you use the suggestion.
            </p>
            <Button size="sm" variant="outline" disabled={suggesting} onClick={suggestFromPitch}>
              {suggesting ? "Looking…" : "Suggest a starting point"}
            </Button>
            {suggestion && (
              <div className="space-y-2 rounded-[8px] border border-primary/30 bg-primary/5 p-3 text-sm">
                <p>{suggestion.note}</p>
                <p>
                  <span className="font-medium">Apps: </span>
                  {suggestion.apps.map((app) => app.name).join(", ") || "none"}
                </p>
                <p>
                  <span className="font-medium">Sales stages: </span>
                  {suggestion.leadStages.map((stage) => stage.label).join(" → ")}
                </p>
                <p>
                  <span className="font-medium">Roles: </span>
                  {suggestion.roles.map((role) => role.label).join(", ")}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={useSuggestion}>Use this</Button>
                  <Button size="sm" variant="outline" onClick={() => setSuggestion(null)}>Not now</Button>
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleTemplates.map((t) => {
              const checked = t.installed || templates.includes(t.key);
              return (
                <label
                  key={t.key}
                  className={cn(
                    "flex gap-3 rounded-[10px] border p-3 text-sm cursor-pointer",
                    checked ? "border-primary bg-primary/5" : "border-border",
                    t.installed && "opacity-70 cursor-default",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    disabled={t.installed}
                    onChange={() => toggle(templates, setTemplates, t.key)}
                  />
                  <span className="min-w-0">
                    <span className="font-medium">{t.pluralLabel}</span>
                    {t.installed && <span className="ml-2 text-xs text-muted-fg">already added</span>}
                    {!t.recommended && !t.installed && (
                      <span className="ml-2 text-xs text-muted-fg">from another industry</span>
                    )}
                    <span className="block text-xs text-muted-fg">{t.description}</span>
                    <span className="block text-[11px] text-muted-fg mt-1 truncate">Fields: {t.fields.join(", ")}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {plan.vertical !== "GENERIC" && (
            <button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show only my industry" : "Browse templates from other industries"}
            </button>
          )}

          <div className="rounded-[10px] border border-dashed border-border p-4 space-y-3">
            <p className="text-sm font-medium">Something we don&apos;t have? Describe it in plain words.</p>
            {customTypes.map((t, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                <Input
                  placeholder="e.g. Burial society"
                  value={t.label}
                  onChange={(e) => setCustomTypes(customTypes.map((c, j) => (j === i ? { ...c, label: e.target.value } : c)))}
                />
                <Input
                  placeholder="Stages (optional), e.g. Applied, Active, Lapsed"
                  value={t.stages}
                  onChange={(e) => setCustomTypes(customTypes.map((c, j) => (j === i ? { ...c, stages: e.target.value } : c)))}
                />
                <Button size="sm" variant="outline" onClick={() => setCustomTypes(customTypes.filter((_, j) => j !== i))} aria-label="Remove">
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setCustomTypes([...customTypes, { label: "", stages: "" }])}>
              <Plus size={14} className="mr-1" /> Add your own
            </Button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">How does a new customer move through your sales process?</h2>
            <p className="text-sm text-muted-fg">We&apos;ve suggested stages for your industry. Rename, reorder or remove them.</p>
          </div>
          <div className="space-y-2">
            {openStages.map((s, i) => (
              <div key={`${s.key}-${i}`} className="flex items-center gap-2">
                <span className="w-5 text-xs text-muted-fg">{i + 1}</span>
                <Input
                  value={s.label}
                  onChange={(e) => setOpenStages(openStages.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)))}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={i === 0}
                  onClick={() => {
                    const next = [...openStages];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    setOpenStages(next);
                  }}
                  aria-label="Move up"
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={openStages.length <= 1}
                  onClick={() => setOpenStages(openStages.filter((_, j) => j !== i))}
                  aria-label="Remove stage"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setOpenStages([...openStages, { key: "", label: "New stage", kind: "open" }])}>
              <Plus size={14} className="mr-1" /> Add stage
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {outcomeStages.map((s) => (
              <label key={s.key} className="space-y-1 text-sm">
                <span className="text-xs text-muted-fg">{s.kind === "won" ? "When you win the customer" : "When you lose them"}</span>
                <Input
                  value={s.label}
                  onChange={(e) => setLeadStages(leadStages.map((o) => (o.key === s.key ? { ...o, label: e.target.value } : o)))}
                />
              </label>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">Who works in the business?</h2>
            <p className="text-sm text-muted-fg">
              Each role gets sensible access for your industry. Health and ID details stay hidden from roles that
              don&apos;t need them (POPIA). You can fine-tune permissions later.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.roles.map((r) => {
              const checked = r.exists || roles.includes(r.key);
              return (
                <label
                  key={r.key}
                  className={cn(
                    "flex gap-3 rounded-[10px] border p-3 text-sm",
                    checked ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    disabled={r.exists}
                    onChange={() => toggle(roles, setRoles, r.key)}
                  />
                  <span>
                    <span className="font-medium">{r.label}</span>
                    {r.exists && <span className="ml-2 text-xs text-muted-fg">ready</span>}
                    <span className="block text-xs text-muted-fg">
                      {r.permissions.includes("records.view_sensitive") ? "Can see sensitive details · " : ""}
                      {r.permissions.includes("billing.manage")
                        ? "Runs billing"
                        : r.permissions.includes("billing.view")
                          ? "Sees invoices"
                          : r.permissions.includes("records.edit")
                            ? "Works on records"
                            : "View only"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">Invite your team (optional)</h2>
            <p className="text-sm text-muted-fg">
              They get an email with a secure link to join. You can skip this and invite people later from Settings.
            </p>
          </div>
          <div className="space-y-3">
            {invites.map((row, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_0.9fr_auto]">
                <Input
                  type="email"
                  placeholder="colleague@business.co.za"
                  value={row.email}
                  onChange={(e) => setInvites(invites.map((r, j) => (j === i ? { ...r, email: e.target.value } : r)))}
                />
                <Input
                  placeholder="Full name (optional)"
                  value={row.fullName}
                  onChange={(e) => setInvites(invites.map((r, j) => (j === i ? { ...r, fullName: e.target.value } : r)))}
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={row.role}
                  onChange={(e) => setInvites(invites.map((r, j) => (j === i ? { ...r, role: e.target.value } : r)))}
                >
                  {roleChoices.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={invites.length <= 1}
                  onClick={() => setInvites(invites.filter((_, j) => j !== i))}
                  aria-label="Remove invite"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
          {badInvites.length > 0 && (
            <p className="text-xs text-danger" role="alert">
              Check {badInvites.map((i) => i.email.trim()).join(", ")} — that doesn&apos;t look like a valid email.
              Fix it or clear the row to continue.
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setInvites([...invites, { email: "", fullName: "", role: roleChoices[0]?.key || "STAFF" }])
            }
          >
            <Plus size={14} className="mr-1" /> Add another person
          </Button>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">Send a quote your customer can accept</h2>
            <p className="mt-1 text-sm text-muted-fg">
              These details print on the quote. The price is before VAT. Zerpa adds 15% and gives you a link the customer can open.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Business name</span>
              <Input value={sale.companyName} onChange={(e) => setSaleField("companyName", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">VAT number</span>
              <Input value={sale.vatNumber} placeholder="4123456789" onChange={(e) => setSaleField("vatNumber", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">CIPC number</span>
              <Input value={sale.registrationNumber} placeholder="2019/123456/07" onChange={(e) => setSaleField("registrationNumber", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Address on the quote</span>
              <Input value={sale.address} onChange={(e) => setSaleField("address", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Bank</span>
              <Input value={sale.bankName} placeholder="FNB" onChange={(e) => setSaleField("bankName", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Account number</span>
              <Input value={sale.accountNumber} onChange={(e) => setSaleField("accountNumber", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Branch code</span>
              <Input value={sale.branchCode} onChange={(e) => setSaleField("branchCode", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">What you sell</span>
              <Input value={sale.productName} placeholder="Monthly support" onChange={(e) => setSaleField("productName", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Price before VAT (R)</span>
              <Input inputMode="decimal" value={sale.unitPrice} placeholder="1000" onChange={(e) => setSaleField("unitPrice", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Customer</span>
              <Input value={sale.customerName} onChange={(e) => setSaleField("customerName", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Customer email</span>
              <Input type="email" value={sale.customerEmail} onChange={(e) => setSaleField("customerEmail", e.target.value)} />
            </label>
          </div>
          {showSaleErrors && quoteProblems.length > 0 && (
            <ul className="space-y-1 text-xs text-danger" role="alert">
              {quoteProblems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSaleSkipped(true);
              setShowSaleErrors(false);
              setStep(5);
            }}
          >
            I&apos;ll send a quote later
          </Button>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">Bring in the customers you already have</h2>
            <p className="mt-1 text-sm text-muted-fg">
              Upload an Excel file, or paste a Sage, Xero, or Google Contacts export. A customer already here is skipped. A customer you add for a quote does not count as an import.
            </p>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Excel, CSV, Sage, Xero, or Google Contacts</span>
            <input
              type="file"
              accept=".csv,.xlsx,text/csv"
              onChange={(e) => {
                setImportFile(e.target.files?.[0] ?? null);
                setImportSkipped(false);
                setImportError("");
                setImportNote("");
              }}
            />
          </label>
          <textarea
            className="min-h-28 w-full rounded-[6px] border border-border bg-background px-3 py-2 font-mono text-sm"
            value={importCsv}
            onChange={(e) => {
              setImportFile(null);
              setImportSkipped(false);
              setImportError("");
              setImportNote("");
              setImportCsv(e.target.value);
            }}
          />
          {importNote && <p className="text-xs text-muted-fg">{importNote}</p>}
          {importError && <p className="text-xs text-danger" role="alert">{importError}</p>}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setImportSkipped(true);
              setImportError("");
              setStep(6);
            }}
          >
            I&apos;m starting fresh
          </Button>
        </section>
      )}

      {step === 6 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">Card and instant EFT</h2>
            <p className="mt-1 text-sm text-muted-fg">
              Add your PayFast or Ozow details if you want customers to pay online. Until you do, those methods stay off. Invoices still show your bank account for EFT. Keys are saved in test mode.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">PayFast merchant ID</span>
              <Input value={payfastId} onChange={(e) => { setPayError(""); setPayfastId(e.target.value); }} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">PayFast merchant key</span>
              <Input type="password" value={payfastKey} onChange={(e) => { setPayError(""); setPayfastKey(e.target.value); }} />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">PayFast passphrase</span>
              <Input type="password" value={payfastPass} onChange={(e) => { setPayError(""); setPayfastPass(e.target.value); }} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Ozow site code</span>
              <Input value={ozowSite} onChange={(e) => { setPayError(""); setOzowSite(e.target.value); }} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Ozow private key</span>
              <Input type="password" value={ozowKey} onChange={(e) => { setPayError(""); setOzowKey(e.target.value); }} />
            </label>
          </div>
          {payError && <p className="text-xs text-danger" role="alert">{payError}</p>}
          <Button size="sm" variant="outline" onClick={() => { setPayError(""); setPayfastId(""); setPayfastKey(""); setPayfastPass(""); setOzowSite(""); setOzowKey(""); setStep(7); }}>
            I&apos;ll add this later
          </Button>
        </section>
      )}

      {step === 7 && (
        <section className="space-y-4">
          <h2 className="font-semibold">Ready to open your workspace</h2>
          <ul className="space-y-2 text-sm">
            <li className="rounded-[10px] border border-border p-3">
              <span className="font-medium">Record types:</span>{" "}
              {[
                ...plan.templates.filter((t) => templates.includes(t.key)).map((t) => t.pluralLabel),
                ...validCustomTypes.map((t) => t.label.trim()),
              ].join(", ") || "industry defaults only"}
            </li>
            <li className="rounded-[10px] border border-border p-3">
              <span className="font-medium">Sales stages:</span> {leadStages.map((s) => s.label).join(" → ")}
            </li>
            <li className="rounded-[10px] border border-border p-3">
              <span className="font-medium">New roles:</span> {newRoles.map((r) => r.label).join(", ") || "defaults only"}
            </li>
            <li className="rounded-[10px] border border-border p-3">
              <span className="font-medium">Invites:</span>{" "}
              {validInvites.length ? validInvites.map((i) => i.email).join(", ") : "none — you can invite later"}
            </li>
            <li className="rounded-[10px] border border-border p-3">
              <span className="font-medium">First quote:</span>{" "}
              {quoteReady
                ? `${sale.productName.trim()} for ${sale.customerName.trim()} — they can accept it from the link`
                : "skipped — you can send one from Quotes"}
            </li>
            <li className="rounded-[10px] border border-border p-3">
              <span className="font-medium">Existing customers:</span>{" "}
              {importSkipped ? "starting fresh" : "spreadsheet will be imported"}
            </li>
            <li className="rounded-[10px] border border-border p-3">
              <span className="font-medium">Online payments:</span>{" "}
              {payfastId.trim() && payfastKey.trim() ? "PayFast in test mode" : ""}
              {payfastId.trim() && payfastKey.trim() && ozowSite.trim() && ozowKey.trim() ? " and " : ""}
              {ozowSite.trim() && ozowKey.trim() ? "Ozow in test mode" : ""}
              {!(payfastId.trim() && payfastKey.trim()) && !(ozowSite.trim() && ozowKey.trim())
                ? "off — invoices still show your bank account"
                : ""}
            </li>
          </ul>
          <p className="text-xs text-muted-fg">
            Compliance steps for your industry stay built in and can&apos;t be switched off by accident. Everything else
            can be changed in Settings.
          </p>
        </section>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="outline" disabled={step === 0 || launching} onClick={() => setStep(step - 1)}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={goNext} disabled={step === 3 && badInvites.length > 0}>
            {step === 3 && !validInvites.length ? "Skip — invite later" : "Continue"}
            <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button onClick={launch} disabled={launching || badInvites.length > 0}>
            <Rocket size={16} className="mr-2" />
            {launching ? "Setting up…" : launchLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
