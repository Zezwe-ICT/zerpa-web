/**
 * @file app/(public)/reset-password/page.tsx
 * @description Choose a new password from the emailed link (?uid=&token=). The link works once, for an hour.
 * Afterwards every other signed-in device is signed out.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountShell } from "@/components/auth/account-shell";
import { confirmPasswordReset, PASSWORD_RULES } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [params, setParams] = useState<{ uid: string; token: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams({ uid: q.get("uid") ?? "", token: q.get("token") ?? "" });
  }, []);

  const strong = PASSWORD_RULES.every((r) => r.test(password));
  const linkMissing = params && (!params.uid || !params.token);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!params) return;
    if (!strong) return setError("Your new password doesn't meet all the rules below.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    setError(null);
    try {
      const res = await confirmPasswordReset(params.uid, params.token, password);
      toast.success(res.message);
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (linkMissing) {
    return (
      <AccountShell title="This link is incomplete" subtitle="Open the link from your email again, or ask for a new one.">
        <Button asChild className="w-full">
          <Link href="/forgot-password">Send a new reset link</Link>
        </Button>
      </AccountShell>
    );
  }

  return (
    <AccountShell title="Choose a new password" subtitle="You'll be signed out on other devices once it's changed.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-fg hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <ul className="grid gap-1 sm:grid-cols-3 text-xs pt-1">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
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
          <Label htmlFor="confirm">Type it again</Label>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}{" "}
            {/expired|already used/.test(error) && (
              <Link href="/forgot-password" className="underline">
                Send a new link
              </Link>
            )}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={busy || !params}>
          {busy ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AccountShell>
  );
}
