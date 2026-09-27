/**
 * @file components/modules/settings/your-data-settings.tsx
 * @description POPIA rights for your own login: download a copy of your data, or delete your account.
 */
"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import HoldButton from "@/components/kokonutui/hold-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { deleteMyAccount, downloadFromApi, getMfaStatus } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";

export function YourDataSettings() {
  const { signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    try {
      await downloadFromApi("/auth/my-data", "my-zerpa-data.json");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  }

  async function startDelete() {
    setDeleting(true);
    setError(null);
    getMfaStatus()
      .then((s) => setNeedsCode(s.enabled))
      .catch(() => setNeedsCode(false));
  }

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteMyAccount(password, needsCode ? code : undefined);
      toast.success("Your account was deleted.");
      signOut();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[12px] border border-border bg-background p-5 space-y-4">
      <div>
        <h2 className="section-title">Your data</h2>
        <p className="text-sm text-muted-fg mt-1">
          Your rights under POPIA. Your business&apos;s records are exported from Settings → Data &amp; Exports.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={download}>
          <Download size={14} className="mr-1.5" /> Download my data
        </Button>
        {!deleting && (
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger-bg" onClick={startDelete}>
            <Trash2 size={14} className="mr-1.5" /> Delete my account
          </Button>
        )}
      </div>

      {deleting && (
        <div className="space-y-3 rounded-[10px] border border-danger-ring bg-danger-bg p-4">
          <p className="text-sm">
            This closes your login and removes your name, email and phone number. It can&apos;t be undone. Records you
            created for a business (like invoices) stay with that business. If you&apos;re the only owner of a business,
            make someone else an owner first.
          </p>
          <div className="space-y-1.5 max-w-xs">
            <Label htmlFor="deletePassword">Your password</Label>
            <Input
              id="deletePassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {needsCode && (
            <div className="space-y-1.5 max-w-xs">
              <Label htmlFor="deleteCode">Code from your authenticator app</Label>
              <Input id="deleteCode" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.trim())} />
            </div>
          )}
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <div className="flex gap-2">
            <HoldButton
              onComplete={confirmDelete}
              disabled={busy || !password || (needsCode && code.length < 6)}
              label={busy ? "Deleting…" : "Hold to delete my account"}
            />
            <Button variant="ghost" onClick={() => setDeleting(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
