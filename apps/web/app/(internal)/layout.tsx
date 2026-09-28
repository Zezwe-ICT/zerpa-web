/**
 * @file app/(internal)/layout.tsx
 * @description Auth-guarded layout for all internal (admin) routes.
 * Redirects unauthenticated users to /login. Wraps children in InternalShell
 * (sidebar + top bar). Covers /dashboard, /billing, /crm, /hr, /settings etc.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppRouteGuard } from "@/components/layouts/app-route-guard";
import { InternalShell } from "@/components/layouts/internal-shell";
import { NpsPrompt } from "@/components/feedback/nps-prompt";
import { PageTracker } from "@/components/analytics/page-tracker";
import { useAuth } from "@/lib/auth/context";
import { ZerpaLoader } from "@/components/brand/zerpa-loader";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <ZerpaLoader title="Opening your workspace" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <InternalShell>
      <AppRouteGuard>{children}</AppRouteGuard>
      <NpsPrompt />
      <PageTracker />
    </InternalShell>
  );
}
