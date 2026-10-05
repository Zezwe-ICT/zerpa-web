/**
 * @file components/announcements/whats-new.tsx
 * @description Top-bar button with an unread dot; opens a panel of recent product updates published from Zerpa HQ.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Gift } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { loadAnnouncements, markAllSeen, markAnnouncement, type Announcement } from "@/lib/api/announcements";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

export function WhatsNew() {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAnnouncements().then((f) => {
      setRows(f.whatsNew);
      setUnread(f.unread);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread) {
      setUnread(0);
      markAllSeen();
    }
  }

  if (rows.length === 0) return null;
  return (
    <div className="relative" ref={box}>
      <button type="button" onClick={toggle} aria-label="What's new" aria-expanded={open} title="What's new"
        className="relative p-2 rounded-[6px] text-muted-fg hover:text-foreground hover:bg-surface">
        <Gift size={18} />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto rounded-[12px] border border-border bg-background shadow-xl z-50">
            <p className="sticky top-0 bg-background border-b border-border px-4 py-3 text-sm font-semibold">What&apos;s new in Zerpa</p>
            <ul className="divide-y divide-border">
              {rows.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <p className="text-[11px] text-muted-fg flex items-center gap-1.5">
                    {!a.seen && <span className="size-1.5 rounded-full bg-primary" />}{formatDate(a.publishedAt)}
                  </p>
                  <p className={cn("text-sm font-medium mt-0.5")}>{a.title}</p>
                  {a.body && <Markdown source={a.body} className="text-[13px] text-muted-fg [&_p]:my-1.5" />}
                  {a.ctaUrl && (
                    <Link href={a.ctaUrl} onClick={() => { markAnnouncement(a.id, "click"); setOpen(false); }}
                      className="inline-block mt-1 text-sm font-medium text-primary hover:underline" {...(a.ctaUrl.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                      {a.ctaLabel || "Take a look"}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
