"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, FileText, LifeBuoy, Plus, Receipt, Ticket, UserPlus, Users } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@/lib/auth/context";
import { useAppearance } from "@/lib/theme/context";
import { CompanySwitcher } from "@/components/company-switcher";
import ActionSearchBar, { type Action } from "@/components/kokonutui/action-search-bar";
import ProfileDropdown from "@/components/kokonutui/profile-dropdown";
import { searchRecords, type SearchResult } from "@/lib/api/search";

interface TopBarProps {
  title?: string;
}

const iconClass = "h-4 w-4";
const QUICK_ACTIONS: Action[] = [
  { id: "new-invoice", label: "New invoice", icon: <Plus className={`${iconClass} text-primary`} />, end: "Create", href: "/billing/invoices/new" },
  { id: "new-quote", label: "New quote", icon: <Plus className={`${iconClass} text-primary`} />, end: "Create", href: "/billing/quotes/new" },
  { id: "new-lead", label: "Add a lead", icon: <UserPlus className={`${iconClass} text-primary`} />, end: "Create", href: "/crm/leads/new" },
  { id: "customers", label: "Customers", icon: <Users className={`${iconClass} text-muted-fg`} />, end: "Go to", href: "/clients" },
  { id: "invoices", label: "Invoices", icon: <Receipt className={`${iconClass} text-muted-fg`} />, end: "Go to", href: "/billing/invoices" },
];

const RESULT_ICONS: Record<SearchResult["type"], React.ReactNode> = {
  customer: <Building2 className={`${iconClass} text-info`} />,
  invoice: <Receipt className={`${iconClass} text-success`} />,
  quote: <FileText className={`${iconClass} text-warning`} />,
  lead: <UserPlus className={`${iconClass} text-primary`} />,
  ticket: <Ticket className={`${iconClass} text-danger`} />,
};

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  customer: "Customer",
  invoice: "Invoice",
  quote: "Quote",
  lead: "Lead",
  ticket: "Ticket",
};

const rand = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);

export function InternalTopBar({ title }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { user, company, signOut } = useAuth();
  const { settings, update } = useAppearance();

  const onSearch = useCallback(async (q: string): Promise<Action[]> => {
    const rows = await searchRecords(q);
    return rows.map((r) => ({
      id: `${r.type}-${r.id}`,
      label: r.title,
      description: r.subtitle,
      icon: RESULT_ICONS[r.type],
      short: r.amount != null ? rand(r.amount) : undefined,
      end: TYPE_LABEL[r.type],
      href: r.href,
    }));
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border h-14">
      <div className="flex items-center justify-between px-6 h-full gap-4">
        {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
        <div className="flex-1" />

        <CompanySwitcher />

        <ActionSearchBar
          actions={QUICK_ACTIONS}
          onSearch={company?.id ? onSearch : undefined}
          onSelect={(a) => router.push(a.href)}
          placeholder="Search or jump to…"
        />

        <Link
          href={pathname.startsWith("/help") ? "/help" : `/help?from=${encodeURIComponent(pathname)}`}
          className="p-2 rounded-[6px] text-muted-fg hover:text-foreground hover:bg-surface"
          aria-label="Help & support"
          title="Help & support"
        >
          <LifeBuoy size={18} />
        </Link>

        <NotificationBell />

        <ProfileDropdown
          data={{
            name: user?.fullName ?? "—",
            email: user?.email ?? "",
            companyName: company?.name,
            role: company?.role,
          }}
          theme={settings.theme}
          onThemeChange={(theme) => update({ theme })}
          onSignOut={signOut}
        />
      </div>
    </header>
  );
}
