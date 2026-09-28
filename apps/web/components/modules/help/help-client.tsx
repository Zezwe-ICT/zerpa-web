/**
 * @file components/modules/help/help-client.tsx
 * @description Help & support: search the help centre (articles for the screen you came from first),
 * read an article, or ask the Zerpa team (the page you were on is attached) and follow the replies.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, ChevronRight, LifeBuoy, MessageCircle, Plus, Search, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Markdown } from "@/components/markdown";
import {
  allHelp, getHelpArticle, HELP_CATEGORIES, helpForPage, searchHelp, sendHelpFeedback, type HelpArticle, type HelpArticleSummary,
} from "@/lib/api/help";
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

function ArticleList({ rows }: { rows: HelpArticleSummary[] }) {
  return (
    <ul className="rounded-[12px] border border-border bg-background divide-y divide-border">
      {rows.map((a) => (
        <li key={a.id}>
          <Link href={`/help/articles/${a.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
            <BookOpen size={16} className="text-primary shrink-0" />
            <span className="min-w-0 flex-1"><span className="block font-medium">{a.title}</span>{a.summary && <span className="block text-xs text-muted-fg truncate">{a.summary}</span>}</span>
            <ChevronRight size={14} className="text-muted-fg" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function HelpPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SupportTicket[] | null>(null);
  const [asking, setAsking] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "", category: "question", pageUrl: "" });
  const [busy, setBusy] = useState(false);
  const [from, setFrom] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<HelpArticleSummary[] | null>(null);
  const [forPage, setForPage] = useState<HelpArticleSummary[]>([]);
  const [all, setAll] = useState<HelpArticleSummary[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listSupportTickets().then(setRows).catch(() => setRows([]));
    allHelp().then(setAll).catch(() => undefined);
    const params = new URLSearchParams(window.location.search);
    const page = params.get("from") ?? "";
    setFrom(page);
    setForm((f) => ({ ...f, pageUrl: page }));
    if (page) helpForPage(page).then(setForPage).catch(() => undefined);
    if (params.get("new")) setAsking(true);
  }, []);

  function onSearch(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    timer.current = setTimeout(() => {
      searchHelp(value.trim(), from || undefined).then(setResults).catch(() => setResults([]));
    }, 400);
  }

  function ask() {
    setAsking(true);
    if (q.trim() && !form.subject) setForm((f) => ({ ...f, subject: q.trim().slice(0, 120) }));
  }

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

  const byCategory = all.reduce<Record<string, HelpArticleSummary[]>>((acc, a) => ((acc[a.category] ??= []).push(a), acc), {});

  return (
    <PageContainer>
      <div className="mb-6">
        <PageHeader
          title="Help & support"
          subtitle="Ask the Zerpa team anything. We reply here, and you'll get a notification and an email."
          action={!asking ? <Button className="gap-2" onClick={ask}><Plus size={16} /> Ask the Zerpa team</Button> : undefined}
        />
      </div>
      {!asking && (
        <div className="mb-8 space-y-5">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-fg" />
            <Input value={q} onChange={(e) => onSearch(e.target.value)} placeholder="Search help, e.g. “send a quote” or “connect PayFast”" className="h-12 pl-11 text-base" aria-label="Search help" autoFocus />
          </div>
          {results !== null ? (
            results.length ? (
              <div className="space-y-2">
                <ArticleList rows={results} />
                <p className="text-sm text-muted-fg">Not what you need? <button type="button" onClick={ask} className="text-primary hover:underline">Ask the Zerpa team</button></p>
              </div>
            ) : (
              <div className="rounded-[12px] border border-border bg-background p-6 text-center">
                <p className="font-medium">No articles about &ldquo;{q}&rdquo; yet</p>
                <p className="text-sm text-muted-fg mt-1">We&apos;ve noted it so we can write one. In the meantime a real person can help.</p>
                <Button className="mt-3" onClick={ask}>Ask the Zerpa team</Button>
              </div>
            )
          ) : (
            <>
              {forPage.length > 0 && (
                <section className="space-y-2">
                  <h2 className="section-title">Help for the page you were on</h2>
                  <ArticleList rows={forPage} />
                </section>
              )}
              {Object.keys(byCategory).length > 0 && (
                <section className="space-y-2">
                  <h2 className="section-title">Browse</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(byCategory).map(([cat, list]) => (
                      <div key={cat} className="rounded-[12px] border border-border bg-background p-4">
                        <p className="text-xs font-medium text-muted-fg uppercase tracking-wide mb-2">{HELP_CATEGORIES[cat] ?? cat}</p>
                        <ul className="space-y-1.5">
                          {list.map((a) => <li key={a.id}><Link href={`/help/articles/${a.slug}`} className="text-sm hover:text-primary">{a.title}</Link></li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
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
      <h2 className="section-title mb-2">Your requests</h2>
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

export function HelpArticleView({ slug }: { slug: string }) {
  const [a, setA] = useState<HelpArticle | null>(null);
  const [vote, setVote] = useState<"yes" | "no" | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getHelpArticle(slug).then((r) => {
      setA(r);
      setVote(r.yourVote);
    }).catch(() => toast.error("Article not found"));
  }, [slug]);

  async function rate(helpful: boolean) {
    setVote(helpful ? "yes" : "no");
    setSent(false);
    await sendHelpFeedback(slug, helpful).catch(() => undefined);
  }

  async function sendComment() {
    await sendHelpFeedback(slug, vote === "yes", comment.trim()).catch(() => undefined);
    setSent(true);
    setComment("");
  }

  if (!a) return <PageContainer><div className="h-64 animate-pulse rounded-[12px] bg-surface" /></PageContainer>;
  return (
    <PageContainer>
      <Link href="/help" className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4 w-fit"><ArrowLeft size={14} /> Help & support</Link>
      <article className="max-w-3xl">
        <p className="text-xs font-medium text-muted-fg uppercase tracking-wide">{HELP_CATEGORIES[a.category] ?? a.category}</p>
        <h1 className="page-title mt-1">{a.title}</h1>
        {a.summary && <p className="text-muted-fg mt-2">{a.summary}</p>}
        <Markdown source={a.body} className="mt-6 text-[15px]" />
      </article>
      <div className="max-w-3xl mt-10 rounded-[12px] border border-border bg-background p-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-medium text-sm flex-1">Did this help?</p>
          <Button variant={vote === "yes" ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => rate(true)}><ThumbsUp size={14} /> Yes</Button>
          <Button variant={vote === "no" ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => rate(false)}><ThumbsDown size={14} /> No</Button>
        </div>
        {vote && !sent && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <div className="pt-4 space-y-2">
              <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={vote === "no" ? "What was missing or unclear?" : "Anything we could add? (optional)"} aria-label="Feedback" />
              <div className="flex gap-2">
                <Button size="sm" onClick={sendComment} disabled={!comment.trim()}>Send</Button>
                {vote === "no" && <Link href={`/help?new=1&from=${encodeURIComponent(`/help/articles/${a.slug}`)}`}><Button size="sm" variant="outline">Ask the Zerpa team instead</Button></Link>}
              </div>
            </div>
          </motion.div>
        )}
        {sent && <p className="text-sm text-muted-fg mt-3">Thanks, the team will read it.</p>}
      </div>
      {a.related.length > 0 && (
        <div className="max-w-3xl mt-8 space-y-2">
          <h2 className="section-title">Related</h2>
          <ArticleList rows={a.related} />
        </div>
      )}
    </PageContainer>
  );
}
