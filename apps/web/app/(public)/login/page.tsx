"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/client";

type Mode = "signin" | "register";

export default function LoginPage() {
  const { signIn, register } = useAuth();
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === "register") {
        await register({ email, fullName, password });
        toast.success("Account created — let's set up your company.");
        window.location.href = "/onboarding";
      } else {
        await signIn({ email, password });
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-primary text-primary-fg flex items-center justify-center font-bold text-xl">
              Z
            </div>
            <span className="font-display text-xl font-normal">Zerpa</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-background rounded-[12px] border border-border p-8 space-y-6">
          {/* Mode toggle */}
          <div className="flex rounded-[8px] border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "register"
                  ? "bg-primary text-primary-fg"
                  : "text-muted-fg hover:text-foreground"
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "bg-primary text-primary-fg"
                  : "text-muted-fg hover:text-foreground"
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading
                ? mode === "register" ? "Creating account…" : "Signing in…"
                : mode === "register" ? "Create Account" : "Sign In"}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
