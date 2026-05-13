/**
 * @file components/modules/billing/send-invoice-modal.tsx
 * @description Modal dialog for sending an invoice to a client. Pre-fills the
 * recipient email, allows adding a custom message and calls sendInvoice() on submit.
 */
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Invoice } from "@zerpa/shared-types";
import { sendInvoice } from "@/lib/data/invoices";

interface SendInvoiceModalProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}

const DEFAULT_EMAIL_TEMPLATE = (invoice: Invoice, clientEmail: string) => `Dear ${invoice.tenantName},

Please find attached invoice ${invoice.invoiceNumber} for ${new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
}).format(invoice.total || 0)} (incl. 15% VAT), due on ${invoice.dueDate}.

Payment Details:
  Bank:      FNB
  Account:   62 800 123 456
  Branch:    250 655
  Reference: ${invoice.invoiceNumber}  ← Please use this as your payment reference

If you have any queries, please contact us at billing@zerpa.co.za or call 011 888 0000.

Kind regards,
Zerpa ICT Billing Team`;

export function SendInvoiceModal({
  invoice,
  open,
  onOpenChange,
  onSent,
}: SendInvoiceModalProps) {
  const [toEmail, setToEmail] = useState("billing@client.co.za");
  const [ccEmail, setCcEmail] = useState("billing@zerpa.co.za");
  const [subject, setSubject] = useState(
    `Invoice ${invoice.invoiceNumber} from Zerpa ICT — Due ${invoice.dueDate}`
  );
  const [body, setBody] = useState(DEFAULT_EMAIL_TEMPLATE(invoice, "billing@client.co.za"));
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!toEmail) {
      toast.error("Please enter a recipient email");
      return;
    }

    setSending(true);
    try {
      await sendInvoice(invoice.id, toEmail);
      toast.success(`Invoice sent to ${toEmail}`);
      onOpenChange(false);
      onSent?.();
    } catch (error) {
      toast.error("Failed to send invoice. Please try again.");
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

