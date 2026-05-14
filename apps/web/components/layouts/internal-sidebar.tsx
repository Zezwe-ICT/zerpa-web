/**
 * @file components/layouts/internal-sidebar.tsx
 * @description Collapsible left-hand navigation sidebar for the internal ERP shell.
 * Contains nav links grouped by section (CRM, Billing, Operations, HR, Settings)
 * and a sign-out button. Reads active route from usePathname for highlighting.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Contact,
  Package,
  Receipt,
  Building2,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";

interface SidebarItem {
  label: string;
  href?: string;
  icon?: React.ReactNode | null;
  section?: string;
  children?: SidebarItem[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={16} strokeWidth={1.5} />,
  },
  {
    label: "OPERATIONS",
    section: "operations",
    icon: null,
    children: [
      {
        label: "CRM",
        href: "/crm/leads",
        icon: <Users size={16} strokeWidth={1.5} />,
        children: [
          {
            label: "Leads",
            href: "/crm/leads",
            icon: <TrendingUp size={16} strokeWidth={1.5} />,
          },
          {
            label: "Contacts",
            href: "/crm/contacts",
            icon: <Contact size={16} strokeWidth={1.5} />,
          },
        ],
      },
      {
        label: "Nest Sales",
        href: "/nest-sales",
        icon: <Package size={16} strokeWidth={1.5} />,
      },
      {
        label: "Billing",
        href: "/billing",
        icon: <Receipt size={16} strokeWidth={1.5} />,
      },
      {
        label: "Clients",
        href: "/clients",
        icon: <Building2 size={16} strokeWidth={1.5} />,
      },
    ],
  },
  {
    label: "ADMIN",
    section: "admin",
    icon: null,
    children: [
      {
        label: "HR",
        href: "/hr",
        icon: <UserCheck size={16} strokeWidth={1.5} />,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: <Settings size={16} strokeWidth={1.5} />,
      },
    ],
  },
];

export function InternalSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, company, signOut } = useAuth();

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "h-screen bg-background border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-primary text-primary-fg flex items-center justify-center font-bold text-lg">
              Z
            </div>
            <span className="font-display text-lg font-normal">Zerpa</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {SIDEBAR_ITEMS.map((item, idx) => {
          // Section label
          if (item.section) {
            return (
              <div key={idx}>
                {!collapsed && (
                  <p className="text-xs uppercase tracking-wide text-muted-fg px-3 py-1 font-semibold mt-4 mb-2 first:mt-0">
                    {item.label}
                  </p>
                )}
                {item.children?.map((child) => {
                  const childActive =
                    isActive(child.href ?? "") ||
                    (child.children?.some((gc) =>
                      isActive(gc.href ?? "")
                    ) ?? false);
                  return (
                    <NavItem
                      key={child.href ?? child.label}
                      item={child}
                      collapsed={collapsed}
                      isActive={childActive}
                    />
                  );
                })}
              </div>
            );
          }

          return (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={isActive(item.href!)}
            />
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4 space-y-2">
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-fg flex items-center justify-center font-semibold text-xs flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.fullName ?? "—"}</p>
              <p className="text-xs text-muted-fg truncate">{company?.name ?? user?.email ?? ""}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={signOut}
          >
            <LogOut size={12} className="mr-1.5" />
            Sign Out
          </Button>
        )}
      </div>
    </aside>
  );
}

interface NavItemProps {
  item: SidebarItem;
  collapsed: boolean;
  isActive: boolean;
  level?: number;
}

function NavItem({ item, collapsed, isActive, level = 0 }: NavItemProps) {
  const hasChildren = Boolean(item.children?.length);
  const [expanded, setExpanded] = useState(isActive);

  const sharedClass = cn(
    "flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium transition-all group w-full",
    isActive
      ? "bg-primary-tint text-primary border-l-2 border-primary"
      : "text-foreground-2 hover:bg-surface hover:text-foreground",
    level > 0 && "pl-8 text-xs"
  );

  // Item with children: render as a toggle button + collapsible sub-list
  if (hasChildren && !collapsed) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={sharedClass}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform duration-200 text-muted-fg",
              expanded && "rotate-180"
            )}
          />
        </button>

        {expanded && (
          <div className="ml-2 border-l border-border mt-1 pl-3 space-y-1">
            {item.children!.map((child) => (
              <NavItem
                key={child.href}
                item={child}
                collapsed={false}
                isActive={isActive}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Collapsed with children: just show icon, no dropdown
  if (hasChildren && collapsed) {
    return (
      <div className={cn(sharedClass, "justify-center")}>
        {item.icon}
      </div>
    );
  }

  // Regular link item
  return (
    <Link
      href={item.href || "#"}
      className={sharedClass}
    >
      {item.icon}
      {!collapsed && <span className="flex-1">{item.label}</span>}
    </Link>
  );
}
