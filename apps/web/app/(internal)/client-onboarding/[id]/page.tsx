"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getClientOnboarding,
  transitionClientOnboarding,
  updateClientOnboarding,
  upsertExternalWork,
  type ClientOnboarding,
} from "@/lib/api/msp";
import { uploadDocument } from "@/lib/api/documents";

const ONBOARDING_NEXT: Record<string, string | null> = {
  discovery: "tooling",
  tooling: "documentation",
  documentation: "golive",
  golive: "review_30",
  review_30: "completed",
  completed: null,
  cancelled: null,
};

const OFFBOARDING_NEXT: Record<string, string | null> = {
  revoke: "tools",
  tools: "final_bill",
  final_bill: "archive",
  archive: "completed",
  completed: null,
  cancelled: null,
};

const DISCOVERY_FIELDS = [
  { key: "primaryContact", label: "Primary contact" },
  { key: "sitesCount", label: "Sites count" },
  { key: "usersCount", label: "Users / endpoints" },
  { key: "existingRmm", label: "Existing RMM" },
  { key: "existingPsa", label: "Existing PSA" },
  { key: "criticalSystems", label: "Critical systems" },
  { key: "goLiveTarget", label: "Target go-live" },
];

export default function ClientOnboardingDetailPage() {
  const params = useParams<{ id: string }>();
  const [row, setRow] = useState<ClientOnboarding | null>(null);
  const [extSystem, setExtSystem] = useState("autotask");
  const [extId, setExtId] = useState("");
  const [extSubject, setExtSubject] = useState("");
  const [blockerText, setBlockerText] = useState("");

  function reload() {
    getClientOnboarding(params.id)
      .then((r) => {
        setRow(r);
        setBlockerText((r.blockers || []).join("\n"));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (!row) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-fg">Loading…</p>
      </PageContainer>
    );
  }

  const isOffboarding = row.kind === "offboarding";
  const nextMap = isOffboarding ? OFFBOARDING_NEXT : ONBOARDING_NEXT;
  const next = nextMap[row.status];
  const discovery = row.discovery || {};

  return (
    <PageContainer>
      <PageHeader
        title={row.number}
        subtitle={`${isOffboarding ? "Offboarding" : "Onboarding"} · ${row.accountName || "Client"} · ${row.ownerName || "unassigned"}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/client-onboarding">Back</Link>
            </Button>
            {next && (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    const updated = await transitionClientOnboarding(row.id, next);
                    setRow(updated);
                    toast.success(`Moved to ${next}`);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Transition failed");
                  }
                }}
              >
                Advance to {next.replace(/_/g, " ")}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={row.status.toUpperCase()} />
            <span className="text-sm text-muted-fg">{row.progress}% complete</span>
            {!isOffboarding && row.status === "documentation" && row.progress < 75 && (
              <span className="text-xs text-danger">Need ≥75% before go-live</span>
            )}
          </div>

          {!isOffboarding && (
            <div className="rounded-[12px] border border-border p-4 space-y-3">
              <h3 className="font-semibold text-sm">Discovery questionnaire</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {DISCOVERY_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Input
                      value={discovery[f.key] || ""}
                      onBlur={async (e) => {
                        try {
                          const updated = await updateClientOnboarding(row.id, {
                            discovery: { [f.key]: e.target.value },
                          });
                          setRow(updated);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Save failed");
                        }
                      }}
                      onChange={(e) =>
                        setRow({
                          ...row,
                          discovery: { ...discovery, [f.key]: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[12px] border border-border divide-y divide-border">
            {(row.checklist || []).map((item, idx) => (
              <div key={item.id} className="px-4 py-3 text-sm space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(item.done)}
                    onChange={async (e) => {
                      const checklist = row.checklist.map((c, i) => (i === idx ? { ...c, done: e.target.checked } : c));
                      try {
                        const updated = await updateClientOnboarding(row.id, { checklist });
                        setRow(updated);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Update failed");
                      }
                    }}
                  />
                  <span className={item.done ? "text-muted-fg line-through" : ""}>{item.label}</span>
                </label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Runbook URL (optional)"
                  defaultValue={item.runbookUrl || ""}
                  onBlur={async (e) => {
                    const checklist = row.checklist.map((c, i) =>
                      i === idx ? { ...c, runbookUrl: e.target.value } : c,
                    );
                    try {
                      const updated = await updateClientOnboarding(row.id, { checklist });
                      setRow(updated);
                    } catch {
                      /* ignore blur noise */
                    }
                  }}
                />
                <label className="block text-xs text-muted-fg">
                  File for this step
                  <input
                    type="file"
                    className="mt-1 block text-xs"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        const saved = await uploadDocument(file);
                        const checklist = row.checklist.map((c, i) =>
                          i === idx ? { ...c, documentId: saved.id, documentName: saved.name } : c,
                        );
                        const updated = await updateClientOnboarding(row.id, { checklist });
                        setRow(updated);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Upload failed");
                      }
                    }}
                  />
                </label>
                {item.documentName && (
                  <p className="text-xs text-muted-fg">Saved file: {item.documentName}</p>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-[12px] border border-border p-4 space-y-2">
            <Label className="text-sm font-medium">Blockers (one per line)</Label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input px-3 py-2 text-sm"
              value={blockerText}
              onChange={(e) => setBlockerText(e.target.value)}
              onBlur={async () => {
                const blockers = blockerText
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean);
                try {
                  const updated = await updateClientOnboarding(row.id, { blockers });
                  setRow(updated);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Blockers save failed");
                }
              }}
            />
          </div>

          {isOffboarding && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(row.popiaRetentionFlag)}
                onChange={async (e) => {
                  try {
                    const updated = await updateClientOnboarding(row.id, {
                      popiaRetentionFlag: e.target.checked,
                    });
                    setRow(updated);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Update failed");
                  }
                }}
              />
              POPIA retention flag set
            </label>
          )}

          {row.notes && (
            <div className="rounded-[12px] border border-border p-4 text-sm">
              <p className="font-medium mb-1">Notes</p>
              <p className="text-muted-fg whitespace-pre-wrap">{row.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[12px] border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Link external work</h3>
            <p className="text-xs text-muted-fg">Bridge a PSA/RMM ticket without replacing that system.</p>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={extSystem}
              onChange={(e) => setExtSystem(e.target.value)}
            >
              <option value="autotask">Autotask</option>
              <option value="connectwise">ConnectWise</option>
              <option value="halo">HaloPSA</option>
              <option value="ninja">NinjaOne</option>
              <option value="other">Other</option>
            </select>
            <input
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="External ticket ID"
              value={extId}
              onChange={(e) => setExtId(e.target.value)}
            />
            <input
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Subject"
              value={extSubject}
              onChange={(e) => setExtSubject(e.target.value)}
            />
            <Button
              size="sm"
              className="w-full"
              disabled={!extId.trim()}
              onClick={async () => {
                try {
                  await upsertExternalWork({
                    system: extSystem,
                    externalId: extId.trim(),
                    subject: extSubject || `Linked from ${row.number}`,
                    accountId: row.accountId,
                    status: "linked",
                  });
                  toast.success("External work linked");
                  setExtId("");
                  setExtSubject("");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Link failed");
                }
              }}
            >
              Link reference
            </Button>
          </div>
          <div className="rounded-[12px] border border-border p-4 text-sm space-y-2">
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href="/agreements">Open agreements</Link>
            </Button>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href="/tickets">Open Work Bridge</Link>
            </Button>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href="/assets">Import assets</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
