/**
 * @file components/modules/documents/attachments.tsx
 * @description Files attached to a record (a supplier's bill PDF, an expense slip). Stored in
 * Documents with relatedType/relatedId, so they also show in the Documents area.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Paperclip, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listRelatedDocuments, uploadDocument, type DocumentRow } from "@/lib/api/documents";
import { downloadFile } from "@/lib/api/books";

const ACCEPT = "image/*,application/pdf";

export function Attachments({
  relatedType,
  relatedId,
  category,
  label = "Attachments",
  emptyText = "No files yet.",
  canUpload = true,
}: {
  relatedType: string;
  relatedId: string;
  category?: string;
  label?: string;
  emptyText?: string;
  canUpload?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listRelatedDocuments(relatedType, relatedId).then(setRows).catch(() => setRows([]));
  }, [relatedType, relatedId]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      await uploadDocument(file, file.name, { type: relatedType, id: relatedId, category });
      setRows(await listRelatedDocuments(relatedType, relatedId));
      toast.success(`${file.name} attached`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload the file");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="rounded-[12px] border border-border bg-background p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-fg flex items-center gap-1.5">
          <Paperclip size={12} /> {label}
        </span>
        {canUpload && (
          <>
            <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button size="sm" variant="outline" onClick={() => input.current?.click()} disabled={busy}>
              <Upload size={14} className="mr-1.5" /> {busy ? "Uploading…" : "Attach"}
            </Button>
          </>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-fg">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{d.name}</span>
              <button
                type="button"
                className="text-primary hover:underline flex items-center gap-1 text-xs flex-none"
                onClick={() => downloadFile(`/documents/${d.id}/download`, d.name).catch(() => toast.error("Could not download"))}
              >
                <Download size={12} /> Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
