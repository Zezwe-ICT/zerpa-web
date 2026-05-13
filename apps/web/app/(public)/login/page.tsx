/**
 * @file app/(public)/login/page.tsx
 * @description
 * Login page component for user authentication
 *
 * Purpose:
 * Allow existing users to sign in with email and password.
 * Part of the public route group (no auth required to view this page).
 *
 * Flow:
 * 1. User navigates to /login
 * 2. User enters email and password
 * 3. Form submits to signIn() context function
 * 4. signIn() calls backend /auth/sign-in endpoint
 * 5. Backend validates credentials and returns token + companies
 * 6. signIn() routes based on company count:
 *    - 0 companies: /onboarding (create first company)
 *    - 1 company: /dashboard (auto-select)
 *    - 2+ companies: /select-company (user chooses)
 *
 * Error Handling:
 * - Invalid email/password: Shows error toast
 * - Network errors: Shows network error toast
 * - Validation errors: Shows field-specific error from backend
 *
 * UI Components:
 * - ZERPA logo (Z badge + text)
 * - Form with email and password inputs
 * - Submit button with loading state
 * - Link to registration page (for new users)
 *
 * Styling:
 * - Full-screen centered layout
 * - Uses design system variables (bg-surface, bg-background, text-primary-fg)
 * - Responsive responsive (w-full max-w-md)
 * - Accessible (labels, autocomplete, required fields)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/client";

/**
 * Component: LoginPage
 * 
 * Purpose:
 * User sign-in form with email/password authentication
 *
 * State:
 * - email: Form input value
 * - password: Form input value
 * - isLoading: Disable submission and show spinner during request
 *
 * Functions:
 * - handleSubmit: Process form submission, call signIn() context
 *
 * Key Logic:
 * - Prevents default form submission
 * - Calls context.signIn() which handles routing
 * - Catches and displays errors to user
 * - Finally block ensures loading state clears
 *
 * @component
 * @returns {React.ReactElement} - Full-page login form
 */
export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Function: handleSubmit
   * 
   * Purpose:
   * Process login form submission
   *
   * Flow:
   * 1. Prevent default form submission
   * 2. Set loading state (disable button, show spinner)
   * 3. Call context.signIn() with credentials
   * 4. If successful, signIn() handles routing (no code needed here)
   * 5. If error, catch and display toast message
   * 6. Finally, clear loading state
   *
   * Error Handling:
   * - ApiError: Display error.message (from backend)
   * - Other errors: Display generic "Something went wrong"
   *
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Call context function which handles auth + routing
      await signIn({ email, password });
    } catch (err) {
      // Display error to user
      const message =
        err instanceof ApiError ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      // Clear loading state
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md space-y-8">
        {/* Logo header */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3">
            {/* Branding badge with Z icon */}
            <div className="w-10 h-10 rounded-[8px] bg-primary text-primary-fg flex items-center justify-center font-bold text-xl">
              Z
            </div>
            <span className="font-display text-xl font-normal">Zerpa</span>
          </div>
        </div>

        {/* Main form card */}
        <div className="bg-background rounded-[12px] border border-border p-8 space-y-6">
          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted-fg">Sign in to your Zerpa account</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
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

            {/* Password input */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Submit button with loading state */}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>

        {/* Sign up link footer */}
        <p className="text-center text-xs text-muted-fg">
          Don't have an account?{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-primary hover:underline font-medium"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
