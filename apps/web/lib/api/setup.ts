/**
 * Guided setup: fetch an industry-specific starting plan and apply it in one request.
 */
import { apiRequest } from "./client";
import type { PipelineStage, RecordTemplate } from "./customization";

export interface SetupTemplate extends RecordTemplate {
  recommended: boolean;
}

export interface SetupRole {
  key: string;
  label: string;
  permissions: string[];
  builtIn: boolean;
  exists: boolean;
}

export interface SetupPlan {
  vertical: string;
  verticalLabel: string;
  industryLabel: string;
  completedAt: string | null;
  templates: SetupTemplate[];
  roles: SetupRole[];
  leadStages: PipelineStage[];
  hasLeadPipeline: boolean;
  recordTypeCount: number;
  canApply: boolean;
}

export interface SetupCustomType {
  label: string;
  pluralLabel?: string;
  stages?: PipelineStage[];
}

export interface SetupRequest {
  industryLabel?: string;
  templates: string[];
  customTypes: SetupCustomType[];
  roles: string[];
  leadStages?: PipelineStage[];
}

export interface SetupResult {
  created: { recordTypes: string[]; roles: string[]; leadPipeline: boolean };
  plan: SetupPlan;
}

const companyHeader = (companyId?: string) => (companyId ? { "X-Company-Id": companyId } : undefined);

export const getSetupPlan = (companyId?: string) =>
  apiRequest<SetupPlan>("/setup", { headers: companyHeader(companyId) });

export const applySetup = (body: SetupRequest, companyId?: string) =>
  apiRequest<SetupResult>("/setup/apply", { method: "POST", body, headers: companyHeader(companyId) });
