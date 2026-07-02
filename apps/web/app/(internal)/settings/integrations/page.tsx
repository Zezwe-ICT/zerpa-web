/**
 * @file app/(internal)/settings/integrations/page.tsx
 * @description Integrations settings — lists available third-party integrations
 * and their connection status. Reads from the settings mock data.
 */
"use client";

import { INTEGRATIONS } from "@/lib/data/settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plug } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  connected: "bg-success-bg text-success",
  disconnected: "bg-surface-2 text-muted-fg",
  error: "bg-danger-bg text-danger",
};

export default function IntegrationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="section-title">Integrations</h2>
        <p className="text-sm text-muted-fg mt-1">
          Connect Zerpa to the tools your team already uses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.id}
            className="rounded-[12px] border border-border bg-background p-5 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-surface border border-border flex items-center justify-center flex-shrink-0">
                <Plug size={18} className="text-muted-fg" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{integration.name}</p>
                <p className="text-xs text-muted-fg mt-0.5 max-w-xs">
                  {integration.description}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs mt-2 capitalize",
                    STATUS_STYLES[integration.status] ??
                      "bg-surface-2 text-muted-fg"
                  )}
                >
                  {integration.status}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant={integration.status === "connected" ? "outline" : "default"}
            >
              {integration.status === "connected" ? "Manage" : "Connect"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
