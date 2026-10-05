/**
 * @file components/layouts/notification-bell.tsx
 * @description Top-bar bell: unread count, recent notifications (quote accepted/declined, payments),
 * mark as read, and jump to the related quote or invoice. Refreshes every minute and on window focus.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCircle2, CreditCard, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { getNotifications, markNotificationsRead, type AppNotification } from "@/lib/api/notifications";
import { relativeTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ReactNode> = {
  quote_accepted: <CheckCircle2 size={16} className="text-primary" />,
  quote_declined: <XCircle size={16} className="text-danger" />,
  payment_received: <CreditCard size={16} className="text-primary" />,
};

export function NotificationBell() {
  const { company } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!company?.id) return;
    getNotifications(15)
      .then((res) => {
        setItems(res.items);
        setUnread(res.unread);
      })
      .catch(() => undefined);
  }, [company?.id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  async function openItem(n: AppNotification) {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      markNotificationsRead({ ids: [n.id] }).catch(() => undefined);
    }
    if (n.link) router.push(n.link);
  }

  async function markAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await markNotificationsRead({ all: true }).catch(() => undefined);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        className="relative p-2 hover:bg-surface rounded-[6px] transition-colors"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell size={16} className="text-foreground-2" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-[10px] font-semibold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-[12px] border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs text-primary hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-fg">
                Nothing yet. You&apos;ll hear here when customers accept quotes or pay.
              </li>
            )}
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left hover:bg-surface border-b border-border last:border-0",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <span className="mt-0.5 shrink-0">{ICONS[n.kind] ?? <Bell size={16} className="text-muted-fg" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", !n.read && "font-semibold")}>{n.title}</span>
                    {n.body && <span className="block text-xs text-muted-fg line-clamp-2 mt-0.5">{n.body}</span>}
                    <span className="block text-[11px] text-muted-fg mt-1">{relativeTime(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-4 py-2 text-right">
            <Link href="/settings/notifications" onClick={() => setOpen(false)} className="text-xs text-muted-fg hover:text-foreground">
              Notification settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
