"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { createCompany } from "@/lib/api/companies";
import { ApiError } from "@/lib/api/client";

export default function OnboardingPage() {
  const { user, isLoading, isAuthenticated, setCompany } = useAuth();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createCompany(companyName.trim());
      setCompany({ id: res.id, name: res.name, slug: res.slug });
      toast.success(`Company "${res.name}" created!`);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to create company";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-muted-fg text-sm">Loading…</div>
      </div>
    );
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
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-[10px] bg-surface border border-border flex items-center justify-center">
              <Building2 size={22} className="text-primary" />
            </div>
            <div className="text-center">
              <h1 className="section-title">Set up your company</h1>
              <p className="text-sm text-muted-fg mt-1">
                Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}. Create your company to get started.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="e.g. Apollo Holdings"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting || !companyName.trim()}
            >
              {submitting ? "Creating…" : "Create Company & Continue"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-fg">
          Step 2 of 2 — You can add team members from the HR page after setup.
        </p>
      </div>
    </div>
  );
}
