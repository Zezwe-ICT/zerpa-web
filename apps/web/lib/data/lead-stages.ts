import { CONFIG } from "@/lib/config";
import { listPipelines, type PipelineStage } from "@/lib/api/customization";

/** Mirrors the API fallback when a company has not customised its lead pipeline. */
export const DEFAULT_LEAD_STAGES: PipelineStage[] = [
  { key: "NEW", label: "New", kind: "open" },
  { key: "CONTACTED", label: "Contacted", kind: "open" },
  { key: "QUALIFIED", label: "Qualified", kind: "open" },
  { key: "PROPOSAL", label: "Proposal", kind: "open" },
  { key: "NEGOTIATION", label: "Negotiation", kind: "open" },
  { key: "CLOSED_WON", label: "Won", kind: "won" },
  { key: "CLOSED_LOST", label: "Lost", kind: "lost" },
];

export async function getLeadStages(): Promise<PipelineStage[]> {
  if (CONFIG.useMock) return DEFAULT_LEAD_STAGES;
  const pipelines = await listPipelines();
  const lead = pipelines.find((p) => p.entity === "lead");
  return lead?.stages.length ? lead.stages : DEFAULT_LEAD_STAGES;
}
