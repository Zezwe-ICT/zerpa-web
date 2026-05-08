"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Plus, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { createCompany } from "@/lib/api/companies";
import { ApiError } from "@/lib/api/client";

const VERTICALS = [
  { value: "FUNERAL", label: "Funeral Home" },
  { value: "AUTO", label: "Automotive / Car Dealership" },
  { value: "RESTAURANT", label: "Restaurant / Hospitality" },
  { value: "SPA", label: "Spa / Wellness" },
  { value: "OTHER", label: "Other" },
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1 – 10", sub: "Just me / small team" },
  { value: "11-50", label: "11 – 50", sub: "Growing team" },
  { value: "51-200", label: "51 – 200", sub: "Mid-size" },
  { value: "201-500", label: "201 – 500", sub: "Large" },
  { value: "500+", label: "500+", sub: "Enterprise" },
];

type Mode = "select" | "create";

export default function OnboardingPage() {
  const { user, companies, isLoading, isAuthenticated, setCompany, selectCompany } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("select");
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("");
  const [size, setSize] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // If user has no companies yet, go straight to the create form
  useEffect(() => {
    if (!isLoading && isAuthenticated && companies.length === 0) {
      setMode("create");
    }
  }, [isLoading, isAuthenticated, companies.length]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!vertical) { toast.error("Please select an industry."); return; }
    if (!size) { toast.error("Please select company size."); return; }
    setSubmitting(true);
    try {
      const res = await createCompany({ name: name.trim(), vertical, size, phone: phone.trim() || undefined });
      setCompany({ id: res.id, name: res.name, slug: res.slug });
      toast.success(`Company "${res.name}" created!`);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create company");
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
    <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-primary text-primary-fg flex items-center justify-center font-bold text-xl">
              Z
            </div>
            <span className="font-display text-xl font-normal">Zerpa</span>
          </div>
        </div>

        {/* ── SELECT MODE ─────────────────────────────────────── */}
        {mode === "select" && companies.length > 0 && (
          <div className="bg-background rounded-[12px] border border-border p-8 space-y-6">
            <div className="text-center">
              <h1 className="section-title">Your Companies</h1>
              <p className="text-sm text-muted-fg mt-1">
                Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}. Select a company or add a new one.
              </p>
            </div>

            <div className="space-y-3">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCompany(c.id)}
                  className="w-full flex items-center justify-between p-4 rounded-[10px] border border-border hover:border-primary hover:bg-surface transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] bg-surface border border-border flex items-center justify-center">
                      <Building2 size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      {c.vertical && (
                        <p className="text-xs text-muted-fg capitalize">
                          {c.vertical.replace("_", " ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-fg group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMode("create")}
              >
                <Plus size={16} className="mr-2" />
                Add New Company
              </Button>
            </div>
          </div>
        )}

        {/* ── CREATE MODE ─────────────────────────────────────── */}
        {mode === "create" && (
          <div className="bg-background rounded-[12px] border border-border p-8 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-[10px] bg-surface border border-border flex items-center justify-center">
                <Building2 size={22} className="text-primary" />
              </div>
              <div className="text-center">
                <h1 className="section-title">Set up your company</h1>
                <p className="text-sm text-muted-fg mt-1">
                  {companies.length > 0
                    ? "Add another company to your account."
                    : `Welcome${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}. Tell us about your business.`}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* Company Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Apollo Holdings"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Industry */}
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <div className="grid grid-cols-1 gap-2">
                  {VERTICALS.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setVertical(v.value)}
                      className={`flex items-center justify-between px-4 py-3 rounded-[8px] border text-sm transition-colors ${
                        vertical === v.value
                          ? "border-primary bg-primary/5 text-foreground font-medium"
                          : "border-border hover:border-primary/50 text-muted-fg hover:text-foreground"
                      }`}
                    >
                      <span>{v.label}</span>
                      {vertical === v.value && <Check size={14} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Size */}
              <div className="space-y-1.5">
                <Label>Number of Employees</Label>
                <div className="grid grid-cols-5 gap-2">
                  {COMPANY_SIZES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSize(s.value)}
                      className={`flex flex-col items-center justify-center px-2 py-3 rounded-[8px] border text-xs transition-colors ${
                        size === s.value
                          ? "border-primary bg-primary/5 text-foreground font-medium"
                          : "border-border hover:border-primary/50 text-muted-fg hover:text-foreground"
                      }`}
                    >
                      <span className="font-semibold text-sm">{s.label}</span>
                      <span className="text-[10px] mt-0.5 text-center leading-tight">{s.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Phone <span className="text-muted-fg font-normal">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+27 11 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-1">
                {companies.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMode("select")}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  size="lg"
                  disabled={submitting || !name.trim() || !vertical || !size}
                >
                  {submitting ? "Creating…" : "Create Company →"}
                </Button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-muted-fg">
          You can update company details from Settings after setup.
        </p>
      </div>
    </div>
  );
}

