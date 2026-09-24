/**
 * @file components/auth/account-shell.tsx
 * @description Centered card layout for the small account pages (forgot/reset password, verify email).
 */
import { ZerpaLogo } from "@/components/brand/zerpa-logo";

export function AccountShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <ZerpaLogo className="h-12" />
        </div>
        <div className="bg-background rounded-[12px] border border-border p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-muted-fg">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
