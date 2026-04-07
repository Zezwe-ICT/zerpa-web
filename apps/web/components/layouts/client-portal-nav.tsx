"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { Vertical } from "@zerpa/shared-types";

interface ClientPortalNavProps {
  vertical: Vertical;
  navItems: Array<{ label: string; href: string }>;
}

const VERTICAL_NAMES: Record<Vertical, string> = {
  FUNERAL: "Funeral Parlour",
  AUTOMOTIVE: "Automotive",
  RESTAURANT: "Restaurant",
  SPA: "Spa & Wellness",
};

export function ClientPortalNav({ vertical, navItems }: ClientPortalNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border h-14 ">
      <div className="flex items-center justify-between px-6 h-full gap-6">
        {/* Logo & Portal Name */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-primary text-primary-fg flex items-center justify-center font-bold text-lg">
              Z
            </div>
            <span className="font-display text-sm font-normal">Zerpa</span>
          </Link>
          <span className="text-xs text-muted-fg">|</span>
          <span className="text-sm font-medium text-foreground">{VERTICAL_NAMES[vertical]}</span>
        </div>

        {/* Nav Items */}
        <nav className="flex items-center gap-6 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors pb-3 border-b-2 border-transparent",
                isActive(item.href)
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-fg hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface rounded-[6px] transition-colors ml-auto">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-fg flex items-center justify-center text-xs font-semibold">
            FA
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:inline">Funeral Admin</span>
          <ChevronDown size={14} className="text-muted-fg" />
        </button>
      </div>
    </header>
  );
}
