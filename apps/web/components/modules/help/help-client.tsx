/**
 * @file components/modules/help/help-client.tsx
 * @description Help & support: ask the Zerpa team a question (the page you were on is attached),
 * and follow the replies. Answered in Zerpa HQ.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, LifeBuoy, MessageCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupportTicket, getSupportTicket, listSupportTickets, replySupportTicket, type SupportTicket } from "@/lib/api/support";
import { ApiError } from "@/lib/api/client";
import { formatDatetime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const STATUS: Record<SupportTicket["status"], { label: string; className: string }> = {
  open: { label: "With Zerpa", className: "bg-warning-bg text-warning border-warning-ring" },
  pending: { label: "Waiting for you", className: "bg-info-bg text-info border-info-ring" },
  solved: { label: "Solved", className: "bg-success-bg text-success border-success-ring" },
  closed: { label: "Closed", className: "bg-surface-2 text-muted-fg border-border" },
};
const CATEGORIES = [["question", "A question"], ["problem", "Something isn't working"], ["onboarding", "Help setting up"], ["billing", "My Zerpa bill"], ["feature", "An idea or request"]] as const;

export function HelpPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SupportTicket[] | null>(null);
  const [asking, setAsking] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "", category: "question", pageUrl: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listSupportTickets().then(setRows).catch(() => setRows([]));
    const params = new URLSearchParams(window.location.search);
    if (params.get("new")) {
      setAsking(true);
      setForm((f) => ({ ...f, pageUrl: params.get("from") ?? "" }));
    }
  }, []);

  async function submit() {
    setBusy(true);
    try {
      const t = await createSupportTicket({ ...form, subject: form.subject.trim(), body: form.body.trim(), pageUrl: form.pageUrl || undefined });
      toast.success(`Sent. Your reference is #${t.number}.`);
      router.push(`/help/tickets/${t.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send your request");
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Help & support"
          subtitle="Ask the Zerpa team anything. We reply here, and you'll get a notification and an email."
          action={!asking ? <Button className="gap-2" onClick={() => setAsking(true)}><Plus size={16} /> Ask for help</Button> : undefined}
        />
      </div>
      {asking && (
        <div className="rounded-[12px] border border-border bg-background p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Ask for help</h2>
            <button type="button" onClick={() => setAsking(false)} aria-label="Close" className="text-muted-fg hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="What is it about?">
            {CATEGORIES.map(([key, label]) => (
              <button key={key} type="button" role="radio" aria-checked={form.category === key} onClick={() => setForm({ ...form, category: key })}
                className={cn("rounded-full border px-3 py-1.5 text-sm", form.category === key ? "border-primary bg-primary-tint text-primary" : "border-border text-muted-fg")}>
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="help-subject">In a few words *</Label>
            <Input id="help-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Invoice won't send to a customer" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="help-body">Tell us more *</Label>
            <Textarea id="help-body" rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="What were you trying to do, and what happened instead?" />
          </div>
          {form.pageUrl && <p className="text-xs text-muted-fg">We&apos;ll see you were on <span className="font-mono">{form.pageUrl}</span>, so you don&apos;t need to explain where.</p>}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={busy || form.subject.trim().length < 3 || form.body.trim().length < 5}>{busy ? "Sending…" : "Send to Zerpa"}</Button>
            <Button variant="outline" onClick={() => setAsking(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}
      {rows === null ? (
        <div className="h-32 animate-pulse rounded-[12px] bg-surface" />
      ) : rows.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-10 text-center">
          <LifeBuoy className="mx-auto mb-3 text-muted-fg" size={22} />
          <p className="font-semibold">No help requests yet</p>
          <p className="text-sm text-muted-fg mt-1">Stuck on something? Ask us. A real person on the Zerpa team answers.</p>
        </div>
      ) : (
        <ul className="rounded-[12px] border border-border bg-background divide-y divide-border">
          {rows.map((t) => (
            <li key={t.id}>
              <Link href={`/help/tickets/${t.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface">
                <span className="text-xs text-muted-fg w-12 font-mono">#{t.number}</span>
                <span className="min-w-0 flex-1"><span className="block font-medium truncate">{t.subject}</span><span className="text-xs text-muted-fg">{t.requester?.name} · {formatDatetime(t.updatedAt)}</span></span>
                <span className={cn("rounded-full border px-2 py-0.5 font-mono text-xs", STATUS[t.status].className)}>{STATUS[t.status].label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}

export function HelpTicket({ id }: { id: string }) {
  const [t, setT] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSupportTicket(id).then(setT).catch(() => toast.error("Request not found"));
  }, [id]);

  async function send() {
    setBusy(true);
    try {
      setT(await replySupportTicket(id, reply.trim()));
      setReply("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  if (!t) return <PageContainer><div className="h-64 animate-pulse rounded-[12px] bg-surface" /></PageContainer>;
  return (
    <PageContainer>
      <Link href="/help" className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4 w-fit"><ArrowLeft size={14} /> Help & support</Link>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">#{t.number} {t.subject}</h1>
          <p className="text-sm text-muted-fg mt-1">Asked by {t.requester?.name} · {formatDatetime(t.createdAt)}</p>
        </div>
        <span className={cn("rounded-full border px-2.5 py-1 font-mono text-xs", STATUS[t.status].className)}>{STATUS[t.status].label}</span>
      </div>
      <ol className="space-y-3 max-w-3xl">
        {(t.messages ?? []).map((m, i) => (
          <motion.li key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
            className={cn("rounded-[12px] border p-4 text-sm", m.fromStaff ? "bg-primary-tint border-primary-ring" : "bg-background border-border ml-8")}>
            <p className="text-xs text-muted-fg mb-1 flex items-center gap-1">
              {m.fromStaff && <MessageCircle size={11} />}<span className="font-medium text-foreground">{m.author?.name}</span> · {formatDatetime(m.at)}
            </p>
            <p className="whitespace-pre-wrap">{m.body}</p>
          </motion.li>
        ))}
      </ol>
      {t.status !== "closed" && (
        <div className="max-w-3xl mt-4 space-y-2">
          <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add a reply" aria-label="Reply" />
          <Button onClick={send} disabled={busy || !reply.trim()}>{busy ? "Sending…" : "Send reply"}</Button>
        </div>
      )}
    </PageContainer>
  );
}
