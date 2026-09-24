/**
 * @file app/(internal)/settings/account/page.tsx
 * @description Your own account: email status and change password. Changing the password keeps this
 * device signed in and signs out every other device.
 */
"use client";

import { useState } from "react";
import { Check, CheckCircle2, Eye, EyeOff, MailWarning, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { TwoStepSettings } from "@/components/modules/settings/two-step-settings";
import { changePassword, PASSWORD_RULES, resendVerification } from "@/lib/api/account";
import { ApiError, setRefreshToken, setToken } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function AccountSettingsPage() {
  const { user, updateUser } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const strong = PASSWORD_RULES.every((r) => r.test(next));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return setError("Enter your current password.");
    if (!strong) return setError("Your new password doesn't meet all the rules below.");
    if (next !== confirm) return setError("The two new passwords don't match.");
    setBusy(true);
    setError(null);
    try {
      const res = await changePassword(current, next);
      // Old sign-ins stop working, so keep this device on the fresh one.
      setToken(res.token);
      setRefreshToken(res.refreshToken);
      updateUser(res.user);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Your account" subtitle="Your sign-in details. These are just for you, not the whole business." />

      <div className="max-w-xl space-y-6">
        <section className="rounded-[12px] border border-border bg-background p-5 space-y-2">
          <h2 className="section-title">Sign-in email</h2>
          <p className="text-sm">
            {user?.fullName} · <span className="font-mono">{user?.email}</span>
          </p>
          {user?.emailVerified === false ? (
            <p className="flex flex-wrap items-center gap-2 text-sm text-warning">
              <MailWarning size={14} /> Not confirmed yet.
              <button
                type="button"
                className="underline"
                onClick={() =>
                  resendVerification()
                    .then((r) => toast.success(r.message ?? "Link sent"))
                    .catch((e) => toast.error(e instanceof ApiError ? e.message : "Could not send the link"))
                }
              >
                Resend the link
              </button>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 size={14} /> Confirmed
            </p>
          )}
        </section>

        <TwoStepSettings />

        <form onSubmit={submit} className="rounded-[12px] border border-border bg-background p-5 space-y-4" noValidate>
          <div>
            <h2 className="section-title">Change password</h2>
            <p className="text-sm text-muted-fg mt-1">You stay signed in here. Every other device will be signed out.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new">New password</Label>
            <div className="relative">
              <Input
                id="new"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-fg hover:text-foreground"
                aria-label={show ? "Hide passwords" : "Show passwords"}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <ul className="grid gap-1 sm:grid-cols-3 text-xs pt-1">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(next);
                return (
                  <li key={rule.label} className={cn("flex items-center gap-1.5", ok ? "text-primary" : "text-muted-fg")}>
                    {ok ? <Check size={12} /> : <X size={12} />}
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Type the new password again</Label>
            <Input
              id="confirm"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Change password"}
          </Button>
        </form>
      </div>
    </PageContainer>
  );
}
