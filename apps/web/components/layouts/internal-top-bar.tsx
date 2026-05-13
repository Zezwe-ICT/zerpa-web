/**
 * @file components/layouts/internal-top-bar.tsx
 * @description Sticky top bar for the internal (admin) shell. Shows a global
 * search input, notification bell, and the logged-in user's avatar/initials.
 */
"use client";

import { Search, Bell, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth/context";

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

        {/* Search */}
        <div className="flex items-center gap-2 bg-surface rounded-[6px] px-3 py-2 border border-border w-64">
          <Search size={14} className="text-muted-fg" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm placeholder-muted-fg focus:outline-none flex-1"
          />
          <span className="text-xs text-muted-fg">⌘K</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-surface rounded-[6px] transition-colors">
          <Bell size={16} className="text-foreground-2" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface rounded-[6px] transition-colors">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-fg flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <span className="text-sm font-medium text-foreground">
            {user?.fullName ?? "—"}
          </span>
          <ChevronDown size={14} className="text-muted-fg" />
        </button>
      </div>
    </header>
  );
}
