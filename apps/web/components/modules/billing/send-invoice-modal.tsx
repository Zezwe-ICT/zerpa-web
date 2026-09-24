/**
 * @file components/modules/billing/send-invoice-modal.tsx
 * @description Modal dialog for sending an invoice to a client. Pre-fills the
 * recipient email, allows adding a custom message and calls sendInvoice() on submit.
 */
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BillingSettings, Invoice } from "@zerpa/shared-types";
import { useAuth } from "@/lib/auth/context";
import { getBillingSettings } from "@/lib/data/billing-settings";
import { updateBillingInvoiceStatus } from "@/lib/data/invoices";
import { createPayLink } from "@/lib/api/payments";
import { apiRequest } from "@/lib/api/client";

interface SendInvoiceModalProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}

const PAY_LINK = "{pay_link}";

/** Uses the business's own bank details — never hardcode one company's account into every email. */
const DEFAULT_EMAIL_TEMPLATE = (invoice: Invoice, settings: BillingSettings | null, companyName: string) => {
  const bank = settings?.bankAccountNumber
    ? `
Or pay by EFT:
  Bank:      ${settings.bankName ?? ""}
  Account:   ${settings.bankAccountNumber}${settings.accountHolder ? `\n  Holder:    ${settings.accountHolder}` : ""}
  Branch:    ${settings.bankBranchCode ?? ""}
  Reference: ${invoice.invoiceNumber}  ← please use this as your payment reference
`
    : "";
  const contact = settings?.proofOfPaymentEmail ? `\nPlease send proof of payment to ${settings.proofOfPaymentEmail}.\n` : "";
  return `Dear ${invoice.tenantName},

Please find invoice ${invoice.invoiceNumber} for ${new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(invoice.balanceDue ?? invoice.total ?? 0)}, due on ${invoice.dueDate}.

Pay online (card or instant EFT): ${PAY_LINK}
${bank}${contact}
Kind regards,
${companyName}`;
};

export function SendInvoiceModal({
  invoice,
  open,
  onOpenChange,
  onSent,
}: SendInvoiceModalProps) {
  const { company } = useAuth();
  const [toEmail, setToEmail] = useState(invoice.contactEmail ?? "");
  const [ccEmail, setCcEmail] = useState("");
  const [subject, setSubject] = useState(
    `Invoice ${invoice.invoiceNumber} from ${company?.name ?? "Zerpa"} — Due ${invoice.dueDate}`
  );
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const name = company?.name ?? "";
    setBody(DEFAULT_EMAIL_TEMPLATE(invoice, null, name));
    getBillingSettings()
      .then((settings) => setBody(DEFAULT_EMAIL_TEMPLATE(invoice, settings, settings.companyName || name)))
      .catch(() => undefined);
  }, [open, invoice, company?.name]);

  const handleSend = async () => {
    if (!toEmail) {
      toast.error("Please enter a recipient email");
      return;
    }

    setSending(true);
    try {
      let message = body;
      if (message.includes(PAY_LINK)) {
        // A pay link needs an approved invoice; approving here is what "send" implies anyway.
        if (invoice.status === "DRAFT") await updateBillingInvoiceStatus(invoice.id, "APPROVED");
        const { payUrl } = await createPayLink(invoice.id);
        message = message.split(PAY_LINK).join(payUrl);
      }
      const result = await apiRequest<{ emailDelivery?: { status: string; note?: string } }>(
        `/billing/invoices/${invoice.id}/email`,
        { method: "POST", body: { to: toEmail, cc: ccEmail || undefined, subject, message } },
      );
      if (result.emailDelivery?.status === "failed") {
        throw new Error(result.emailDelivery.note || "The email did not leave Zerpa.");
      }
      toast.success(
        result.emailDelivery?.status === "queued"
          ? `Invoice queued for ${toEmail}`
          : `Invoice sent to ${toEmail}`,
      );
      onOpenChange(false);
      onSent?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invoice. Please try again.");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Invoice {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>Review and edit the email before sending.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="to-email">To</Label>
            <Input
              id="to-email"
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="client@example.co.za"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cc-email">CC</Label>
            <Input
              id="cc-email"
              type="email"
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <p className="text-xs text-muted-fg">
              {PAY_LINK} is replaced with this invoice&apos;s secure payment link when you send.
            </p>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Send size={14} className="mr-1.5" />
            )}
            {sending ? "Sending..." : "Send Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

