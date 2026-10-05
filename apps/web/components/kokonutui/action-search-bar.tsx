"use client";

/**
 * @author: @kokonutui
 * @description: A modern search bar component with action buttons and suggestions
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * Zerpa: adapted for the top bar. Shows quick actions when empty, searches records through
 * `onSearch` as you type, supports ⌘K / Ctrl+K to focus, arrow keys + Enter to open, and uses
 * Zerpa's theme tokens instead of fixed greys.
 */

import { Loader2, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import useDebounce from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  short?: string;
  end?: string;
  href: string;
}

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: { duration: 0.25 },
        staggerChildren: 0.03,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: 0.2 },
        opacity: { duration: 0.15 },
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
  },
} as const;

function ActionSearchBar({
  actions,
  onSearch,
  onSelect,
  placeholder = "Search…",
  className,
}: {
  /** Shown when the box is empty, and filtered by what's typed. */
  actions: Action[];
  /** Look up records for a query (debounced). */
  onSearch?: (query: string) => Promise<Action[]>;
  onSelect: (action: Action) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [found, setFound] = useState<Action[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 200);

  const q = debouncedQuery.toLowerCase().trim();
  const quick = q
    ? actions.filter((a) => `${a.label} ${a.description || ""}`.toLowerCase().includes(q))
    : actions;
  const items = [...found, ...quick];

  useEffect(() => {
    if (!onSearch || q.length < 2) {
      setFound([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    onSearch(q)
      .then((rows) => !cancelled && setFound(rows))
      .catch(() => !cancelled && setFound([]))
      .finally(() => !cancelled && setSearching(false));
    return () => {
      cancelled = true;
    };
  }, [q, onSearch]);

  useEffect(() => setActiveIndex(-1), [q]);

  // ⌘K / Ctrl+K focuses the search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const choose = useCallback(
    (action: Action) => {
      onSelect(action);
      setQuery("");
      setIsFocused(false);
      inputRef.current?.blur();
    },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
        return;
      }
      if (!items.length) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          choose(items[activeIndex >= 0 ? activeIndex : 0]);
          break;
      }
    },
    [items, activeIndex, choose],
  );

  const showEmpty = q.length >= 2 && !searching && items.length === 0;

  return (
    <div className={cn("relative w-64 lg:w-80", className)}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg pointer-events-none" />
        <input
          ref={inputRef}
          aria-activedescendant={activeIndex >= 0 ? `action-${items[activeIndex]?.id}` : undefined}
          aria-autocomplete="list"
          aria-controls="global-search-results"
          aria-expanded={isFocused}
          aria-label="Search customers, invoices, quotes, leads and tickets"
          autoComplete="off"
          className="h-9 w-full rounded-[6px] border border-border bg-surface pl-8 pr-14 text-sm placeholder:text-muted-fg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-ring"
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          type="text"
          value={query}
        />
        <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
          <AnimatePresence mode="popLayout" initial={false}>
            {searching ? (
              <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 size={14} className="animate-spin text-muted-fg" />
              </motion.span>
            ) : (
              <motion.kbd
                key="kbd"
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                className="hidden sm:inline-block rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-fg"
              >
                ⌘K
              </motion.kbd>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isFocused && (items.length > 0 || showEmpty) && (
          <motion.div
            animate="show"
            aria-label="Search results"
            className="absolute left-0 right-0 top-full z-50 mt-1 min-w-[20rem] overflow-hidden rounded-[10px] border border-border bg-background shadow-lg"
            exit="exit"
            id="global-search-results"
            initial="hidden"
            role="listbox"
            variants={ANIMATION_VARIANTS.container}
          >
            {showEmpty ? (
              <p className="px-3 py-4 text-sm text-muted-fg">Nothing found for “{debouncedQuery}”.</p>
            ) : (
              <motion.ul role="none" className="max-h-[60vh] overflow-y-auto p-1">
                {items.map((action, i) => (
                  <motion.li
                    aria-selected={activeIndex === i}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-[6px] px-2.5 py-2 hover:bg-surface",
                      activeIndex === i && "bg-surface-2",
                      i === found.length && found.length > 0 && "mt-1 border-t border-border pt-2.5",
                    )}
                    id={`action-${action.id}`}
                    key={action.id}
                    layout
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(action)}
                    role="option"
                    variants={ANIMATION_VARIANTS.item}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span aria-hidden="true" className="flex-none">{action.icon}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{action.label}</span>
                        {action.description && (
                          <span className="block truncate text-xs text-muted-fg">{action.description}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-none items-center gap-2 text-xs text-muted-fg">
                      {action.short && <span>{action.short}</span>}
                      {action.end && <span>{action.end}</span>}
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
            <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-fg">
              <span>↑↓ to move · Enter to open</span>
              <span>Esc to close</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ActionSearchBar;
