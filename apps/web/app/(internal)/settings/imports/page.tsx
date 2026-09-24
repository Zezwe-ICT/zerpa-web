"use client";
import { useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { commitCustomers, previewCustomers, sourceLabel, type ImportPreview } from "@/lib/api/imports";
import { toast } from "sonner";

export default function ImportsPage() {
  const [csv, setCsv] = useState("name,email,phone\n");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);

  async function runPreview() {
    setBusy(true);
    try {
      const res = await previewCustomers({ csv, file });
      setPreview(res);
      const skipped = res.duplicates?.length ?? 0;
      toast.message(
        skipped
          ? `${res.valid} new, ${skipped} already here`
          : `${res.valid} customer${res.valid === 1 ? "" : "s"} ready`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that file");
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    setBusy(true);
    try {
      const res = await commitCustomers({ csv, file });
      const skipped = res.skipped ?? 0;
      toast.success(
        skipped
          ? `Imported ${res.created}. Skipped ${skipped} already here.`
          : `Imported ${res.created}.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not import customers");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Imports"
        subtitle="Bring in customers from Excel, a Sage or Xero export, or Google Contacts. People already here are skipped."
      />
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium">Upload a file</span>
        <input
          type="file"
          accept=".csv,.xlsx,text/csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
          }}
        />
      </label>
      <p className="mb-2 text-xs text-muted-fg">Or paste the sheet. The first row is the column names.</p>
      <textarea
        className="w-full min-h-48 rounded-md border border-input p-3 text-sm font-mono"
        value={csv}
        onChange={(e) => {
          setCsv(e.target.value);
          setFile(null);
          setPreview(null);
        }}
      />
      <div className="flex gap-3 mt-4">
        <Button variant="outline" disabled={busy} onClick={runPreview}>Preview</Button>
        <Button disabled={busy} onClick={runCommit}>Import</Button>
      </div>
      {preview && (
        <div className="mt-4 space-y-2 rounded-[12px] border border-border p-4 text-sm">
          <p>Read as a {sourceLabel(preview.source)}.</p>
          <p>{preview.valid} new customer{preview.valid === 1 ? "" : "s"}.</p>
          {(preview.duplicates?.length ?? 0) > 0 && (
            <p>{preview.duplicates!.length} already in Zerpa and will be skipped: {preview.duplicates!.map((row) => row.name).join(", ")}.</p>
          )}
          {preview.issues.length > 0 && (
            <p className="text-danger">{preview.issues.map((issue) => `Line ${issue.line}: ${issue.error}`).join(" ")}</p>
          )}
        </div>
      )}
    </PageContainer>
  );
}
