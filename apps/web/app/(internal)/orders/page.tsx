"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createOrder,
  createPlan,
  createCoverage,
  listFnoBoard,
  listOrders,
  listPlans,
  listSubscribers,
  provisionOrder,
  transitionOrder,
  updateOrder,
  type TelecomPlan,
} from "@/lib/api/telecom";
import { canTransition, SERVICE_ORDER_MACHINE } from "@/lib/workflows";
import type { TelecomServiceOrder, TelecomSubscriber } from "@zerpa/shared-types";
import { AssistPanel } from "@/components/modules/assistant/assist-panel";
import { toast } from "sonner";

export default function OrdersPage() {
  const [orders, setOrders] = useState<TelecomServiceOrder[]>([]);
  const [subscribers, setSubscribers] = useState<TelecomSubscriber[]>([]);
  const [plans, setPlans] = useState<TelecomPlan[]>([]);
  const [fnoQueue, setFnoQueue] = useState<
    Array<TelecomServiceOrder & { serviceAddress?: string; fnoBoardStatus?: string }>
  >([]);
  const [selected, setSelected] = useState<TelecomServiceOrder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showFno, setShowFno] = useState(false);
  const [subscriberId, setSubscriberId] = useState("");
  const [planId, setPlanId] = useState("");
  const [productName, setProductName] = useState("50Mbps Fibre");
  const [monthlyFee, setMonthlyFee] = useState("1299");
  const [onceOffFee, setOnceOffFee] = useState("0");
  const [planCode, setPlanCode] = useState("FIBRE-50");
  const [planName, setPlanName] = useState("50Mbps Fibre");
  const [planMrr, setPlanMrr] = useState("1299");
  const [planOnce, setPlanOnce] = useState("999");
  const [fnoCode, setFnoCode] = useState("VUMATEL");
  const [coverageLabel, setCoverageLabel] = useState("");
  const [cpeSerial, setCpeSerial] = useState("");
  const [simIccid, setSimIccid] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    const [rows, subs, planRows, fnoRows] = await Promise.all([
      listOrders(),
      listSubscribers(),
      listPlans().catch(() => [] as TelecomPlan[]),
      listFnoBoard().catch(() => []),
    ]);
    setOrders(rows);
    setSubscribers(subs);
    setPlans(planRows);
    setFnoQueue(fnoRows);
    if (!subscriberId && subs[0]) setSubscriberId(subs[0].id);
    if (!planId && planRows[0]) {
      setPlanId(planRows[0].id);
      setProductName(planRows[0].name);
      setMonthlyFee(String(planRows[0].monthlyFee));
      setOnceOffFee(String(planRows[0].onceOffFee));
    }
    if (selected) {
      setSelected(rows.find((r) => r.id === selected.id) ?? rows[0] ?? null);
    }
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load orders"));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Service orders"
        subtitle="Order → RICA → provisioning → activation"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowFno((v) => !v)}>
              {showFno ? "Hide FNO board" : "FNO board"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCatalog((v) => !v)}>
              {showCatalog ? "Close catalog" : "Catalog / coverage"}
            </Button>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Close" : "New order"}
            </Button>
          </div>
        }
      />

      {showCatalog && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <form
            className="rounded-[12px] border border-border p-5 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createPlan({
                  code: planCode,
                  name: planName,
                  monthlyFee: Number(planMrr) || 0,
                  onceOffFee: Number(planOnce) || 0,
                  fnoCode,
                  serviceType: "fibre",
                });
                toast.success("Plan created");
                await reload();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Plan create failed");
              }
            }}
          >
            <h2 className="section-title">New plan</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input value={planCode} onChange={(e) => setPlanCode(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>FNO</Label>
                <Input value={fnoCode} onChange={(e) => setFnoCode(e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Name</Label>
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>MRR</Label>
                <Input type="number" value={planMrr} onChange={(e) => setPlanMrr(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Once-off</Label>
                <Input type="number" value={planOnce} onChange={(e) => setPlanOnce(e.target.value)} />
              </div>
            </div>
            <Button type="submit" size="sm">Add plan</Button>
            {plans.length > 0 && (
              <ul className="text-xs text-muted-fg space-y-1 pt-2 border-t border-border">
                {plans.map((p) => (
                  <li key={p.id}>{p.code} · {p.name} · R{p.monthlyFee}/mo</li>
                ))}
              </ul>
            )}
          </form>
          <form
            className="rounded-[12px] border border-border p-5 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createCoverage({
                  label: coverageLabel,
                  fnoCode,
                  status: "covered",
                  planCodes: plans.map((p) => p.code),
                });
                toast.success("Coverage zone saved");
                setCoverageLabel("");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Coverage failed");
              }
            }}
          >
            <h2 className="section-title">Coverage zone</h2>
            <div className="space-y-1.5">
              <Label>Address / area label</Label>
              <Input
                required
                value={coverageLabel}
                onChange={(e) => setCoverageLabel(e.target.value)}
                placeholder="12 Long St Cape Town"
              />
            </div>
            <p className="text-xs text-muted-fg">This checks zones saved in Zerpa. It does not ask a fibre network.</p>
            <Button type="submit" size="sm">Save coverage</Button>
          </form>
        </div>
      )}

      {showForm && (
        <form
          className="mb-6 max-w-xl rounded-[12px] border border-border p-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!subscriberId) {
              toast.error("Create a subscriber first");
              return;
            }
            setSubmitting(true);
            try {
              const order = await createOrder({
                subscriberId,
                planId: planId || undefined,
                productName: productName || undefined,
                monthlyFee: Number(monthlyFee) || 0,
                onceOffFee: Number(onceOffFee) || 0,
              });
              toast.success(`Created ${order.number}`);
              setShowForm(false);
              await reload();
              setSelected(order);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Create failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <h2 className="section-title">New service order</h2>
          <div className="space-y-1.5">
            <Label htmlFor="subscriber">Subscriber</Label>
            <select
              id="subscriber"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={subscriberId}
              onChange={(e) => setSubscriberId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select subscriber
              </option>
              {subscribers.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.serviceAddress || s.id).slice(0, 48)} · {s.ricaStatus}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan">Plan (optional)</Label>
            <select
              id="plan"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={planId}
              onChange={(e) => {
                const next = e.target.value;
                setPlanId(next);
                const plan = plans.find((p) => p.id === next);
                if (plan) {
                  setProductName(plan.name);
                  setMonthlyFee(String(plan.monthlyFee));
                  setOnceOffFee(String(plan.onceOffFee));
                }
              }}
            >
              <option value="">Custom product</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product">Product</Label>
            <Input id="product" required value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mrr">Monthly fee (ZAR)</Label>
              <Input id="mrr" type="number" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="once">Once-off (ZAR)</Label>
              <Input id="once" type="number" value={onceOffFee} onChange={(e) => setOnceOffFee(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={submitting || !subscriberId}>
            {submitting ? "Creating…" : "Create order"}
          </Button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[12px] border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
                <tr>
                  <th className="text-left px-4 py-3">Order</th>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Blockers</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-border hover:bg-surface cursor-pointer"
                    onClick={() => setSelected(o)}
                  >
                    <td className="px-4 py-3 font-mono">{o.number}</td>
                    <td className="px-4 py-3">{o.productName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status.toUpperCase()} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-fg">
                      {o.blockers?.length ? o.blockers.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className="rounded-[12px] border border-border p-5 space-y-3">
              <h2 className="section-title">Order detail · {selected.number}</h2>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <Label>Upstream / FNO ref</Label>
                  <Input
                    defaultValue={selected.upstreamOrderRef || ""}
                    onBlur={async (e) => {
                      try {
                        const updated = await updateOrder(selected.id, { upstreamOrderRef: e.target.value });
                        setSelected(updated);
                        await reload();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Save failed");
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Install date</Label>
                  <Input
                    type="datetime-local"
                    defaultValue={
                      selected.installDate
                        ? new Date(selected.installDate).toISOString().slice(0, 16)
                        : ""
                    }
                    onBlur={async (e) => {
                      try {
                        const updated = await updateOrder(selected.id, {
                          installDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                        });
                        setSelected(updated);
                        await reload();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Save failed");
                      }
                    }}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Blockers (comma-separated)</Label>
                  <Input
                    defaultValue={(selected.blockers || []).join(", ")}
                    onBlur={async (e) => {
                      try {
                        const blockers = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const updated = await updateOrder(selected.id, { blockers });
                        setSelected(updated);
                        await reload();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Save failed");
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>CPE serial (provision)</Label>
                  <Input value={cpeSerial} onChange={(e) => setCpeSerial(e.target.value)} placeholder="Optional" />
                </div>
                <div className="space-y-1">
                  <Label>SIM ICCID</Label>
                  <Input value={simIccid} onChange={(e) => setSimIccid(e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <h3 className="text-sm font-medium pt-2">Transitions</h3>
              <div className="flex flex-wrap gap-2">
                {(SERVICE_ORDER_MACHINE[selected.status] ?? []).map((to) => (
                  <Button
                    key={to}
                    size="sm"
                    variant="outline"
                    disabled={!canTransition(SERVICE_ORDER_MACHINE, selected.status, to)}
                    onClick={async () => {
                      try {
                        const updated = await transitionOrder(selected.id, to);
                        toast.success(`Moved to ${to}`);
                        setSelected(updated);
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Transition blocked");
                      }
                    }}
                  >
                    → {to}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <p className="w-full text-xs text-muted-fg">
                  RADIUS and MikroTik here are stubs. Suspending does not cut a live line. Manual FNO is a board, not the fibre network.
                </p>
                {(
                  [
                    ["radius_stub", "RADIUS stub"],
                    ["mikrotik_stub", "MikroTik stub"],
                    ["manual_fno", "Manual FNO"],
                  ] as const
                ).map(([adapter, label]) => (
                  <Button
                    key={adapter}
                    size="sm"
                    variant={adapter === "manual_fno" ? "outline" : "default"}
                    onClick={async () => {
                      try {
                        await provisionOrder(selected.id, {
                          adapter,
                          cpeSerial: cpeSerial || undefined,
                          simIccid: simIccid || undefined,
                        });
                        toast.success(`${label} provisioned`);
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Provisioning blocked");
                      }
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {showFno && (
            <div className="rounded-[12px] border border-border p-5 space-y-3">
              <h2 className="section-title">Manual FNO board</h2>
              <p className="text-xs text-muted-fg">RICA approved · awaiting FNO / provisioning</p>
              {fnoQueue.length === 0 ? (
                <p className="text-sm text-muted-fg">Queue empty.</p>
              ) : (
                <ul className="space-y-3">
                  {fnoQueue.map((o) => (
                    <li key={o.id} className="rounded-md border border-border p-3 text-sm space-y-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-mono">{o.number}</span>
                        <StatusBadge status={(o.fnoBoardStatus || "awaiting").toUpperCase()} />
                      </div>
                      <p className="text-muted-fg text-xs">{o.serviceAddress || o.productName}</p>
                      <div className="flex flex-wrap gap-1">
                        {(["awaiting", "submitted", "delayed", "ready"] as const).map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await updateOrder(o.id, { fnoBoardStatus: st });
                                toast.success(`FNO → ${st}`);
                                await reload();
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "Update failed");
                              }
                            }}
                          >
                            {st}
                          </Button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <AssistPanel
          recordType="service_order"
          recordId={selected?.id}
          title={selected ? `Assist · ${selected.number}` : "Zerpa Assist"}
        />
      </div>
    </PageContainer>
  );
}
