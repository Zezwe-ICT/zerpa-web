/**
 * @file app/(public)/verify-email/page.tsx
 * @description Landing page for the "Confirm your email" link (?token=). Works signed in or not.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountShell } from "@/components/auth/account-shell";
import { useAuth } from "@/lib/auth/context";
import { verifyEmail } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";

export default function VerifyEmailPage() {
  const { isAuthenticated, updateUser } = useAuth();
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!token) {
      setState({ ok: false, message: "This link is incomplete. Open it from your email again." });
      return;
    }
    verifyEmail(token)
      .then((res) => {
        updateUser({ emailVerified: true });
        setState({ ok: true, message: `${res.email} is confirmed. You can now send quotes, invoices and payment links.` });
      })
      .catch((err) =>
        setState({ ok: false, message: err instanceof ApiError ? err.message : "We couldn't confirm your email." }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state) {
    return (
      <AccountShell title="Confirming your email…">
        <p className="text-sm text-muted-fg">One moment.</p>
      </AccountShell>
    );
  }

  return (
    <AccountShell title={state.ok ? "Email confirmed" : "We couldn't confirm your email"}>
      <div className="flex gap-3 text-sm">
        {state.ok ? (
          <CheckCircle2 size={20} className="shrink-0 text-primary" />
        ) : (
          <XCircle size={20} className="shrink-0 text-danger" />
        )}
        <p>{state.message}</p>
      </div>
      {!state.ok && (
        <p className="text-xs text-muted-fg">
          Sign in and use &ldquo;Resend the link&rdquo; on the banner at the top of Zerpa to get a fresh one.
        </p>
      )}
      <Button asChild className="w-full">
        <Link href={isAuthenticated ? "/dashboard" : "/login"}>{isAuthenticated ? "Go to Zerpa" : "Sign in"}</Link>
      </Button>
    </AccountShell>
  );
}
