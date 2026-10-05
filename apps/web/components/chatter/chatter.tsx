/**
 * @file components/chatter/chatter.tsx
 * @description Chatter for any record: log a note (with @mentions), schedule an activity, see
 * planned activities and the record's history (including automatic log lines).
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlarmClock, Check, Clock, History, Mail, MessageSquare, Phone, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/context";
import { listTeamMembers, type TeamMember } from "@/lib/api/customization";
import {
  addNote,
  completeActivity,
  getActivities,
  getTimeline,
  scheduleActivity,
  snoozeActivity,
  type Activity,
  type ActivityKind,
  type RecordType,
  type TimelineEntry,
} from "@/lib/api/chatter";
import { ApiError } from "@/lib/api/client";
import { formatDate, formatDatetime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<ActivityKind, typeof Phone> = { call: Phone, email: Mail, meeting: Users, todo: Check, follow_up: AlarmClock };
const KINDS: Array<[ActivityKind, string]> = [["call", "Call"], ["email", "Email"], ["meeting", "Meeting"], ["todo", "To-do"], ["follow_up", "Follow up"]];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function Chatter({ recordType, recordId, className }: { recordType: RecordType; recordId: string; className?: string }) {
  const { company, user } = useAuth();
  const [tab, setTab] = useState<"note" | "activity">("note");
  const [entries, setEntries] = useState<TimelineEntry[] | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  async function reload() {
    const [t, a] = await Promise.all([getTimeline(recordType, recordId), getActivities(recordType, recordId)]);
    setEntries(t);
    setActivities(a);
  }
  useEffect(() => {
    reload().catch(() => setEntries([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordType, recordId]);
  useEffect(() => {
    if (company?.id) listTeamMembers(company.id).then((m) => setMembers(m.filter((x) => x.role !== "PORTAL_USER"))).catch(() => undefined);
  }, [company?.id]);

  const planned = activities.filter((a) => !a.done);
  const feed = useMemo(() => [...(entries ?? [])].reverse(), [entries]);

  return (
    <section className={cn("rounded-[12px] border border-border bg-background", className)} aria-label="Notes and activities">
      <div className="flex border-b border-border" role="tablist">
        {([["note", "Log note", MessageSquare], ["activity", "Schedule activity", Clock]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn("relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium", tab === key ? "text-primary" : "text-muted-fg hover:text-foreground")}
          >
            <Icon size={14} /> {label}
            {tab === key && <motion.span layoutId={`chatter-tab-${recordId}`} className="absolute inset-x-2 -bottom-px h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "note" ? (
          <NoteComposer members={members} onPost={async (body, mentions) => {
            const e = await addNote(recordType, recordId, body, mentions);
            setEntries((list) => [...(list ?? []), e]);
          }} />
        ) : (
          <ActivityComposer members={members} meId={user?.id} onSchedule={async (body) => {
            const a = await scheduleActivity({ recordType, recordId, ...body });
            setActivities((list) => [...list, a]);
            setTab("note");
          }} />
        )}
      </div>

      {planned.length > 0 && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Planned</p>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {planned.map((a) => {
                const Icon = KIND_ICON[a.kind];
                return (
                  <motion.li key={a.id} layout exit={{ opacity: 0, height: 0 }} className="flex items-start gap-3 text-sm">
                    <span className={cn("mt-0.5 rounded-full p-1.5 flex-none", a.overdue ? "bg-danger-bg text-danger" : a.dueToday ? "bg-warning-bg text-warning" : "bg-surface-2 text-muted-fg")}>
                      <Icon size={12} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.summary}</p>
                      <p className={cn("text-xs", a.overdue ? "text-danger" : "text-muted-fg")}>
                        {a.overdue ? "Overdue · " : a.dueToday ? "Today · " : ""}{formatDate(a.dueDate)}
                        {a.assignee ? ` · ${a.assignee.name}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-none">
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={async () => {
                        const feedback = window.prompt("How did it go? (optional)") ?? undefined;
                        try {
                          await completeActivity(a.id, feedback || undefined);
                          await reload();
                        } catch (e) {
                          toast.error(e instanceof ApiError ? e.message : "Could not mark it done");
                        }
                      }}>
                        <Check size={12} className="mr-1" /> Done
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" title="Move to tomorrow" onClick={async () => {
                        const updated = await snoozeActivity(a.id, 1);
                        setActivities((list) => list.map((x) => (x.id === a.id ? updated : x)));
                      }}>
                        +1 day
                      </Button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <div className="border-t border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg mb-2 flex items-center gap-1.5"><History size={12} /> History</p>
        {entries === null ? (
          <div className="h-12 animate-pulse rounded-[8px] bg-surface" />
        ) : feed.length === 0 ? (
          <p className="text-sm text-muted-fg">Nothing yet. Notes, payments and changes show up here.</p>
        ) : (
          <ol className="space-y-3">
            {feed.map((e) => (
              <motion.li key={e.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm">
                {e.kind === "log" ? (
                  <p className="text-muted-fg">
                    <span className="text-foreground-2">{e.body}</span>
                    <span className="text-xs"> · {e.authorName ? `${e.authorName}, ` : ""}{formatDatetime(e.at)}</span>
                  </p>
                ) : (
                  <div className="rounded-[10px] bg-surface px-3 py-2">
                    <p className="text-xs text-muted-fg mb-0.5">
                      <span className="font-medium text-foreground">{e.authorName || "Someone"}</span> · {e.kind === "note" ? "note" : e.kind} · {formatDatetime(e.at)}
                    </p>
                    <p className="whitespace-pre-wrap">{highlightMentions(e.body)}</p>
                  </div>
                )}
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function highlightMentions(text: string) {
  return text.split(/(@[A-Z][\w'-]*(?: [A-Z][\w'-]*)?)/g).map((part, i) =>
    part.startsWith("@") ? <span key={i} className="text-primary font-medium">{part}</span> : part,
  );
}

function NoteComposer({ members, onPost }: { members: TeamMember[]; onPost: (body: string, mentions: string[]) => Promise<void> }) {
  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState<Record<string, string>>({}); // name → user id
  const [query, setQuery] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const suggestions = query === null ? [] : members
    .filter((m) => (m.user.fullName || m.user.email).toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  function onChange(value: string) {
    setBody(value);
    const caret = ref.current?.selectionStart ?? value.length;
    const match = /@([\w'-]*)$/.exec(value.slice(0, caret));
    setQuery(match ? match[1] : null);
  }

  function pick(m: TeamMember) {
    const name = m.user.fullName || m.user.email;
    const caret = ref.current?.selectionStart ?? body.length;
    const before = body.slice(0, caret).replace(/@[\w'-]*$/, `@${name} `);
    setBody(before + body.slice(caret));
    setMentions((x) => ({ ...x, [name]: m.user.id }));
    setQuery(null);
    requestAnimationFrame(() => ref.current?.focus());
  }

  async function post() {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    try {
      const ids = Object.entries(mentions).filter(([name]) => text.includes(`@${name}`)).map(([, id]) => id);
      await onPost(text, ids);
      setBody("");
      setMentions({});
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save the note");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative space-y-2">
      <Textarea
        ref={ref}
        rows={2}
        value={body}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post();
          if (e.key === "Escape") setQuery(null);
        }}
        placeholder="Write a note. Type @ to mention someone."
        aria-label="Note"
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 -mt-1 rounded-[10px] border border-border bg-background shadow-lg p-1" role="listbox" aria-label="Mention someone">
          {suggestions.map((m) => (
            <li key={m.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(m)} className="w-full text-left rounded-[6px] px-2.5 py-1.5 text-sm hover:bg-surface">
                {m.user.fullName || m.user.email}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-fg">Only your team sees notes. ⌘/Ctrl + Enter to save.</span>
        <Button size="sm" onClick={post} disabled={busy || !body.trim()}>{busy ? "Saving…" : "Log note"}</Button>
      </div>
    </div>
  );
}

function ActivityComposer({ members, meId, onSchedule }: {
  members: TeamMember[];
  meId?: string;
  onSchedule: (body: { kind: ActivityKind; summary: string; dueDate: string; assigneeId?: string }) => Promise<void>;
}) {
  const [kind, setKind] = useState<ActivityKind>("call");
  const [summary, setSummary] = useState("");
  const [due, setDue] = useState(inDays(1));
  const [assignee, setAssignee] = useState(meId ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {KINDS.map(([key, label]) => {
          const Icon = KIND_ICON[key];
          return (
            <button key={key} type="button" onClick={() => setKind(key)} aria-pressed={kind === key}
              className={cn("flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs", kind === key ? "border-primary bg-primary-tint text-primary" : "border-border text-muted-fg")}>
              <Icon size={12} /> {label}
            </button>
          );
        })}
      </div>
      <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. Call Thandi about the deposit" aria-label="What needs doing" />
      <div className="flex flex-wrap items-center gap-2">
        {([["Today", 0], ["Tomorrow", 1], ["Next week", 7]] as const).map(([label, n]) => (
          <button key={label} type="button" onClick={() => setDue(inDays(n))} className={cn("rounded-[6px] border px-2 py-1 text-xs", due === inDays(n) ? "border-primary text-primary" : "border-border text-muted-fg")}>
            {label}
          </button>
        ))}
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-8 w-40" aria-label="Due date" />
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="h-8 rounded-[8px] border border-input bg-background px-2 text-sm" aria-label="Assigned to">
          {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.id === meId ? "Me" : m.user.fullName || m.user.email}</option>)}
        </select>
      </div>
      <div className="flex justify-end">
        <Button size="sm" disabled={busy} onClick={async () => {
          setBusy(true);
          try {
            await onSchedule({ kind, summary: summary.trim(), dueDate: due, assigneeId: assignee || undefined });
            setSummary("");
            toast.success("Activity scheduled");
          } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Could not schedule it");
          } finally {
            setBusy(false);
          }
        }}>
          Schedule
        </Button>
      </div>
    </div>
  );
}
