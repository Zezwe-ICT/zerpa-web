/**
 * @file app/api/email/notification/route.ts
 * @description Sends a business notification email (quote accepted, payment received, …).
 * Server-to-server only: the Django API calls this with x-zerpa-internal-key. Browser tokens are refused
 * so nobody can use it to send arbitrary mail.
 *
 * POST /api/email/notification
 *   body: { to, name?, subject, body?, link?, companyName?, audience?: "staff"|"customer", buttonLabel? }
 */
import { NextResponse } from "next/server";
import { sendEmail, EmailConfigError } from "@/lib/server/email/ses";
import { buildNotificationEmail, formatFrom, BILLING_FROM_EMAIL } from "@/lib/server/email/templates";
import { keysMatch } from "@/lib/server/verify-access-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const key = process.env.ZERPA_INTERNAL_API_KEY;
  if (!key || !keysMatch(key, request.headers.get("x-zerpa-internal-key") ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  let body: {
    to?: string;
    name?: string;
    subject?: string;
    body?: string;
    link?: string;
    companyName?: string;
    audience?: string;
    buttonLabel?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: NO_STORE });
  }
  const to = body.to?.trim();
  if (!to || !EMAIL_RE.test(to) || !body.subject?.trim()) {
    return NextResponse.json({ error: "`to` and `subject` are required." }, { status: 400, headers: NO_STORE });
  }
  const link = body.link && /^https?:\/\//.test(body.link) ? body.link : undefined;

  const audience = body.audience === "customer" ? "customer" : "staff";
  const buttonLabel = body.buttonLabel?.trim().slice(0, 40) || undefined;
  const built = buildNotificationEmail({
    ...body,
    subject: body.subject.trim(),
    link,
    audience,
    buttonLabel,
  });
  try {
    const messageId = await sendEmail({
      to,
      from: formatFrom(`${body.companyName?.trim() || "Zerpa"} via Zerpa`, BILLING_FROM_EMAIL),
      subject: built.subject,
      html: built.html,
      text: built.text,
    });
    return NextResponse.json({ ok: true, messageId }, { headers: NO_STORE });
  } catch (err) {
    const status = err instanceof EmailConfigError ? 503 : 502;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status, headers: NO_STORE },
    );
  }
}
