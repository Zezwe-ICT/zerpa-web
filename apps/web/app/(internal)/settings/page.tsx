/**
 * @file app/(internal)/settings/page.tsx
 * @description Settings home. Shows company/account info (+ dev-only API health)
 * and a grid of section cards that link into each settings area. These cards are
 * the primary settings navigation (there is no settings sub-sidebar).
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Mail,
  Building2,
  Activity,
  ChevronRight,
  Boxes,
  ListPlus,
  Workflow,
  UserCog,
  Rocket,
  BadgeDollarSign,
  MessageCircle,
  Landmark,
  FileSpreadsheet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth/context";
import { useIsDevUser } from "@/lib/auth/dev-access";
import { getHealth } from "@/lib/api/companies";
import type { HealthResponse } from "@/lib/api/companies";

const SETTINGS_SECTIONS = [
  {
    icon: UserCog,
    title: "Your account",
    href: "/settings/account",
    description: "Your sign-in email and password. Just for you, not the whole business.",
    items: ["Change password", "Two-step sign-in", "Download or delete your data"],
  },
  {
    icon: Rocket,
    title: "Guided setup",
    href: "/settings/setup",
    description: "Shape Zerpa around your business in a few clicks. Safe to run again.",
    items: ["What you track", "Sales stages", "Team roles"],
  },
  {
    icon: Boxes,
    title: "Record types",
    href: "/settings/record-types",
    description: "Track anything your business runs on, from industry templates or your own design.",
    items: ["Industry templates", "Your own record types", "Stages per type"],
  },
  {
    icon: ListPlus,
    title: "Custom fields",
    href: "/settings/fields",
    description: "Add the fields your team needs to any record.",
    items: ["13 field types incl. SA ID number", "Required fields", "POPIA-sensitive fields"],
  },
  {
    icon: Workflow,
    title: "Pipelines",
    href: "/settings/pipelines",
    description: "Name and order the stages your team works through.",
    items: ["Lead stages", "Custom record stages", "Won / lost outcomes"],
  },
  {
    icon: UserCog,
    title: "Roles & permissions",
    href: "/settings/roles",
    description: "Decide what each role can see and do, and assign your team.",
    items: ["Permission matrix", "Custom roles", "Team role assignment"],
  },
  {
    icon: Bell,
    title: "Notifications",
    href: "/settings/notifications",
    description: "Configure email and in-app notification preferences.",
    items: ["Invoice reminders", "Lead status changes", "System alerts"],
  },
  {
    icon: Shield,
    title: "Security",
    href: "/settings/security",
    description: "Manage authentication, access control, and audit logs.",
    items: ["Two-factor authentication", "Session management", "Audit log"],
    devOnly: true,
  },
  {
    icon: Palette,
    title: "Appearance",
    href: "/settings/appearance",
    description: "Customize the look and feel of the platform.",
    items: ["Theme (light / dark)", "Brand colours", "Font size"],
  },
  {
    icon: Globe,
    title: "Localisation",
    href: "/settings/localisation",
    description: "Set your region, currency, and date format.",
    items: ["Currency: ZAR (R)", "Date format: DD/MM/YYYY", "Timezone: Africa/Johannesburg"],
  },
  {
    icon: Mail,
    title: "Email & Integrations",
    href: "/settings/integrations",
    description: "Connect your email provider and third-party tools.",
    items: ["SMTP configuration", "AWS SES", "Webhook endpoints"],
  },
  {
    icon: BadgeDollarSign,
    title: "Plan",
    href: "/settings/plan",
    description: "Free, Business, Industry or Scale, monthly or annual. Pay by card or EFT invoice.",
    items: ["Users included in every plan", "Add-ons and extra users", "Portal customers are free"],
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    href: "/settings/whatsapp",
    description: "Send quotes, invoices, and reminders on WhatsApp Business.",
    items: ["Quotes and pay links", "Overdue reminders", "Skipped until a token is saved"],
  },
  {
    icon: Landmark,
    title: "Debit orders",
    href: "/settings/debit-orders",
    description: "Mandates and collections. Live DebiCheck waits until Netcash is connected.",
    items: ["Customer mandates", "Queued collections", "Failed collections"],
  },
  {
    icon: FileSpreadsheet,
    title: "Accounting export",
    href: "/settings/accounting",
    description: "Download a journal or people file for Sage, Xero, or SimplePay.",
    items: ["Sage CSV", "Xero CSV", "SimplePay CSV"],
  },
  {
    icon: Database,
    title: "Data & Exports",
    href: "/settings/data-exports",
    description: "Download your business's records as CSV files.",
    items: ["Customers", "Invoices & payments", "Quotes & leads"],
  },
  {
    icon: Rocket,
    title: "Offline capture",
    href: "/capture",
    description: "Write a note on this device during load-shedding, then save it as a lead.",
    items: ["Saved on this phone", "Sent when you are back online"],
  },
];

export default function SettingsPage() {
  const { user, company } = useAuth();
  const isDev = useIsDevUser();
  const sections = SETTINGS_SECTIONS.filter((s) => !s.devOnly || isDev);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    if (!isDev) return;
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));
  }, [isDev]);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Platform configuration and preferences"
      />

      {/* Company & Account */}
      <div className={`grid grid-cols-1 ${isDev ? "md:grid-cols-2" : ""} gap-4 mb-6`}>
        {/* Company Info */}
        <div className="rounded-[12px] border border-border bg-background p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-surface border border-border flex items-center justify-center">
              <Building2 size={16} className="text-muted-fg" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Company</h3>
              <p className="text-xs text-muted-fg">Your organisation details</p>
            </div>
          </div>
          <div className="pl-11 space-y-1 text-xs text-muted-fg">
            <p><span className="text-foreground font-medium">Name:</span> {company?.name ?? "—"}</p>
            <p><span className="text-foreground font-medium">Slug:</span> {company?.slug ?? "—"}</p>
            <p><span className="text-foreground font-medium">Owner:</span> {user?.fullName ?? "—"}</p>
            <p><span className="text-foreground font-medium">Email:</span> {user?.email ?? "—"}</p>
          </div>
        </div>

        {/* API Health — dev-only */}
        {isDev && (
        <div className="rounded-[12px] border border-border bg-background p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-surface border border-border flex items-center justify-center">
              <Activity size={16} className="text-muted-fg" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">API Health</h3>
              <p className="text-xs text-muted-fg">Live service status</p>
            </div>
            {!healthLoading && health && (
              <span
                className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                  health.status === "ok"
                    ? "bg-success-bg text-success"
                    : "bg-danger-bg text-danger"
                }`}
              >
                {health.status === "ok" ? "Operational" : "Degraded"}
              </span>
            )}
          </div>
          <div className="pl-11 space-y-1 text-xs text-muted-fg">
            {healthLoading ? (
              <p>Checking…</p>
            ) : health ? (
              <>
                <p>
                  <span className="text-foreground font-medium">Database:</span>{" "}
                  {health.database.available ? "Available" : "Unavailable"}
                </p>
                <p>
                  <span className="text-foreground font-medium">Tables:</span>{" "}
                  {health.database.tableCount ?? "—"}
                </p>
                <p>
                  <span className="text-foreground font-medium">Checked:</span>{" "}
                  {new Date(health.ts).toLocaleTimeString("en-ZA")}
                </p>
              </>
            ) : (
              <p className="text-danger">Could not reach API</p>
            )}
          </div>
        </div>
        )}
      </div>

      {/* General Settings — cards link into each section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-[12px] border border-border bg-background p-5 space-y-3 transition-colors hover:border-primary hover:bg-surface"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-surface border border-border flex items-center justify-center">
                  <Icon size={16} className="text-muted-fg" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                  <p className="text-xs text-muted-fg">{section.description}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="ml-auto text-muted-fg transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </div>
              <ul className="space-y-1 pl-11">
                {section.items.map((item) => (
                  <li key={item} className="text-xs text-muted-fg flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-fg flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>
    </>
  );
}
