/**
 * Tenant customisation: custom fields, pipelines, record types, custom records and roles.
 * Regulatory workflows (RICA, job-card approval, tickets, invoices) stay locked on the API.
 */
import { apiRequest } from "./client";

/** Window event fired after record types change so navigation can refresh. */
export const RECORD_TYPES_CHANGED = "zerpa:record-types-changed";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "multiselect"
  | "email"
  | "phone"
  | "url"
  | "sa_id_number";

export type FieldValue = string | number | boolean | string[] | null | undefined;
export type FieldValues = Record<string, FieldValue>;

export interface CustomField {
  id: string;
  entity: string;
  key: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  options: string[];
  helpText: string;
  position: number;
  sensitive: boolean;
  archived: boolean;
  config: Record<string, unknown>;
}

export interface EntityMeta {
  key: string;
  label: string;
  kind: "builtin" | "custom";
  pipelineCapable: boolean;
  lockedWorkflow: boolean;
}

export interface CustomizationMeta {
  vertical: string;
  fieldTypes: Array<{ key: FieldType; label: string }>;
  entities: EntityMeta[];
  permissions: string[];
}

export type StageKind = "open" | "won" | "lost";

export interface PipelineStage {
  key: string;
  label: string;
  kind: StageKind;
  color?: string;
  position?: number;
}

export interface Pipeline {
  id: string;
  entity: string;
  name: string;
  stages: PipelineStage[];
}

export interface RecordType {
  id: string;
  key: string;
  entity: string;
  label: string;
  pluralLabel: string;
  description: string;
  icon: string;
  templateKey: string;
  archived: boolean;
  pipeline: Pipeline | null;
  recordCount?: number;
}

export interface RecordTemplate {
  key: string;
  label: string;
  pluralLabel: string;
  description: string;
  icon: string;
  fields: string[];
  stages: string[];
  installed: boolean;
}

export interface CustomRecord {
  id: string;
  number: string;
  title: string;
  stage: string;
  values: FieldValues;
  accountId: string | null;
  contactId: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleInfo {
  key: string;
  label: string;
  builtIn: boolean;
  customised: boolean;
  editable: boolean;
  permissions: string[];
}

export interface TeamMember {
  id: string;
  role: string;
  accountId: string | null;
  user: { id: string; email: string; fullName: string };
  joinedAt: string;
}

export const getCustomizationMeta = () => apiRequest<CustomizationMeta>("/customization/meta");

export function listCustomFields(entity?: string, includeArchived = false) {
  const params = new URLSearchParams();
  if (entity) params.set("entity", entity);
  if (includeArchived) params.set("includeArchived", "1");
  const qs = params.toString();
  return apiRequest<CustomField[]>(`/custom-fields${qs ? `?${qs}` : ""}`);
}

export const createCustomField = (body: Partial<CustomField> & { entity: string; label: string }) =>
  apiRequest<CustomField>("/custom-fields", { method: "POST", body });

export const updateCustomField = (id: string, body: Partial<CustomField>) =>
  apiRequest<CustomField>(`/custom-fields/${id}`, { method: "PATCH", body });

export const archiveCustomField = (id: string) =>
  apiRequest<CustomField>(`/custom-fields/${id}`, { method: "DELETE" });

export const getCustomFieldValues = (entity: string, recordId: string) =>
  apiRequest<{ fields: CustomField[]; values: FieldValues }>(
    `/custom-field-values/${encodeURIComponent(entity)}/${recordId}`,
  );

export const saveCustomFieldValues = (entity: string, recordId: string, values: FieldValues) =>
  apiRequest<{ values: FieldValues }>(`/custom-field-values/${encodeURIComponent(entity)}/${recordId}`, {
    method: "PUT",
    body: { values },
  });

export const listPipelines = () => apiRequest<Pipeline[]>("/pipelines");

export const createPipeline = (body: { entity: string; name?: string; stages: PipelineStage[] }) =>
  apiRequest<Pipeline>("/pipelines", { method: "POST", body });

export const updatePipeline = (id: string, body: { name?: string; stages?: PipelineStage[] }) =>
  apiRequest<Pipeline>(`/pipelines/${id}`, { method: "PATCH", body });

export const deletePipeline = (id: string) => apiRequest<void>(`/pipelines/${id}`, { method: "DELETE" });

export const listRecordTypes = () => apiRequest<RecordType[]>("/record-types");

export const createRecordType = (body: {
  label: string;
  pluralLabel?: string;
  description?: string;
  icon?: string;
  stages?: PipelineStage[];
}) => apiRequest<RecordType>("/record-types", { method: "POST", body });

export const updateRecordType = (id: string, body: Partial<RecordType>) =>
  apiRequest<RecordType>(`/record-types/${id}`, { method: "PATCH", body });

export const archiveRecordType = (id: string) =>
  apiRequest<RecordType>(`/record-types/${id}`, { method: "DELETE" });

export const listRecordTemplates = () => apiRequest<RecordTemplate[]>("/record-types/templates");

export const installRecordTemplate = (key: string) =>
  apiRequest<RecordType>(`/record-types/templates/${encodeURIComponent(key)}/install`, { method: "POST" });

export function listRecords(typeKey: string, filters: { stage?: string; q?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return apiRequest<{ type: RecordType; fields: CustomField[]; records: CustomRecord[] }>(
    `/records/${encodeURIComponent(typeKey)}${qs ? `?${qs}` : ""}`,
  );
}

export const getRecord = (typeKey: string, id: string) =>
  apiRequest<{ type: RecordType; fields: CustomField[]; record: CustomRecord }>(
    `/records/${encodeURIComponent(typeKey)}/${id}`,
  );

export const createRecord = (
  typeKey: string,
  body: { title: string; stage?: string; values?: FieldValues; accountId?: string | null },
) => apiRequest<CustomRecord>(`/records/${encodeURIComponent(typeKey)}`, { method: "POST", body });

export const updateRecord = (
  typeKey: string,
  id: string,
  body: { title?: string; stage?: string; values?: FieldValues; accountId?: string | null },
) => apiRequest<CustomRecord>(`/records/${encodeURIComponent(typeKey)}/${id}`, { method: "PATCH", body });

export const deleteRecord = (typeKey: string, id: string) =>
  apiRequest<void>(`/records/${encodeURIComponent(typeKey)}/${id}`, { method: "DELETE" });

export const listRoles = () =>
  apiRequest<{ permissions: Array<{ key: string; label: string }>; roles: RoleInfo[]; mine: string[] }>("/roles");

export const saveRole = (key: string, body: { label?: string; permissions: string[] }) =>
  apiRequest<RoleInfo>(`/roles/${encodeURIComponent(key)}`, { method: "PUT", body });

export const resetRole = (key: string) => apiRequest<void>(`/roles/${encodeURIComponent(key)}`, { method: "DELETE" });

export const getMyPermissions = () => apiRequest<{ role: string; permissions: string[] }>("/me/permissions");

export const listTeamMembers = (companyId: string) =>
  apiRequest<TeamMember[]>(`/companies/${companyId}/team-members`);

export const setMemberRole = (companyId: string, memberId: string, role: string) =>
  apiRequest<TeamMember>(`/companies/${companyId}/team-members/${memberId}`, { method: "PATCH", body: { role } });

/** Surfaces per-field validation errors returned as details.fieldErrors. */
export function fieldErrorsOf(err: unknown): Record<string, string> {
  const details = (err as { details?: { fieldErrors?: Record<string, string> } })?.details;
  return details?.fieldErrors ?? {};
}
