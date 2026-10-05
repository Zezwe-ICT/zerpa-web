/**
 * @file components/announcements/announcement-banner.tsx
 * @description A dismissible banner under the top bar, published from Zerpa HQ (maintenance notices, new features).
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Info, Megaphone, TriangleAlert, X } from "lucide-react";
import { loadAnnouncements, markAnnouncement, type Announcement } from "@/lib/api/announcements";
import { cn } from "@/lib/utils";

const TONE = {
  info: { cls: "bg-info-bg border-info-ring text-foreground", icon: Info, iconCls: "text-info" },
  success: { cls: "bg-success-bg border-success-ring text-foreground", icon: Megaphone, iconCls: "text-success" },
  warning: { cls: "bg-warning-bg border-warning-ring text-foreground", icon: TriangleAlert, iconCls: "text-warning" },
};

export function AnnouncementBanner() {
  const [rows, setRows] = useState<Announcement[]>([]);
  useEffect(() => {
    loadAnnouncements().then((f) => {
      setRows(f.banners);
      f.banners.filter((b) => !b.seen && !b.incident).forEach((b) => markAnnouncement(b.id, "seen"));
    });
  }, []);

  const dismiss = (id: string) => {
    setRows((r) => r.filter((x) => x.id !== id));
    markAnnouncement(id, "dismiss");
  };

  return (
    <AnimatePresence initial={false}>
      {rows.map((a) => {
        const t = TONE[a.tone];
        return (
          <motion.div key={a.id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div role="status" className={cn("flex items-center gap-3 border-b px-6 py-2.5 text-sm", t.cls)}>
              <t.icon size={16} className={cn("shrink-0", t.iconCls)} />
              <p className="flex-1 min-w-0"><span className="font-medium">{a.title}</span>{a.body && <span className="text-muted-fg"> · {a.body.split("\n")[0].replace(/[#*`>]/g, "").slice(0, 160)}</span>}</p>
              {a.ctaUrl && (
                <Link href={a.ctaUrl} onClick={() => !a.incident && markAnnouncement(a.id, "click")} className="shrink-0 font-medium text-primary hover:underline" {...(a.ctaUrl.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                  {a.ctaLabel || "Learn more"}
                </Link>
              )}
              {!a.incident && <button type="button" onClick={() => dismiss(a.id)} aria-label="Dismiss" className="shrink-0 text-muted-fg hover:text-foreground"><X size={15} /></button>}
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
