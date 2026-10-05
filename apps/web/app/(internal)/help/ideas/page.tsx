/**
 * @file app/(internal)/help/ideas/page.tsx
 * @description Ideas board: vote for what Zerpa builds next, or suggest something new (similar ideas are shown first).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronUp, Lightbulb, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listIdeas, submitIdea, unvoteIdea, voteIdea, type Idea } from "@/lib/api/ideas";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<Idea["status"], string> = {
  under_review: "bg-surface-2 text-muted-fg border-border",
  planned: "bg-info-bg text-info border-info-ring",
  in_progress: "bg-warning-bg text-warning border-warning-ring",
  shipped: "bg-success-bg text-success border-success-ring",
  declined: "bg-surface-2 text-muted-fg border-border",
};
const FILTERS = [["", "All"], ["planned", "Planned"], ["in_progress", "In progress"], ["shipped", "Shipped"]] as const;

function VoteButton({ idea, onChange }: { idea: Idea; onChange: (i: Idea) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={busy || idea.status === "shipped"} aria-pressed={idea.voted} aria-label={idea.voted ? "Remove your vote" : "Vote for this"}
      onClick={async () => {
        setBusy(true);
        try {
          onChange(idea.voted ? await unvoteIdea(idea.id) : await voteIdea(idea.id));
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Could not vote");
        } finally {
          setBusy(false);
        }
      }}
      className={cn("flex flex-col items-center justify-center w-14 h-14 shrink-0 rounded-[10px] border transition-colors",
        idea.voted ? "border-primary bg-primary-tint text-primary" : "border-border hover:border-primary text-muted-fg hover:text-primary")}>
      <ChevronUp size={16} />
      <span className="font-mono text-sm font-semibold">{idea.votes}</span>
    </button>
  );
}

export default function IdeasPage() {
  const [rows, setRows] = useState<Idea[] | null>(null);
  const [sort, setSort] = useState<"top" | "new">("top");
  const [status, setStatus] = useState("");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [similar, setSimilar] = useState<Idea[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listIdeas({ sort, status }).then(setRows).catch(() => setRows([]));
  }, [sort, status]);

  function onTitle(v: string) {
    setTitle(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 4) return setSimilar([]);
    timer.current = setTimeout(() => listIdeas({ q: v.trim() }).then((r) => setSimilar(r.slice(0, 4))).catch(() => undefined), 350);
  }

  const replace = (i: Idea) => {
    setRows((r) => r && r.map((x) => (x.id === i.id ? i : x)));
    setSimilar((r) => r.map((x) => (x.id === i.id ? i : x)));
  };

  async function submit() {
    setBusy(true);
    try {
      const i = await submitIdea(title.trim(), description.trim());
      setRows((r) => [i, ...(r ?? [])]);
      setAdding(false);
      setTitle("");
      setDescription("");
      setSimilar([]);
      toast.success("Thanks. You'll hear from us if it's planned.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send your idea");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <Link href="/help" className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4 w-fit"><ArrowLeft size={14} /> Help & support</Link>
      <div className="mb-6">
        <PageHeader title="Ideas" subtitle="Vote for what Zerpa builds next. When something you voted for is planned or ships, we'll let you know."
          action={!adding ? <Button className="gap-2" onClick={() => setAdding(true)}><Plus size={16} /> Suggest an idea</Button> : undefined} />
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-[12px] border border-border bg-background p-5 mb-6 space-y-3 max-w-3xl">
              <Input value={title} onChange={(e) => onTitle(e.target.value)} placeholder="What should Zerpa do? e.g. Send invoice reminders on WhatsApp" autoFocus aria-label="Idea" />
              {similar.length > 0 && (
                <div className="rounded-[10px] bg-surface p-3 space-y-2">
                  <p className="text-xs text-muted-fg">Already suggested? Vote instead:</p>
                  {similar.map((i) => (
                    <div key={i.id} className="flex items-center gap-3"><VoteButton idea={i} onChange={replace} /><span className="text-sm">{i.title}</span></div>
                  ))}
                </div>
              )}
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="How would it help your business? (optional)" aria-label="Details" />
              <div className="flex gap-2">
                <Button onClick={submit} disabled={busy || title.trim().length < 5}>{busy ? "Sending…" : "Send idea"}</Button>
                <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 mb-4 max-w-3xl">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setStatus(k)} className={cn("rounded-full border px-3 py-1 text-sm", status === k ? "border-primary bg-primary-tint text-primary" : "border-border text-muted-fg")}>{label}</button>
        ))}
        <span className="flex-1" />
        <button type="button" onClick={() => setSort(sort === "top" ? "new" : "top")} className="text-sm text-muted-fg hover:text-foreground">Sort: {sort === "top" ? "Most votes" : "Newest"}</button>
      </div>

      {rows === null ? <div className="h-40 animate-pulse rounded-[12px] bg-surface max-w-3xl" /> : rows.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-10 text-center max-w-3xl">
          <Lightbulb className="mx-auto mb-3 text-muted-fg" size={22} />
          <p className="font-semibold">No ideas here yet</p>
          <p className="text-sm text-muted-fg mt-1">Be the first to suggest one.</p>
        </div>
      ) : (
        <ul className="space-y-3 max-w-3xl">
          {rows.map((i, n) => (
            <motion.li key={i.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(n, 10) * 0.03 } }}
              className="flex gap-4 rounded-[12px] border border-border bg-background p-4">
              <VoteButton idea={i} onChange={replace} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{i.title}</p>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-mono", STATUS_STYLE[i.status])}>{i.statusLabel}</span>
                </div>
                {i.description && <p className="text-sm text-muted-fg mt-1 line-clamp-2">{i.description}</p>}
                {i.publicNote && <p className="text-sm mt-2 rounded-[8px] bg-primary-tint px-3 py-2"><span className="font-medium">Zerpa:</span> {i.publicNote}</p>}
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
