/**
 * @file components/modules/billing/action-menu.tsx
 * @description Lightweight kebab action menu for table rows. Renders a list of
 * clickable actions in a popover. Kept local to billing to avoid overloading the
 * Radix-Select-based ui/dropdown-menu.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-muted-fg hover:text-foreground transition-colors p-1 rounded-[6px] hover:bg-surface"
        title="Actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 rounded-[8px] border border-border bg-background shadow-lg py-1">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed",
                item.danger ? "text-danger" : "text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
