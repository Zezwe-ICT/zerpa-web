"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SetupWizard } from "@/components/modules/setup/setup-wizard";
import { useAuth } from "@/lib/auth/context";

export default function GuidedSetupPage() {
  const router = useRouter();
  const { company, user } = useAuth();
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Guided setup"
        subtitle="Shape Zerpa around how your business actually works. Safe to run again; nothing you already have is removed."
      />
      <div className="rounded-[16px] border border-border bg-background p-6">
        <SetupWizard
          companyId={company?.id}
          companyName={company?.name}
          inviterName={user?.fullName}
          launchLabel="Apply setup"
          onDone={(result) => {
            const parts = [
              result.created.recordTypes.length && `${result.created.recordTypes.length} record types`,
              result.created.roles.length && `${result.created.roles.length} roles`,
              result.created.leadPipeline && "sales stages",
              result.invitesSent && `${result.invitesSent} invite${result.invitesSent === 1 ? "" : "s"}`,
              result.quoteNumber && `quote ${result.quoteNumber}`,
            ].filter(Boolean);
            toast.success(parts.length ? `Added ${parts.join(", ")}` : "Setup saved");
            if (result.quoteUrl) toast.message("Customer link", { description: result.quoteUrl });
            router.push("/dashboard");
          }}
        />
      </div>
    </PageContainer>
  );
}
