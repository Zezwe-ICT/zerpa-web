/**
 * @file components/modules/billing/online-payments-settings.tsx
 * @description Turn on card / instant EFT (PayFast), pay-by-bank (Ozow) and manual EFT for the
 * public payment page. Secrets are write-only: the API only says whether one is saved.
 */
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { getGateways, updateGateways, type GatewaySettings, type GatewayUpdate } from "@/lib/api/payments";
import { ZerpaLoader } from "@/components/brand/zerpa-loader";

export function OnlinePaymentsSettings() {
  const [current, setCurrent] = useState<GatewaySettings | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [draft, setDraft] = useState<Required<GatewayUpdate>>({ payfast: {}, ozow: {}, eft: { enabled: true } });
  const [saving, setSaving] = useState(false);

  function hydrate(g: GatewaySettings) {
    setCurrent(g);
    setDraft({
      payfast: { enabled: g.payfast.enabled, sandbox: g.payfast.sandbox, merchantId: g.payfast.merchantId },
      ozow: { enabled: g.ozow.enabled, test: g.ozow.test, siteCode: g.ozow.siteCode },
      eft: { enabled: g.eft.enabled },
    });
  }

  useEffect(() => {
    getGateways()
      .then(hydrate)
      .catch((e) => (e instanceof ApiError && e.status === 403 ? setForbidden(true) : undefined));
  }, []);

  const pf = (patch: GatewayUpdate["payfast"]) => setDraft((d) => ({ ...d, payfast: { ...d.payfast, ...patch } }));
  const oz = (patch: GatewayUpdate["ozow"]) => setDraft((d) => ({ ...d, ozow: { ...d.ozow, ...patch } }));

  async function save() {
    setSaving(true);
    try {
      hydrate(await updateGateways(draft));
      toast.success("Online payment settings saved");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save payment settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[12px] border border-border bg-background p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Online payments</h2>
          <p className="text-sm text-muted-fg mt-1">
            Let customers pay invoices from the payment link by card, instant EFT or their banking app. Money goes
            straight into your own PayFast or Ozow account.
          </p>
        </div>
        {current && (
          <Button size="sm" onClick={save} disabled={saving}>
            <Save size={14} className="mr-1.5" />
            {saving ? "Saving…" : "Save"}
          </Button>
        )}
      </div>

      {forbidden && (
        <p className="text-sm text-muted-fg">Only an owner or admin can change how customers pay online.</p>
      )}
      {!current && !forbidden && <ZerpaLoader />}

      {current && (
        <>
          <Provider
            title="PayFast"
            blurb="Card, instant EFT, SnapScan, Zapper and more. Fees are charged by PayFast."
            enabled={!!draft.payfast.enabled}
            onToggle={(enabled) => pf({ enabled })}
            ready={current.payfast.ready}
          >
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!draft.payfast.sandbox}
                onChange={(e) => pf({ sandbox: e.target.checked })}
              />
              Test mode (sandbox) — no real money moves
            </label>
            {draft.payfast.sandbox && !draft.payfast.merchantId && (
              <p className="text-xs text-muted-fg">
                Leave the fields empty to use PayFast&apos;s public test merchant, so you can try a payment straight away.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <Secret label="Merchant ID" value={draft.payfast.merchantId ?? ""} onChange={(v) => pf({ merchantId: v })} plain />
              <Secret label="Merchant key" saved={current.payfast.merchantKeySet} onChange={(v) => pf({ merchantKey: v })} />
              <Secret label="Passphrase" saved={current.payfast.passphraseSet} onChange={(v) => pf({ passphrase: v })} />
            </div>
            <p className="text-xs text-muted-fg">
              Find these in your PayFast dashboard under Settings → Developer settings. Set a passphrase there first.
            </p>
          </Provider>

          <Provider
            title="Ozow"
            blurb="Customers pay from their banking app. Instant, and usually cheaper than card."
            enabled={!!draft.ozow.enabled}
            onToggle={(enabled) => oz({ enabled })}
            ready={current.ozow.ready}
          >
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!draft.ozow.test} onChange={(e) => oz({ test: e.target.checked })} />
              Test mode — no real money moves
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <Secret label="Site code" value={draft.ozow.siteCode ?? ""} onChange={(v) => oz({ siteCode: v })} plain />
              <Secret label="Private key" saved={current.ozow.privateKeySet} onChange={(v) => oz({ privateKey: v })} />
              <Secret label="API key" saved={current.ozow.apiKeySet} onChange={(v) => oz({ apiKey: v })} />
            </div>
            <p className="text-xs text-muted-fg">From the Ozow merchant dashboard under Merchant details.</p>
          </Provider>

          <label className="flex items-start gap-3 rounded-[10px] border border-border p-4 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={!!draft.eft.enabled}
              onChange={(e) => setDraft((d) => ({ ...d, eft: { enabled: e.target.checked } }))}
            />
            <span>
              <span className="font-medium">Show my bank details for manual EFT</span>
              <span className="block text-xs text-muted-fg">
                Uses the bank details above, with the invoice number as the payment reference.
              </span>
            </span>
          </label>

          {current.notifyBaseUrl.includes("localhost") && (draft.payfast.enabled || draft.ozow.enabled) && (
            <p className="rounded-[10px] border border-border bg-surface p-3 text-xs text-muted-fg">
              <CircleAlert size={12} className="inline mr-1" />
              Payment confirmations are sent to {current.notifyBaseUrl}, which PayFast and Ozow can&apos;t reach from the
              internet. Payments will go through but won&apos;t mark invoices paid until the API is hosted on a public
              address (set <code>API_PUBLIC_URL</code>).
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Provider({
  title,
  blurb,
  enabled,
  onToggle,
  ready,
  children,
}: {
  title: string;
  blurb: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  ready: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-border p-4 space-y-3">
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
        <span className="flex-1">
          <span className="flex items-center gap-2 text-sm font-medium">
            {title}
            {ready && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-primary">
                <CheckCircle2 size={12} /> Showing on payment links
              </span>
            )}
          </span>
          <span className="block text-xs text-muted-fg">{blurb}</span>
        </span>
      </label>
      {enabled && <div className="space-y-3 pl-7">{children}</div>}
    </div>
  );
}

function Secret({
  label,
  saved,
  value,
  onChange,
  plain,
}: {
  label: string;
  saved?: boolean;
  value?: string;
  onChange: (v: string) => void;
  plain?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={plain ? "text" : "password"}
        autoComplete="off"
        value={plain ? value : undefined}
        onChange={(e) => onChange(e.target.value)}
        placeholder={saved ? "Saved — type to replace" : ""}
      />
    </div>
  );
}
