/**
 * @file app/(public)/forgot-password/page.tsx
 * @description Ask for a password reset link. The answer is the same whether or not the email has an
 * account, so this page can't be used to find out who uses Zerpa.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountShell } from "@/components/auth/account-shell";
import { isEmail } from "@/components/auth/onboarding-ui";
import { requestPasswordReset } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) {
      setError("Enter the email you sign in with, e.g. you@business.co.za.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await requestPasswordReset(email.trim().toLowerCase());
      setSent(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <AccountShell title="Check your email">
        <div className="flex gap-3 rounded-[10px] border border-border bg-surface p-4 text-sm">
          <MailCheck size={18} className="shrink-0 text-primary" />
          <p>{sent}</p>
        </div>
        <p className="text-xs text-muted-fg">
          Nothing arrived after a few minutes? Check your spam folder, or make sure you used the email you sign in with.
        </p>
        <Link href="/login" className="block text-center text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </AccountShell>
    );
  }

  return (
    <AccountShell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.co.za"
          />
          {error && <p className="text-xs text-danger" role="alert">{error}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <Link href="/login" className="block text-center text-sm text-muted-fg hover:text-foreground">
        Back to sign in
      </Link>
    </AccountShell>
  );
}
