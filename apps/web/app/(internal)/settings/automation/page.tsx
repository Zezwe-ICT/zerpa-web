"use client";

import { useEffect, useState } from "react";
import { Plus, X, Zap } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAutomationRule,
  listAutomationRules,
  toggleAutomationRule,
  type AutomationRule,
} from "@/lib/api/automation";
import { toast } from "sonner";

const TRIGGERS = [
  { value: "ticket.created", label: "Ticket created" },
  { value: "ticket.closed", label: "Ticket closed" },
  { value: "ticket.sla_breached", label: "Ticket SLA breached" },
  { value: "invoice.sent", label: "Invoice sent" },
  { value: "invoice.overdue", label: "Invoice overdue" },
  { value: "invoice.paid", label: "Invoice paid" },
  { value: "lead.created", label: "Lead created" },
  { value: "lead.stage_changed", label: "Lead stage changed" },
  { value: "subscriber.suspended", label: "Subscriber suspended" },
  { value: "outage.created", label: "Outage opened" },
  { value: "outage.resolved", label: "Outage resolved" },
];

const ACTIONS = [
  { value: "SEND_EMAIL", label: "Send email" },
  { value: "SEND_WHATSAPP", label: "Send WhatsApp" },
  { value: "CREATE_TICKET", label: "Create ticket" },
  { value: "NOTIFY_TEAM", label: "Notify team" },
  { value: "WEBHOOK", label: "Call webhook" },
];

export default function AutomationSettingsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState(TRIGGERS[0].value);
  const [action, setAction] = useState(ACTIONS[0].value);
  const [template, setTemplate] = useState("");

  async function reload() {
    try {
      setRules(await listAutomationRules());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Rule name required");
    setSubmitting(true);
    try {
      await createAutomationRule({
        name: name.trim(),
        trigger,
        action,
        actionPayload: template ? { template } : undefined,
        enabled: true,
      });
      toast.success("Automation rule created");
      setShowForm(false);
      setName("");
      setTemplate("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create rule");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleAutomationRule(id);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Automation"
        subtitle="Trigger → action rules. Rules run in safe mode and cannot bypass workflow state machines."
        action={
          !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={14} className="mr-1" />
              Add rule
            </Button>
          ) : undefined
        }
      />

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[12px] border border-border bg-surface p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              New automation rule
            </h3>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowForm(false)}>
              <X size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs">Rule name *</Label>
              <Input
                className="mt-1 h-9 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Notify team when SLA breached"
                required
              />
            </div>
            <div>
              <Label className="text-xs">When (trigger)</Label>
              <select
                className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
              >
                {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Then (action)</Label>
              <select
                className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            {(action === "SEND_EMAIL" || action === "SEND_WHATSAPP") && (
              <div>
                <Label className="text-xs">Email template key</Label>
                <Input
                  className="mt-1 h-9 text-sm"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="e.g. ticket_ack"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating…" : "Create rule"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-muted-fg py-4">Loading rules…</p>}

      {!loading && rules.length === 0 && !showForm && (
        <div className="rounded-[12px] border border-dashed border-border p-10 text-center">
          <Zap size={24} className="mx-auto mb-3 text-muted-fg opacity-50" />
          <p className="font-medium">No automation rules yet</p>
          <p className="text-sm text-muted-fg mt-1">Add a rule to automate notifications and actions.</p>
          <Button size="sm" className="mt-4" onClick={() => setShowForm(true)}>
            <Plus size={14} className="mr-1" />
            Add first rule
          </Button>
        </div>
      )}

      {rules.length > 0 && (
        <div className="rounded-[12px] border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Trigger</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Enabled</th>
                <th className="text-left px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-fg">
                    {TRIGGERS.find((t) => t.value === r.trigger)?.label || r.trigger}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-fg">
                    {ACTIONS.find((a) => a.value === r.action)?.label || r.action}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${r.enabled ? "text-success" : "text-muted-fg"}`}>
                      {r.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant={r.enabled ? "outline" : "default"}
                      onClick={() => handleToggle(r.id)}
                    >
                      {r.enabled ? "Disable" : "Enable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
