/**
 * @file app/(internal)/settings/layout.tsx
 * @description Settings layout. There is no settings sub-sidebar — the /settings
 * home page's section cards are the navigation. This layout just constrains the
 * width and, on a section sub-page, shows a "Back to Settings" link.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isIndex = pathname === "/settings";

  return (
    <PageContainer>
      {!isIndex && (
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>
      )}
      {children}
    </PageContainer>
  );
}
