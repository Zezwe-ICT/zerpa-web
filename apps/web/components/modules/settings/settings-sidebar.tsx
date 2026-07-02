/**
 * @file components/modules/settings/settings-sidebar.tsx
 * @description Sidebar navigation for settings pages
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_MENU = [
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/security", label: "Security", icon: Shield },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/localisation", label: "Localisation", icon: Globe },
  { href: "/settings/integrations", label: "Integrations", icon: Mail },
  { href: "/settings/data-exports", label: "Data & Exports", icon: Database },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 border-r border-border bg-surface p-4 space-y-1">
      {SETTINGS_MENU.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-fg font-medium"
                : "text-muted-fg hover:text-foreground hover:bg-background"
            )}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
