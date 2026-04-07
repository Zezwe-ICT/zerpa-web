import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Bell, Shield, Palette, Globe, Database, Mail } from "lucide-react";

export const metadata = {
  title: "Settings - Zerpa",
  description: "Platform settings",
};

const SETTINGS_SECTIONS = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure email and in-app notification preferences.",
    items: ["Invoice reminders", "Lead status changes", "System alerts"],
  },
  {
    icon: Shield,
    title: "Security",
    description: "Manage authentication, access control, and audit logs.",
    items: ["Two-factor authentication", "Session management", "Audit log"],
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customize the look and feel of the platform.",
    items: ["Theme (light / dark)", "Brand colours", "Logo"],
  },
  {
    icon: Globe,
    title: "Localisation",
    description: "Set your region, currency, and date format.",
    items: ["Currency: ZAR (R)", "Date format: DD/MM/YYYY", "Timezone: Africa/Johannesburg"],
  },
  {
    icon: Mail,
    title: "Email & Integrations",
    description: "Connect your email provider and third-party tools.",
    items: ["SMTP configuration", "AWS SES", "Webhook endpoints"],
  },
  {
    icon: Database,
    title: "Data & Exports",
    description: "Export your data or manage backups.",
    items: ["Export invoices (CSV)", "Export leads (CSV)", "Database backup"],
  },
];

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        subtitle="Platform configuration and preferences"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="rounded-[12px] border border-border bg-background p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-surface border border-border flex items-center justify-center">
                  <Icon size={16} className="text-muted-fg" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                  <p className="text-xs text-muted-fg">{section.description}</p>
                </div>
              </div>
              <ul className="space-y-1 pl-11">
                {section.items.map((item) => (
                  <li key={item} className="text-xs text-muted-fg flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-fg flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-1 pl-11">
                <span className="text-xs text-primary cursor-not-allowed opacity-50">
                  Configure (coming soon)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
