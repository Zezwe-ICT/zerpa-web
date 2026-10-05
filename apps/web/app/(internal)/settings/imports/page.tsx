"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Table,
  Upload,
  X,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { commitImport, previewImport, type ImportPreview, type ImportResult } from "@/lib/api/imports";
import { toast } from "sonner";

// ─── Entity config ────────────────────────────────────────────────────────────

interface EntityDef {
  id: string;
  label: string;
  description: string;
  fields: SchemaField[];
}

interface SchemaField {
  key: string;
  label: string;
  required?: boolean;
}

const ENTITIES: EntityDef[] = [
  {
    id: "accounts",
    label: "Customers",
    description: "Client accounts / companies",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" },
    ],
  },
  {
    id: "contacts",
    label: "Contacts / Leads",
    description: "Individual people and sales leads",
    fields: [
      { key: "firstName", label: "First name", required: true },
      { key: "lastName", label: "Last name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "company", label: "Company" },
    ],
  },
  {
    id: "products",
    label: "Products / Services",
    description: "Catalogue items, plans, SKUs",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "code", label: "Code / SKU" },
      { key: "price", label: "Price" },
      { key: "category", label: "Category" },
      { key: "description", label: "Description" },
    ],
  },
  {
    id: "assets",
    label: "Assets",
    description: "Devices and configuration items",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "assetType", label: "Asset type" },
      { key: "serialNumber", label: "Serial number" },
      { key: "accountId", label: "Account / Client ID" },
      { key: "warrantyEnds", label: "Warranty end date" },
    ],
  },
  {
    id: "invoices",
    label: "Historical Invoices",
    description: "Past invoices for opening balance",
    fields: [
      { key: "invoiceNumber", label: "Invoice number", required: true },
      { key: "clientName", label: "Client name" },
      { key: "issueDate", label: "Issue date" },
      { key: "dueDate", label: "Due date" },
      { key: "amount", label: "Total amount" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "subscribers",
    label: "Subscribers",
    description: "Telecom / ISP subscriber accounts",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "plan", label: "Service plan" },
      { key: "status", label: "Status" },
    ],
  },
];

// ─── Source auto-map definitions ──────────────────────────────────────────────

type SourceId = "generic" | "odoo" | "xero" | "sage" | "quickbooks" | "google";

interface SourceDef {
  id: SourceId;
  label: string;
  hint: string;
  // Maps from source column name to Zerpa field key
  columnMap: Record<string, string>;
}

const SOURCES: SourceDef[] = [
  {
    id: "generic",
    label: "Generic CSV",
    hint: "First row is column headers",
    columnMap: {},
  },
  {
    id: "odoo",
    label: "Odoo export",
    hint: "res.partner CSV export",
    columnMap: {
      "Company Name": "name",
      "Contact Name": "firstName",
      "Email": "email",
      "Phone": "phone",
      "Mobile": "phone",
      "Street": "address",
      "Internal Reference": "code",
    },
  },
  {
    id: "xero",
    label: "Xero export",
    hint: "Contacts CSV export from Xero",
    columnMap: {
      "* Contact Name": "name",
      "Email Address": "email",
      "Phone Number": "phone",
      "Postal Address 1": "address",
      "Account Number": "code",
    },
  },
  {
    id: "sage",
    label: "Sage export",
    hint: "Customer list CSV from Sage",
    columnMap: {
      "Account Name": "name",
      "Account Code": "code",
      "Email": "email",
      "Telephone": "phone",
      "Address1": "address",
    },
  },
  {
    id: "quickbooks",
    label: "QuickBooks export",
    hint: "Customer list from QuickBooks",
    columnMap: {
      "Customer": "name",
      "Company": "name",
      "Email": "email",
      "Phone": "phone",
      "Billing Address Line 1": "address",
    },
  },
  {
    id: "google",
    label: "Google Contacts",
    hint: "Export from Google Contacts",
    columnMap: {
      "Name": "name",
      "Given Name": "firstName",
      "Family Name": "lastName",
      "E-mail 1 - Value": "email",
      "Phone 1 - Value": "phone",
      "Organization 1 - Name": "company",
    },
  },
];

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function parseCsvHeaders(csv: string): string[] {
  const firstLine = csv.split("\n")[0] || "";
  return firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
}

