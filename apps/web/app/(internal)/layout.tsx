/**
 * @file app/(internal)/layout.tsx
 * @description Auth-guarded layout for all internal (admin) routes.
 * Redirects unauthenticated users to /login. Wraps children in InternalShell
 * (sidebar + top bar). Covers /dashboard, /billing, /crm, /hr, /settings etc.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InternalShell } from "@/components/layouts/internal-shell";
import { useAuth } from "@/lib/auth/context";

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
        <div className="text-muted-fg text-sm">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <InternalShell>{children}</InternalShell>;
}
