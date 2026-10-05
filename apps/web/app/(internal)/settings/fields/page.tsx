"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  archiveCustomField,
  createCustomField,
  getCustomizationMeta,
  listCustomFields,
  updateCustomField,
  type CustomField,
  type CustomizationMeta,
  type FieldType,
} from "@/lib/api/customization";

const SELECT_CLASS = "rounded-[6px] border border-border bg-background px-3 py-2 text-sm";
const CHOICE: FieldType[] = ["select", "multiselect"];

export default function CustomFieldsSettingsPage() {
  return (
    <Suspense fallback={null}>
      <CustomFieldsSettings />
    </Suspense>
  );
}

function CustomFieldsSettings() {
  const search = useSearchParams();
  const [meta, setMeta] = useState<CustomizationMeta | null>(null);
  const [entity, setEntity] = useState<string>(search.get("entity") || "");
  const [fields, setFields] = useState<CustomField[]>([]);
  const [draft, setDraft] = useState({ label: "", fieldType: "text" as FieldType, options: "", required: false, sensitive: false, helpText: "" });

  useEffect(() => {
    getCustomizationMeta()
      .then((m) => {
        setMeta(m);
        setEntity((current) => current || m.entities[0]?.key || "");
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const reload = useCallback(async () => {
    if (entity) setFields(await listCustomFields(entity, true));
  }, [entity]);

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load fields"));
  }, [reload]);

  const canManage = meta?.permissions.includes("customization.manage") ?? false;
  const current = meta?.entities.find((e) => e.key === entity);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Custom fields"
        subtitle="Capture whatever your team needs on any record. Sensitive fields are hidden from roles without POPIA access."
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-fg">Record type</span>
        <select className={SELECT_CLASS} value={entity} onChange={(e) => setEntity(e.target.value)}>
          {meta?.entities.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
              {e.kind === "custom" ? " (custom)" : ""}
            </option>
          ))}
        </select>
        {current?.lockedWorkflow && (
          <span className="text-xs text-muted-fg">Status workflow is fixed for compliance; fields are yours to add.</span>
        )}
      </div>

      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="text-left px-4 py-3">Label</th>
              <th className="text-left px-4 py-3">Key</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Required</th>
              <th className="text-left px-4 py-3">Sensitive</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id} className={`border-t border-border ${f.archived ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">
                  <Input
                    defaultValue={f.label}
                    disabled={!canManage || f.archived}
                    onBlur={async (e) => {
                      if (e.target.value === f.label) return;
                      try {
                        await updateCustomField(f.id, { label: e.target.value });
                        await reload();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Update failed");
                      }
                    }}
                  />
                  {CHOICE.includes(f.fieldType) && (
                    <p className="mt-1 text-[11px] text-muted-fg">Options: {f.options.join(", ")}</p>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{f.key}</td>
                <td className="px-4 py-3 text-xs">{meta?.fieldTypes.find((t) => t.key === f.fieldType)?.label ?? f.fieldType}</td>
                {(["required", "sensitive"] as const).map((flag) => (
                  <td key={flag} className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={f[flag]}
                      disabled={!canManage || f.archived}
                      onChange={async (e) => {
                        try {
                          await updateCustomField(f.id, { [flag]: e.target.checked });
                          await reload();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Update failed");
                        }
                      }}
                    />
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          if (f.archived) await updateCustomField(f.id, { archived: false });
                          else await archiveCustomField(f.id);
                          await reload();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Update failed");
                        }
                      }}
                    >
                      {f.archived ? "Restore" : "Archive"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!fields.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-fg">
                  No custom fields on this record type yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canManage && entity && (
        <section className="rounded-[12px] border border-border p-5 space-y-3">
          <h2 className="section-title">Add a field</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Label, e.g. Burial society" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            <select className={SELECT_CLASS} value={draft.fieldType} onChange={(e) => setDraft({ ...draft, fieldType: e.target.value as FieldType })}>
              {meta?.fieldTypes.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <Input placeholder="Help text (optional)" value={draft.helpText} onChange={(e) => setDraft({ ...draft, helpText: e.target.value })} />
            {CHOICE.includes(draft.fieldType) && (
              <Input
                className="md:col-span-3"
                placeholder="Options, comma separated"
                value={draft.options}
                onChange={(e) => setDraft({ ...draft, options: e.target.value })}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.required} onChange={(e) => setDraft({ ...draft, required: e.target.checked })} />
              Required
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.sensitive} onChange={(e) => setDraft({ ...draft, sensitive: e.target.checked })} />
              Sensitive (health, ID numbers)
            </label>
            <Button
              size="sm"
              disabled={!draft.label.trim()}
              onClick={async () => {
                try {
                  await createCustomField({
                    entity,
                    label: draft.label.trim(),
                    fieldType: draft.fieldType,
                    required: draft.required,
                    sensitive: draft.sensitive,
                    helpText: draft.helpText,
                    options: draft.options.split(",").map((o) => o.trim()).filter(Boolean),
                  });
                  setDraft({ label: "", fieldType: "text", options: "", required: false, sensitive: false, helpText: "" });
                  toast.success("Field added");
                  await reload();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not add field");
                }
              }}
            >
              Add field
            </Button>
          </div>
        </section>
      )}
    </PageContainer>
  );
}
