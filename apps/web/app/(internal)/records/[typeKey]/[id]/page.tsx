"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomFieldsForm } from "@/components/modules/customization/custom-field-input";
import {
  deleteRecord,
  fieldErrorsOf,
  getRecord,
  updateRecord,
  type CustomField,
  type CustomRecord,
  type FieldValue,
  type RecordType,
} from "@/lib/api/customization";

export default function RecordDetailPage() {
  const { typeKey, id } = useParams<{ typeKey: string; id: string }>();
  const router = useRouter();
  const [type, setType] = useState<RecordType | null>(null);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [record, setRecord] = useState<CustomRecord | null>(null);
  const [title, setTitle] = useState("");
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await getRecord(typeKey, id);
    setType(data.type);
    setFields(data.fields);
    setRecord(data.record);
    setTitle(data.record.title);
    setValues(data.record.values);
  }, [typeKey, id]);

  useEffect(() => {
    load().catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  if (loadError || !record) {
    return (
      <PageContainer>
        <PageHeader title={loadError ? "Record unavailable" : "Loading…"} subtitle={loadError ?? undefined} />
      </PageContainer>
    );
  }

  const stages = type?.pipeline?.stages ?? [];

  const save = async (patch: { stage?: string } = {}) => {
    setSaving(true);
    setErrors({});
    try {
      const payload = Object.fromEntries(fields.map((f) => [f.key, values[f.key] ?? null]));
      const updated = await updateRecord(typeKey, id, { title: title.trim(), values: payload, ...patch });
      setRecord(updated);
      setValues(updated.values);
      toast.success("Saved");
    } catch (e) {
      setErrors(fieldErrorsOf(e));
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer className="space-y-6">
      <Link href={`/records/${typeKey}`} className="text-sm text-muted-fg hover:underline">
        ← {type?.pluralLabel ?? "Records"}
      </Link>
      <PageHeader
        title={record.title}
        subtitle={`${record.number} · updated ${new Date(record.updatedAt).toLocaleString("en-ZA")}`}
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              if (!window.confirm(`Delete ${record.number}? This cannot be undone.`)) return;
              try {
                await deleteRecord(typeKey, id);
                router.push(`/records/${typeKey}`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Delete failed");
              }
            }}
          >
            Delete
          </Button>
        }
      />

      {stages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stages.map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={record.stage === s.key ? "default" : "outline"}
              disabled={saving || record.stage === s.key}
              onClick={() => save({ stage: s.key })}
            >
              {s.label}
            </Button>
          ))}
        </div>
      )}

      <section className="rounded-[12px] border border-border p-5 space-y-4">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
        {errors.title && <p className="text-xs text-danger">{errors.title}</p>}
        <CustomFieldsForm
          fields={fields}
          values={values}
          errors={errors}
          onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
        />
        <Button size="sm" disabled={saving || !title.trim()} onClick={() => save()}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </section>
    </PageContainer>
  );
}
