"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CustomField, FieldValue } from "@/lib/api/customization";

const SELECT_CLASS = "w-full rounded-[6px] border border-border bg-background px-3 py-2 text-sm";

export function CustomFieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: CustomField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  disabled?: boolean;
}) {
  const str = value === null || value === undefined ? "" : String(value);
  switch (field.fieldType) {
    case "textarea":
      return <Textarea value={str} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "boolean":
      return (
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={value === true}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "select":
      return (
        <select className={SELECT_CLASS} value={str} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-3">
          {field.options.map((o) => (
            <label key={o} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                disabled={disabled}
                checked={selected.includes(o)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...selected, o] : selected.filter((s) => s !== o))
                }
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    case "number":
    case "currency":
      return (
        <Input
          type="number"
          step={field.fieldType === "currency" ? "0.01" : "any"}
          value={str}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "date":
      return <Input type="date" value={str.slice(0, 10)} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "datetime":
      return (
        <Input
          type="datetime-local"
          value={str.slice(0, 16)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "email":
      return <Input type="email" value={str} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "phone":
      return <Input type="tel" value={str} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "url":
      return <Input type="url" value={str} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <Input value={str} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function formatFieldValue(field: CustomField, value: FieldValue): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field.fieldType === "boolean") return value ? "Yes" : "No";
  if (field.fieldType === "currency") return `R ${Number(value).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
  if (Array.isArray(value)) return value.join(", ");
  if (field.fieldType === "datetime") return new Date(String(value)).toLocaleString("en-ZA");
  return String(value);
}

export function CustomFieldsForm({
  fields,
  values,
  errors,
  onChange,
  disabled,
}: {
  fields: CustomField[];
  values: Record<string, FieldValue>;
  errors?: Record<string, string>;
  onChange: (key: string, value: FieldValue) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className={f.fieldType === "textarea" ? "md:col-span-2 space-y-1" : "space-y-1"}>
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            {f.label}
            {f.required && <span className="text-danger">*</span>}
            {f.sensitive && (
              <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-fg">
                Sensitive
              </span>
            )}
          </label>
          <CustomFieldInput field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} disabled={disabled} />
          {f.helpText && <p className="text-[11px] text-muted-fg">{f.helpText}</p>}
          {errors?.[f.key] && <p className="text-[11px] text-danger">{errors[f.key]}</p>}
        </div>
      ))}
    </div>
  );
}
