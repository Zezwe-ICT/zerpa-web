/**
 * App-driven internal sidebar. Dashboard, Customers and admin tools are always present;
 * everything else comes from the company's installed apps (see /apps).
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ZerpaLogo } from "@/components/brand/zerpa-logo";
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
  FileText,
  Boxes,
  CalendarClock,
  MapPinned,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Ticket,
  Server,
  Clock,
  Wifi,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  FolderHeart,
  Calendar,
  Wrench,
  Car,
  Gift,
  UserRound,
  BadgePercent,
  Sparkles,
  Workflow,
  Phone,
  Globe,
  Layers,
  LayoutGrid,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { getVerticalManifest } from "@/lib/verticals";
import { listRecordTypes, RECORD_TYPES_CHANGED, type RecordType } from "@/lib/api/customization";
import { APPS_CHANGED, getCompanyApps, type CatalogApp } from "@/lib/api/apps";
import { AppIcon } from "@/components/modules/apps/app-card";

interface SidebarItem {
  label: string;
  href?: string;
  icon?: React.ReactNode | null;
  section?: string;
  children?: SidebarItem[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={16} strokeWidth={1.5} />,
  Users: <Users size={16} strokeWidth={1.5} />,
  Building2: <Building2 size={16} strokeWidth={1.5} />,
  Receipt: <Receipt size={16} strokeWidth={1.5} />,
  Settings: <Settings size={16} strokeWidth={1.5} />,
  Ticket: <Ticket size={16} strokeWidth={1.5} />,
  FileText: <FileText size={16} strokeWidth={1.5} />,
  Server: <Server size={16} strokeWidth={1.5} />,
  Clock: <Clock size={16} strokeWidth={1.5} />,
  UserCheck: <UserCheck size={16} strokeWidth={1.5} />,
  Package: <Package size={16} strokeWidth={1.5} />,
  Wifi: <Wifi size={16} strokeWidth={1.5} />,
  ShieldCheck: <ShieldCheck size={16} strokeWidth={1.5} />,
  AlertTriangle: <AlertTriangle size={16} strokeWidth={1.5} />,
  AlertCircle: <AlertCircle size={16} strokeWidth={1.5} />,
  FolderHeart: <FolderHeart size={16} strokeWidth={1.5} />,
  Calendar: <Calendar size={16} strokeWidth={1.5} />,
  Shield: <ShieldCheck size={16} strokeWidth={1.5} />,
  UserRound: <UserRound size={16} strokeWidth={1.5} />,
  BadgePercent: <BadgePercent size={16} strokeWidth={1.5} />,
  Gift: <Gift size={16} strokeWidth={1.5} />,
  Wrench: <Wrench size={16} strokeWidth={1.5} />,
  Phone: <Phone size={16} strokeWidth={1.5} />,
  Car: <Car size={16} strokeWidth={1.5} />,
  Boxes: <Boxes size={16} strokeWidth={1.5} />,
  BarChart3: <TrendingUp size={16} strokeWidth={1.5} />,
  Workflow: <Workflow size={16} strokeWidth={1.5} />,
  Globe: <Globe size={16} strokeWidth={1.5} />,
  Sparkles: <Sparkles size={16} strokeWidth={1.5} />,
};

function buildSidebar(apps: CatalogApp[] | null, recordTypes: RecordType[] = []): SidebarItem[] {
  // Each installed app contributes its menu entries: one link, or a group when it has several pages.
  const appItems: SidebarItem[] = (apps ?? []).map((app) => {
    const icon = <AppIcon name={app.icon} size={16} />;
    if (app.nav.length === 1) return { label: app.nav[0].label, href: app.nav[0].href, icon };
    return {
      label: app.name,
      href: app.nav[0]?.href,
      icon,
      children: app.nav.map((n) => ({ label: n.label, href: n.href, icon: null })),
    };
  });

  return [
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
          label: "Customers",
          href: "/clients",
          icon: <Building2 size={16} strokeWidth={1.5} />,
        },
        ...appItems,
        ...(recordTypes.length
          ? [
              {
                label: "Records",
                href: `/records/${recordTypes[0].key}`,
                icon: <Layers size={16} strokeWidth={1.5} />,
                children: recordTypes.map((t) => ({
                  label: t.pluralLabel,
                  href: `/records/${t.key}`,
                  icon: (t.icon && ICON_MAP[t.icon]) || <Package size={16} strokeWidth={1.5} />,
                })),
              },
            ]
          : []),
      ],
    },
    {
      label: "ADMIN",
      section: "admin",
      icon: null,
      children: [
        { label: "Apps", href: "/apps", icon: <LayoutGrid size={16} strokeWidth={1.5} /> },
        { label: "Reports", href: "/reports", icon: <BarChart3 size={16} strokeWidth={1.5} /> },
        { label: "Customise", href: "/settings/record-types", icon: <Layers size={16} strokeWidth={1.5} /> },
        { label: "Imports", href: "/settings/imports", icon: <Boxes size={16} strokeWidth={1.5} /> },
        { label: "Automation", href: "/settings/automation", icon: <Workflow size={16} strokeWidth={1.5} /> },
        { label: "Assist", href: "/settings/assist", icon: <Sparkles size={16} strokeWidth={1.5} /> },
        { label: "Settings", href: "/settings", icon: <Settings size={16} strokeWidth={1.5} /> },
      ],
    },
  ];
}

export function InternalSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, company, signOut } = useAuth();
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [apps, setApps] = useState<CatalogApp[] | null>(null);
  const items = useMemo(() => buildSidebar(apps, recordTypes), [apps, recordTypes]);

  useEffect(() => {
    if (!company?.id) return;
    let cancelled = false;
    const load = () =>
      getCompanyApps(company.id)
        .then((res) => !cancelled && setApps(res.apps.filter((a) => res.installed.includes(a.key))))
        .catch(() => !cancelled && setApps([]));
    load();
    window.addEventListener(APPS_CHANGED, load);
    return () => {
      cancelled = true;
      window.removeEventListener(APPS_CHANGED, load);
    };
  }, [company?.id]);

  useEffect(() => {
    if (!company?.id) return;
    let cancelled = false;
    const load = () =>
      listRecordTypes()
        .then((types) => !cancelled && setRecordTypes(types))
        .catch(() => !cancelled && setRecordTypes([]));
    load();
    window.addEventListener(RECORD_TYPES_CHANGED, load);
    return () => {
      cancelled = true;
      window.removeEventListener(RECORD_TYPES_CHANGED, load);
    };
  }, [company?.id]);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "h-screen bg-background border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("border-b border-border flex items-center", collapsed ? "flex-col gap-2 py-3" : "justify-between p-4")}>
        {collapsed ? (
          <ZerpaLogo variant="mark" className="h-8 w-8" />
        ) : (
          <div>
            <ZerpaLogo className="h-8" />
            {company?.vertical && (
              <span className="text-[10px] uppercase tracking-wide text-muted-fg block mt-1">
                {getVerticalManifest(company.vertical).name}
              </span>
            )}
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item, idx) => {
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
                    (child.children?.some((gc) => isActive(gc.href ?? "")) ?? false);
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
            <NavItem key={item.href} item={item} collapsed={collapsed} isActive={isActive(item.href!)} />
          );
        })}
      </nav>

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
          <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={signOut}>
            <LogOut size={12} className="mr-1.5" />
            Sign Out
          </Button>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  item,
  collapsed,
  isActive,
  level = 0,
}: {
  item: SidebarItem;
  collapsed: boolean;
  isActive: boolean;
  level?: number;
}) {
  const pathname = usePathname() ?? "";
  const hasChildren = Boolean(item.children?.length);
  const [expanded, setExpanded] = useState(isActive);

  const sharedClass = cn(
    "flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium transition-all group w-full",
    isActive
      ? "bg-primary-tint text-primary border-l-2 border-primary"
      : "text-foreground-2 hover:bg-surface hover:text-foreground",
    level > 0 && "pl-8 text-xs",
  );

  if (hasChildren && !collapsed) {
    return (
      <div>
        <button type="button" onClick={() => setExpanded((v) => !v)} className={sharedClass}>
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            size={14}
            className={cn("transition-transform duration-200 text-muted-fg", expanded && "rotate-180")}
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

  if (hasChildren && collapsed) {
    return <div className={cn(sharedClass, "justify-center")}>{item.icon}</div>;
  }

  // Leaves work out their own active state (a group passes its own flag down to every child).
  const leafActive = level > 0 ? matchesPath(pathname, item.href) : isActive;
  return (
    <Link
      href={item.href || "#"}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium transition-colors group w-full",
        leafActive ? "text-primary" : "text-foreground-2 hover:bg-surface hover:text-foreground",
        level > 0 && "pl-8 text-xs",
      )}
      aria-current={leafActive ? "page" : undefined}
    >
      {leafActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 -z-0 rounded-[6px] bg-primary-tint border-l-2 border-primary"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <span className="relative flex items-center gap-3 w-full">
        {item.icon}
        {!collapsed && <span className="flex-1">{item.label}</span>}
      </span>
    </Link>
  );
}

function matchesPath(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(href + "/");
}
