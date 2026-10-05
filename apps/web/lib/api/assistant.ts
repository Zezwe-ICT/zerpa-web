import { apiRequest } from "@/lib/api/client";

export interface AssistantSkill {
  id: string;
  label: string;
  description: string;
  requiresApproval: boolean;
}

export interface AssistantProposal {
  id: string;
  skillId: string;
  summary: string;
  citedRecordIds: string[];
  status: string;
  proposedAction?: { type: string; requiresApproval: boolean };
}

export function listAssistSkills() {
  return apiRequest<{ enabled: boolean; skills: AssistantSkill[] }>("/assistant/skills");
}

export function proposeAssist(payload: {
  skillId: string;
  recordType: string;
  recordId?: string;
  accountId?: string;
  summary?: string;
  message?: string;
  customerName?: string;
}) {
  return apiRequest<AssistantProposal>("/assistant/propose", { method: "POST", body: payload });
}

export function decideAssist(id: string, decision: "approved" | "rejected") {
  return apiRequest<AssistantProposal>(`/assistant/proposals/${id}/decide`, {
    method: "POST",
    body: { decision },
  });
}
