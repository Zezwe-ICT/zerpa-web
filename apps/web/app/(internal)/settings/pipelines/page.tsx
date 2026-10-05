"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPipeline,
  getCustomizationMeta,
  listPipelines,
  updatePipeline,
  type CustomizationMeta,
  type Pipeline,
  type PipelineStage,
  type StageKind,
} from "@/lib/api/customization";
import { DEFAULT_LEAD_STAGES } from "@/lib/data/lead-stages";

const SELECT_CLASS = "rounded-[6px] border border-border bg-background px-3 py-2 text-sm";

export default function PipelinesSettingsPage() {
  return (
    <Suspense fallback={null}>
      <PipelinesSettings />
    </Suspense>
  );
}

function PipelinesSettings() {
  const search = useSearchParams();
  const [meta, setMeta] = useState<CustomizationMeta | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [entity, setEntity] = useState(search.get("entity") || "");
  const [stages, setStages] = useState<PipelineStage[]>([]);

  const capable = useMemo(() => meta?.entities.filter((e) => e.pipelineCapable) ?? [], [meta]);
  const pipeline = pipelines.find((p) => p.entity === entity);
  const canManage = meta?.permissions.includes("customization.manage") ?? false;

  const reload = useCallback(async () => {
    const [m, p] = await Promise.all([getCustomizationMeta(), listPipelines()]);
    setMeta(m);
    setPipelines(p);
    setEntity((current) => current || m.entities.find((e) => e.pipelineCapable)?.key || "");
  }, []);

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, [reload]);

  useEffect(() => {
    if (pipeline) setStages(pipeline.stages.map((s) => ({ key: s.key, label: s.label, kind: s.kind })));
    else setStages(entity === "lead" ? DEFAULT_LEAD_STAGES : [{ key: "", label: "New", kind: "open" }]);
  }, [pipeline, entity]);

  const isFixedLeadStage = (s: PipelineStage) => entity === "lead" && (s.key === "CLOSED_WON" || s.key === "CLOSED_LOST");

  const setStage = (i: number, patch: Partial<PipelineStage>) =>
    setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const move = (i: number, delta: number) =>
    setStages((prev) => {
      const next = [...prev];
      const j = i + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Pipelines"
        subtitle="Name the stages your team actually uses. Compliance workflows (RICA, job-card approval, tickets, invoices) stay fixed."
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-fg">Record type</span>
        <select className={SELECT_CLASS} value={entity} onChange={(e) => setEntity(e.target.value)}>
          {capable.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
        {!pipeline && entity && <span className="text-xs text-muted-fg">No pipeline yet; the stages below are a starting point.</span>}
      </div>

      <div className="rounded-[12px] border border-border divide-y divide-border">
        {stages.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-3 p-3">
            <span className="w-6 text-xs text-muted-fg">{i + 1}</span>
            <Input className="max-w-xs" value={s.label} disabled={!canManage} onChange={(e) => setStage(i, { label: e.target.value })} />
            <span className="font-mono text-xs text-muted-fg w-32 truncate">{s.key || "auto"}</span>
            <select
              className={SELECT_CLASS}
              value={s.kind}
              disabled={!canManage || isFixedLeadStage(s)}
              onChange={(e) => setStage(i, { kind: e.target.value as StageKind })}
            >
              <option value="open">Open</option>
              <option value="won">Won / done</option>
              <option value="lost">Lost / cancelled</option>
            </select>
            {canManage && (
              <div className="ml-auto flex gap-1">
                <Button size="sm" variant="outline" onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </Button>
                <Button size="sm" variant="outline" onClick={() => move(i, 1)} disabled={i === stages.length - 1}>
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isFixedLeadStage(s)}
                  onClick={() => setStages((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {canManage && entity && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setStages((prev) => [...prev, { key: "", label: "New stage", kind: "open" }])}>
            Add stage
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              try {
                if (pipeline) await updatePipeline(pipeline.id, { stages });
                else await createPipeline({ entity, stages });
                toast.success("Pipeline saved");
                await reload();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Save failed");
              }
            }}
          >
            Save pipeline
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
