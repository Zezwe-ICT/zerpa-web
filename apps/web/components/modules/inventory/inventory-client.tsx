/**
 * @file components/modules/inventory/inventory-client.tsx
 * @description Tracked products with stock on hand, value and low-stock warnings; stock counts,
 * adjustments and each product's movement history.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Boxes, ChevronDown, PackageCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { ProductService } from "@zerpa/shared-types";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProducts } from "@/lib/data/products";
import { changeStock, getInventorySummary, getStockMoves, type StockMove } from "@/lib/api/inventory";
import { ApiError } from "@/lib/api/client";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const REASON: Record<StockMove["reason"], string> = {
  sale: "Sold",
  return: "Returned (credit note)",
  purchase: "Received (supplier bill)",
  adjustment: "Adjusted",
  opening: "Opening stock",
  reversal: "Reversed (voided)",
};

function sourceHref(m: StockMove) {
  if (!m.sourceId) return null;
  return m.sourceType === "supplier_bill" ? `/purchases/bills/${m.sourceId}` : `/billing/invoices/${m.sourceId}`;
}

export function InventoryPage() {
  const { can } = usePermissions();
  const canManage = can("billing.manage");
  const [products, setProducts] = useState<ProductService[] | null>(null);
  const [summary, setSummary] = useState<{ trackedCount: number; stockValue: number; outOfStock: number; lowStock: ProductService[] } | null>(null);
  const [filter, setFilter] = useState<"all" | "low">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  async function reload() {
    const [rows, sum] = await Promise.all([getProducts(false), getInventorySummary()]);
    setProducts(rows.filter((p) => p.trackStock));
    setSummary(sum);
  }
  useEffect(() => {
    reload().catch(() => setProducts([]));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? [])
      .filter((p) => filter === "all" || p.lowStock || (p.stockOnHand ?? 0) <= 0)
      .filter((p) => !q || [p.name, p.sku].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.lowStock) - Number(a.lowStock) || a.name.localeCompare(b.name));
  }, [products, filter, query]);

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Inventory"
          subtitle="Stock follows your invoices, credit notes and supplier bills. Count it now and then to keep it honest."
          action={<Button asChild variant="outline"><Link href="/billing/products">Products</Link></Button>}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard label="Items tracked" value={summary ? String(summary.trackedCount) : "—"} sub="Products with stock turned on" icon={Boxes} iconColor="blue" />
        <StatsCard label="Stock value" value={summary ? formatCurrency(summary.stockValue) : "—"} sub="At cost price, excl. VAT" icon={Wallet} iconColor="green" />
        <StatsCard label="Running low" value={summary ? String(summary.lowStock.length) : "—"} sub={summary?.outOfStock ? `${summary.outOfStock} out of stock` : "At or below the warning level"} icon={AlertTriangle} iconColor={summary?.lowStock.length ? "red" : "amber"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 rounded-[8px] border border-border p-1" role="tablist">
          {([["all", "All items"], ["low", "Running low"]] as const).map(([key, label]) => (
            <button key={key} role="tab" aria-selected={filter === key} onClick={() => setFilter(key)} className={cn("rounded-[6px] px-3 py-1.5 text-sm font-medium", filter === key ? "bg-primary-tint text-primary" : "text-muted-fg hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or SKU" className="max-w-xs" aria-label="Search stock" />
      </div>

      {products === null ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-surface" />
      ) : products.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-10 text-center">
          <PackageCheck className="mx-auto mb-3 text-muted-fg" size={22} />
          <p className="font-semibold">No stock tracked yet</p>
          <p className="text-sm text-muted-fg mt-1 max-w-md mx-auto">
            Open a once-off product on the Products page and turn on <strong>Track stock</strong>. Enter how many you have now.
          </p>
          <Button asChild variant="outline" className="mt-4"><Link href="/billing/products">Go to products</Link></Button>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-fg py-6 text-center">Nothing is running low.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((p) => (
            <StockRow key={p.id} product={p} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} canManage={canManage} onChanged={reload} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function StockRow({
  product: p,
  open,
  onToggle,
  canManage,
  onChanged,
}: {
  product: ProductService;
  open: boolean;
  onToggle: () => void;
  canManage: boolean;
  onChanged: () => void;
}) {
  const [moves, setMoves] = useState<StockMove[] | null>(null);
  const [mode, setMode] = useState<"count" | "adjust">("count");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const onHand = p.stockOnHand ?? 0;
  const out = onHand <= 0;

  useEffect(() => {
    if (open && moves === null) getStockMoves(p.id).then((r) => setMoves(r.moves)).catch(() => setMoves([]));
  }, [open, moves, p.id]);

  async function save() {
    setBusy(true);
    try {
      await changeStock(p.id, { mode, quantity: Number(qty), note: note || undefined });
      toast.success(mode === "count" ? "Stock count saved" : "Stock adjusted");
      setQty("");
      setNote("");
      setMoves(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not change the stock");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("rounded-[12px] border bg-background", p.lowStock || out ? "border-danger-ring" : "border-border")}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex flex-wrap items-center gap-3 p-4 text-left">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{p.name}</p>
          <p className="text-xs text-muted-fg">{[p.sku, `Warn at ${p.reorderLevel ?? 0}`, p.costPrice ? `Cost ${formatCurrency(p.costPrice)}` : null].filter(Boolean).join(" · ")}</p>
        </div>
        {(p.lowStock || out) && (
          <span className="text-xs font-medium text-danger flex items-center gap-1"><AlertTriangle size={12} /> {out ? "Out of stock" : "Running low"}</span>
        )}
        <span className="text-right">
          <span className={cn("block font-mono text-lg font-semibold", (p.lowStock || out) && "text-danger")}>{onHand}</span>
          <span className="block text-[11px] text-muted-fg">{p.unit || "in stock"}</span>
        </span>
        <ChevronDown size={16} className={cn("text-muted-fg transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-border p-4 grid gap-5 lg:grid-cols-2">
              {canManage && (
                <div className="space-y-3">
                  <div className="flex gap-1 rounded-[8px] border border-border p-1 w-fit">
                    {([["count", "Stock count"], ["adjust", "Add or remove"]] as const).map(([key, label]) => (
                      <button key={key} type="button" onClick={() => setMode(key)} className={cn("rounded-[6px] px-3 py-1 text-sm", mode === key ? "bg-primary-tint text-primary font-medium" : "text-muted-fg")}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-fg">
                    {mode === "count" ? "Enter how many you counted. Zerpa records the difference." : "Use a minus for breakages or items used in-house, e.g. -2."}
                  </p>
                  <div className="flex gap-2">
                    <Input type="number" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={mode === "count" ? String(onHand) : "+5 or -2"} aria-label="Quantity" className="w-32" />
                    <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Note" />
                  </div>
                  <Button size="sm" onClick={save} disabled={busy || qty === "" || (mode === "adjust" && Number(qty) === 0)}>
                    {busy ? "Saving…" : mode === "count" ? "Save count" : "Save adjustment"}
                  </Button>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg mb-2">History</p>
                {moves === null ? (
                  <div className="h-20 animate-pulse rounded-[8px] bg-surface" />
                ) : moves.length === 0 ? (
                  <p className="text-sm text-muted-fg">No movements yet.</p>
                ) : (
                  <ul className="divide-y divide-border text-sm max-h-64 overflow-y-auto">
                    {moves.map((m) => {
                      const href = sourceHref(m);
                      return (
                        <li key={m.id} className="flex items-center gap-3 py-1.5">
                          <span className={cn("w-14 text-right font-mono", m.quantity > 0 ? "text-success" : "text-danger")}>{m.quantity > 0 ? "+" : ""}{m.quantity}</span>
                          <span className="min-w-0 flex-1 truncate">
                            {REASON[m.reason]}
                            {m.reference && (href ? <> · <Link href={href} className="text-primary hover:underline">{m.reference}</Link></> : ` · ${m.reference}`)}
                            {m.note ? <span className="text-muted-fg"> · {m.note}</span> : null}
                          </span>
                          <span className="text-xs text-muted-fg flex-none">{formatDate(m.at)} · {m.balanceAfter}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
