/**
 * @file app/(internal)/settings/security/page.tsx
 * @description Security settings page. Dev-only — gated behind DevOnlyGuard so
 * direct URL access by customers is blocked, matching the hidden sidebar link.
 */

import { SecuritySettings } from "@/components/modules/settings/security-settings";
import { DevOnlyGuard } from "@/components/modules/settings/dev-only-guard";

export default function SecurityPage() {
  return (
    <DevOnlyGuard>
      <SecuritySettings />
    </DevOnlyGuard>
  );
}
