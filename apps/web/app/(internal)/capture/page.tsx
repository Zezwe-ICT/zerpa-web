"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  FileText,
  Hash,
  MessageSquare,
  Mic,
  Phone,
  Plus,
  Search,
  Tag,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";

type Category =
  | "meeting_note"
  | "complaint"
  | "requirement"
  | "lead"
  | "call_log"
  | "demo_feedback"
  | "support";

type LogTarget = "lead" | "ticket" | "job_card";

interface CaptureNote {
  id: string;
  category: Category;
  subject: string;
  body: string;
  tags: string[];
  savedAt: string;
  synced?: boolean;
}

const CATEGORIES: Array<{ value: Category; label: string; icon: React.ComponentType<any> }> = [
  { value: "meeting_note", label: "Meeting note", icon: MessageSquare },
  { value: "lead", label: "Lead", icon: Hash },
  { value: "requirement", label: "Requirement", icon: FileText },
  { value: "complaint", label: "Complaint", icon: AlertCircle },
  { value: "call_log", label: "Call log", icon: Phone },
  { value: "support", label: "Support", icon: Tag },
];

const LOG_TARGETS: Array<{ value: LogTarget; label: string; endpoint: string }> = [
  { value: "lead", label: "Save as a lead", endpoint: "/crm/leads" },
  { value: "ticket", label: "Open a ticket", endpoint: "/msp/tickets" },
  { value: "job_card", label: "Create a job card", endpoint: "/automotive/job-cards" },
];

function storageKey(companyId: string) {
  return `zerpa:capture:${companyId}`;
}

function catColor(c: Category) {
  const map: Record<Category, string> = {
    meeting_note: "bg-primary/10 text-primary",
    lead: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    requirement: "bg-violet/10 text-violet-700",
    complaint: "bg-danger/10 text-danger",
    call_log: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
    support: "bg-surface text-muted-fg border border-border",
    demo_feedback: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  };
  return map[c] || "bg-surface text-muted-fg border border-border";
}

