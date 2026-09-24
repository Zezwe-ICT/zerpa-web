"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ZerpaLogo } from "@/components/brand/zerpa-logo";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileUp,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Pencil,
  Receipt,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  JourneySteps,
  errorRing,
  focusFirstError,
  isEmail,
  isSaPhone,
  normaliseWebsite,
  selectClass,
} from "@/components/auth/onboarding-ui";
import { SetupWizard } from "@/components/modules/setup/setup-wizard";
import { AppCard } from "@/components/modules/apps/app-card";
import { dependentsOf, getAppCatalog, withDependencies, type AppCatalog } from "@/lib/api/apps";
import { useAuth } from "@/lib/auth/context";
import { createCompany } from "@/lib/api/companies";
import { choosePlan } from "@/lib/api/books";
import { ApiError } from "@/lib/api/client";
import { COMPANY_SIZES, PROVINCES, updateCompanyProfile } from "@/lib/api/onboarding";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "zerpa_onboarding_draft_v6";

/** Onboarding steps. The journey tracker adds 1 because "Your login" came first on /register. */
const STEP = { BUSINESS: 0, APPS: 1, DETAILS: 2, REVIEW: 3, WORKSPACE: 4, DONE: 5 } as const;

const INDUSTRIES = [
  { value: "MSP", label: "IT / Managed services", hint: "Clients, agreements, tickets, licences" },
  { value: "TELECOM", label: "ISP / Telecom reseller", hint: "Coverage, RICA, activations, debit orders" },
  { value: "FUNERAL", label: "Funeral parlour", hint: "Cases, policies, mortuary, services" },
  { value: "SPA", label: "Spa & wellness", hint: "Bookings, therapists, client consent" },
  { value: "RESTAURANT", label: "Restaurant", hint: "Reservations, functions, food safety" },
  { value: "AUTOMOTIVE", label: "Workshop / automotive", hint: "Job cards, estimates, vehicles" },
  { value: "GENERIC", label: "Something else", hint: "Build your own from scratch or borrow templates" },
];

type Draft = {
  userId?: string;
  step: number;
  companyId?: string;
  companySlug?: string;
  companyName: string;
  phone: string;
  email: string;
  website: string;
  companySize: string;
  vertical: string;
  industryLabel: string;
  /** Apps picked on the Apps step; null until the owner changes the recommended set. */
  apps: string[] | null;
  /** Industry the app choice was made for — switching industry resets to its recommendations. */
  appsFor: string;
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  legalName: string;
  registrationNumber: string;
  vatRegistered: boolean;
  vatNumber: string;
  deskMode: "bridge" | "lite";
  existingPsa: string;
  existingRmm: string;
  accountingSystem: string;
  /** Empty until the owner picks one. "later" leaves the company unlimited. */
  plan: "" | "free" | "standard" | "industry" | "later";
};

const DEFAULT_DRAFT: Draft = {
  step: STEP.BUSINESS,
  companyName: "",
  phone: "",
  email: "",
  website: "",
  companySize: "2-10",
  vertical: "",
  industryLabel: "",
  apps: null,
  appsFor: "",
  street: "",
  suburb: "",
  city: "",
  province: "",
  postalCode: "",
  legalName: "",
  registrationNumber: "",
  vatRegistered: false,
  vatNumber: "",
  deskMode: "bridge",
  existingPsa: "",
  existingRmm: "",
  accountingSystem: "",
  plan: "",
};

type Errors = Record<string, string | null>;

function businessErrors(d: Draft): Errors {
  return {
    companyName: d.companyName.trim().length < 2 ? "Enter the name your customers know you by." : null,
    vertical: d.vertical ? null : "Pick the option closest to your business.",
    industryLabel:
      d.vertical === "GENERIC" && !d.industryLabel.trim() ? "Describe what kind of business it is." : null,
    phone: !d.phone.trim()
      ? d.email.trim()
        ? null
        : "Add a business phone or email so customers can reach you."
      : isSaPhone(d.phone)
        ? null
        : "Use a South African number, e.g. 011 123 4567.",
    email: d.email.trim() && !isEmail(d.email) ? "That doesn't look like a valid email." : null,
  };
}

