/**
 * @file components/layouts/verify-email-banner.tsx
 * @description Shown until the signed-in person confirms their email. Sending quotes, invoices and payment
 * links to customers is blocked by the API until then. Checks the server once per page load, so a
 * confirmation in another tab is picked up.
 */
"use client";

import { useEffect, useState } from "react";
import { MailWarning } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import { getSession, resendVerification } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";

export function VerifyEmailBanner() {
  const { user, updateUser } = useAuth();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user || user.emailVerified !== false) return;
    getSession()
      .then((s) => s.emailVerified && updateUser({ emailVerified: true }))
      .catch(() => undefined);
  }, [user, updateUser]);

  // Older sessions don't carry the flag; the API still enforces verification where it matters.
  if (!user || user.emailVerified !== false) return null;

  async function resend() {
    setSending(true);
    try {
      const res = await resendVerification();
      if (res.alreadyVerified) {
        updateUser({ emailVerified: true });
        toast.success("Your email is already confirmed.");
      } else {
        toast.success(res.message ?? "We sent you a new link.");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send the link. Try again in a minute.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-warning-ring bg-warning-bg px-6 py-2.5 text-sm text-warning" role="status">
      <MailWarning size={16} className="shrink-0" />
      <span className="flex-1 min-w-[16rem]">
        Confirm your email ({user.email}) to send quotes, invoices and payment links to customers. Check your inbox for our
        link.
      </span>
      <button type="button" onClick={resend} disabled={sending} className="font-medium underline disabled:opacity-60">
        {sending ? "Sending…" : "Resend the link"}
      </button>
    </div>
  );
}
