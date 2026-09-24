"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { createAutomationRule, listAutomationRules, toggleAutomationRule, type AutomationRule } from "@/lib/api/automation";
import { toast } from "sonner";

export default function AutomationSettingsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  async function reload() { setRules(await listAutomationRules()); }
  useEffect(() => { reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed")); }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Automation"
        subtitle="Safe trigger → condition → action rules that cannot bypass workflow machines"
        action={<Button size="sm" onClick={async () => { await createAutomationRule({ name: "Ticket created → notify", trigger: "ticket.created", action: "SEND_EMAIL", actionPayload: { template: "ticket_ack" } }); toast.success("Rule created"); await reload(); }}>Add rule</Button>}
      />
      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg"><tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Trigger</th><th className="text-left px-4 py-3">Action</th><th className="text-left px-4 py-3">Enabled</th><th className="text-left px-4 py-3" /></tr></thead>
          <tbody>{rules.map((r) => <tr key={r.id} className="border-t border-border"><td className="px-4 py-3">{r.name}</td><td className="px-4 py-3 font-mono text-xs">{r.trigger}</td><td className="px-4 py-3 font-mono text-xs">{r.action}</td><td className="px-4 py-3">{r.enabled ? 'Yes' : 'No'}</td><td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={async () => { await toggleAutomationRule(r.id); await reload(); }}>Toggle</Button></td></tr>)}</tbody>
        </table>
      </div>
    </PageContainer>
  );
}
