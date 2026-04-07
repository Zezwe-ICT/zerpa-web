"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import type { Invoice } from "@zerpa/shared-types";

interface VoidInvoiceDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function VoidInvoiceDialog({
  invoice,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: VoidInvoiceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[400px]">
        <AlertDialogHeader className="gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-danger" />
            <AlertDialogTitle>Void Invoice?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to void invoice{" "}
              <span className="font-semibold text-foreground">
                {invoice.invoiceNumber}
              </span>
              ?
            </p>
            <p className="text-xs text-muted-fg">
              This action cannot be undone. The invoice will be marked as void and
              no longer be available for payment.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-danger hover:bg-danger/90"
          >
            {isLoading ? "Voiding..." : "Void Invoice"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
