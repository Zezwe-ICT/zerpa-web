/**
 * @file app/(internal)/billing/settings/page.tsx
 * @description Billing settings route (accessed via the gear in the Billing header).
 */
import { PageContainer } from "@/components/layouts/page-container";
import { BillingSettingsClient } from "@/components/modules/billing/billing-settings-client";

export default function BillingSettingsPage() {
  return (
    <PageContainer>
      <BillingSettingsClient />
    </PageContainer>
  );
}
