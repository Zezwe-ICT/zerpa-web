/**
 * @file lib/features.ts
 * @description Feature flags set in Zerpa HQ. `useFeature("key")` is false until the flags load and for unknown keys.
 */
"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/client";

let cache: { companyId: string | null; flags: Record<string, boolean> } | null = null;
let inflight: Promise<Record<string, boolean>> | null = null;

function currentCompany() {
  try {
    const raw = localStorage.getItem("zerpa_company");
    return raw ? (JSON.parse(raw) as { id?: string }).id ?? null : null;
  } catch {
    return null;
  }
}

export function loadFeatures(): Promise<Record<string, boolean>> {
  const companyId = currentCompany();
  if (cache && cache.companyId === companyId) return Promise.resolve(cache.flags);
  inflight ??= apiRequest<{ flags: Record<string, boolean> }>("/features")
    .then((r) => {
      cache = { companyId, flags: r.flags };
      return r.flags;
    })
    .catch(() => ({}))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useFeature(key: string): boolean {
  const [on, setOn] = useState(() => Boolean(cache?.flags[key]));
  useEffect(() => {
    let live = true;
    loadFeatures().then((flags) => live && setOn(Boolean(flags[key])));
    return () => {
      live = false;
    };
  }, [key]);
  return on;
}
