import { apiRequest } from "@/lib/api/client";

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  action: string;
}

export function listAutomationRules() {
  return apiRequest<AutomationRule[]>("/automation/rules");
}

export function createAutomationRule(payload: {
  name: string;
  trigger: string;
  action: string;
  conditions?: unknown;
  actionPayload?: Record<string, unknown>;
  enabled?: boolean;
}) {
  return apiRequest<AutomationRule>("/automation/rules", { method: "POST", body: payload });
}

export function toggleAutomationRule(id: string) {
  return apiRequest<AutomationRule>(`/automation/rules/${id}/toggle`, { method: "POST", body: {} });
}

export function runAutomations(trigger: string, payload: Record<string, unknown> = {}) {
  return apiRequest<{ matched: number }>("/automation/run", {
    method: "POST",
    body: { trigger, payload },
  });
}
