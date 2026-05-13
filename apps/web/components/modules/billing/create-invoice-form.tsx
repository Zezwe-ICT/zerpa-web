"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InvoicePreview } from "./invoice-preview";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import type { Invoice, InvoiceLineItem, InvoiceType } from "@zerpa/shared-types";

interface CreateInvoiceFormProps {
  onSuccess?: (invoice: Invoice) => void;
}

const TENANTS = [
  { id: "funeral-001", name: "Dignity Funeral Home", vertical: "FUNERAL" },
  { id: "auto-001", name: "Auto Excellence Workshop", vertical: "AUTOMOTIVE" },
  { id: "restaurant-001", name: "Golden Fork Restaurant", vertical: "RESTAURANT" },
  { id: "spa-001", name: "Serenity Spa", vertical: "SPA" },
];

const INVOICE_TYPES: { value: InvoiceType; label: string }[] = [
  { value: "SETUP", label: "Setup Fee" },
  { value: "SUBSCRIPTION", label: "Monthly Subscription" },
  { value: "AD_HOC", label: "Ad-hoc Charge" },
];

const PRESETS: Record<string, InvoiceLineItem[]> = {
  setup: [
    {
      id: "1",
      description: "Initial Setup & Configuration",
      quantity: 1,
      unitPrice: 5000,
      total: 5000,
    },
    {
      id: "2",
      description: "Data Migration & Integration",
      quantity: 1,
      unitPrice: 3000,
      total: 3000,
    },
  ],
  subscription: [
    {
      id: "1",
      description: "Monthly Software License",
      quantity: 1,
      unitPrice: 2500,
      total: 2500,
    },
  ],
  basic: [
    {
      id: "1",
      description: "Professional Services",
      quantity: 5,
      unitPrice: 500,
      total: 2500,
    },
  ],
};

