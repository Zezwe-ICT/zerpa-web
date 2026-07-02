/**
 * @file components/modules/billing/document-preview-modal.tsx
 * @description Full-screen preview of a billing document (invoice/quote) with a
 * "Print / Save as PDF" action. Printing toggles `printing-document` on <body>
 * so the global print CSS isolates #billing-print-root, letting the browser's
 * native print-to-PDF produce a clean A4 document without the app chrome.
 */
"use client";

import { useEffect, useState } from "react";
import { X, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { BillingDocument } from "./billing-document";
import { getBillingSettings } from "@/lib/data/billing-settings";
import { getBillingCustomerById } from "@/lib/data/billing-customers";
import type {
  BillingCustomer,
  BillingSettings,
  Invoice,
  Quote,
} from "@zerpa/shared-types";

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  kind: "invoice" | "quote";
  invoice?: Invoice;
  quote?: Quote;
}

export function DocumentPreviewModal({
  open,
  onClose,
  kind,
  invoice,
  quote,
}: DocumentPreviewModalProps) {
  const { company } = useAuth();
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [customer, setCustomer] = useState<BillingCustomer | null>(null);

  const customerId = kind === "quote" ? quote?.customerId : invoice?.tenantId;

  useEffect(() => {
    if (!open) return;
    getBillingSettings().then(setSettings);
    if (customerId) {
      getBillingCustomerById(customerId, company?.id)
        .then(setCustomer)
        .catch(() => setCustomer(null));
    }
  }, [open, customerId, company?.id]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handlePrint() {
    document.body.classList.add("printing-document");
    const cleanup = () => {
      document.body.classList.remove("printing-document");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    // Fallback cleanup in case afterprint doesn't fire.
    setTimeout(cleanup, 1000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40">
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between px-4 py-3 bg-background border-b border-border">
        <span className="text-sm font-medium text-foreground">
          {kind === "quote" ? "Quote" : "Invoice"} preview
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handlePrint} disabled={!settings}>
            {!settings ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Printer size={14} className="mr-1.5" />
            )}
            Print / Save as PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X size={14} className="mr-1.5" />
            Close
          </Button>
        </div>
      </div>

      {/* Scrollable document area */}
      <div className="flex-1 overflow-auto py-8 px-4">
        {settings ? (
          <div className="shadow-xl mx-auto w-fit">
            <BillingDocument
              kind={kind}
              invoice={invoice}
              quote={quote}
              settings={settings}
              customer={customer}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-white">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
