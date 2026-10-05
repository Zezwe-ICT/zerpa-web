"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Clock, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, JourneySteps, errorRing, focusFirstError, isEmail, isSaPhone } from "@/components/auth/onboarding-ui";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { ZerpaLogo } from "@/components/brand/zerpa-logo";
import { OfferNotice } from "@/components/auth/offer-notice";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "One capital letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw: string) => /[0-9]/.test(pw) },
];

type FieldKey = "fullName" | "email" | "phone" | "password" | "confirm" | "acceptTerms";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [emailTaken, setEmailTaken] = useState(false);

  const errors: Record<FieldKey, string | null> = {
    fullName: fullName.trim().length < 2 ? "Enter your first and last name." : null,
    email: !email.trim()
      ? "Enter the email you'll sign in with."
      : !isEmail(email)
        ? "That doesn't look like a valid email, e.g. you@business.co.za."
        : emailTaken
          ? "An account with this email already exists."
          : null,
    phone: phone.trim() && !isSaPhone(phone) ? "Use a South African number, e.g. 082 123 4567." : null,
    password: PASSWORD_RULES.every((r) => r.test(password)) ? null : "Your password doesn't meet all the rules below.",
    confirm: !confirm ? "Type your password again." : confirm !== password ? "Passwords do not match." : null,
    acceptTerms: acceptTerms ? null : "You need to accept the terms to create an account.",
  };
  const show = (k: FieldKey) => (touched[k] ? errors[k] : null);
  const touch = (k: FieldKey) => setTouched((t) => ({ ...t, [k]: true }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setTouched({ fullName: true, email: true, phone: true, password: true, confirm: true, acceptTerms: true });
    if (Object.values(errors).some(Boolean)) {
      focusFirstError(errors);
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        acceptTerms: true,
        marketingOptIn,
      });
      toast.success("Your login is ready. Next, tell us about your business.");
      router.push("/onboarding");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEmailTaken(true);
        document.getElementById("email")?.focus();
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <ZerpaLogo className="h-12" />
        </div>

        <div className="bg-background rounded-[12px] border border-border p-6 sm:p-8 space-y-6">
          <JourneySteps current={0} />

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Create your Zerpa account</h1>
            <p className="text-sm text-muted-fg">
              First we set up your personal login. Then we&apos;ll walk you through your business details and
              workspace, one short screen at a time.
            </p>
          </div>

          <OfferNotice />

          <div className="rounded-[10px] border border-border bg-surface p-4 text-sm space-y-2">
            <p className="flex items-center gap-2 font-medium">
              <Clock size={14} className="text-primary" /> Takes about 5 minutes. Have these handy:
            </p>
            <ul className="list-disc pl-5 text-muted-fg space-y-0.5 text-xs">
              <li>Your business&apos;s trading name and contact details</li>
              <li>The address you put on invoices</li>
              <li>VAT and CIPC numbers, if you have them (you can add them later)</li>
              <li>Email addresses of anyone you want to invite (also optional)</li>
            </ul>
            <p className="text-xs text-muted-fg">Your progress is saved as you go, so you can stop and come back.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field id="fullName" label="Your full name" required error={show("fullName")}>
              <Input
                id="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => touch("fullName")}
                placeholder="e.g. Thandi Nkosi"
                aria-invalid={!!show("fullName")}
                className={errorRing(!!show("fullName"))}
              />
            </Field>

            <Field
              id="email"
              label="Email address"
              required
              hint="You'll use this to sign in. Pick one you check every day."
              why="We send password resets, invoices from Zerpa and team invites to this address."
              error={show("email")}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailTaken(false);
                }}
                onBlur={() => touch("email")}
                placeholder="you@yourbusiness.co.za"
                aria-invalid={!!show("email")}
                className={errorRing(!!show("email"))}
              />
            </Field>
            {emailTaken && (
              <p className="-mt-2 text-xs">
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in instead
                </Link>{" "}
                <span className="text-muted-fg">or use a different email.</span>
              </p>
            )}

            <Field
              id="phone"
              label="Mobile number"
              hint="Helps us reach you if there's a problem with your account."
              error={show("phone")}
            >
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => touch("phone")}
                placeholder="082 123 4567"
                aria-invalid={!!show("phone")}
                className={errorRing(!!show("phone"))}
              />
            </Field>

            <Field id="password" label="Choose a password" required error={show("password")}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch("password")}
                  placeholder="••••••••"
                  aria-invalid={!!show("password")}
                  className={cn("pr-10", errorRing(!!show("password")))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-fg hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <ul className="-mt-2 grid gap-1 sm:grid-cols-3 text-xs">
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

            <Field id="confirm" label="Confirm password" required error={show("confirm")}>
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (e.target.value.length >= password.length) touch("confirm");
                }}
                onBlur={() => touch("confirm")}
                placeholder="••••••••"
                aria-invalid={!!show("confirm")}
                className={errorRing(!!show("confirm"))}
              />
            </Field>

            <div className="space-y-3 border-t border-border pt-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  className="mt-1"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    touch("acceptTerms");
                  }}
                />
                <span>
                  I agree to Zerpa&apos;s{" "}
                  <a href="/terms" target="_blank" rel="noreferrer" className="text-primary underline">
                    terms of use
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="text-primary underline">
                    privacy notice
                  </a>
                  .{" "}
                  <span className="text-muted-fg">
                    We process your data in line with POPIA and never sell it.
                  </span>
                </span>
              </label>
              {show("acceptTerms") && <p className="text-xs text-danger -mt-1 pl-7">{show("acceptTerms")}</p>}

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                />
                <span className="text-muted-fg">
                  Send me product tips and South African industry updates. You can unsubscribe any time.
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating your login…" : "Create login and continue"}
            </Button>
            <p className="text-center text-xs text-muted-fg">
              Next: tell us about your business (step 2 of 6).
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-muted-fg">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
          {" · "}
          Joining a colleague&apos;s team? Use the link in your invite email.
        </p>
      </div>
    </div>
  );
}
