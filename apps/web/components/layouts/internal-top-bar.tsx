"use client";

import { Search, ChevronDown } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@/lib/auth/context";
import { CompanySwitcher } from "@/components/company-switcher";

interface TopBarProps {
  title?: string;
}

export function InternalTopBar({ title }: TopBarProps) {
  const { user } = useAuth();

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border h-14">
      <div className="flex items-center justify-between px-6 h-full gap-4">
        {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
        <div className="flex-1" />

        <CompanySwitcher />

        <div className="flex items-center gap-2 bg-surface rounded-[6px] px-3 py-2 border border-border w-56">
          <Search size={14} className="text-muted-fg" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm placeholder-muted-fg focus:outline-none flex-1"
            aria-label="Search"
          />
        </div>

        <NotificationBell />

        <button type="button" className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface rounded-[6px] transition-colors">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-fg flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <span className="text-sm font-medium text-foreground hidden md:inline">
            {user?.fullName ?? "—"}
          </span>
          <ChevronDown size={14} className="text-muted-fg" />
        </button>
      </div>
    </header>
  );
}
