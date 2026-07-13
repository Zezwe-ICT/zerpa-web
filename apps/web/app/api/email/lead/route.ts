/**
 * @file app/api/email/lead/route.ts
 * @description Sends an outreach email from the sales team TO a lead/contact,
 * via Amazon SES. Body of the message is composed in the CRM lead view.
 *
 * POST /api/email/lead
 *   body: { to: string, subject: string, message: string, senderName?: string, replyTo?: string }
 */
import { NextResponse } from "next/server";
import { sendEmail, EmailConfigError } from "@/lib/server/email/ses";
import { buildOutreachEmail, formatFrom, SALES_FROM_EMAIL } from "@/lib/server/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: {
    to?: string;
    subject?: string;
    message?: string;
    senderName?: string;
    replyTo?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: NO_STORE }
    );
  }

  const to = body.to?.trim();
  const subject = body.subject?.trim();
  const message = body.message?.trim();

  if (!to || !EMAIL_RE.test(to)) {
    return NextResponse.json(
      { error: "A valid `to` email address is required." },
      { status: 400, headers: NO_STORE }
    );
  }
  if (!subject) {
    return NextResponse.json(
      { error: "A `subject` is required." },
      { status: 400, headers: NO_STORE }
    );
  }
  if (!message) {
    return NextResponse.json(
      { error: "A `message` is required." },
      { status: 400, headers: NO_STORE }
    );
  }

  const replyTo = body.replyTo?.trim();
  const { html, text } = buildOutreachEmail({ message, senderName: body.senderName });
  // Send from the sales role identity, showing the rep's name — not no-reply.
  // Replies route to the rep via Reply-To.
  const from = formatFrom(body.senderName?.trim() || undefined, SALES_FROM_EMAIL);

  try {
    const messageId = await sendEmail({
      to,
      from,
      subject,
      html,
      text,
      ...(replyTo && EMAIL_RE.test(replyTo) ? { replyTo } : {}),
    });
    return NextResponse.json({ ok: true, messageId }, { headers: NO_STORE });
  } catch (err) {
    const errMessage =
      err instanceof EmailConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to send email.";
    const status = err instanceof EmailConfigError ? 503 : 502;
    return NextResponse.json({ ok: false, error: errMessage }, { status, headers: NO_STORE });
  }
}