export default function CapturePage() {
  const { company } = useAuth();
  const [notes, setNotes] = useState<CaptureNote[]>([]);
  const [online, setOnline] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "">("");
  const tagInput = useRef<HTMLInputElement>(null);

  // Form
  const [category, setCategory] = useState<Category>("meeting_note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [logTarget, setLogTarget] = useState<LogTarget>("lead");
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!company?.id) return;
    try {
      setNotes(JSON.parse(localStorage.getItem(storageKey(company.id)) || "[]"));
    } catch {
      setNotes([]);
    }
  }, [company?.id]);

  function persist(next: CaptureNote[]) {
    if (!company?.id) return;
    setNotes(next);
    localStorage.setItem(storageKey(company.id), JSON.stringify(next));
  }

  function addTag() {
    const t = tagDraft.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagDraft("");
    tagInput.current?.focus();
  }

  function removeTag(t: string) { setTags((prev) => prev.filter((x) => x !== t)); }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return toast.error("Subject is required");
    persist([
      {
        id: crypto.randomUUID(),
        category,
        subject: subject.trim(),
        body: body.trim(),
        tags,
        savedAt: new Date().toISOString(),
      },
      ...notes,
    ]);
    setSubject(""); setBody(""); setTags([]); setTagDraft("");
    toast.success("Saved on this device");
  }

  async function sync(note: CaptureNote, target: LogTarget) {
    const { endpoint } = LOG_TARGETS.find((t) => t.value === target)!;
    setSyncing(note.id);
    try {
      const payload: Record<string, string> = {
        title: note.subject,
        notes: note.body,
        category: note.category,
      };
      if (target === "lead") {
        payload.companyName = note.subject;
      } else if (target === "ticket") {
        payload.subject = note.subject;
        payload.description = note.body;
        payload.source = "capture";
      } else if (target === "job_card") {
        payload.vehicleReg = note.subject;
        payload.complaint = note.body;
      }
      await apiRequest(endpoint, { method: "POST", body: payload });
      const updated = notes.map((n) => n.id === note.id ? { ...n, synced: true } : n);
      persist(updated);
      toast.success(`Saved as ${LOG_TARGETS.find((t) => t.value === target)?.label}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSyncing(null);
    }
  }

  function deleteNote(id: string) {
    persist(notes.filter((n) => n.id !== id));
  }

  const filtered = notes.filter((n) => {
    if (filterCat && n.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return n.subject.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q));
    }
    return true;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Capture"
        subtitle="Field notes and intel — save offline, log when ready"
        action={
          online ? (
            <span className="flex items-center gap-1.5 text-xs text-success">
              <Wifi size={13} /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-fg">
              <WifiOff size={13} /> Offline
            </span>
          )
        }
      />

      {/* New note form */}
      <form onSubmit={handleSave} className="rounded-[12px] border border-border bg-background p-5 mb-6 space-y-4">
        <p className="text-xs font-semibold text-muted-fg uppercase tracking-wide">New capture</p>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                category === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface text-muted-fg border-border hover:border-primary/50"
              }`}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Subject *</Label>
            <input
              type="text"
              className="mt-1 w-full rounded-[8px] border border-border bg-background px-3 py-2 text-sm"
              placeholder="Company name, person, or short description"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <textarea
              className="mt-1 w-full min-h-[80px] rounded-[8px] border border-border bg-background px-3 py-2 text-sm resize-none"
              placeholder="What was discussed, required, complained about, or agreed…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div>
            <Label className="text-xs">Tags</Label>
            <div className="mt-1 flex flex-wrap gap-2 items-center">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 bg-surface border border-border rounded-full px-2.5 py-1 text-xs">
                  #{t}
                  <button type="button" onClick={() => removeTag(t)}><X size={10} /></button>
                </span>
              ))}
              <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                <input
                  ref={tagInput}
                  type="text"
                  className="flex-1 rounded-[6px] border border-border bg-background px-2.5 py-1.5 text-xs"
                  placeholder="Add tag…"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                />
                <Button type="button" size="sm" variant="outline" onClick={addTag} className="h-7 px-2"><Plus size={11} /></Button>
              </div>
            </div>
          </div>

          {/* Voice note placeholder */}
          <div className="flex items-center gap-2 p-3 rounded-[8px] border border-dashed border-border text-xs text-muted-fg">
            <Mic size={13} className="opacity-50" />
            <span>Voice notes — coming soon. For now, paste a transcript above.</span>
          </div>
        </div>

        <Button type="submit" size="sm">Save on this device</Button>
      </form>

      {/* Saved notes */}
      {notes.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
              <input
                type="text"
                placeholder="Search notes…"
                className="w-full pl-8 pr-3 h-8 rounded-[8px] border border-border text-sm bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-border rounded-[8px] px-3 text-sm bg-background h-8"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value as Category | "")}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            {filtered.map((note) => {
              const CatIcon = CATEGORIES.find((c) => c.value === note.category)?.icon || FileText;
              return (
                <div
                  key={note.id}
                  className={`rounded-[12px] border p-4 space-y-2 ${note.synced ? "border-border opacity-70" : "border-border bg-background"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${catColor(note.category)}`}>
                        <CatIcon size={10} />
                        {CATEGORIES.find((c) => c.value === note.category)?.label || note.category}
                      </span>
                      {note.synced && (
                        <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">Synced</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteNote(note.id)}
                      className="text-muted-fg hover:text-danger transition-colors flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="font-semibold text-sm">{note.subject}</p>
                  {note.body && <p className="text-sm text-muted-fg leading-relaxed">{note.body}</p>}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((t) => (
                        <span key={t} className="text-xs text-muted-fg bg-surface border border-border rounded-full px-2 py-0.5">#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                    <p className="text-xs text-muted-fg flex-1">
                      {new Date(note.savedAt).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {!note.synced && online && (
                      <div className="flex items-center gap-2">
                        <select
                          className="border border-border rounded-[6px] px-2 py-1 text-xs bg-background"
                          value={logTarget}
                          onChange={(e) => setLogTarget(e.target.value as LogTarget)}
                        >
                          {LOG_TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={syncing === note.id}
                          onClick={() => sync(note, logTarget)}
                          className="text-xs h-7"
                        >
                          {syncing === note.id ? "Saving…" : "Log it"}
                        </Button>
                      </div>
                    )}
                    {!online && !note.synced && (
                      <span className="text-xs text-muted-fg flex items-center gap-1">
                        <WifiOff size={10} /> Waiting for connection
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {notes.length === 0 && (
        <div className="text-center py-12 text-muted-fg">
          <MessageSquare size={28} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nothing captured yet</p>
          <p className="text-sm mt-1">Notes are saved on this device until you log them.</p>
        </div>
      )}
    </PageContainer>
  );
}
