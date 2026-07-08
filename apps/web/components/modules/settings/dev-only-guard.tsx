/**
 * @file components/modules/settings/dev-only-guard.tsx
 * @description Client guard that only renders its children for developer users
 * (email in NEXT_PUBLIC_DEV_EMAILS). Non-dev users see a "not available"
 * message instead. Used to protect dev-only settings surfaces (e.g. Security)
 * against direct URL access, complementing the hidden sidebar links.
 *
 * Note: this is UI-level gating only. The backend must still authorise the
 * underlying endpoints.
 */
"use client";

import { Lock } from "lucide-react";
import { useIsDevUser } from "@/lib/auth/dev-access";

export function DevOnlyGuard({ children }: { children: React.ReactNode }) {
  const isDev = useIsDevUser();

  if (!isDev) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
          <Lock size={20} className="text-muted-fg" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Not available</h3>
        <p className="text-sm text-muted-fg mt-1 max-w-sm">
          This section is restricted to platform administrators.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
