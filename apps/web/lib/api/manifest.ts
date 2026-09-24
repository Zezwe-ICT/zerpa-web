import { apiRequest } from "@/lib/api/client";
import type { VerticalManifest } from "@zerpa/vertical-manifests";

export function getCompanyManifest(companyId: string) {
  return apiRequest<VerticalManifest & { installedVersion?: string; installedModules?: string[] }>(
    `/companies/${companyId}/manifest`,
    { headers: { "X-Company-Id": companyId } },
  );
}