export function CreateInvoiceForm({ onSuccess }: CreateInvoiceFormProps) {
  const [formData, setFormData] = useState({
    tenantId: TENANTS[0].id,
    invoiceType: "SETUP" as InvoiceType,
    lineItems: [
      {
        id: "1",
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTenant = TENANTS.find((t) => t.id === formData.tenantId)!;

  const subtotal = formData.lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * 0.15;
  const total = subtotal + taxAmount;

  const handleAddPreset = (presetKey: keyof typeof PRESETS) => {
    setFormData({
      ...formData,
      lineItems: PRESETS[presetKey].map((item, idx) => ({
        ...item,
        id: String(idx),
      })),
    });
  };

  const handleAddLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [
        ...formData.lineItems,
        {
          id: String(Date.now()),
          description: "",
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
    });
  };

  const handleRemoveLineItem = (id: string) => {
    if (formData.lineItems.length === 1) {
      toast.error("Invoice must have at least one line item");
      return;
    }
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((item) => item.id !== id),
    });
  };

  const handleLineItemChange = (
    id: string,
    field: keyof InvoiceLineItem,
    value: any
  ) => {
    const updatedItems = formData.lineItems.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.total =
            (parseFloat(String(item.quantity)) || 0) *
            (parseFloat(String(item.unitPrice)) || 0);
        }
        return updated;
      }
      return item;
    });
    setFormData({ ...formData, lineItems: updatedItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.lineItems.some((item) => !item.description || item.total === 0)) {
      toast.error("Please fill all line items with valid amounts");
      return;
    }

    setIsSubmitting(true);
    try {
      const newInvoice: Invoice = {
        id: String(Date.now()),
        invoiceNumber: `ZRP-2025-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        tenantId: formData.tenantId,
        tenantName: selectedTenant.name,
        tenantVertical: selectedTenant.vertical as any,
        subtotal: subtotal,
        taxAmount,
        total,
        taxRate: 15,
        status: "DRAFT",
        type: formData.invoiceType,
        lineItems: formData.lineItems,
        currency: "ZAR",
        issuedDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      toast.success(`Draft invoice ${newInvoice.invoiceNumber} created`);
      onSuccess?.(newInvoice);
    } catch (error) {
      toast.error("Failed to create invoice");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mockInvoice: Invoice = {
    id: "preview",
    invoiceNumber: "ZRP-2025-0000",
    tenantId: formData.tenantId,
    tenantName: selectedTenant.name,
    tenantVertical: selectedTenant.vertical as any,
    amount: subtotal,
    taxAmount,
    total,
    status: "DRAFT",
    type: formData.invoiceType,
    lineItems: formData.lineItems,
    currency: "ZAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
      {/* Left - Form (2 cols) */}
      <div className="col-span-2 space-y-4">
        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Client</label>
          <select
            value={formData.tenantId}
            onChange={(e) =>
              setFormData({ ...formData, tenantId: e.target.value })
            }
            className="w-full px-3 py-2 border border-border rounded-[8px] text-sm bg-background"
          >
            {TENANTS.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>

        {/* Invoice Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Invoice Type</label>
          <select
            value={formData.invoiceType}
            onChange={(e) =>
              setFormData({
                ...formData,
                invoiceType: e.target.value as InvoiceType,
              })
            }
            className="w-full px-3 py-2 border border-border rounded-[8px] text-sm bg-background"
          >
            {INVOICE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <p className="text-xs text-muted-fg font-semibold uppercase">
            Quick Presets
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddPreset("setup")}
            >
              Setup Charges
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddPreset("subscription")}
            >
              Subscription
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddPreset("basic")}
            >
              Services
            </Button>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Line Items</label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddLineItem}
              className="gap-1"
            >
              <Plus size={14} />
              Add Item
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {formData.lineItems.map((item, idx) => (
              <div
                key={item.id}
                className="border border-border rounded-[8px] p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) =>
                      handleLineItemChange(
                        item.id,
                        "description",
                        e.target.value
                      )
                    }
                    className="flex-1 px-2 py-1.5 border border-border rounded-[6px] text-sm bg-background"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLineItem(item.id)}
                    className="text-muted-fg hover:text-danger"
                  >
                    <X size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-muted-fg mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleLineItemChange(
                          item.id,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1.5 border border-border rounded-[6px] bg-background"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-muted-fg mb-1">Unit Price</label>
                    <div className="flex items-center">
                      <span className="text-muted-fg px-2">R</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleLineItemChange(
                            item.id,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="flex-1 px-2 py-1.5 border border-border rounded-[6px] bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-muted-fg mb-1">Total</label>
                    <div className="px-2 py-1.5 bg-muted rounded-[6px] font-mono text-foreground">
                      R{item.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-border pt-4 space-y-2 text-sm">
          <div className="flex justify-end gap-4">
            <span className="text-muted-fg">Subtotal:</span>
            <span className="font-mono w-24 text-right">
              <CurrencyDisplay amount={subtotal} />
            </span>
          </div>
          <div className="flex justify-end gap-4">
            <span className="text-muted-fg">VAT (15%):</span>
            <span className="font-mono w-24 text-right">
              <CurrencyDisplay amount={taxAmount} />
            </span>
          </div>
          <div className="flex justify-end gap-4 border-t border-border pt-2 font-semibold text-base">
            <span>Total:</span>
            <span className="font-mono w-24 text-right">
              <CurrencyDisplay amount={total} />
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Creating..." : "Create Draft Invoice"}
          </Button>
        </div>
      </div>

      {/* Right - Preview (1 col) */}
      <div className="col-span-1">
        <div className="rounded-[12px] border border-border p-3 h-fit sticky top-24">
          <p className="text-xs text-muted-fg font-semibold uppercase mb-3">
            Preview
          </p>
          <InvoicePreview
            invoice={mockInvoice}
            className="max-w-full scale-75 origin-top"
          />
        </div>
      </div>
    </form>
  );
}
