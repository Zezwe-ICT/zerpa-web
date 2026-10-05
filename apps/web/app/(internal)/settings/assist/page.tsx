"use client";

import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { AssistPanel } from "@/components/modules/assistant/assist-panel";

export default function AssistSettingsPage() {
  return (
    <PageContainer>
      <PageHeader title="Zerpa Assist" subtitle="Approval-gated copilot skills for the active vertical pack" />
      <div className="max-w-md">
        <AssistPanel recordType="ticket" title="Skill browser" />
      </div>
    </PageContainer>
  );
}
