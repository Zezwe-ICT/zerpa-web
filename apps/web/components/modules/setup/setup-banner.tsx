"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { getSetupPlan } from "@/lib/api/setup";

/** Nudges owners and admins to finish guided setup until it has been applied once. */
export function SetupBanner() {
  const { company } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!company?.id) return;
    getSetupPlan(company.id)
      .then((p) => setShow(p.canApply && !p.completedAt))
      .catch(() => setShow(false));
  }, [company?.id]);

  if (!show) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <Rocket size={18} className="mt-0.5 text-primary" />
        <div>
          <p className="text-sm font-medium">Finish setting up {company?.name}</p>
          <p className="text-xs text-muted-fg">
            Pick what you track, your sales stages and your team roles. It takes about two minutes.
          </p>
        </div>
      </div>
      <Button asChild size="sm">
        <Link href="/settings/setup">Start guided setup</Link>
      </Button>
    </div>
  );
}
