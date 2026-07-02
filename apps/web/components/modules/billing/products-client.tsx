/**
 * @file components/modules/billing/products-client.tsx
 * @description Products & Services list with category filter tabs, search, an
 * archived toggle, and a slide-over panel to add/edit an item.
 */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, X, Search, Pencil, Archive, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getProducts,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
} from "@/lib/data/products";
import type {
  ProductService,
  ProductCategory,
  ProductBillingCycle,
} from "@zerpa/shared-types";

const CATEGORIES: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "managed_service", label: "Managed Service" },
  { value: "once_off", label: "Once-Off" },
  { value: "hardware", label: "Hardware" },
  { value: "licence", label: "Licence" },
  { value: "project", label: "Project" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  managed_service: "Managed Service",
  once_off: "Once-Off",
  hardware: "Hardware",
  licence: "Licence",
  project: "Project",
  other: "Other",
};

const BILLING_CYCLES: { value: ProductBillingCycle; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Annually" },
  { value: "once_off", label: "Once-off" },
];

interface FormState {
  name: string;
  category: ProductCategory;
  description: string;
  unit: string;
  unitPrice: number;
  taxRate: number;
  billingCycle: ProductBillingCycle;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  category: "managed_service",
  description: "",
  unit: "",
  unitPrice: 0,
  taxRate: 15,
  billingCycle: "monthly",
  isActive: true,
};

export function ProductsClient() {
  const [products, setProducts] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<ProductService | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function reload() {
    setLoading(true);
    getProducts(true)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  const filtered = products.filter((p) => {
    if (!showArchived && !p.isActive) return false;
    if (category !== "all" && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPanelOpen(true);
  }

  function openEdit(p: ProductService) {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      description: p.description,
      unit: p.unit ?? "",
      unitPrice: p.unitPrice,
      taxRate: p.taxRate,
      billingCycle: p.billingCycle,
      isActive: p.isActive,
    });
    setPanelOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, unit: form.unit || null };
      if (editing) {
        await updateProduct(editing.id, payload);
        toast.success("Product updated");
      } else {
        await createProduct(payload);
        toast.success("Product added");
      }
      setPanelOpen(false);
      reload();
    } catch {
      toast.error("Could not save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(p: ProductService) {
    try {
      if (p.isActive) {
        await archiveProduct(p.id);
        toast.success(`${p.name} archived`);
      } else {
        await restoreProduct(p.id);
        toast.success(`${p.name} restored`);
      }
      reload();
    } catch {
      toast.error("Action failed");
    }
  }

  return (
    <>
      <PageHeader
        title="Products & Services"
        subtitle="Central catalogue that feeds quotes, invoices and automations"
        action={
          <Button size="sm" onClick={openNew}>
            <Plus size={14} className="mr-1.5" />
            Add Product/Service
          </Button>
        }
      />

      {/* Category tabs */}
      <div className="flex items-center gap-1 flex-wrap border-b border-border mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              "pb-2.5 px-3 text-sm font-medium transition-all border-b-2 border-transparent -mb-px",
              category === c.value
                ? "text-primary border-b-2 border-primary"
                : "text-muted-fg hover:text-foreground"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search + archived toggle */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-fg cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-fg">Loading products…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-12 text-center text-muted-fg">
          No products match your filters.
        </div>
      ) : (
        <div className="rounded-[12px] border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th>Unit</Th>
                  <Th className="text-right">Unit Price</Th>
                  <Th className="text-right">Tax</Th>
                  <Th>Billing Cycle</Th>
                  <Th>Status</Th>
                  <Th className="text-center">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-surface transition-colors",
                      !p.isActive && "opacity-60"
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-muted-fg truncate max-w-xs">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-fg">
                      {CATEGORY_LABELS[p.category]}
                    </td>
                    <td className="px-4 py-3 text-muted-fg">{p.unit ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(p.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-fg">
                      {p.taxRate}%
                    </td>
                    <td className="px-4 py-3 text-muted-fg capitalize">
                      {p.billingCycle.replace("_", "-")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs",
                          p.isActive
                            ? "bg-success-bg text-success"
                            : "bg-surface-2 text-muted-fg"
                        )}
                      >
                        {p.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-muted-fg hover:text-foreground transition-colors p-1"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleArchive(p)}
                          className="text-muted-fg hover:text-foreground transition-colors p-1"
                          title={p.isActive ? "Archive" : "Restore"}
                        >
                          {p.isActive ? (
                            <Archive size={14} />
                          ) : (
                            <RotateCcw size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setPanelOpen(false)}
          />
          <div className="relative w-full max-w-md bg-background h-full shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-base">
                {editing ? "Edit Product/Service" : "Add Product/Service"}
              </h2>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-muted-fg hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Gold MSP Retainer"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as ProductCategory })
                  }
                  className="w-full h-10 rounded-[8px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Default line-item description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="month, hour, device…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="billingCycle">Billing Cycle *</Label>
                  <select
                    id="billingCycle"
                    value={form.billingCycle}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        billingCycle: e.target.value as ProductBillingCycle,
                      })
                    }
                    className="w-full h-10 rounded-[8px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {BILLING_CYCLES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="unitPrice">Unit Price (ZAR) *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min={0}
                    step="any"
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min={0}
                    step="any"
                    value={form.taxRate}
                    onChange={(e) =>
                      setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active
              </label>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Save changes" : "Add product"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPanelOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg",
        className
      )}
    >
      {children}
    </th>
  );
}
