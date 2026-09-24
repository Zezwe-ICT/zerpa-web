"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  fieldErrorsOf,
  getCustomFieldValues,
  saveCustomFieldValues,
  type CustomField,
  type FieldValues,
} from "@/lib/api/customization";
import { CustomFieldsForm } from "./custom-field-input";

/** Company-defined fields for a built-in record (ticket, subscriber, funeral case, ...). */
export function CustomFieldsPanel({ entity, recordId }: { entity: string; recordId: string }) {
  const [fields, setFields] = useState<CustomField[] | null>(null);
  const [values, setValues] = useState<FieldValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCustomFieldValues(entity, recordId)
      .then((res) => {
        setFields(res.fields);
        setValues(res.values);
      })
      .catch(() => setFields([]));
  }, [entity, recordId]);

  if (!fields) return null;

  return (
    <section className="rounded-[12px] border border-border bg-background p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Additional details</h2>
        <Link href={`/settings/fields?entity=${encodeURIComponent(entity)}`} className="text-xs text-muted-fg hover:text-primary">
          Manage fields
        </Link>
      </div>
      {fields.length === 0 ? (
        <p className="text-sm text-muted-fg">No custom fields on this record type yet.</p>
      ) : (
        <>
          <CustomFieldsForm
            fields={fields}
            values={values}
            errors={errors}
            onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
          />
          <Button
            size="sm"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const payload = Object.fromEntries(fields.map((f) => [f.key, values[f.key] ?? null]));
                const res = await saveCustomFieldValues(entity, recordId, payload);
                setValues(res.values);
                setErrors({});
                toast.success("Saved");
              } catch (e) {
                setErrors(fieldErrorsOf(e));
                toast.error(e instanceof Error ? e.message : "Save failed");
              } finally {
                setSaving(false);
              }
            }}
          >
            Save details
          </Button>
        </>
      )}
    </section>
  );
}
