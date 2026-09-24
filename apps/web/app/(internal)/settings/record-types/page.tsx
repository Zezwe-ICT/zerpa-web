"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  archiveRecordType,
  createRecordType,
  getMyPermissions,
  installRecordTemplate,
  listRecordTemplates,
  listRecordTypes,
  RECORD_TYPES_CHANGED,
  updateRecordType,
  type RecordTemplate,
  type RecordType,
} from "@/lib/api/customization";

function announce() {
  window.dispatchEvent(new CustomEvent(RECORD_TYPES_CHANGED));
}

export default function RecordTypesSettingsPage() {
  const [types, setTypes] = useState<RecordType[]>([]);
  const [templates, setTemplates] = useState<RecordTemplate[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [draft, setDraft] = useState({ label: "", pluralLabel: "", description: "", stages: "" });

  const reload = useCallback(async () => {
    const [t, tpl] = await Promise.all([listRecordTypes(), listRecordTemplates()]);
    setTypes(t);
    setTemplates(tpl);
  }, []);

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
    getMyPermissions()
      .then((p) => setCanManage(p.permissions.includes("customization.manage")))
      .catch(() => setCanManage(false));
  }, [reload]);

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        title="Record types"
        subtitle="Track anything your business runs on: add your own record types with their own fields and stages."
      />

      <section className="space-y-3">
        <h2 className="section-title">Your record types</h2>
        {types.length === 0 ? (
          <p className="text-sm text-muted-fg">None yet. Start from a template below or build your own.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {types.map((t) => (
              <div key={t.id} className="rounded-[12px] border border-border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.pluralLabel}</p>
                    <p className="text-xs text-muted-fg">{t.description || "Custom record type"}</p>
                  </div>
                  <span className="text-xs text-muted-fg">{t.recordCount ?? 0} records</span>
                </div>
                {t.pipeline && (
                  <p className="text-xs text-muted-fg">Stages: {t.pipeline.stages.map((s) => s.label).join(" → ")}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild size="sm">
                    <Link href={`/records/${t.key}`}>Open</Link>
                  </Button>
                  {canManage && (
                    <>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/settings/fields?entity=${encodeURIComponent(t.entity)}`}>Fields</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/settings/pipelines?entity=${encodeURIComponent(t.entity)}`}>Stages</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const label = window.prompt("Rename record type", t.label)?.trim();
                          if (!label || label === t.label) return;
                          try {
                            await updateRecordType(t.id, { label, pluralLabel: `${label}s` });
                            await reload();
                            announce();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Rename failed");
                          }
                        }}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!window.confirm(`Archive ${t.pluralLabel}? Records are kept and it can be restored.`)) return;
                          try {
                            await archiveRecordType(t.id);
                            await reload();
                            announce();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Archive failed");
                          }
                        }}
                      >
                        Archive
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {templates.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">Templates for your industry</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((tpl) => (
              <div key={tpl.key} className="rounded-[12px] border border-border p-4 space-y-2">
                <p className="font-medium">{tpl.pluralLabel}</p>
                <p className="text-xs text-muted-fg">{tpl.description}</p>
                <p className="text-xs text-muted-fg">Fields: {tpl.fields.join(", ")}</p>
                {tpl.stages.length > 0 && <p className="text-xs text-muted-fg">Stages: {tpl.stages.join(" → ")}</p>}
                <Button
                  size="sm"
                  variant={tpl.installed ? "outline" : "default"}
                  disabled={tpl.installed || !canManage}
                  onClick={async () => {
                    try {
                      await installRecordTemplate(tpl.key);
                      toast.success(`${tpl.pluralLabel} added`);
                      await reload();
                      announce();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Install failed");
                    }
                  }}
                >
                  {tpl.installed ? "Installed" : "Add to my workspace"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {canManage && (
        <section className="rounded-[12px] border border-border p-5 space-y-3">
          <h2 className="section-title">Build your own</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Name (singular), e.g. Burial society" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            <Input placeholder="Plural, e.g. Burial societies" value={draft.pluralLabel} onChange={(e) => setDraft({ ...draft, pluralLabel: e.target.value })} />
            <Input className="md:col-span-2" placeholder="Description (optional)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <Input
              className="md:col-span-2"
              placeholder="Stages, comma separated (optional), e.g. New, In progress, Done"
              value={draft.stages}
              onChange={(e) => setDraft({ ...draft, stages: e.target.value })}
            />
          </div>
          <Button
            size="sm"
            disabled={!draft.label.trim()}
            onClick={async () => {
              const labels = draft.stages.split(",").map((s) => s.trim()).filter(Boolean);
              try {
                const created = await createRecordType({
                  label: draft.label.trim(),
                  pluralLabel: draft.pluralLabel.trim() || undefined,
                  description: draft.description.trim(),
                  stages: labels.map((label, i) => ({
                    key: "",
                    label,
                    kind: i === labels.length - 1 && labels.length > 1 ? "won" : "open",
                  })),
                });
                setDraft({ label: "", pluralLabel: "", description: "", stages: "" });
                toast.success(`${created.pluralLabel} created. Add fields next.`);
                await reload();
                announce();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Create failed");
              }
            }}
          >
            Create record type
          </Button>
        </section>
      )}
    </PageContainer>
  );
}
