/**
 * @file components/legal/legal-page.tsx
 * @description Shared layout for the Terms of Use and Privacy Notice pages.
 */
import Link from "next/link";
import { ZerpaLogo } from "@/components/brand/zerpa-logo";
import { LEGAL } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="inline-block">
          <ZerpaLogo className="h-10" />
        </Link>
        {!LEGAL.approved && (
          <div className="rounded-[10px] border border-warning-ring bg-warning-bg p-4 text-sm text-warning" role="note">
            <strong>Draft.</strong> This page has not yet been reviewed by an attorney and may change before Zerpa launches.
          </div>
        )}
        <article className="rounded-[16px] border border-border bg-background p-6 sm:p-10 space-y-4 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:pt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-fg">Last updated: {LEGAL.lastUpdated}</p>
          </header>
          {children}
        </article>
        <p className="text-center text-xs text-muted-fg">
          <Link href="/terms" className="hover:underline">
            Terms of Use
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="hover:underline">
            Privacy Notice
          </Link>
        </p>
      </div>
    </div>
  );
}
