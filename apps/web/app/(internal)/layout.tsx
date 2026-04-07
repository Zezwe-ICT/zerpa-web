import { InternalShell } from "@/components/layouts/internal-shell";
import { CONFIG } from "@/lib/config";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  // In production, this would check AWS Cognito auth and verify zerpa_* group
  if (!CONFIG.useMock) {
    // TODO: Add Cognito auth check
  }

  return <InternalShell>{children}</InternalShell>;
}
