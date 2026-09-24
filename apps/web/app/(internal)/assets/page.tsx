"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { listAssets, updateAsset } from "@/lib/api/msp";
import { commitImport, previewImport } from "@/lib/api/verticals";
import { toast } from "sonner";

const SAMPLE = `accountName,name,assetType,serialNumber,siteName,status
Client A,Firewall-01,firewall,SN-1001,,active
Client A,AP-Lobby,access_point,SN-2002,,active`;

export default function AssetsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [csv, setCsv] = useState(SAMPLE);
  const [preview, setPreview] = useState<{ valid: number; issues: Array<{ line: number; error: string }> } | null>(
    null,
  );
  const [history, setHistory] = useState<Record<string, Array<{ id: string; field: string; before: string; after: string }>>>({});

  async function reload() {
    setRows(await listAssets());
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Assets" subtitle="Tracked client devices and configuration items" />

      <div className="mb-6 rounded-[12px] border border-border p-5 space-y-3 max-w-3xl">
        <h2 className="section-title">CSV import</h2>
        <p className="text-xs text-muted-fg">
          Columns: accountId or accountName, name, assetType, serialNumber, siteName, status
        </p>
        <Label className="text-xs">CSV</Label>
        <textarea
          className="w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-xs font-mono"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const res = await previewImport("assets", csv);
                setPreview(res);
                toast.success(`${res.valid} valid row(s)`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Preview failed");
              }
            }}
          >
            Preview
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              try {
                const res = await commitImport("assets", csv);
                toast.success(`Imported ${res.created} asset(s)`);
                setPreview(null);
                await reload();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Import failed");
              }
            }}
          >
            Commit import
          </Button>
        </div>
        {preview && preview.issues.length > 0 && (
          <ul className="text-xs text-danger space-y-1">
            {preview.issues.map((i) => (
              <li key={`${i.line}-${i.error}`}>
                Line {i.line}: {i.error}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Warranty ends</th>
              <th className="text-left px-4 py-3">History</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">{row.assetType}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    defaultValue={row.warrantyEnds || ""}
                    onBlur={async (e) => {
                      try {
                        const updated = await updateAsset(row.id, { warrantyEnds: e.target.value || null });
                        setHistory((prev) => ({ ...prev, [row.id]: updated.history || [] }));
                        await reload();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Could not save the warranty");
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-muted-fg">
                  {(history[row.id] || []).map((event) => (
                    <p key={event.id}>{event.field}: {event.before || "—"} → {event.after || "—"}</p>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
