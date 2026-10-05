"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomFieldsForm, formatFieldValue } from "@/components/modules/customization/custom-field-input";
import {
  createRecord,
  fieldErrorsOf,
  listRecords,
  updateRecord,
  type CustomField,
  type CustomRecord,
  type FieldValue,
  type RecordType,
} from "@/lib/api/customization";

export default function RecordListPage() {
  const { typeKey } = useParams<{ typeKey: string }>();
  const [type, setType] = useState<RecordType | null>(null);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [records, setRecords] = useState<CustomRecord[]>([]);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const data = await listRecords(typeKey, { q: query || undefined });
    setType(data.type);
    setFields(data.fields);
    setRecords(data.records);
  }, [typeKey, query]);

  useEffect(() => {
    reload()
      .then(() => setLoadError(null))
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load"));
  }, [reload]);

  const stages = type?.pipeline?.stages ?? [];
  const columns = fields.filter((f) => !f.sensitive).slice(0, 3);

  const submit = async () => {
    setErrors({});
    try {
      await createRecord(typeKey, { title: title.trim(), values });
      setTitle("");
      setValues({});
      setCreating(false);
      toast.success(`${type?.label ?? "Record"} created`);
      await reload();
    } catch (e) {
      setErrors(fieldErrorsOf(e));
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  };

  const moveStage = async (record: CustomRecord, stage: string) => {
    try {
      await updateRecord(typeKey, record.id, { stage });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not move record");
    }
  };

  if (loadError) {
    return (
      <PageContainer>
        <PageHeader title="Records" subtitle={loadError} />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={type?.pluralLabel ?? "Records"}
        subtitle={type?.description || undefined}
        action={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/settings/fields?entity=${encodeURIComponent(type?.entity ?? "")}`}>Fields</Link>
            </Button>
            <Button size="sm" onClick={() => setCreating((v) => !v)}>
              {creating ? "Cancel" : `New ${type?.label.toLowerCase() ?? "record"}`}
            </Button>
          </div>
        }
      />

      {creating && (
        <section className="rounded-[12px] border border-border p-5 space-y-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          {errors.title && <p className="text-xs text-danger">{errors.title}</p>}
          <CustomFieldsForm
            fields={fields}
            values={values}
            errors={errors}
            onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
          />
          <Button size="sm" disabled={!title.trim()} onClick={submit}>
            Create
          </Button>
        </section>
      )}

      <Input className="max-w-sm" placeholder="Search title or number" value={query} onChange={(e) => setQuery(e.target.value)} />

      {stages.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {stages.map((stage) => {
            const inStage = records.filter((r) => r.stage === stage.key);
            return (
              <div key={stage.key} className="w-72 shrink-0 rounded-[12px] border border-border bg-surface p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-fg">
                  <span>{stage.label}</span>
                  <span>{inStage.length}</span>
                </div>
                {inStage.map((r) => (
                  <div key={r.id} className="rounded-[8px] border border-border bg-background p-3 space-y-1">
                    <Link href={`/records/${typeKey}/${r.id}`} className="block text-sm font-medium hover:underline">
                      {r.title}
                    </Link>
                    <p className="font-mono text-[10px] text-muted-fg">{r.number}</p>
                    {columns.map((f) =>
                      r.values[f.key] !== undefined && r.values[f.key] !== null && r.values[f.key] !== "" ? (
                        <p key={f.key} className="text-xs text-muted-fg truncate">
                          {f.label}: {formatFieldValue(f, r.values[f.key])}
                        </p>
                      ) : null,
                    )}
                    <select
                      className="mt-1 w-full rounded-[6px] border border-border bg-background px-2 py-1 text-xs"
                      value={r.stage}
                      onChange={(e) => moveStage(r, e.target.value)}
                      aria-label="Move to stage"
                    >
                      {stages.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[12px] border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="text-left px-4 py-3">Number</th>
                <th className="text-left px-4 py-3">Title</th>
                {columns.map((f) => (
                  <th key={f.key} className="text-left px-4 py-3">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{r.number}</td>
                  <td className="px-4 py-3">
                    <Link href={`/records/${typeKey}/${r.id}`} className="hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  {columns.map((f) => (
                    <td key={f.key} className="px-4 py-3 text-xs">
                      {formatFieldValue(f, r.values[f.key])}
                    </td>
                  ))}
                </tr>
              ))}
              {!records.length && (
                <tr>
                  <td colSpan={2 + columns.length} className="px-4 py-6 text-center text-muted-fg">
                    Nothing here yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
