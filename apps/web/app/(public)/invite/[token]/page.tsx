"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInvite, getPublicInvite, type PublicInvite } from "@/lib/api/onboarding";
import { setRefreshToken, setToken, resetAuthInvalidLatch, ApiError } from "@/lib/api/client";
import { ZerpaLogo } from "@/components/brand/zerpa-logo";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<PublicInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    getPublicInvite(token)
      .then((info) => {
        setInvite(info);
        setFullName(info.fullName || "");
        if (info.status !== "pending") {
          setError(`This invite is ${info.status}. Ask your admin for a new one.`);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "This invite link is not valid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invite || !token) return;
    if (!invite.accountExists) {
      if (password.length < 8) return toast.error("Use at least 8 characters for your password");
      if (password !== confirm) return toast.error("Passwords do not match");
      if (!acceptTerms) return toast.error("Accept the terms to continue");
      if (!fullName.trim()) return toast.error("Enter your full name");
    } else if (!password) {
      return toast.error("Enter your existing Zerpa password");
    }

    setLoading(true);
    try {
      resetAuthInvalidLatch();
      const res = await acceptInvite(token, {
        password,
        fullName: fullName.trim() || undefined,
        acceptTerms: invite.accountExists ? undefined : true,
      });
      setToken(res.token);
      setRefreshToken(res.refreshToken);
      localStorage.setItem("zerpa_user", JSON.stringify(res.user));
      const companies = res.companies?.length ? res.companies : res.company ? [res.company] : [];
      if (companies.length) {
        localStorage.setItem("zerpa_companies", JSON.stringify(companies));
        localStorage.setItem("zerpa_company", JSON.stringify(companies[0]));
      }
      toast.success(`Welcome to ${invite.companyName}`);
      // Full reload so AuthProvider hydrates the new session cleanly.
      window.location.assign("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not accept invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <ZerpaLogo className="h-12" />
        </div>

        <div className="rounded-[12px] border border-border bg-background p-8 space-y-5">
          {!invite && !error && <p className="text-sm text-muted-fg">Checking invite…</p>}
          {error && (
            <div className="space-y-3">
              <h1 className="text-xl font-bold">Invite unavailable</h1>
              <p className="text-sm text-muted-fg">{error}</p>
              <Button asChild variant="outline">
                <Link href="/login">Go to sign in</Link>
              </Button>
            </div>
          )}
          {invite && !error && (
            <>
              <div className="space-y-2">
                <h1 className="text-xl font-bold">Join {invite.companyName}</h1>
                <p className="text-sm text-muted-fg">
                  {invite.invitedBy ? `${invite.invitedBy} invited you` : "You were invited"} as{" "}
                  <strong>{invite.roleLabel}</strong> ({invite.email}).
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!invite.accountExists && (
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Your full name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="password">
                    {invite.accountExists ? "Your existing Zerpa password" : "Create a password"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={invite.accountExists ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {!invite.accountExists && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm">Confirm password</Label>
                      <Input
                        id="confirm"
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                      />
                    </div>
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                      />
                      <span>I agree to Zerpa&apos;s terms of use and privacy notice (POPIA).</span>
                    </label>
                  </>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Joining…" : "Join workspace"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