function locationErrors(d: Draft): Errors {
  return {
    city: d.city.trim() ? null : "Enter the city or town you operate from.",
    province: d.province ? null : "Pick a province.",
    postal: d.postalCode && !/^\d{4}$/.test(d.postalCode) ? "South African postal codes are 4 digits." : null,
  };
}

function taxErrors(d: Draft): Errors {
  const vat = d.vatNumber.replace(/\s/g, "");
  return {
    vat:
      d.vatRegistered && vat && !/^4\d{9}$/.test(vat)
        ? "SA VAT numbers are 10 digits starting with 4, e.g. 4123456789."
        : null,
    cipc:
      d.registrationNumber && !/^\d{4}\/\d{6}\/\d{2}$/.test(d.registrationNumber.trim())
        ? "CIPC numbers look like 2019/123456/07."
        : null,
  };
}

const detailsErrors = (d: Draft): Errors => ({ ...locationErrors(d), ...taxErrors(d) });

const hasErrors = (e: Errors) => Object.values(e).some(Boolean);

export default function OnboardingPage() {
  const router = useRouter();
  const { user, companies, isLoading, isAuthenticated, attachCompany } = useAuth();
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [loaded, setLoaded] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<string[]>([]);
  const [quoteUrl, setQuoteUrl] = useState("");
  const [catalog, setCatalog] = useState<{ vertical: string; data: AppCatalog } | null>(null);
  const [showMoreApps, setShowMoreApps] = useState(false);

  // Restore a saved draft, but never one that belongs to a different login on this browser.
  useEffect(() => {
    if (isLoading) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw) as Draft;
        if (!saved.userId || saved.userId === user?.id) {
          setDraft({ ...DEFAULT_DRAFT, ...saved, step: Math.min(saved.step ?? 0, STEP.WORKSPACE) });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoaded(true);
  }, [isLoading, user?.id]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && draft.companyId) {
      const stillThere = companies.some((c) => c.id === draft.companyId);
      if (!stillThere) {
        setDraft((prev) => ({
          ...prev,
          companyId: undefined,
          companySlug: undefined,
          step: Math.min(prev.step, STEP.REVIEW),
        }));
      }
    }
  }, [isLoading, isAuthenticated, companies, draft.companyId]);

  useEffect(() => {
    if (loaded && !draft.email && user?.email) {
      setDraft((prev) => ({ ...prev, email: prev.email || user.email }));
    }
  }, [loaded, user?.email, draft.email]);

  useEffect(() => {
    if (!loaded || draft.step === STEP.DONE) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, userId: user?.id }));
  }, [draft, loaded, user?.id]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [draft.step]);

  useEffect(() => {
    if (!loaded || !isAuthenticated || !draft.vertical || catalog?.vertical === draft.vertical) return;
    const vertical = draft.vertical;
    getAppCatalog(vertical)
      .then((data) => setCatalog({ vertical, data }))
      .catch(() => toast.error("Could not load the list of apps. Check your connection and try again."));
  }, [loaded, isAuthenticated, draft.vertical, catalog?.vertical]);

  const appCatalog = catalog?.vertical === draft.vertical ? catalog.data : null;
  const chosenApps = draft.apps && draft.appsFor === draft.vertical ? draft.apps : null;
  const selectedApps = chosenApps ?? appCatalog?.recommended ?? [];

  function toggleApp(key: string) {
    if (!appCatalog) return;
    const next = selectedApps.includes(key)
      ? selectedApps.filter((k) => !dependentsOf([key], selectedApps, appCatalog.apps).includes(k))
      : withDependencies([...selectedApps, key], appCatalog.apps);
    setDraft((prev) => ({ ...prev, apps: next, appsFor: prev.vertical }));
  }

  const created = draft.companyId ? companies.find((c) => c.id === draft.companyId) : undefined;

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function goTo(step: number) {
    setShowErrors(false);
    setDraft((prev) => ({ ...prev, step }));
  }

  const currentErrors: Errors =
    draft.step === STEP.BUSINESS
      ? businessErrors(draft)
      : draft.step === STEP.APPS
        ? { apps: selectedApps.length ? null : "Pick at least one app. You can add more later." }
        : draft.step === STEP.DETAILS
          ? detailsErrors(draft)
          : draft.step === STEP.REVIEW
            ? { plan: draft.plan ? null : "Choose a plan, or decide later." }
            : {};
  const err = (key: string) => (showErrors ? currentErrors[key] : null);

  async function createBusiness() {
    const website = normaliseWebsite(draft.website);
    const company = await createCompany({
      name: draft.companyName.trim(),
      vertical: draft.vertical,
      phone: draft.phone.trim() || undefined,
      apps: chosenApps ?? undefined,
      details: {
        industryLabel: draft.industryLabel.trim() || undefined,
        companySize: draft.companySize,
        website: website || undefined,
        legalName: draft.legalName.trim() || undefined,
        registrationNumber: draft.registrationNumber.trim() || undefined,
        suburb: draft.suburb.trim() || undefined,
        province: draft.province || undefined,
        ...(draft.vertical === "MSP"
          ? {
              deskMode: draft.deskMode,
              existingPsa: draft.existingPsa,
              existingRmm: draft.existingRmm,
              accountingSystem: draft.accountingSystem,
            }
          : {}),
      },
    });

    attachCompany({
      id: company.id,
      name: company.name,
      slug: company.slug,
      vertical: company.vertical,
      ownerUserId: company.ownerUserId,
      role: "OWNER",
    });
    // Remember the company straight away so a failed profile save can't create a duplicate on retry.
    setDraft((prev) => ({ ...prev, companyId: company.id, companySlug: company.slug }));

    try {
      await updateCompanyProfile(company.id, {
        email: draft.email.trim() || undefined,
        phone: draft.phone.trim() || undefined,
        website: website || undefined,
        legalName: draft.legalName.trim() || undefined,
        registrationNumber: draft.registrationNumber.trim() || undefined,
        companySize: draft.companySize || undefined,
        industryLabel: draft.industryLabel.trim() || undefined,
        vatRegistered: draft.vatRegistered,
        vatNumber: draft.vatRegistered ? draft.vatNumber.replace(/\s/g, "") : "",
        address: {
          street: draft.street.trim(),
          suburb: draft.suburb.trim(),
          city: draft.city.trim(),
          province: draft.province,
          postalCode: draft.postalCode.trim(),
        },
      });
    } catch {
      toast.warning("Your business was created, but some details didn't save. You can finish them in Settings.");
    }

    if (draft.plan === "free" || draft.plan === "standard" || draft.plan === "industry") {
      try {
        await choosePlan(draft.plan);
      } catch {
        toast.warning("Your business was created, but the plan was not saved. Choose it in Settings → Plan.");
      }
    }

    setDraft((prev) => ({ ...prev, step: STEP.WORKSPACE }));
  }

  async function handleContinue() {
    if (hasErrors(currentErrors)) {
      setShowErrors(true);
      focusFirstError(currentErrors);
      return;
    }
    if (draft.step < STEP.REVIEW) {
      goTo(draft.step + 1);
      return;
    }
    if (draft.step === STEP.REVIEW) {
      const firstBad = hasErrors(businessErrors(draft))
        ? STEP.BUSINESS
        : hasErrors(detailsErrors(draft))
          ? STEP.DETAILS
          : -1;
      if (firstBad >= 0) {
        setDraft((prev) => ({ ...prev, step: firstBad }));
        setShowErrors(true);
        return;
      }
      if (draft.companyId) {
        goTo(STEP.WORKSPACE);
        return;
      }
      setSubmitting(true);
      try {
        await createBusiness();
        toast.success("Business created. Last step: shape your workspace.");
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Could not create your business. Please try again.");
      } finally {
        setSubmitting(false);
      }
    }
  }

  if (isLoading || !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-sm text-muted-fg">Loading…</div>
    );
  }

  const firstName = user?.fullName?.split(" ")[0] || "there";
  const industry = INDUSTRIES.find((i) => i.value === draft.vertical);

  return (
    <div className="min-h-screen bg-surface py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex justify-center">
          <ZerpaLogo className="h-12" />
        </div>

        <div className="rounded-[16px] border border-border bg-background p-6 sm:p-8 space-y-6">
          {draft.step !== STEP.DONE && (
            <div className="space-y-4">
              <JourneySteps current={Math.min(draft.step + 1, STEP.WORKSPACE + 1)} />
              <div>
                <h1 className="section-title">
                  {created ? `Finish setting up ${created.name}` : "Set up your business"}
                </h1>
                <p className="text-sm text-muted-fg mt-1">
                  {draft.step === STEP.BUSINESS
                    ? `Welcome, ${firstName}! Your login is ready. Now tell us about the business — answer in plain language, you can change anything later.`
                    : "Fields marked * are required. Everything else can be filled in later from Settings."}
                </p>
              </div>
            </div>
          )}

          {draft.step === STEP.BUSINESS && (
            <section className="space-y-5">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                <h2 className="font-semibold">About the business</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="companyName"
                  label="Trading name"
                  required
                  className="sm:col-span-2"
                  hint="The name customers see on quotes, invoices and emails."
                  error={err("companyName")}
                >
                  <Input
                    id="companyName"
                    autoComplete="organization"
                    value={draft.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="e.g. Hawkz Telecoms"
                    className={errorRing(!!err("companyName"))}
                  />
                </Field>
                <Field
                  id="phone"
                  label="Business phone"
                  required={!draft.email.trim()}
                  hint="Phone or email is required."
                  error={err("phone")}
                >
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    value={draft.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="011 123 4567"
                    className={errorRing(!!err("phone"))}
                  />
                </Field>
                <Field
                  id="email"
                  label="Business email"
                  hint="Where customer replies go. We filled in your login email."
                  error={err("email")}
                >
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    value={draft.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="info@business.co.za"
                    className={errorRing(!!err("email"))}
                  />
                </Field>
                <Field id="website" label="Website" hint="We'll add https:// for you.">
                  <Input
                    id="website"
                    inputMode="url"
                    value={draft.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="yourbusiness.co.za"
                  />
                </Field>
                <Field
                  id="size"
                  label="How many people work in the business?"
                  required
                  why="Helps us suggest the right roles and team setup for your size."
                >
                  <select
                    id="size"
                    className={selectClass}
                    value={draft.companySize}
                    onChange={(e) => update("companySize", e.target.value)}
                  >
                    {COMPANY_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s === "Just me" ? s : `${s} people`}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="space-y-2" id="vertical" tabIndex={-1}>
                <p className="text-sm font-medium">
                  What kind of business is it?<span className="text-danger ml-0.5">*</span>
                </p>
                <p className="text-xs text-muted-fg">
                  We&apos;ll load the records, stages and compliance steps that businesses like yours need.
                </p>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Industry">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.value}
                      type="button"
                      role="radio"
                      aria-checked={draft.vertical === ind.value}
                      onClick={() => update("vertical", ind.value)}
                      className={cn(
                        "rounded-[10px] border p-3 text-left",
                        draft.vertical === ind.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-foreground/20",
                      )}
                    >
                      <p className="text-sm font-medium flex items-center justify-between">
                        {ind.label}
                        {draft.vertical === ind.value && <CheckCircle2 size={14} className="text-primary" />}
                      </p>
                      <p className="text-xs text-muted-fg mt-0.5">{ind.hint}</p>
                    </button>
                  ))}
                </div>
                {err("vertical") && <p className="text-xs text-danger">{err("vertical")}</p>}
              </div>

              {draft.vertical === "GENERIC" && (
                <Field
                  id="industryLabel"
                  label="Describe your business in a few words"
                  required
                  error={err("industryLabel")}
                >
                  <Input
                    id="industryLabel"
                    value={draft.industryLabel}
                    onChange={(e) => update("industryLabel", e.target.value)}
                    placeholder="e.g. Security company, cleaning services, school"
                    className={errorRing(!!err("industryLabel"))}
                  />
                </Field>
              )}

              {draft.vertical === "MSP" && (
                <div className="rounded-[12px] border border-border p-4 space-y-3">
                  <p className="text-sm font-medium">How do you handle tickets today?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      {
                        value: "bridge" as const,
                        label: "I already use a PSA / RMM",
                        hint: "Keep Autotask, ConnectWise, Halo, Ninja and link work into Zerpa",
                      },
                      {
                        value: "lite" as const,
                        label: "I need a simple desk",
                        hint: "Use Zerpa's built-in light ticketing",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update("deskMode", opt.value)}
                        className={cn(
                          "rounded-[10px] border p-3 text-left",
                          draft.deskMode === opt.value ? "border-primary bg-primary/5" : "border-border",
                        )}
                      >
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-fg mt-1">{opt.hint}</p>
                      </button>
                    ))}
                  </div>
                  {draft.deskMode === "bridge" && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        aria-label="PSA"
                        value={draft.existingPsa}
                        onChange={(e) => update("existingPsa", e.target.value)}
                        placeholder="PSA, e.g. Halo"
                      />
                      <Input
                        aria-label="RMM"
                        value={draft.existingRmm}
                        onChange={(e) => update("existingRmm", e.target.value)}
                        placeholder="RMM, e.g. Ninja"
                      />
                      <Input
                        aria-label="Accounting system"
                        value={draft.accountingSystem}
                        onChange={(e) => update("accountingSystem", e.target.value)}
                        placeholder="Accounting, e.g. Xero"
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {draft.step === STEP.APPS && (
            <section className="space-y-5" id="apps" tabIndex={-1}>
              <div className="flex items-center gap-2">
                <LayoutGrid size={16} className="text-primary" />
                <h2 className="font-semibold">Choose your apps</h2>
              </div>
              <p className="text-sm text-muted-fg">
                We&apos;ve ticked the apps most {industry?.value === "GENERIC" ? "businesses" : industry?.label.toLowerCase() + " businesses"}{" "}
                use. Untick anything you don&apos;t need or add more — you can change this any time from{" "}
                <span className="font-medium text-foreground">Apps</span> in the menu, and removing an app never deletes
                your records.
              </p>
              {!appCatalog ? (
                <p className="text-sm text-muted-fg">Loading apps…</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-fg">
                      Recommended for you
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {appCatalog.apps
                        .filter((a) => a.recommended)
                        .map((app) => (
                          <AppCard
                            key={app.key}
                            app={app}
                            active={selectedApps.includes(app.key)}
                            onClick={() => toggleApp(app.key)}
                          />
                        ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowMoreApps((v) => !v)}
                      className="text-sm font-medium text-primary hover:underline"
                      aria-expanded={showMoreApps}
                    >
                      {showMoreApps ? "Hide other apps" : `Browse ${appCatalog.apps.filter((a) => !a.recommended).length} more apps`}
                    </button>
                    {showMoreApps &&
                      appCatalog.categories.map((cat) => {
                        const apps = appCatalog.apps.filter((a) => !a.recommended && a.category === cat.key);
                        if (!apps.length) return null;
                        return (
                          <div key={cat.key} className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-fg">{cat.label}</h3>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {apps.map((app) => {
                                const on = selectedApps.includes(app.key);
                                const needs = on
                                  ? []
                                  : withDependencies([app.key], appCatalog.apps)
                                      .filter((k) => k !== app.key && !selectedApps.includes(k))
                                      .map((k) => appCatalog.apps.find((a) => a.key === k)?.name ?? k);
                                return (
                                  <AppCard
                                    key={app.key}
                                    app={app}
                                    active={on}
                                    needs={needs}
                                    onClick={() => toggleApp(app.key)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <p className="text-xs text-muted-fg">
                    {selectedApps.length} app{selectedApps.length === 1 ? "" : "s"} selected. Customers, reports,
                    imports and automation are always included.
                  </p>
                  {err("apps") && <p className="text-xs text-danger">{err("apps")}</p>}
                </>
              )}
            </section>
          )}

          {draft.step === STEP.DETAILS && (
            <section className="space-y-5">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <h2 className="font-semibold">Where do you operate from?</h2>
              </div>
              <p className="text-sm text-muted-fg">
                This address appears on your invoices and quotes. If you have more than one branch, enter your main
                one — you can add others later.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="street" label="Street address" className="sm:col-span-2">
                  <Input
                    id="street"
                    autoComplete="address-line1"
                    value={draft.street}
                    onChange={(e) => update("street", e.target.value)}
                    placeholder="12 Main Road"
                  />
                </Field>
                <Field id="suburb" label="Suburb">
                  <Input
                    id="suburb"
                    autoComplete="address-level3"
                    value={draft.suburb}
                    onChange={(e) => update("suburb", e.target.value)}
                    placeholder="Rosebank"
                  />
                </Field>
                <Field id="city" label="City / town" required error={err("city")}>
                  <Input
                    id="city"
                    autoComplete="address-level2"
                    value={draft.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="Johannesburg"
                    className={errorRing(!!err("city"))}
                  />
                </Field>
                <Field id="province" label="Province" required error={err("province")}>
                  <select
                    id="province"
                    className={cn(selectClass, errorRing(!!err("province")))}
                    value={draft.province}
                    onChange={(e) => update("province", e.target.value)}
                  >
                    <option value="">Select a province…</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="postal" label="Postal code" error={err("postal")}>
                  <Input
                    id="postal"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    value={draft.postalCode}
                    onChange={(e) => update("postalCode", e.target.value.replace(/\D/g, ""))}
                    placeholder="2196"
                    maxLength={4}
                    className={errorRing(!!err("postal"))}
                  />
                </Field>
              </div>
            </section>
          )}

          {draft.step === STEP.DETAILS && (
            <section className="space-y-5 border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                <h2 className="font-semibold">Tax and company registration</h2>
              </div>
              <p className="text-sm text-muted-fg">
                Everything in this section is optional. You only need it before you send VAT invoices — leave it
                blank if you don&apos;t have the numbers to hand and add them later in Settings.
              </p>

              <div className="space-y-2">
                <p className="text-sm font-medium">Is the business registered for VAT with SARS?</p>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="VAT registered">
                  {[
                    { value: true, label: "Yes, we're VAT registered", hint: "We'll add 15% VAT to invoices" },
                    { value: false, label: "No, not VAT registered", hint: "Invoices won't include VAT" },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="radio"
                      aria-checked={draft.vatRegistered === opt.value}
                      onClick={() => update("vatRegistered", opt.value)}
                      className={cn(
                        "rounded-[10px] border p-3 text-left",
                        draft.vatRegistered === opt.value ? "border-primary bg-primary/5" : "border-border",
                      )}
                    >
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-fg mt-0.5">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {draft.vatRegistered && (
                  <Field
                    id="vat"
                    label="VAT number"
                    hint="10 digits starting with 4. It's on your SARS VAT registration letter."
                    error={err("vat")}
                  >
                    <Input
                      id="vat"
                      inputMode="numeric"
                      value={draft.vatNumber}
                      onChange={(e) => update("vatNumber", e.target.value)}
                      placeholder="4123456789"
                      className={errorRing(!!err("vat"))}
                    />
                  </Field>
                )}
                <Field
                  id="legalName"
                  label="Registered company name"
                  className="sm:col-span-2"
                  hint="Only if it's different from your trading name, e.g. Hawkz Holdings (Pty) Ltd."
                >
                  <Input
                    id="legalName"
                    value={draft.legalName}
                    onChange={(e) => update("legalName", e.target.value)}
                    placeholder={draft.companyName ? `${draft.companyName} (Pty) Ltd` : "Company (Pty) Ltd"}
                  />
                </Field>
                <Field
                  id="cipc"
                  label="CIPC registration number"
                  hint="Format: year/number/type, e.g. 2019/123456/07."
                  error={err("cipc")}
                >
                  <Input
                    id="cipc"
                    value={draft.registrationNumber}
                    onChange={(e) => update("registrationNumber", e.target.value)}
                    placeholder="2019/123456/07"
                    className={errorRing(!!err("cipc"))}
                  />
                </Field>
              </div>
            </section>
          )}

          {draft.step === STEP.REVIEW && (
            <section className="space-y-5">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={16} className="text-primary" />
                <h2 className="font-semibold">Check your details</h2>
              </div>
              <p className="text-sm text-muted-fg">
                {draft.companyId
                  ? "Your business is already created. Edits here can also be made later in Settings."
                  : "Make sure this looks right. When you continue we'll create your business in Zerpa."}
              </p>
              <ReviewBlock
                title="Business"
                onEdit={() => goTo(STEP.BUSINESS)}
                rows={[
                  ["Trading name", draft.companyName],
                  ["Industry", draft.vertical === "GENERIC" ? draft.industryLabel : industry?.label],
                  ["Team size", draft.companySize],
                  ["Phone", draft.phone],
                  ["Email", draft.email],
                  ["Website", normaliseWebsite(draft.website)],
                ]}
              />
              <ReviewBlock
                title="Apps"
                onEdit={() => goTo(STEP.APPS)}
                rows={[
                  [
                    `${selectedApps.length} selected`,
                    selectedApps.map((k) => appCatalog?.apps.find((a) => a.key === k)?.name ?? k).join(", ") ||
                      "Recommended for your industry",
                  ],
                ]}
              />
              <ReviewBlock
                title="Location"
                onEdit={() => goTo(STEP.DETAILS)}
                rows={[
                  [
                    "Address",
                    [draft.street, draft.suburb, draft.city, draft.province, draft.postalCode]
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .join(", "),
                  ],
                ]}
              />
              <ReviewBlock
                title="Tax"
                onEdit={() => goTo(STEP.DETAILS)}
                rows={[
                  ["VAT", draft.vatRegistered ? draft.vatNumber || "Registered — number to add later" : "Not registered"],
                  ["Registered name", draft.legalName],
                  ["CIPC number", draft.registrationNumber],
                ]}
              />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Plan</h3>
                <p className="text-sm text-muted-fg">
                  Free is 1 app and 3 users. Standard is R 249 per user a month. Industry Pack is R 399 per user a month.
                  A paid plan starts a 14-day trial. No card is charged. Portal customers are free.
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["free", "Free", "R 0"],
                      ["standard", "Standard", "R 249 / user"],
                      ["industry", "Industry Pack", "R 399 / user"],
                    ] as const
                  ).map(([code, label, price]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => update("plan", code)}
                      className={cn(
                        "rounded-[10px] border p-3 text-left text-sm",
                        draft.plan === code ? "border-primary bg-primary/10" : "border-border",
                      )}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="mt-1 block text-xs text-muted-fg">{price}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={cn("text-sm", draft.plan === "later" ? "font-medium text-primary" : "text-muted-fg hover:underline")}
                  onClick={() => update("plan", "later")}
                >
                  Decide later — keep this company unlimited for now
                </button>
                {draft.plan === "free" && selectedApps.length > 1 && (
                  <p className="text-xs text-muted-fg">
                    Free includes 1 app. The apps you already picked stay. You cannot add more until you change plan.
                  </p>
                )}
                {err("plan") && <p className="text-xs text-danger">{err("plan")}</p>}
              </div>
            </section>
          )}

          {draft.step === STEP.WORKSPACE && created && (
            <div className="space-y-4">
              <p className="text-sm text-muted-fg">
                Last step. We&apos;ve pre-filled everything for{" "}
                {industry && industry.value !== "GENERIC" ? `your industry (${industry.label})` : "a business like yours"}.
                Click through to adjust, or launch straight away with the recommended setup.
              </p>
              <SetupWizard
                companyId={created.id}
                companyName={created.name}
                inviterName={user?.fullName}
                industryLabel={draft.industryLabel.trim() || undefined}
                onDone={(result) => {
                  localStorage.removeItem(STORAGE_KEY);
                  setSummary(
                    [
                      result.created.recordTypes.length &&
                        `${result.created.recordTypes.length} record type${result.created.recordTypes.length === 1 ? "" : "s"} added`,
                      result.created.roles.length &&
                        `${result.created.roles.length} team role${result.created.roles.length === 1 ? "" : "s"} created`,
                      result.invitesSent &&
                        `${result.invitesSent} invite${result.invitesSent === 1 ? "" : "s"} sent`,
                      result.quoteNumber && `quote ${result.quoteNumber} ready to accept`,
                    ].filter((s): s is string => Boolean(s)),
                  );
                  setQuoteUrl(result.quoteUrl || "");
                  setDraft((prev) => ({ ...prev, step: STEP.DONE }));
                }}
              />
            </div>
          )}

          {draft.step === STEP.DONE && (
            <section className="space-y-6 text-center">
              <CheckCircle2 size={40} className="mx-auto text-primary" />
              <div className="space-y-1">
                <h1 className="section-title">{created?.name || draft.companyName} is ready</h1>
                <p className="text-sm text-muted-fg">
                  Your account is fully set up{summary.length ? `: ${summary.join(" · ")}` : ""}.
                </p>
              </div>
              {quoteUrl && (
                <p className="text-sm">
                  Send this link. Your customer can accept the quote from it.{" "}
                  <a className="font-medium text-primary break-all hover:underline" href={quoteUrl}>
                    {quoteUrl}
                  </a>
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-3 text-left">
                <NextAction
                  href="/crm/leads"
                  icon={UserPlus}
                  title="Add your first customer"
                  body="Capture a lead or client and move them through your sales stages."
                />
                <NextAction
                  href="/settings/imports"
                  icon={FileUp}
                  title="Import existing data"
                  body="Bring customers across from a spreadsheet or another system."
                />
                <NextAction
                  href="/settings"
                  icon={Building2}
                  title="Review settings"
                  body="Add a logo, extra fields, more roles or finish tax details."
                />
              </div>
              <Button size="lg" onClick={() => router.push("/dashboard")}>
                <LayoutDashboard size={16} className="mr-2" /> Go to my dashboard
              </Button>
            </section>
          )}

          {draft.step <= STEP.REVIEW && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <Button
                variant="outline"
                disabled={draft.step === STEP.BUSINESS || submitting}
                onClick={() => goTo(Math.max(0, draft.step - 1))}
              >
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <div className="flex items-center gap-2">
                <Button onClick={handleContinue} disabled={submitting}>
                  {submitting
                    ? "Creating your business…"
                    : draft.step === STEP.REVIEW
                      ? draft.companyId
                        ? "Continue to workspace"
                        : "Looks good — create my business"
                      : "Continue"}
                  <ChevronRight size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {draft.step !== STEP.DONE && (
          <p className="text-center text-xs text-muted-fg">
            Your answers are saved on this device as you go. Close the tab any time and pick up where you left off.
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewBlock({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: Array<[string, string | undefined]>;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-[10px] border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <Pencil size={12} /> Edit
        </button>
      </div>
      <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[10rem_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-fg">{label}</dt>
            <dd className={cn("break-words", !value?.trim() && "text-muted-fg italic")}>
              {value?.trim() || "Not provided"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function NextAction({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[10px] border border-border p-4 hover:border-primary/50 hover:bg-primary/5"
    >
      <Icon size={18} className="text-primary" />
      <p className="mt-2 text-sm font-medium flex items-center gap-1">
        {title} <ArrowRight size={12} className="opacity-0 group-hover:opacity-100" />
      </p>
      <p className="text-xs text-muted-fg mt-1">{body}</p>
    </Link>
  );
}
