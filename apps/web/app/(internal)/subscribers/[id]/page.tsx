"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { dunningAction, getSubscriber, lookupCoverage, submitRica } from "@/lib/api/telecom";
import { uploadDocument } from "@/lib/api/documents";
import { toast } from "sonner";
import { CustomFieldsPanel } from "@/components/modules/customization/custom-fields-panel";

export default function SubscriberWorkspacePage() {
  const params = useParams();
  const id = String(params.id);
  const [row, setRow] = useState<Awaited<ReturnType<typeof getSubscriber>> | null>(null);
  const [idNumber, setIdNumber] = useState("");
  const [idDocName, setIdDocName] = useState("SA ID scan.pdf");
  const [poaName, setPoaName] = useState("Proof of address.pdf");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [poaFile, setPoaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    const data = await getSubscriber(id);
    setRow(data);
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, [id]);

  if (!row) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-fg">Loading subscriber…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={row.serviceAddress || "Subscriber"}
        subtitle={`${row.accountName || row.accountId} · RICA ${row.ricaStatus}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/subscribers">Back</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/orders">Orders</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const action = row.status === "suspended" ? "reactivate" : "suspend";
                  await dunningAction(row.id, action);
                  toast.success(action === "suspend" ? "Suspended" : "Reactivated");
                  await reload();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Dunning failed");
                }
              }}
            >
              {row.status === "suspended" ? "Reactivate" : "Suspend"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[12px] border border-border p-5 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <StatusBadge status={row.status.toUpperCase()} />
              <span className="text-xs text-muted-fg">Coverage: {row.coverageStatus}. This is a zone saved in Zerpa, not a fibre-network check.</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    const lookup = await lookupCoverage(row.serviceAddress || "");
                    toast.message(`Coverage: ${lookup.coverageStatus}`, {
                      description: lookup.fnos.map((f) => f.fnoCode).join(", ") || "No FNO match",
                    });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Lookup failed");
                  }
                }}
              >
                Re-check coverage
              </Button>
            </div>
          </div>

          <div className="rounded-[12px] border border-border p-5 space-y-3">
            <h2 className="section-title">Orders</h2>
            {(row.orders || []).length === 0 ? (
              <p className="text-sm text-muted-fg">No orders yet</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {row.orders!.map((o) => (
                  <li key={o.id} className="flex justify-between gap-2 border-b border-border pb-2">
                    <span className="font-mono">{o.number}</span>
                    <span>{o.productName}</span>
                    <StatusBadge status={o.status.toUpperCase()} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[12px] border border-border p-5 space-y-3">
            <p className="text-xs text-muted-fg">Suspending does not cut a live line.</p>
            {(row.services || []).length === 0 ? (
              <p className="text-sm text-muted-fg">No active services</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {row.services!.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <span>{s.serviceType}</span>
                    <span className="font-mono text-xs">{s.circuitId || "—"}</span>
                    <StatusBadge status={s.status.toUpperCase()} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            className="rounded-[12px] border border-border p-5 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              try {
                let idDocumentId: string | undefined;
                let proofOfAddressDocumentId: string | undefined;
                if (idFile) idDocumentId = (await uploadDocument(idFile, idDocName)).id;
                if (poaFile) proofOfAddressDocumentId = (await uploadDocument(poaFile, poaName)).id;
                await submitRica(row.id, {
                  idDocumentType: "sa_id",
                  idNumber,
                  proofOfAddressUploaded: Boolean(poaFile || poaName),
                  idDocumentName: idFile ? undefined : idDocName,
                  proofOfAddressName: poaFile ? undefined : poaName,
                  idDocumentId,
                  proofOfAddressDocumentId,
                });
                toast.success(idFile && poaFile ? "RICA submitted with the files" : "RICA submitted. Approval still needs both files.");
                setIdNumber("");
                setIdFile(null);
                setPoaFile(null);
                await reload();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "RICA failed");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <h2 className="section-title">RICA vault</h2>
            <p className="text-xs text-muted-fg">
              A filename is not the file. Approval needs the ID and the proof of address from the document store.
            </p>
            {row.ricaDetail && (
              <p className="text-xs text-muted-fg">
                Latest: {row.ricaDetail.status} · ID {row.ricaDetail.idDocumentHasFile ? "file stored" : "file missing"} · proof of address{" "}
                {row.ricaDetail.proofOfAddressHasFile ? "file stored" : "file missing"}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="idNumber">ID number</Label>
              <Input id="idNumber" required value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="idDoc">ID document name</Label>
                <Input id="idDoc" value={idDocName} onChange={(e) => setIdDocName(e.target.value)} />
                <input type="file" className="block text-xs" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="poa">PoA document name</Label>
                <Input id="poa" value={poaName} onChange={(e) => setPoaName(e.target.value)} />
                <input type="file" className="block text-xs" onChange={(e) => setPoaFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={submitting || !idNumber.trim()}>
              {submitting ? "Submitting…" : "Submit RICA + vault docs"}
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-[12px] border border-border p-5">
            <h2 className="section-title mb-3">Invoices</h2>
            {(row.invoices || []).length === 0 ? (
              <p className="text-xs text-muted-fg">None yet</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {row.invoices!.map((inv) => (
                  <li key={inv.id} className="flex justify-between gap-2">
                    <span className="font-mono">{inv.invoiceNumber}</span>
                    <span>R {Number(inv.total).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-[12px] border border-border p-5">
            <h2 className="section-title mb-3">Documents</h2>
            {(row.documents || []).length === 0 ? (
              <p className="text-xs text-muted-fg">None linked</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {row.documents!.map((d) => (
                  <li key={d.id}>
                    {d.name} <span className="text-muted-fg text-xs">({d.category}{d.hasFile ? "" : ", no file"})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <CustomFieldsPanel entity="subscriber" recordId={id} />
    </PageContainer>
  );
}
