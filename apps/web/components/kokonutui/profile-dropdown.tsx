"use client";

/**
 * @author: @kokonutui
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * Zerpa: the top-bar user menu. Real links (account, company settings, plan, terms), a theme
 * switch, and sign out. Styled with Zerpa's tokens; keeps Kokonut's card-style items and the
 * bending-line indicator.
 */

import { CreditCard, FileText, LogOut, Monitor, Moon, Settings, Shield, Sun, User } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { motion } from "motion/react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import type { ThemeMode } from "@/lib/theme/context";

export interface Profile {
  name: string;
  email: string;
  companyName?: string;
  role?: string;
}

interface MenuItem {
  label: string;
  value?: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Profile;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onSignOut: () => void;
}

const THEMES: Array<{ value: ThemeMode; label: string; icon: React.ReactNode }> = [
  { value: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
  { value: "system", label: "Auto", icon: <Monitor className="h-3.5 w-3.5" /> },
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";
}

export default function ProfileDropdown({
  data,
  theme,
  onThemeChange,
  onSignOut,
  className,
  ...props
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuItems: MenuItem[] = [
    { label: "My account", href: "/settings/account", icon: <User className="h-4 w-4" /> },
    { label: "Security", href: "/settings/security", icon: <Shield className="h-4 w-4" /> },
    { label: "Company settings", value: data.companyName, href: "/settings", icon: <Settings className="h-4 w-4" /> },
    { label: "Plan", href: "/settings/plan", icon: <CreditCard className="h-4 w-4" /> },
    { label: "Terms & privacy", href: "/privacy", icon: <FileText className="h-4 w-4" />, external: true },
  ];

  return (
    <div className={cn("relative", className)} {...props}>
      <Menu.Root onOpenChange={setIsOpen}>
        <div className="group relative">
          <Menu.Trigger asChild>
            <button
              className="flex items-center gap-2 rounded-[8px] border border-transparent px-2 py-1 transition-all duration-200 hover:border-border hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring"
              type="button"
              aria-label="Account menu"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary via-primary to-[#e1561b] p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-background text-[11px] font-semibold text-foreground">
                  {initials(data.name)}
                </div>
              </div>
              <div className="hidden text-left md:block">
                <div className="text-sm font-medium leading-tight text-foreground">{data.name}</div>
                {data.role && <div className="text-[11px] leading-tight text-muted-fg capitalize">{data.role.toLowerCase().replace(/_/g, " ")}</div>}
              </div>
              <svg
                aria-hidden="true"
                className={cn(
                  "ml-0.5 transition-all duration-200",
                  isOpen ? "scale-110 text-primary" : "text-muted-fg group-hover:text-foreground",
                )}
                fill="none"
                height="20"
                viewBox="0 0 12 24"
                width="10"
              >
                <path d="M2 4C6 8 6 16 2 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
              </svg>
            </button>
          </Menu.Trigger>

          <Menu.Portal>
          <Menu.Content
            align="end"
            className="z-50 w-72 origin-top-right outline-none rounded-[14px] border border-border bg-background/95 p-2 shadow-xl backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            sideOffset={6}
          >
            <div className="px-3 pb-3 pt-2">
              <div className="text-sm font-semibold text-foreground">{data.name}</div>
              <div className="truncate text-xs text-muted-fg">{data.email}</div>
            </div>

            <div className="space-y-0.5">
              {menuItems.map((item) => (
                <Menu.Item asChild key={item.label}>
                  <Link
                    className="group flex cursor-pointer items-center rounded-[10px] border border-transparent px-3 py-2.5 outline-none transition-all duration-200 hover:border-border hover:bg-surface data-[highlighted]:border-border data-[highlighted]:bg-surface"
                    href={item.href}
                    {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    <div className="flex flex-1 items-center gap-2.5 text-foreground-2">
                      {item.icon}
                      <span className="whitespace-nowrap text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    {item.value && (
                      <span className="ml-2 max-w-[7rem] truncate rounded-[6px] border border-primary-ring bg-primary-tint px-2 py-0.5 text-[11px] font-medium text-primary">
                        {item.value}
                      </span>
                    )}
                  </Link>
                </Menu.Item>
              ))}
            </div>

            <div className="mt-2 px-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-fg">Theme</p>
              <div className="relative grid grid-cols-3 rounded-[10px] border border-border bg-surface p-0.5" role="radiogroup" aria-label="Theme">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={theme === t.value}
                    onClick={(e) => {
                      e.preventDefault();
                      onThemeChange(t.value);
                    }}
                    className={cn(
                      "relative z-10 flex items-center justify-center gap-1.5 rounded-[8px] py-1.5 text-xs font-medium transition-colors",
                      theme === t.value ? "text-foreground" : "text-muted-fg hover:text-foreground",
                    )}
                  >
                    {theme === t.value && (
                      <motion.span
                        layoutId="theme-pill"
                        className="absolute inset-0 -z-10 rounded-[8px] bg-background shadow-xs"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Menu.Separator className="my-2.5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <Menu.Item asChild>
              <button
                className="group flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] border border-transparent bg-danger-bg px-3 py-2.5 transition-all duration-200 hover:border-danger-ring"
                type="button"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4 text-danger" />
                <span className="text-sm font-medium text-danger">Sign out</span>
              </button>
            </Menu.Item>
          </Menu.Content>
          </Menu.Portal>
        </div>
      </Menu.Root>
    </div>
  );
}
