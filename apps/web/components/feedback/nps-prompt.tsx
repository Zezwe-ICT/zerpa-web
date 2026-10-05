/**
 * @file components/feedback/nps-prompt.tsx
 * @description A small card, now and then (at most once a quarter), asking how likely people are to recommend Zerpa.
 * Answers go to Zerpa HQ and into the company's health score.
 */
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { dismissNps, npsDue, sendNps } from "@/lib/api/feedback";
import { cn } from "@/lib/utils";

const SEEN_KEY = "zerpa-nps-checked";

export function NpsPrompt() {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage blocked: still fine to check */
    }
    const t = setTimeout(() => npsDue().then((due) => due && setOpen(true)).catch(() => undefined), 8000);
    return () => clearTimeout(t);
  }, []);

  function pick(n: number) {
    setScore(n);
    sendNps(n).catch(() => undefined);
  }

  function close() {
    if (score === null && !done) dismissNps().catch(() => undefined);
    setOpen(false);
  }

  async function finish() {
    if (score !== null && comment.trim()) await sendNps(score, comment.trim()).catch(() => undefined);
    setDone(true);
    setTimeout(() => setOpen(false), 1800);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="How likely are you to recommend Zerpa?"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:w-[400px] rounded-[14px] border border-border bg-background p-5 shadow-xl"
        >
          <button type="button" onClick={close} aria-label="Not now" className="absolute right-3 top-3 text-muted-fg hover:text-foreground"><X size={16} /></button>
          {done ? (
            <p className="text-sm font-medium py-2">Thank you. The team reads every answer.</p>
          ) : score === null ? (
            <>
              <p className="text-sm font-semibold pr-6">How likely are you to recommend Zerpa to another business owner?</p>
              <div className="mt-4 grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, n) => (
                  <button key={n} type="button" onClick={() => pick(n)}
                    className="h-8 rounded-[6px] border border-border text-xs font-mono hover:border-primary hover:bg-primary-tint hover:text-primary transition-colors">
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-fg"><span>Not likely</span><span>Very likely</span></div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-sm font-semibold pr-6">
                {score >= 9 ? "Great to hear. What do you like most?" : score >= 7 ? "Thanks. What would make Zerpa a 10?" : "Sorry about that. What's getting in the way?"}
              </p>
              <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="mt-3" placeholder="Optional" aria-label="Tell us more" autoFocus />
              <div className="mt-3 flex items-center justify-between">
                <span className={cn("text-xs text-muted-fg")}>You chose {score}</span>
                <Button size="sm" onClick={finish}>{comment.trim() ? "Send" : "Done"}</Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
