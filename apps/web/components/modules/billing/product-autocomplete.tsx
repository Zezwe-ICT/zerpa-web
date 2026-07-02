/**
 * @file components/modules/billing/product-autocomplete.tsx
 * @description Inline searchable picker over the active Products & Services
 * catalogue. Emits the selected ProductService so callers can build a line item.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { getActiveProducts } from "@/lib/data/products";
import type { ProductService } from "@zerpa/shared-types";

interface ProductAutocompleteProps {
  onSelect: (product: ProductService) => void;
  placeholder?: string;
  className?: string;
}

export function ProductAutocomplete({
  onSelect,
  placeholder = "Search products & services…",
  className,
}: ProductAutocompleteProps) {
  const [products, setProducts] = useState<ProductService[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getActiveProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : products;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg"
        />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full h-9 rounded-[8px] border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-[8px] border border-border bg-background shadow-lg">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect(p);
                setQuery("");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-surface transition-colors border-b border-border last:border-0"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground truncate">
                  {p.name}
                </span>
                <span className="font-mono text-xs text-muted-fg flex-shrink-0">
                  {formatCurrency(p.unitPrice)}
                  {p.unit ? ` / ${p.unit}` : ""}
                </span>
              </div>
              {p.description && (
                <p className="text-xs text-muted-fg truncate mt-0.5">
                  {p.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {open && query && filtered.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-[8px] border border-border bg-background shadow-lg px-3 py-2">
          <p className="text-sm text-muted-fg">No matching products.</p>
        </div>
      )}
    </div>
  );
}
