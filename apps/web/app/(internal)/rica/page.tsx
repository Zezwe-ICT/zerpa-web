"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { listSubscribers, reviewRica, submitRica } from "@/lib/api/telecom";
import { uploadDocument } from "@/lib/api/documents";
import type { TelecomSubscriber } from "@zerpa/shared-types";
import { toast } from "sonner";

export default function RicaPage() {
  const [subs, setSubs] = useState<TelecomSubscriber[]>([]);
  const [subscriberId, setSubscriberId] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [poaFile, setPoaFile] = useState<File | null>(null);

  useEffect(() => {
    listSubscribers().then(setSubs).catch(() => undefined);
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="RICA"
        subtitle="Approval needs the ID file and the proof of address. A name on its own cannot be approved."
      />
      <div className="max-w-lg space-y-4 rounded-[12px] border border-border p-5">
        <label className="block text-sm space-y-1.5">
          <span className="text-xs font-semibold uppercase text-muted-fg">Subscriber</span>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={subscriberId}
            onChange={(e) => setSubscriberId(e.target.value)}
          >
            <option value="">Select…</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.serviceAddress || s.id} · {s.ricaStatus}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm space-y-1.5">
          <span className="text-xs font-semibold uppercase text-muted-fg">SA ID / Passport</span>
          <input
            className="w-full h-10 rounded-md border border-input px-3 text-sm"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="Stored masked"
          />
        </label>
        <label className="block text-sm space-y-1.5">
          <span className="text-xs font-semibold uppercase text-muted-fg">ID file</span>
          <input type="file" className="block text-sm" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
        </label>
        <label className="block text-sm space-y-1.5">
          <span className="text-xs font-semibold uppercase text-muted-fg">Proof of address</span>
          <input type="file" className="block text-sm" onChange={(e) => setPoaFile(e.target.files?.[0] || null)} />
        </label>
        <Button
          disabled={!subscriberId || idNumber.length < 4 || !idFile || !poaFile}
          onClick={async () => {
            try {
              const idDocument = await uploadDocument(idFile!);
              const proof = await uploadDocument(poaFile!);
              const rica = await submitRica(subscriberId, {
                idDocumentType: "sa_id",
                idNumber,
                proofOfAddressUploaded: true,
                idDocumentId: idDocument.id,
                proofOfAddressDocumentId: proof.id,
              });
              toast.success(`RICA submitted (${rica.idNumberMasked})`);
              setSubs(await listSubscribers());
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          Submit RICA
        </Button>

        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-xs text-muted-fg">Pending reviews appear on the subscriber record after submit.</p>
          {subs
            .filter((s) => s.ricaStatus === "pending")
            .map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{s.serviceAddress || s.id}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const ricaId = (s as { rica?: { id: string }[] }).rica?.[0]?.id;
                      if (!ricaId) {
                        toast.message("Reload after submit to review");
                        return;
                      }
                      try {
                        await reviewRica(ricaId, "approved");
                        toast.success("RICA approved");
                        setSubs(await listSubscribers());
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Could not approve RICA");
                      }
                    }}
                  >
                    Approve latest
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </PageContainer>
  );
}
