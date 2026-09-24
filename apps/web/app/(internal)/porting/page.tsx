"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createNumberPort,
  listNumberPorts,
  listSubscribers,
  transitionNumberPort,
  type NumberPortRequest,
} from "@/lib/api/telecom";
import { toast } from "sonner";

export default function PortingPage() {
  const [rows, setRows] = useState<NumberPortRequest[]>([]);
  const [subscriberId, setSubscriberId] = useState("");
  const [number, setNumber] = useState("");
  const [donor, setDonor] = useState("");
  const [subs, setSubs] = useState<Array<{ id: string; serviceAddress: string }>>([]);

  async function reload() {
    setRows(await listNumberPorts());
  }

  useEffect(() => {
    Promise.all([listNumberPorts(), listSubscribers()])
      .then(([ports, subscribers]) => {
        setRows(ports);
        setSubs(subscribers.map((s) => ({ id: s.id, serviceAddress: s.serviceAddress || s.id })));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Number porting" subtitle="A port saved here stays in Zerpa. It is not sent to the donor network." />
      <form
        className="mb-6 flex flex-wrap gap-2 items-end rounded-[12px] border border-border p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await createNumberPort({
              subscriberId,
              number,
              donorNetwork: donor,
            });
            toast.success("Port requested");
            setNumber("");
            await reload();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Create failed");
          }
        }}
      >
        <div>
          <label className="text-xs text-muted-fg">Subscriber</label>
          <select
            className="block rounded-md border border-border bg-background px-2 py-1.5 text-sm min-w-[180px]"
            value={subscriberId}
            onChange={(e) => setSubscriberId(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.serviceAddress}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-fg">Number</label>
          <Input value={number} onChange={(e) => setNumber(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-muted-fg">Donor network</label>
          <Input value={donor} onChange={(e) => setDonor(e.target.value)} placeholder="Vodacom…" />
        </div>
        <Button type="submit" size="sm">
          Request port
        </Button>
      </form>
      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-fg">
            <tr>
              <th className="text-left px-4 py-3">Number</th>
              <th className="text-left px-4 py-3">Donor</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono">{r.number}</td>
                <td className="px-4 py-3">{r.donorNetwork || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status.toUpperCase()} />
                </td>
                <td className="px-4 py-3 space-x-1">
                  {["submitted", "accepted", "completed"].map((to) => (
                    <Button
                      key={to}
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await transitionNumberPort(r.id, to);
                          toast.success(`→ ${to}`);
                          await reload();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Blocked");
                        }
                      }}
                    >
                      {to}
                    </Button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