function parseCsvRows(csv: string, limit = 50): string[][] {
  const lines = csv.split("\n").slice(1).filter(Boolean);
  return lines.slice(0, limit).map((l) =>
    l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
  );
}

// Apply a source's column map to detected headers: returns Record<sourceCol, zerpaKey>
function autoMap(headers: string[], source: SourceDef): Record<string, string> {
  const m: Record<string, string> = {};
  headers.forEach((h) => {
    if (source.columnMap[h]) m[h] = source.columnMap[h];
  });
  return m;
}

// Rebuild CSV from mapped columns
function remapCsv(
  original: string,
  headers: string[],
  mapping: Record<string, string>,
  entity: EntityDef
): string {
  const outputFields = entity.fields.map((f) => f.key);
  const reverseMap: Record<string, string[]> = {}; // zerpaKey -> [source headers]
  Object.entries(mapping).forEach(([src, dst]) => {
    if (!reverseMap[dst]) reverseMap[dst] = [];
    reverseMap[dst].push(src);
  });

  const srcRows = parseCsvRows(original, 9999);
  const headerRow = outputFields.join(",");
  const rows = srcRows.map((row) => {
    const srcByHeader: Record<string, string> = {};
    headers.forEach((h, i) => { srcByHeader[h] = row[i] || ""; });
    return outputFields
      .map((k) => {
        const srcs = reverseMap[k] || [];
        const val = srcs.map((s) => srcByHeader[s] || "").find(Boolean) || "";
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(",");
  });
  return [headerRow, ...rows].join("\n");
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ["Entity", "Source", "Upload", "Map columns", "Preview", "Done"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i === current
                ? "bg-primary text-primary-foreground"
                : i < current
                ? "bg-success/15 text-success"
                : "bg-surface text-muted-fg"
            }`}
          >
            {i < current ? <CheckCircle2 size={11} /> : <span>{i + 1}</span>}
            {s}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-4 flex-shrink-0 ${i < current ? "bg-success/40" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function ImportsPage() {
  const [step, setStep] = useState(0);
  const [entity, setEntity] = useState<EntityDef>(ENTITIES[0]);
  const [source, setSource] = useState<SourceDef>(SOURCES[0]);
  const [csv, setCsv] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  // mapping: source column -> zerpa field key (empty = skip)
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── step 0: entity ────────────────────────────────────────────────────────

  function StepEntity() {
    return (
      <div>
        <h3 className="font-semibold mb-1">What are you importing?</h3>
        <p className="text-sm text-muted-fg mb-4">Choose the type of record this file contains.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ENTITIES.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEntity(e)}
              className={`text-left rounded-[10px] border p-4 transition-all ${
                entity.id === e.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <p className="font-medium text-sm">{e.label}</p>
              <p className="text-xs text-muted-fg mt-0.5">{e.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── step 1: source ────────────────────────────────────────────────────────

  function StepSource() {
    return (
      <div>
        <h3 className="font-semibold mb-1">Where is this data coming from?</h3>
        <p className="text-sm text-muted-fg mb-4">We&apos;ll auto-map common column names for you.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSource(s)}
              className={`text-left rounded-[10px] border p-4 transition-all ${
                source.id === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <p className="font-medium text-sm">{s.label}</p>
              <p className="text-xs text-muted-fg mt-0.5">{s.hint}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── step 2: upload ────────────────────────────────────────────────────────

  function handleFileChange(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      setCsv(text);
      const hdrs = parseCsvHeaders(text);
      setHeaders(hdrs);
      setMapping(autoMap(hdrs, source));
    };
    reader.readAsText(f);
  }

  function handleCsvPaste(text: string) {
    setCsv(text);
    setFile(null);
    const hdrs = parseCsvHeaders(text);
    setHeaders(hdrs);
    setMapping(autoMap(hdrs, source));
  }

  function StepUpload() {
    return (
      <div>
        <h3 className="font-semibold mb-1">Upload your file</h3>
        <p className="text-sm text-muted-fg mb-4">CSV or Excel export. The first row must be column names.</p>

        <div
          className="border-2 border-dashed border-border rounded-[12px] p-8 text-center cursor-pointer hover:border-primary/50 transition-colors mb-4"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFileChange(f);
          }}
        >
          <Upload size={24} className="mx-auto mb-2 text-muted-fg" />
          <p className="text-sm font-medium">{file ? file.name : "Drop a CSV or click to browse"}</p>
          <p className="text-xs text-muted-fg mt-1">.csv, .xlsx up to 10 MB</p>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }} />
        </div>

        <p className="text-xs text-muted-fg mb-2">Or paste the data directly:</p>
        <textarea
          className="w-full min-h-[120px] rounded-[8px] border border-border bg-background px-3 py-2 text-xs font-mono resize-none"
          placeholder={"name,email,phone\nAcme Inc,info@acme.co,021 000 0000"}
          value={file ? "" : csv}
          onChange={(e) => handleCsvPaste(e.target.value)}
        />
        {csv && <p className="text-xs text-success mt-1 flex items-center gap-1"><CheckCircle2 size={11} />{headers.length} column(s) detected</p>}
      </div>
    );
  }

  // ── step 3: map columns ───────────────────────────────────────────────────

  function StepMap() {
    const unmappedRequired = entity.fields
      .filter((f) => f.required)
      .filter((f) => !Object.values(mapping).includes(f.key));

    return (
      <div>
        <h3 className="font-semibold mb-1">Map columns to Zerpa fields</h3>
        <p className="text-sm text-muted-fg mb-4">
          Each column in your file on the left — choose the Zerpa field on the right.
          {source.id !== "generic" && <span className="text-primary"> Auto-mapped from {source.label}.</span>}
        </p>

        {unmappedRequired.length > 0 && (
          <div className="flex items-start gap-2 rounded-[8px] bg-warning/10 border border-warning/30 px-3 py-2 mb-4 text-xs text-warning">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            Required fields not mapped: {unmappedRequired.map((f) => f.label).join(", ")}
          </div>
        )}

        <div className="rounded-[10px] border border-border overflow-hidden">
          <div className="grid grid-cols-2 px-4 py-2 bg-surface text-xs font-semibold text-muted-fg uppercase tracking-wide">
            <span>Your column</span>
            <span>Zerpa field</span>
          </div>
          {headers.map((h) => (
            <div key={h} className="grid grid-cols-2 items-center gap-3 px-4 py-2.5 border-t border-border">
              <span className="text-sm font-mono truncate">{h}</span>
              <select
                className="border border-border rounded-[6px] px-2 py-1.5 text-sm bg-background w-full"
                value={mapping[h] || ""}
                onChange={(e) => setMapping((prev) => ({ ...prev, [h]: e.target.value }))}
              >
                <option value="">Skip this column</option>
                {entity.fields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}{f.required ? " *" : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── step 4: preview ───────────────────────────────────────────────────────

  async function runPreview() {
    if (!csv) return toast.error("No data to preview");
    setBusy(true);
    try {
      const remapped = remapCsv(csv, headers, mapping, entity);
      const res = await previewImport(entity.id, remapped);
      setPreview(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  function StepPreview() {
    const previewRows = parseCsvRows(csv, 5);
    const outputFields = entity.fields.filter((f) => Object.values(mapping).includes(f.key));

    return (
      <div>
        <h3 className="font-semibold mb-1">Review before importing</h3>
        <p className="text-sm text-muted-fg mb-4">Showing up to 5 rows from your file with the mapped columns.</p>

        {/* Preview table */}
        <div className="rounded-[10px] border border-border overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead className="bg-surface">
              <tr>
                {outputFields.map((f) => (
                  <th key={f.key} className="text-left px-3 py-2 font-semibold text-muted-fg uppercase tracking-wide">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.slice(0, 5).map((row, ri) => {
                const srcByHeader: Record<string, string> = {};
                headers.forEach((h, i) => { srcByHeader[h] = row[i] || ""; });
                return (
                  <tr key={ri} className="border-t border-border">
                    {outputFields.map((f) => {
                      const srcCols = Object.entries(mapping).filter(([, v]) => v === f.key).map(([k]) => k);
                      const val = srcCols.map((s) => srcByHeader[s] || "").find(Boolean) || "";
                      return (
                        <td key={f.key} className={`px-3 py-2 ${!val && f.required ? "text-danger" : ""}`}>
                          {val || <span className="text-muted-fg italic">empty</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* API preview result */}
        {preview && (
          <div className="rounded-[10px] border border-border bg-surface p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-success" />
              <span className="font-medium">{preview.valid} record{preview.valid !== 1 ? "s" : ""} ready to import</span>
              {(preview.duplicates?.length ?? 0) > 0 && (
                <span className="text-muted-fg text-xs">({preview.duplicates!.length} duplicate{preview.duplicates!.length !== 1 ? "s" : ""} will be skipped)</span>
              )}
            </div>
            {preview.issues.length > 0 && (
              <div className="text-danger text-xs space-y-0.5">
                {preview.issues.map((issue) => (
                  <p key={issue.line}>Line {issue.line}: {issue.error}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {!preview && (
          <Button size="sm" variant="outline" onClick={runPreview} disabled={busy}>
            {busy ? "Checking…" : "Run preview check"}
          </Button>
        )}
      </div>
    );
  }

  // ── step 5: done ──────────────────────────────────────────────────────────

  async function runCommit() {
    if (!csv) return;
    setBusy(true);
    try {
      const remapped = remapCsv(csv, headers, mapping, entity);
      const res = await commitImport(entity.id, remapped);
      setResult(res);
      setStep(5);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function StepDone() {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle2 size={40} className="mx-auto text-success" />
        <div>
          <p className="text-xl font-bold">{result?.created ?? 0} {entity.label} imported</p>
          {(result?.skipped ?? 0) > 0 && (
            <p className="text-sm text-muted-fg mt-1">{result!.skipped} already existed and were skipped.</p>
          )}
        </div>
        <Button
          onClick={() => {
            setStep(0); setCsv(""); setFile(null); setHeaders([]); setMapping({});
            setPreview(null); setResult(null);
          }}
        >
          Import another file
        </Button>
      </div>
    );
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function canGoNext() {
    if (step === 2 && !csv) return false;
    if (step === 3) {
      const unmappedRequired = entity.fields
        .filter((f) => f.required)
        .filter((f) => !Object.values(mapping).includes(f.key));
      return unmappedRequired.length === 0;
    }
    return true;
  }

  function handleNext() {
    if (step === 3) { setPreview(null); }
    setStep((s) => s + 1);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Import data"
        subtitle="Bring records from another system into Zerpa in a few steps"
      />

      <div className="max-w-3xl">
        <StepBar current={step} />

        <div className="rounded-[14px] border border-border bg-background p-6 min-h-[320px]">
          {step === 0 && <StepEntity />}
          {step === 1 && <StepSource />}
          {step === 2 && <StepUpload />}
          {step === 3 && <StepMap />}
          {step === 4 && <StepPreview />}
          {step === 5 && <StepDone />}
        </div>

        {step < 5 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              size="sm"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft size={13} className="mr-1" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              {step === 4 && preview && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={runPreview}
                >
                  Re-check
                </Button>
              )}
              {step === 4 ? (
                <Button
                  size="sm"
                  disabled={busy || !preview || preview.valid === 0}
                  onClick={runCommit}
                >
                  {busy ? "Importing…" : `Import ${preview?.valid ?? ""} records`}
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={!canGoNext()}
                  onClick={handleNext}
                >
                  {step === 3 ? "Preview" : "Next"}
                  <ArrowRight size={13} className="ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
