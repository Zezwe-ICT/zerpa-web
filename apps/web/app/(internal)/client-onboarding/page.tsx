"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Workflow } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getExternalWorkRollup,
  getMspSettings,
  importPsaTime,
  listClientOnboardings,
  listExternalWork,
  syncExternalWork,
  updateMspSettings,
  type ClientOnboarding,
  type ExternalWorkRef,
  type ExternalWorkRollup,
  type MspPackSettings,
} from "@/lib/api/msp";
import { ZerpaLoader } from "@/components/brand/zerpa-loader";

export default function ClientOnboardingListPage() {
  const [rows, setRows] = useState<ClientOnboarding[]>([]);
  const [settings, setSettings] = useState<MspPackSettings | null>(null);
  const [bridge, setBridge] = useState<ExternalWorkRef[]>([]);
  const [rollup, setRollup] = useState<ExternalWorkRollup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listClientOnboardings(),
      getMspSettings().catch(() => null),
      listExternalWork().catch(() => []),
      getExternalWorkRollup().catch(() => null),
    ])
      .then(([onboardings, pack, refs, roll]) => {
        setRows(onboardings);
        setSettings(pack);
        setBridge(refs);
        setRollup(roll);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Client Onboarding"
        subtitle="Lifecycle workspace — discovery through go-live and 30-day review"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link
                href="/client-onboarding/new"
                onClick={(e) => {
                  e.preventDefault();
                  sessionStorage.setItem("zerpa.onboardingKind", "project");
                  window.location.href = "/client-onboarding/new?kind=project&template=m365_cutover";
                }}
              >
                M365 cutover
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/client-onboarding/new">Start onboarding</Link>
            </Button>
          </div>
        }
      />

      {settings && (
        <div className="mb-6 rounded-[12px] border border-border bg-surface p-4 text-sm flex flex-wrap gap-4 items-center justify-between">
          <div>
            <p className="font-medium">
              Desk mode: {settings.deskMode === "lite" ? "Lite Zerpa desk" : "Bridge to existing PSA/RMM"}
            </p>
            <p className="text-muted-fg mt-1">
              {[settings.existingPsa && `PSA: ${settings.existingPsa}`, settings.existingRmm && `RMM: ${settings.existingRmm}`, settings.accountingSystem && `Accounting: ${settings.accountingSystem}`]
                .filter(Boolean)
                .join(" · ") || "Configure PSA/RMM during company setup or in settings."}
            </p>
            <p className="text-muted-fg mt-1">
              PSA sync writes a sample time entry. It does not log into Halo, Autotask, or ConnectWise.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const res = await syncExternalWork(settings.existingPsa || "halo");
                  setBridge(res.items);
                  toast.success(`Synced ${res.synced} from ${res.adapter}`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "PSA sync failed");
                }
              }}
            >
              Sync PSA work
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const res = await importPsaTime(settings.existingPsa || "halo");
                  toast.success(`Imported ${res.imported} time entr${res.imported === 1 ? "y" : "ies"}`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Time import failed");
                }
              }}
            >
              Import PSA time
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={settings.deskMode === "lite" ? "/tickets" : "/client-onboarding"}>
                {settings.deskMode === "lite" ? "Open Lite desk" : "Manage external work"}
              </Link>
            </Button>
          </div>
          <div className="w-full flex flex-wrap gap-3 items-center border-t border-border pt-3 mt-1">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-fg">Accounting</span>
              <select
                className="rounded-md border border-border bg-background px-2 py-1"
                value={settings.accountingSystem || "xero"}
                onChange={async (e) => {
                  try {
                    const next = await updateMspSettings({ accountingSystem: e.target.value });
                    setSettings(next);
                    toast.success(`Accounting export → ${e.target.value}`);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Update failed");
                  }
                }}
              >
                <option value="xero">Xero</option>
                <option value="sage">Sage</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!settings.emailIntakeEnabled}
                onChange={async (e) => {
                  try {
                    const next = await updateMspSettings({ emailIntakeEnabled: e.target.checked });
                    setSettings(next);
                    toast.success(e.target.checked ? "Email intake enabled" : "Email intake disabled");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Update failed");
                  }
                }}
              />
              Email intake
            </label>
            {settings.emailIntakeEnabled && settings.emailIntakeSecret && (
              <code className="text-xs font-mono text-muted-fg truncate max-w-[240px]">
                secret: {settings.emailIntakeSecret}
              </code>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <ZerpaLoader />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No client onboardings yet"
          description="Start a checklist for a new managed client — agreements and tooling tracked here, not as tickets."
          action={{ label: "Start onboarding", onClick: () => (window.location.href = "/client-onboarding/new") }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-[12px] border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
                <tr>
                  <th className="text-left px-4 py-3">Onboarding</th>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border hover:bg-surface">
                    <td className="px-4 py-3">
                      <Link href={`/client-onboarding/${row.id}`} className="font-mono text-primary hover:underline">
                        {row.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{row.accountName || row.accountId}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status.toUpperCase()} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-border overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${row.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-fg">{row.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-[12px] border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm">External work refs</h3>
            <p className="text-xs text-muted-fg">Linked tickets from Autotask, ConnectWise, Halo, Ninja, etc.</p>
            {rollup && (
              <div className="text-xs space-y-1 border-b border-border pb-3">
                <p className="text-muted-fg">
                  SIAM rollup: {rollup.totals.refs} refs · {rollup.totals.accounts} accounts ·{" "}
                  {rollup.totals.systems} systems
                </p>
                {rollup.bySystem.map((s) => (
                  <p key={s.system}>
                    <span className="uppercase font-medium">{s.system}</span> — {s.open} open / {s.total} total
                  </p>
                ))}
              </div>
            )}
            {bridge.length === 0 ? (
              <p className="text-sm text-muted-fg">No linked external work yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {bridge.slice(0, 8).map((ref) => (
                  <li key={ref.id} className="rounded-[8px] border border-border p-2">
                    <p className="font-medium">{ref.subject || ref.externalId}</p>
                    <p className="text-xs text-muted-fg uppercase">{ref.system} · {ref.status || "synced"}</p>
                  </li>
                ))}
              </ul>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  const res = await syncExternalWork(settings?.existingPsa || "connectwise");
                  setBridge(res.items);
                  setRollup(await getExternalWorkRollup());
                  toast.success(`Synced ${res.synced} from ${res.adapter}`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Sync failed");
                }
              }}
            >
              Sync ConnectWise / PSA
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
