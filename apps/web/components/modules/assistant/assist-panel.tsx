"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { decideAssist, listAssistSkills, proposeAssist, type AssistantProposal, type AssistantSkill } from "@/lib/api/assistant";
import { toast } from "sonner";

export function AssistPanel({
  recordType,
  recordId,
  title = "Zerpa Assist",
}: {
  recordType: string;
  recordId?: string;
  title?: string;
}) {
  const [skills, setSkills] = useState<AssistantSkill[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [proposal, setProposal] = useState<AssistantProposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    listAssistSkills()
      .then((res) => {
        setEnabled(res.enabled);
        setSkills(res.skills);
      })
      .catch(() => setEnabled(false));
  }, []);

  return (
    <aside className="rounded-[12px] border border-border bg-background p-5 space-y-4 h-fit sticky top-20">
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="text-xs text-muted-fg mt-1">
          Tenant-scoped suggestions. Actions that change records need your approval.
        </p>
      </div>

      {!enabled && <p className="text-xs text-warning">Assist is disabled for this environment.</p>}
      {!recordId && <p className="text-xs text-muted-fg">Select a record to run skills. Chase and quote-from-message work for the whole company.</p>}

      <textarea
        className="w-full rounded-[8px] border border-border px-3 py-2 text-sm"
        rows={3}
        placeholder="Paste a WhatsApp message to draft a quote"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div className="space-y-2">
        {skills.map((skill) => {
          const companyWide = skill.id === "chase-overdue" || skill.id === "quote-from-message";
          return (
          <Button
            key={skill.id}
            size="sm"
            variant="outline"
            className="w-full justify-start"
            disabled={!enabled || busy || (!recordId && !companyWide)}
            onClick={async () => {
              setBusy(true);
              try {
                const p = await proposeAssist({
                  skillId: skill.id,
                  recordType,
                  recordId,
                  message: skill.id === "quote-from-message" ? message : undefined,
                });
                setProposal(p);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Assist failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {skill.label}
            {skill.requiresApproval ? " · approval" : ""}
          </Button>
          );
        })}
      </div>

      {proposal && (
        <div className="rounded-[8px] border border-border bg-surface p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">{proposal.skillId}</p>
          <p className="text-sm text-foreground">{proposal.summary}</p>
          {proposal.citedRecordIds?.length > 0 && (
            <p className="text-[11px] font-mono text-muted-fg">Sources: {proposal.citedRecordIds.join(", ")}</p>
          )}
          {proposal.proposedAction?.requiresApproval && proposal.status === "draft" && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="flex-1"
                onClick={async () => {
                  const updated = await decideAssist(proposal.id, "approved");
                  setProposal(updated);
                  toast.success("Proposal approved");
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  const updated = await decideAssist(proposal.id, "rejected");
                  setProposal(updated);
                  toast.message("Proposal rejected");
                }}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
