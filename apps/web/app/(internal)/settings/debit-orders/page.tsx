"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";

interface Mandate {
  id: string;
  customer: string;
  accountNumber: string;
  bankName: string;
  status: string;
}
interface Collection {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  failureReason: string;
}
interface AccountRow { id: string; name: string }
interface InvoiceRow { id: string; invoiceNumber: string; status: string }

export default function DebitOrdersPage() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [form, setForm] = useState({ accountId: "", accountHolder: "", bankName: "", accountNumber: "", status: "pending" });
  const [collect, setCollect] = useState({ mandateId: "", invoiceId: "" });

  async function load() {
    const [m, c, a, i] = await Promise.all([
      apiRequest<Mandate[]>("/billing/mandates"),
      apiRequest<Collection[]>("/billing/collections"),
      apiRequest<AccountRow[]>("/crm/accounts"),
      apiRequest<InvoiceRow[]>("/billing/invoices"),
    ]);
    setMandates(m);
    setCollections(c);
    setAccounts(a);
    setInvoices(i);
  }

  useEffect(() => {
    load().catch((e) => toast.error(e instanceof Error ? e.message : "Could not load debit orders"));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Debit orders"
        subtitle="Save a DebiCheck-style mandate and record what the bank did. Live Netcash submission stays queued until it is connected."
      />
      <form
        className="max-w-lg space-y-3 mb-8"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await apiRequest("/billing/mandates", { method: "POST", body: form });
            setForm({ ...form, accountNumber: "" });
            await load();
            toast.success("Mandate saved. The full account number is not shown again.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not save the mandate");
          }
        }}
      >
        <select className="w-full rounded-[8px] border border-border px-3 py-2" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
          <option value="">Customer</option>
          {accounts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
        <input className="w-full rounded-[8px] border border-border px-3 py-2" placeholder="Account holder" value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} />
        <input className="w-full rounded-[8px] border border-border px-3 py-2" placeholder="Bank" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
        <input className="w-full rounded-[8px] border border-border px-3 py-2" placeholder="Account number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
        <select className="w-full rounded-[8px] border border-border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button type="submit">Save mandate</Button>
      </form>

      <ul className="space-y-2 mb-8">
        {mandates.map((row) => (
          <li key={row.id} className="text-sm">{row.customer} · {row.bankName} · {row.accountNumber} · {row.status}</li>
        ))}
      </ul>

      <form
        className="max-w-lg space-y-3 mb-8"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await apiRequest("/billing/collections", { method: "POST", body: collect });
            await load();
            toast.success("Collection queued. It has not been sent to the bank.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not queue the collection");
          }
        }}
      >
        <select className="w-full rounded-[8px] border border-border px-3 py-2" value={collect.mandateId} onChange={(e) => setCollect({ ...collect, mandateId: e.target.value })}>
          <option value="">Mandate</option>
          {mandates.filter((row) => row.status === "active").map((row) => <option key={row.id} value={row.id}>{row.customer}</option>)}
        </select>
        <select className="w-full rounded-[8px] border border-border px-3 py-2" value={collect.invoiceId} onChange={(e) => setCollect({ ...collect, invoiceId: e.target.value })}>
          <option value="">Invoice</option>
          {invoices.map((row) => <option key={row.id} value={row.id}>{row.invoiceNumber} · {row.status}</option>)}
        </select>
        <Button type="submit" variant="outline">Queue collection</Button>
      </form>

      <ul className="space-y-2">
        {collections.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span>{row.invoiceNumber} · R {row.amount} · {row.status}{row.failureReason ? ` · ${row.failureReason}` : ""}</span>
            {row.status === "queued" && (
              <>
                <Button size="sm" onClick={() => result(row.id, "paid")}>Mark paid</Button>
                <Button size="sm" variant="outline" onClick={() => result(row.id, "failed")}>Mark failed</Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </PageContainer>
  );

  async function result(id: string, status: "paid" | "failed") {
    try {
      await apiRequest(`/billing/collections/${id}/result`, {
        method: "POST",
        body: { status, reason: status === "failed" ? "Insufficient funds" : "" },
      });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record the result");
    }
  }
}
