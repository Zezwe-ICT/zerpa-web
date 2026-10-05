/**
 * @file components/modules/crm/customer-privacy.tsx
 * @description Answer a customer's POPIA request: download everything held about them, or erase their
 * personal details (tax records keep the name and VAT number, as the law requires).
 */
"use client";

import { useState } from "react";
import { Download, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import HoldButton from "@/components/kokonutui/hold-button";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiError } from "@/lib/api/client";
import { downloadFromApi } from "@/lib/api/account";

export function CustomerPrivacy({ id, name, onErased }: { id: string; name: string; onErased: () => void }) {
  const [open, setOpen] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function exportData() {
    try {
      await downloadFromApi(`/crm/accounts/${id}/personal-data`, `personal-data-${name.replace(/\W+/g, "-").toLowerCase()}.json`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }

  async function erase() {
    setBusy(true);
    try {
      const res = await apiRequest<{ removed: { people: number; messagesRedacted: number }; reviewThese: Record<string, number> }>(
        `/crm/accounts/${id}/erase`,
        { method: "POST", body: { confirmName: confirm } },
      );
      const others = Object.entries(res.reviewThese).map(([k, n]) => `${n} ${k}`).join(", ");
      toast.success(
        `Personal details erased (${res.removed.people} people, ${res.removed.messagesRedacted} messages).` +
          (others ? ` Check these too: ${others}.` : ""),
      );
      setOpen(false);
      onErased();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not erase this customer");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} title="Privacy requests (POPIA)">
        <ShieldAlert size={14} className="mr-1.5" /> Privacy
      </Button>
    );
  }

  return (
    <div className="w-full basis-full rounded-[10px] border border-border bg-surface p-4 space-y-3 text-sm">
      <p className="font-medium">Privacy request from {name}</p>
      <p className="text-xs text-muted-fg">
        Under POPIA, customers can ask what you hold about them, or ask you to delete it. Invoices and quotes stay
        (SARS requires them for five years) but everything else personal is removed.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={exportData}>
          <Download size={14} className="mr-1.5" /> Download what we hold
        </Button>
        {!erasing && (
          <Button size="sm" variant="ghost" className="text-danger hover:text-danger hover:bg-danger-bg" onClick={() => setErasing(true)}>
            <Trash2 size={14} className="mr-1.5" /> Erase their details
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
      {erasing && (
        <div className="space-y-2 rounded-[8px] border border-danger-ring bg-danger-bg p-3">
          <p className="text-xs">
            Removes contact details, addresses, notes, their people, bank details and message contents. This can&apos;t be
            undone. Type <strong>{name}</strong> to confirm.
          </p>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={name} aria-label="Type the customer name" />
          <div className="flex gap-2">
            <HoldButton
              disabled={busy || confirm.trim().toLowerCase() !== name.trim().toLowerCase()}
              onComplete={erase}
              label={busy ? "Erasing…" : "Hold to erase details"}
            />
            <Button size="sm" variant="ghost" onClick={() => setErasing(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
