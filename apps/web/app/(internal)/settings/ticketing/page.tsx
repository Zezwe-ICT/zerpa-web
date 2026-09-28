"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Info,
  Mail,
  Plus,
  Shield,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { getMspSettings, updateMspSettings } from "@/lib/api/msp";
import { toast } from "sonner";

interface SLATier {
  priority: "critical" | "high" | "medium" | "low";
  label: string;
  responseMinutes: number;
  resolveMinutes: number;
  color: string;
}

interface BusinessHours {
  enabled: boolean;
  timezone: string;
  days: boolean[];
  startTime: string;
  endTime: string;
}

interface TicketingConfig {
  categories: string[];
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  businessHours: BusinessHours;
  slaTiers: SLATier[];
}

const DEFAULT_SLA: SLATier[] = [
  { priority: "critical", label: "Critical", responseMinutes: 30, resolveMinutes: 240, color: "text-danger" },
  { priority: "high", label: "High", responseMinutes: 120, resolveMinutes: 480, color: "text-warning" },
  { priority: "medium", label: "Medium", responseMinutes: 480, resolveMinutes: 1440, color: "text-primary" },
  { priority: "low", label: "Low", responseMinutes: 1440, resolveMinutes: 4320, color: "text-muted-fg" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_CONFIG: TicketingConfig = {
  categories: ["Billing", "Technical", "General", "Feature Request"],
  autoReplyEnabled: true,
  autoReplyMessage:
    "Hi {customer_name},\n\nThank you for contacting us. We've received your ticket #{ticket_id} and will get back to you within our SLA window.\n\nYour Zerpa support team",
  businessHours: {
    enabled: true,
    timezone: "Africa/Johannesburg",
    days: [true, true, true, true, true, false, false],
    startTime: "08:00",
    endTime: "17:00",
  },
  slaTiers: DEFAULT_SLA,
};

function minutesToDisplay(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function displayToMinutes(val: string): number {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

const CONFIG_KEY = (companyId: string) => `zerpa_ticketing_cfg_${companyId}`;

export default function TicketingSettingsPage() {
  const { company } = useAuth();
  const [emailIntakeEnabled, setEmailIntakeEnabled] = useState(false);
  const [loadingMsp, setLoadingMsp] = useState(true);
  const [savingMsp, setSavingMsp] = useState(false);
  const [config, setConfig] = useState<TicketingConfig>(DEFAULT_CONFIG);
  const [newCategory, setNewCategory] = useState("");
  const [copied, setCopied] = useState<"email" | "portal" | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const slug = company?.slug || company?.id || "your-company";
  const inboundEmail = `${slug}@in.zerpa.co.za`;
  const portalUrl = `https://${slug}.ticket.zerpa.co.za`;

  useEffect(() => {
    getMspSettings()
      .then((s) => setEmailIntakeEnabled(s.emailIntakeEnabled ?? false))
      .catch(() => {})
      .finally(() => setLoadingMsp(false));

    if (company?.id) {
      try {
        const stored = localStorage.getItem(CONFIG_KEY(company.id));
        if (stored) setConfig(JSON.parse(stored));
      } catch {}
    }
  }, [company?.id]);

  function persistConfig(next: TicketingConfig) {
    setConfig(next);
    if (company?.id) {
      try {
        localStorage.setItem(CONFIG_KEY(company.id), JSON.stringify(next));
      } catch {}
    }
  }

  async function handleToggleEmailIntake() {
    setSavingMsp(true);
    const next = !emailIntakeEnabled;
    try {
      await updateMspSettings({ emailIntakeEnabled: next });
      setEmailIntakeEnabled(next);
      toast.success(next ? "Email intake enabled" : "Email intake disabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSavingMsp(false);
    }
  }

  function handleSaveSLA() {
    setSavingConfig(true);
    setTimeout(() => {
      persistConfig(config);
      toast.success("SLA tiers saved");
      setSavingConfig(false);
    }, 300);
  }

  function handleSaveAutoReply() {
    persistConfig(config);
    toast.success("Auto-reply settings saved");
  }

  function handleSaveBusinessHours() {
    persistConfig(config);
    toast.success("Business hours saved");
  }

  function handleAddCategory() {
    const cat = newCategory.trim();
    if (!cat) return;
    if (config.categories.includes(cat)) return toast.error("Category already exists");
    const next = { ...config, categories: [...config.categories, cat] };
    persistConfig(next);
    setNewCategory("");
    toast.success(`Category "${cat}" added`);
  }

  function handleRemoveCategory(cat: string) {
    persistConfig({ ...config, categories: config.categories.filter((c) => c !== cat) });
  }

  function updateSLATier(priority: string, field: "responseMinutes" | "resolveMinutes", value: number) {
    setConfig((prev) => ({
      ...prev,
      slaTiers: prev.slaTiers.map((t) => (t.priority === priority ? { ...t, [field]: value } : t)),
    }));
  }

  function copyToClipboard(value: string, type: "email" | "portal") {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Ticketing & Support Desk"
        subtitle="Configure your customer-facing support portal, SLA targets, and email intake."
      />

      {/* Portal Identity */}
      <section className="space-y-4 mb-8">
        <h2 className="section-title flex items-center gap-2">
          <Globe size={15} className="text-primary" />
          Your portal addresses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Portal URL */}
          <div className="rounded-[12px] border border-border bg-surface p-5 space-y-2">
            <p className="text-xs font-medium text-muted-fg uppercase tracking-wide">Customer portal</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-background border border-border rounded-[6px] px-3 py-2 text-primary truncate">
                {portalUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(portalUrl, "portal")}
              >
                {copied === "portal" ? <Check size={13} /> : <Copy size={13} />}
              </Button>
              <a href={portalUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline"><ExternalLink size={13} /></Button>
              </a>
            </div>
            <p className="text-xs text-muted-fg">Share this link so customers can submit and track their tickets.</p>
          </div>

          {/* Inbound Email */}
          <div className="rounded-[12px] border border-border bg-surface p-5 space-y-2">
            <p className="text-xs font-medium text-muted-fg uppercase tracking-wide">Inbound email address</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-background border border-border rounded-[6px] px-3 py-2 text-primary truncate">
                {inboundEmail}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(inboundEmail, "email")}
              >
                {copied === "email" ? <Check size={13} /> : <Copy size={13} />}
              </Button>
            </div>
            <p className="text-xs text-muted-fg">Customers can email this address directly to open a ticket.</p>
          </div>
        </div>

        {/* Forwarding instructions */}
        <div className="rounded-[12px] border border-border bg-surface p-5">
          <div className="flex items-start gap-3">
            <Info size={15} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">How to forward your existing support inbox</p>
              <p className="text-muted-fg text-xs">
                Go to your current email provider (e.g. support@yourcompany.com) and set up auto-forwarding to{" "}
                <code className="font-mono text-primary">{inboundEmail}</code>.
                All forwarded emails will create tickets automatically. Original sender details are preserved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Email Intake Toggle */}
      <section className="rounded-[12px] border border-border bg-surface p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Mail size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Email intake</p>
              <p className="text-xs text-muted-fg mt-0.5">
                Allow tickets to be opened by emailing {inboundEmail}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleEmailIntake}
            disabled={loadingMsp || savingMsp}
            className="disabled:opacity-50 transition-colors"
          >
            {emailIntakeEnabled
              ? <ToggleRight size={28} className="text-primary" />
              : <ToggleLeft size={28} className="text-muted-fg" />
            }
          </button>
        </div>
      </section>

      {/* SLA Tiers */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title flex items-center gap-2">
            <Clock size={15} className="text-primary" />
            SLA targets
          </h2>
          <Button size="sm" onClick={handleSaveSLA} disabled={savingConfig}>
            {savingConfig ? "Saving…" : "Save SLA"}
          </Button>
        </div>
        <div className="rounded-[12px] border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">First response</th>
                <th className="text-left px-4 py-3">Resolution</th>
                <th className="text-left px-4 py-3 text-muted-fg text-xs font-normal normal-case tracking-normal">Preview</th>
              </tr>
            </thead>
            <tbody>
              {config.slaTiers.map((tier) => (
                <tr key={tier.priority} className="border-t border-border">
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${tier.color}`}>{tier.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-20 text-xs"
                        value={tier.responseMinutes}
                        onChange={(e) => updateSLATier(tier.priority, "responseMinutes", displayToMinutes(e.target.value))}
                      />
                      <span className="text-xs text-muted-fg">min</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-20 text-xs"
                        value={tier.resolveMinutes}
                        onChange={(e) => updateSLATier(tier.priority, "resolveMinutes", displayToMinutes(e.target.value))}
                      />
                      <span className="text-xs text-muted-fg">min</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-fg">
                    {minutesToDisplay(tier.responseMinutes)} response · {minutesToDisplay(tier.resolveMinutes)} resolve
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-fg mt-2">
          Breached SLA tickets surface in the tickets dashboard with a red badge. Enter values in minutes.
        </p>
      </section>

      {/* Ticket Categories */}
      <section className="mb-8">
        <h2 className="section-title flex items-center gap-2 mb-4">
          <Tag size={15} className="text-primary" />
          Ticket categories
        </h2>
        <div className="rounded-[12px] border border-border bg-surface p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {config.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 bg-background border border-border rounded-full px-3 py-1 text-xs font-medium"
              >
                {cat}
                <button
                  onClick={() => handleRemoveCategory(cat)}
                  className="text-muted-fg hover:text-danger transition-colors"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            {config.categories.length === 0 && (
              <p className="text-xs text-muted-fg">No categories yet. Add one below.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              className="h-9 text-sm flex-1"
              placeholder="New category name…"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
            />
            <Button size="sm" onClick={handleAddCategory}>
              <Plus size={13} className="mr-1" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-fg">
            Categories help agents route and filter tickets. Customers select one when submitting.
          </p>
        </div>
      </section>

      {/* Business Hours */}
      <section className="mb-8">
        <h2 className="section-title flex items-center gap-2 mb-4">
          <Shield size={15} className="text-primary" />
          Business hours
        </h2>
        <div className="rounded-[12px] border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">SLA counts business hours only</p>
              <p className="text-xs text-muted-fg mt-0.5">When disabled, SLA timers run 24/7.</p>
            </div>
            <button
              onClick={() =>
                persistConfig({
                  ...config,
                  businessHours: { ...config.businessHours, enabled: !config.businessHours.enabled },
                })
              }
              className="transition-colors"
            >
              {config.businessHours.enabled
                ? <ToggleRight size={26} className="text-primary" />
                : <ToggleLeft size={26} className="text-muted-fg" />
              }
            </button>
          </div>

          {config.businessHours.enabled && (
            <>
              <div>
                <Label className="text-xs">Active days</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {DAYS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const days = [...config.businessHours.days];
                        days[i] = !days[i];
                        persistConfig({
                          ...config,
                          businessHours: { ...config.businessHours, days },
                        });
                      }}
                      className={`w-10 h-10 rounded-[8px] text-xs font-semibold border transition-colors ${
                        config.businessHours.days[i]
                          ? "bg-primary text-primary-fg border-primary"
                          : "bg-background text-muted-fg border-border"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-xs">
                <div>
                  <Label className="text-xs">Start time</Label>
                  <Input
                    type="time"
                    className="mt-1 h-9 text-sm"
                    value={config.businessHours.startTime}
                    onChange={(e) =>
                      persistConfig({
                        ...config,
                        businessHours: { ...config.businessHours, startTime: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">End time</Label>
                  <Input
                    type="time"
                    className="mt-1 h-9 text-sm"
                    value={config.businessHours.endTime}
                    onChange={(e) =>
                      persistConfig({
                        ...config,
                        businessHours: { ...config.businessHours, endTime: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Timezone</Label>
                <select
                  className="mt-1 w-full max-w-xs border border-border rounded-[8px] px-3 py-2 text-sm bg-background h-9"
                  value={config.businessHours.timezone}
                  onChange={(e) =>
                    persistConfig({
                      ...config,
                      businessHours: { ...config.businessHours, timezone: e.target.value },
                    })
                  }
                >
                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST, UTC+2)</option>
                  <option value="UTC">UTC</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">America/New_York (ET)</option>
                </select>
              </div>
              <Button size="sm" variant="outline" onClick={handleSaveBusinessHours}>
                Save business hours
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Auto-reply */}
      <section className="mb-8">
        <h2 className="section-title flex items-center gap-2 mb-4">
          <Mail size={15} className="text-primary" />
          Auto-reply
        </h2>
        <div className="rounded-[12px] border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Send confirmation when ticket is created</p>
              <p className="text-xs text-muted-fg mt-0.5">Customer receives this immediately after submitting.</p>
            </div>
            <button
              onClick={() =>
                persistConfig({ ...config, autoReplyEnabled: !config.autoReplyEnabled })
              }
              className="transition-colors"
            >
              {config.autoReplyEnabled
                ? <ToggleRight size={26} className="text-primary" />
                : <ToggleLeft size={26} className="text-muted-fg" />
              }
            </button>
          </div>

          {config.autoReplyEnabled && (
            <>
              <div>
                <Label className="text-xs">Message template</Label>
                <p className="text-xs text-muted-fg mb-1.5">
                  Available variables: <code className="font-mono">&#123;customer_name&#125;</code>{" "}
                  <code className="font-mono">&#123;ticket_id&#125;</code>{" "}
                  <code className="font-mono">&#123;company_name&#125;</code>
                </p>
                <textarea
                  className="w-full min-h-[120px] rounded-[8px] border border-border bg-background px-3 py-2 text-sm resize-none font-mono"
                  value={config.autoReplyMessage}
                  onChange={(e) => setConfig((prev) => ({ ...prev, autoReplyMessage: e.target.value }))}
                />
              </div>
              <Button size="sm" onClick={handleSaveAutoReply}>Save auto-reply</Button>
            </>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
