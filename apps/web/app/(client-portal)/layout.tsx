/**
 * Client portal layout — requires authentication and active company.
 * Invoices and portal data must be company-scoped, never vertical-only.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { ZerpaLoader } from "@/components/brand/zerpa-loader";

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, company } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <ZerpaLoader title="Opening your portal" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-sm text-muted-fg">Select a company to continue.</div>
      </div>
    );
  }

  return <>{children}</>;
}
