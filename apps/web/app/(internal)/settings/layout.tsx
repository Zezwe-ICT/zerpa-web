/**
 * @file app/(internal)/settings/layout.tsx
 * @description Settings pages layout with sidebar navigation
 */
"use client";

import { PageContainer } from "@/components/layouts/page-container";
import { SettingsSidebar } from "@/components/modules/settings/settings-sidebar";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <SettingsSidebar />
      <div className="flex-1 overflow-auto">
        <PageContainer>
          <PageHeader
            title="Settings"
            subtitle="Platform configuration and preferences"
          />
          {children}
        </PageContainer>
      </div>
    </div>
  );
}
