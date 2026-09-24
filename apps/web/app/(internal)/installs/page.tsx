"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  activateService,
  listInstalls,
  updateInstall,
  type InstallJob,
} from "@/lib/api/telecom";
import { toast } from "sonner";

export default function InstallsPage() {
  const [rows, setRows] = useState<InstallJob[]>([]);
  const [serials, setSerials] = useState<Record<string, string>>({});

  async function reload() {
    setRows(await listInstalls());
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load installs"));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Field installs"
        subtitle="Mobile-friendly checklist and CPE capture before activate"
      />
      <div className="space-y-4">
        {rows.map((job) => (
          <div key={job.id} className="rounded-[12px] border border-border p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-muted-fg">{job.number}</p>
                <p className="font-medium">{job.productName}</p>
                <p className="text-sm text-muted-fg">{job.serviceAddress || "No address"}</p>
              </div>
              <p className="text-sm tabular-nums">{job.checklistProgress}%</p>
            </div>
            <ul className="space-y-2">
              {job.installChecklist.map((item, idx) => (
                <li key={item.id || idx} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!item.done}
                    onChange={async (e) => {
                      const next = job.installChecklist.map((c, i) =>
                        i === idx ? { ...c, done: e.target.checked } : c,
                      );
                      try {
                        await updateInstall(job.id, { installChecklist: next });
                        await reload();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Update failed");
                      }
                    }}
                  />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-muted-fg">CPE serial</label>
                <Input
                  value={serials[job.id] ?? job.cpeSerial ?? ""}
                  onChange={(e) => setSerials((s) => ({ ...s, [job.id]: e.target.value }))}
                  placeholder="Serial"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await updateInstall(job.id, {
                      cpeSerial: serials[job.id] || job.cpeSerial || "",
                    });
                    toast.success("CPE saved");
                    await reload();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Save failed");
                  }
                }}
              >
                Save CPE
              </Button>
              {job.serviceId && (
                <Button
                  size="sm"
                  disabled={!job.checklistComplete}
                  onClick={async () => {
                    try {
                      await activateService(job.serviceId!);
                      toast.success("Service activated");
                      await reload();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Activate blocked");
                    }
                  }}
                >
                  Activate
                </Button>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted-fg">No installs in progress.</p>
        )}
      </div>
    </PageContainer>
  );
}
