/**
 * @file components/analytics/page-tracker.tsx
 * @description Tells Zerpa HQ which screens are used (paths only, with record ids removed on the server),
 * batched every 15 seconds and when the tab is hidden. Nothing about the records themselves is sent.
 */
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { apiRequest, getToken } from "@/lib/api/client";

type Ev = { name: "page_view"; path: string };

function companyId() {
  try {
    const raw = localStorage.getItem("zerpa_company");
    return raw ? ((JSON.parse(raw) as { id?: string }).id ?? null) : null;
  } catch {
    return null;
  }
}

export function PageTracker() {
  const pathname = usePathname();
  const queue = useRef<Ev[]>([]);

  useEffect(() => {
    const flush = () => {
      if (!queue.current.length || !getToken() || !companyId()) return;
      const events = queue.current.splice(0, 50);
      // the shared client refreshes an expired token; on failure the views are simply dropped
      apiRequest("/events", { method: "POST", body: { events } }).catch(() => undefined);
    };
    const timer = setInterval(flush, 15000);
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, []);

  useEffect(() => {
    if (pathname) queue.current.push({ name: "page_view", path: pathname });
  }, [pathname]);

  return null;
}
