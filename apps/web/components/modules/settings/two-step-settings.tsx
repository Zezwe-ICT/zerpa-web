/**
 * @file components/modules/settings/two-step-settings.tsx
 * @description Two-step sign-in with an authenticator app (Google Authenticator, Microsoft Authenticator,
 * Authy…). Turning it on: scan the QR code, type a code to prove it works, save the backup codes.
 */
"use client";

import { useEffect, useState } from "react";
import { Copy, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { disableMfa, enableMfa, getMfaStatus, newBackupCodes, startMfaSetup } from "@/lib/api/account";

type Mode = "idle" | "setup" | "disable" | "codes";

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export function TwoStepSettings() {
  const [status, setStatus] = useState<{ enabled: boolean; backupCodesLeft: number } | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => getMfaStatus().then(setStatus).catch(() => setStatus(null));
  useEffect(() => {
    load();
  }, []);

  function reset(next: Mode = "idle") {
    setMode(next);
    setCode("");
    setPassword("");
    setError(null);
  }

  async function begin() {
    setBusy(true);
    try {
      const res = await startMfaSetup();
      const QRCode = await import("qrcode");
      setSetup({ secret: res.secret, qr: await QRCode.toDataURL(res.otpauthUri, { margin: 1, width: 200 }) });
      reset("setup");
    } catch (e) {
      toast.error(errorText(e, "Could not start the setup."));
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorText(e, "Something went wrong."));
    } finally {
      setBusy(false);
    }
  }

  const confirmSetup = () =>
    run(async () => {
      const res = await enableMfa(code);
      setBackupCodes(res.backupCodes);
      setSetup(null);
      reset("codes");
      load();
      toast.success("Two-step sign-in is on");
    });

  const turnOff = () =>
    run(async () => {
      await disableMfa(password, code);
      reset();
      setBackupCodes(null);
      load();
      toast.success("Two-step sign-in is off");
    });

  const replaceCodes = () =>
    run(async () => {
      const res = await newBackupCodes(code);
      setBackupCodes(res.backupCodes);
      reset("codes");
      load();
    });

  if (!status) return null;

  return (
    <section className="rounded-[12px] border border-border bg-background p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Two-step sign-in</h2>
          <p className="text-sm text-muted-fg mt-1">
            After your password, Zerpa asks for a code from an app on your phone. Someone who learns your password
            still can&apos;t get in.
          </p>
        </div>
        {status.enabled ? (
          <span className="flex items-center gap-1 text-sm font-medium text-primary whitespace-nowrap">
            <ShieldCheck size={16} /> On
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm text-muted-fg whitespace-nowrap">
            <ShieldOff size={16} /> Off
          </span>
        )}
      </div>

      {mode === "idle" && !status.enabled && (
        <Button onClick={begin} disabled={busy}>
          {busy ? "Starting…" : "Turn on two-step sign-in"}
        </Button>
      )}

      {mode === "idle" && status.enabled && (
        <div className="space-y-2">
          <p className="text-sm text-muted-fg">{status.backupCodesLeft} backup codes left.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => reset("disable")}>
              Turn off
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBackupCodes(null);
                reset("codes");
              }}
            >
              New backup codes
            </Button>
          </div>
        </div>
      )}

      {mode === "setup" && setup && (
        <div className="space-y-4">
          <ol className="list-decimal pl-5 text-sm space-y-1">
            <li>Install an authenticator app, e.g. Google Authenticator or Microsoft Authenticator.</li>
            <li>In the app, add an account and scan this code.</li>
            <li>Type the 6-digit code the app shows.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt="QR code to add Zerpa to your authenticator app" className="h-40 w-40 rounded bg-white p-1" />
            <div className="text-xs text-muted-fg space-y-1 min-w-0">
              <p>Can&apos;t scan? Enter this key in the app instead:</p>
              <p className="flex items-center gap-2 font-mono text-sm text-foreground break-all">
                {setup.secret}
                <button type="button" aria-label="Copy key" onClick={() => navigator.clipboard.writeText(setup.secret)}>
                  <Copy size={14} />
                </button>
              </p>
            </div>
          </div>
          <CodeField value={code} onChange={setCode} />
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={confirmSetup} disabled={busy || code.length < 6}>
              {busy ? "Checking…" : "Turn on"}
            </Button>
            <Button variant="ghost" onClick={() => reset()} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === "codes" && backupCodes && (
        <div className="space-y-3 rounded-[10px] border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-medium">Save these backup codes somewhere safe</p>
          <p className="text-xs text-muted-fg">
            Each works once if you lose your phone. This is the only time we show them.
          </p>
          <ul className="grid grid-cols-2 gap-1 font-mono text-sm">
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(backupCodes.join("\n"));
                toast.success("Backup codes copied");
              }}
            >
              <Copy size={14} className="mr-1.5" /> Copy codes
            </Button>
            <Button size="sm" onClick={() => reset()}>
              I&apos;ve saved them
            </Button>
          </div>
        </div>
      )}

      {mode === "codes" && !backupCodes && (
        <div className="space-y-3">
          <p className="text-sm">Type a code from your authenticator app to replace all your backup codes.</p>
          <CodeField value={code} onChange={setCode} />
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={replaceCodes} disabled={busy || code.length < 6}>
              Get new codes
            </Button>
            <Button variant="ghost" onClick={() => reset()} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === "disable" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mfaPassword">Your password</Label>
            <Input
              id="mfaPassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <CodeField value={code} onChange={setCode} allowBackup />
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={turnOff} disabled={busy || !password || code.length < 6}>
              Turn off two-step sign-in
            </Button>
            <Button variant="ghost" onClick={() => reset()} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function CodeField({ value, onChange, allowBackup }: { value: string; onChange: (v: string) => void; allowBackup?: boolean }) {
  return (
    <div className="space-y-1.5 max-w-[14rem]">
      <Label htmlFor="mfaCode">{allowBackup ? "Code from your app (or a backup code)" : "Code from your app"}</Label>
      <Input
        id="mfaCode"
        inputMode={allowBackup ? "text" : "numeric"}
        autoComplete="one-time-code"
        placeholder="123456"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        className="tracking-[0.2em]"
      />
    </div>
  );
}
