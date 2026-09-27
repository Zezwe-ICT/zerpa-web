/**
 * @file hooks/use-permissions.ts
 * @description What the signed-in person may do in the active company (from /me/permissions),
 * for showing or hiding actions. The API still checks every request.
 */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { getMyPermissions } from "@/lib/api/customization";

export function usePermissions() {
  const { company } = useAuth();
  const [perms, setPerms] = useState<Set<string> | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!company?.id) return;
    let cancelled = false;
    getMyPermissions()
      .then((r) => {
        if (cancelled) return;
        setPerms(new Set(r.permissions));
        setRole(r.role);
      })
      .catch(() => !cancelled && setPerms(new Set()));
    return () => {
      cancelled = true;
    };
  }, [company?.id]);

  return {
    loaded: perms !== null,
    role,
    can: (perm: string) => Boolean(perms && (perms.has(perm) || perms.has("*"))),
  };
}
