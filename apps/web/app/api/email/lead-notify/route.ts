/**
 * @file app/api/email/lead-notify/route.ts
 * @description Notifies the internal sales team that new leads were imported
 * (e.g. via Lead Finder). Recipient is SALES_NOTIFY_EMAIL, falling back to
 * SES_FROM_EMAIL. Fired best-effort after an import completes.
 *
 * POST /api/email/lead-notify
 *   body: {
 *     count: number,
 *     vertical?: string,
 *     importedBy?: string,
 *     leads: { company: string, contactName?: string, estimatedValue?: number }[]
 *   }
 */
import { NextResponse } from "next/server";
import { sendEmail, EmailConfigError } from "@/lib/server/email/ses";
import { buildNewLeadNotification } from "@/lib/server/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

export async function POST(request: Request) {
  const recipient = (
    process.env.SALES_NOTIFY_EMAIL ||
    process.env.SES_FROM_EMAIL ||
    process.env.SES_FROM_ADDRESS
  )?.trim();

  if (!recipient) {
    return NextResponse.json(
      { ok: false, error: "No notification recipient configured (set SALES_NOTIFY_EMAIL)." },
      { status: 503, headers: NO_STORE }
    );
  }

  let body: {
    count?: number;
    vertical?: string;
    importedBy?: string;
    leads?: { company?: string; contactName?: string; estimatedValue?: number }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: NO_STORE }
    );
  }

  const leads = (body.leads ?? [])
    .filter((l) => l && typeof l.company === "string" && l.company.trim())
    .map((l) => ({
      company: l.company!.trim(),
      contactName: l.contactName?.trim() || undefined,
      estimatedValue:
        typeof l.estimatedValue === "number" && l.estimatedValue > 0
          ? l.estimatedValue
          : undefined,
    }));

  const count = typeof body.count === "number" && body.count > 0 ? body.count : leads.length;
  if (count === 0) {
    return NextResponse.json(
      { error: "No leads provided to notify about." },
      { status: 400, headers: NO_STORE }
    );
  }

  const { subject, html, text } = buildNewLeadNotification({
    count,
    vertical: body.vertical,
    importedBy: body.importedBy,
    leads,
  });

  try {
    const messageId = await sendEmail({ to: recipient, subject, html, text });
    return NextResponse.json({ ok: true, messageId }, { headers: NO_STORE });
  } catch (err) {
    const message =
      err instanceof EmailConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to send notification email.";
    const status = err instanceof EmailConfigError ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status, headers: NO_STORE });
  }
}
